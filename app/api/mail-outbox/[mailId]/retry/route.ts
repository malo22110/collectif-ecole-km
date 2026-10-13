import { FieldValue } from "firebase-admin/firestore";
import { authorizeMailInboxStaff, mailInboxDb, mailInboxErrorResponse } from "@/lib/mailInboxServer";
import { canRetryFailedRecipients } from "@/functions/src/mailQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAIL_ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

// [SPEC-MAIL-03] Requeue only failed recipients; never resend SMTP-accepted messages.
export async function POST(request: Request, context: { params: Promise<{ mailId: string }> }) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  const { mailId } = await context.params;
  if (!MAIL_ID_PATTERN.test(mailId))
    return Response.json({ error: "Identifiant invalide." }, { status: 400 });

  try {
    const mailRef = mailInboxDb.collection("mailOutbox").doc(mailId);
    const failed = await mailRef.collection("recipients").where("status", "==", "error").limit(1001).get();
    if (failed.empty || failed.size > 1000)
      return Response.json({ error: "Aucun échec relançable ou limite dépassée." }, { status: 409 });

    const claimed = await mailInboxDb.runTransaction(async (transaction) => {
      const current = await transaction.get(mailRef);
      if (!current.exists || !canRetryFailedRecipients(
        current.get("status"), current.get("failedCount"), current.get("pendingCount"), failed.size,
      )) return false;
      transaction.update(mailRef, { status: "preparing" });
      return true;
    });
    if (!claimed)
      return Response.json({ error: "Cette campagne n'est plus relançable. Actualisez la liste." }, { status: 409 });

    for (let offset = 0; offset < failed.size; offset += 400) {
      const batch = mailInboxDb.batch();
      for (const recipient of failed.docs.slice(offset, offset + 400)) {
        batch.update(recipient.ref, {
          status: "pending",
          error: FieldValue.delete(),
          failedAt: FieldValue.delete(),
        });
      }
      if (offset + 400 >= failed.size) {
        batch.update(mailRef, {
          status: "pending",
          pendingCount: failed.size,
          failedCount: 0,
          scheduledAt: FieldValue.delete(),
          error: FieldValue.delete(),
          queuedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }
    return Response.json({ retriedCount: failed.size }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de relancer les destinataires en échec.");
  }
}