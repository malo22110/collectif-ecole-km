import { FieldValue } from "firebase-admin/firestore";
import {
  authorizeMailInboxStaff,
  mailInboxDb,
  mailInboxErrorResponse,
  readMailInboxJsonBody,
} from "@/lib/mailInboxServer";
import {
  getNewsletterAudience,
  getNewsletterClient,
  getNewsletterSender,
  syncNewsletterSuppressions,
} from "@/lib/newsletterServer";
import { NewsletterApiError, newsletterDraftSchema } from "@/lib/infomaniakNewsletter";
import { pressBodyToHtml } from "@/lib/pressReleases";
import {
  buildNewsletterHtml,
  newsletterHtmlHasContent,
  sanitizeNewsletterHtml,
} from "@/lib/newsletterContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// [SPEC-NEWSLETTER-CAMPAIGN-01] Listing does not import contacts or mutate provider campaigns.
export async function GET(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  const page = Number(new URL(request.url).searchParams.get("page") || 1);
  if (!Number.isInteger(page) || page < 1 || page > 100)
    return Response.json({ error: "Page invalide." }, { status: 400 });
  try {
    const result = await getNewsletterClient().campaigns(page);
    const groups = await getNewsletterClient().groups();
    const local = await mailInboxDb
      .collection("newsletterCampaigns")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return Response.json(
      {
        items: result.data,
        groups,
        nextPage: result.page < result.pages ? page + 1 : null,
        drafts: local.docs.map((doc) => ({
          id: doc.id,
          subject: doc.get("subject"),
          body: doc.get("body"),
          previewHtml:
            doc.get("contentVersion") === 2
              ? buildNewsletterHtml(doc.get("html") || "").replace(
                  "*|UNSUBSCRIBED|*",
                  "#desinscription-apercu",
                )
              : pressBodyToHtml(doc.get("body") || ""),
          contentVersion: doc.get("contentVersion") || 1,
          state: doc.get("state"),
          remoteId: doc.get("remoteId") || null,
          recipientCount: doc.get("recipientCount") || 0,
          scheduledAt: doc.get("scheduledAt") || null,
          groupId: doc.get("groupId") || null,
          groupName: doc.get("groupName") || null,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "Impossible de lire les campagnes Infomaniak. Vérifiez la configuration et les droits du jeton.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json"))
    return Response.json({ error: "Format invalide." }, { status: 415 });
  try {
    const payload = newsletterDraftSchema.safeParse(await readMailInboxJsonBody(request, 80_000));
    if (!payload.success)
      return Response.json({ error: "Titre ou texte invalide." }, { status: 400 });
    const html = sanitizeNewsletterHtml(payload.data.html || pressBodyToHtml(payload.data.body));
    if (!newsletterHtmlHasContent(html))
      return Response.json({ error: "Le message est vide après validation." }, { status: 400 });
    const client = getNewsletterClient();
    const sender = getNewsletterSender();
    const group = (await client.groups()).find((item) => item.id === payload.data.groupId);
    if (!group) return Response.json({ error: "Le groupe choisi n'existe plus." }, { status: 400 });
    const sync = await syncNewsletterSuppressions(authorization.staff.uid);
    if (sync.remaining)
      return Response.json(
        { error: "Terminez la synchronisation des oppositions avant création." },
        { status: 409 },
      );
    const recipients = await getNewsletterAudience(group.id);
    if (!recipients.length)
      return Response.json(
        { error: "Aucun abonné Infomaniak actif et non désabonné." },
        { status: 400 },
      );
    const ref = mailInboxDb.collection("newsletterCampaigns").doc(payload.data.requestId);
    const claimed = await mailInboxDb.runTransaction(async (transaction) => {
      if ((await transaction.get(ref)).exists) return false;
      transaction.create(ref, {
        ...payload.data,
        html,
        contentVersion: 2,
        createdByUid: authorization.staff.uid,
        createdAt: FieldValue.serverTimestamp(),
        state: "creating",
        groupName: group.name,
        recipientEmails: recipients.map((item) => item.email),
        recipientCount: recipients.length,
      });
      return true;
    });
    if (!claimed)
      return Response.json(
        { error: "Cette demande existe déjà. Consultez les brouillons avant de réessayer." },
        { status: 409 },
      );
    try {
      const campaign = await client.createCampaign({
        subject: payload.data.subject,
        html: buildNewsletterHtml(html),
        ...sender,
        groupId: group.id,
        emails: recipients.map((item) => item.email),
      });
      await ref.update({ remoteId: campaign.id, state: "draft", remoteStatus: campaign.status });
      return Response.json(
        { id: ref.id, remoteId: campaign.id, recipientCount: recipients.length },
        { status: 201 },
      );
    } catch (error) {
      if (
        error instanceof NewsletterApiError &&
        [400, 401, 403, 404, 422, 429].includes(error.httpStatus)
      ) {
        await ref.update({
          state: "rejected",
          failure: { httpStatus: error.httpStatus, fields: error.fields, codes: error.codes },
        });
        return Response.json({ error: error.message, retryAllowed: true }, { status: 422 });
      }
      await ref.update({ state: "review-required" });
      return Response.json(
        {
          error:
            "Création non confirmée. Vérifiez les campagnes Infomaniak avant de recréer un brouillon.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de préparer la campagne Newsletter.");
  }
}
