import { z } from "zod";
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
  syncNewsletterSuppressions,
} from "@/lib/newsletterServer";
import { canRunNewsletterAction, remainingNewsletterAudience } from "@/lib/infomaniakNewsletter";

export const runtime = "nodejs";
export const maxDuration = 60;
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("test") }).strict(),
  z
    .object({
      action: z.literal("schedule"),
      scheduledAt: z.string().datetime(),
      confirm: z.literal(true),
      unsubscribeChecked: z.literal(true),
    })
    .strict(),
]);

// [SPEC-NEWSLETTER-CAMPAIGN-02] Only locally managed, tested drafts can be scheduled once.
export async function POST(request: Request, context: { params: Promise<{ campaignId: string }> }) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  const { campaignId } = await context.params;
  if (!z.string().uuid().safeParse(campaignId).success)
    return Response.json({ error: "Identifiant invalide." }, { status: 400 });
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json"))
    return Response.json({ error: "Format invalide." }, { status: 415 });
  try {
    const payload = actionSchema.safeParse(await readMailInboxJsonBody(request, 2000));
    if (!payload.success)
      return Response.json({ error: "Action ou confirmation invalide." }, { status: 400 });
    const timestamp =
      payload.data.action === "schedule"
        ? Math.floor(new Date(payload.data.scheduledAt).getTime() / 1000)
        : null;
    if (
      timestamp !== null &&
      (timestamp < Date.now() / 1000 + 120 || timestamp > Date.now() / 1000 + 90 * 86400)
    )
      return Response.json(
        { error: "Choisissez une date entre 2 minutes et 90 jours dans le futur." },
        { status: 400 },
      );
    const ref = mailInboxDb.collection("newsletterCampaigns").doc(campaignId);
    const action = payload.data.action;
    const draft = await mailInboxDb.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      const state = current.get("state");
      if (
        !current.exists ||
        !Number.isSafeInteger(current.get("remoteId")) ||
        !canRunNewsletterAction(state, action, current.get("contentVersion"))
      )
        return null;
      transaction.update(ref, { state: action === "test" ? "testing" : "scheduling" });
      return current.data()!;
    });
    if (!draft)
      return Response.json(
        {
          error:
            "Ce brouillon n'est pas disponible pour cette action. Recréez les anciens brouillons pour bénéficier du pied et du lien de désinscription, puis envoyez un nouveau test.",
        },
        { status: 409 },
      );
    try {
      const client = getNewsletterClient();
      const remote = await client.campaign(draft.remoteId);
      if (remote.subject !== draft.subject || remote.status !== draft.remoteStatus)
        throw new Error("La campagne distante a changé depuis sa création.");
      if (action === "test") {
        await client.testCampaign(draft.remoteId, authorization.staff.email);
        await ref.update({
          state: "tested",
          testedAt: FieldValue.serverTimestamp(),
          testedByUid: authorization.staff.uid,
        });
        return Response.json({ status: "tested" });
      }
      const sync = await syncNewsletterSuppressions(authorization.staff.uid);
      if (sync.remaining) throw new Error("Synchronisation des oppositions incomplète.");
      const groupId = z.number().int().positive().parse(draft.groupId);
      const groupAudience = await getNewsletterAudience(groupId);
      const emails = remainingNewsletterAudience(
        z.array(z.string().email()).max(10000).parse(draft.recipientEmails),
        groupAudience.map((item) => item.email),
      );
      if (!emails.length) {
        await ref.update({ state: "tested" });
        return Response.json(
          { error: "Aucun destinataire encore actif après synchronisation." },
          { status: 409 },
        );
      }
      if (groupAudience.length !== emails.length) {
        await ref.update({ state: "tested" });
        return Response.json(
          {
            error:
              "Le groupe contient de nouveaux destinataires. Créez un nouveau brouillon pour confirmer cette audience.",
          },
          { status: 409 },
        );
      }
      await client.updateRecipients(draft.remoteId, groupId);
      await client.scheduleCampaign(draft.remoteId, timestamp!);
      await ref.update({
        state: "scheduled",
        scheduledAt: payload.data.action === "schedule" ? payload.data.scheduledAt : null,
        recipientCount: emails.length,
        scheduledByUid: authorization.staff.uid,
      });
      return Response.json({ status: "scheduled", recipientCount: emails.length });
    } catch {
      await ref.update({ state: "review-required" });
      return Response.json(
        {
          error:
            "Action non confirmée. Vérifiez l'état dans Infomaniak avant toute nouvelle tentative. Aucun repli SMTP n'a été effectué.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de traiter cette campagne Newsletter.");
  }
}
