import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import {
  authorizeMailInboxStaff,
  mailInboxDb,
  mailInboxErrorResponse,
  readMailInboxJsonBody,
  toIsoString,
} from "@/lib/mailInboxServer";
import { getMailSuppressionId } from "@/functions/src/mailSuppression";
import { syncNewsletterSuppressions } from "@/lib/newsletterServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const payloadSchema = z
  .object({ email: z.string().trim().toLowerCase().max(254).email() })
  .strict();

// [SPEC-MAIL-OPT-OUT-01] Manual objections are private, idempotent and do not delete signatures.
export async function POST(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json"))
    return Response.json({ error: "Format invalide." }, { status: 415 });
  try {
    const payload = payloadSchema.safeParse(await readMailInboxJsonBody(request, 2000));
    if (!payload.success)
      return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
    const ref = mailInboxDb
      .collection("mailSuppressions")
      .doc(getMailSuppressionId(payload.data.email));
    await mailInboxDb.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (current.exists) return;
      transaction.create(ref, {
        email: payload.data.email,
        source: "manual-request",
        createdAt: FieldValue.serverTimestamp(),
        createdByUid: authorization.staff.uid,
      });
    });
    let warning: string | null = null;
    try {
      const sync = await syncNewsletterSuppressions(authorization.staff.uid);
      if (sync.remaining)
        warning = `${sync.remaining} opposition(s) restent à transmettre. Relancez la synchronisation avant un envoi depuis Infomaniak.`;
    } catch {
      warning =
        "Désabonnement enregistré sur le site, mais synchronisation Infomaniak non confirmée. Désabonnez aussi cette adresse dans leur outil avant tout envoi externe, puis relancez la synchronisation.";
    }
    return Response.json(
      { email: payload.data.email, status: "suppressed", warning },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible d'enregistrer le désabonnement.");
  }
}

export async function GET(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  const params = new URL(request.url).searchParams;
  const limit = Number(params.get("limit") || 50);
  const cursor = params.get("cursor");
  const email = params.get("email");
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    (cursor && !/^[a-f0-9]{64}$/.test(cursor))
  )
    return Response.json({ error: "Pagination invalide." }, { status: 400 });
  try {
    if (email !== null) {
      const parsed = payloadSchema.safeParse({ email });
      if (!parsed.success) return Response.json({ error: "Adresse invalide." }, { status: 400 });
      const doc = await mailInboxDb
        .collection("mailSuppressions")
        .doc(getMailSuppressionId(parsed.data.email))
        .get();
      return Response.json(
        {
          items: doc.exists
            ? [{ email: doc.get("email"), createdAt: toIsoString(doc.get("createdAt")) }]
            : [],
          nextCursor: null,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    let query = mailInboxDb.collection("mailSuppressions").orderBy("__name__");
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.limit(limit + 1).get();
    const page = snapshot.docs.slice(0, limit);
    return Response.json(
      {
        items: page.map((doc) => ({
          email: doc.get("email"),
          createdAt: toIsoString(doc.get("createdAt")),
        })),
        nextCursor: snapshot.size > limit ? page.at(-1)?.id || null : null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de charger les désabonnements.");
  }
}
