import {
  authorizeMailInboxStaff,
  mailInboxDb,
  mailInboxErrorResponse,
  toIsoString,
} from "@/lib/mailInboxServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAIL_ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

// [SPEC-MAIL-03] Expose campaign delivery state only to authorized mail staff.
export async function GET(request: Request, context: { params: Promise<{ mailId: string }> }) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  const { mailId } = await context.params;
  if (!MAIL_ID_PATTERN.test(mailId))
    return Response.json({ error: "Identifiant invalide." }, { status: 400 });

  try {
    const snapshot = await mailInboxDb.collection("mailOutbox").doc(mailId).get();
    if (!snapshot.exists) return Response.json({ error: "Message introuvable." }, { status: 404 });
    const data = snapshot.data()!;
    const recipientSnapshot = await snapshot.ref
      .collection("recipients")
      .orderBy("email", "asc")
      .limit(1000)
      .get();
    const recipients = recipientSnapshot.docs.map((document) => document.data());
    return Response.json(
      {
        message: {
          id: snapshot.id,
          subject: String(data.subject || "(sans objet)"),
          target: String(data.target || "all"),
          testMode: data.testMode === true,
          status: String(data.status || "pending"),
          createdAt: toIsoString(data.createdAt),
          sentAt: toIsoString(data.sentAt),
          sentCount: Number(data.sentCount || 0),
          failedCount: Number(data.failedCount || 0),
          recipientCount: Number(data.recipientCount || recipients.length),
          recipients: recipients.map((recipient: Record<string, unknown>) => ({
            email: String(recipient.email || ""),
            name: String(recipient.name || ""),
            status: String(recipient.status || "pending"),
            error: typeof recipient.error === "string" ? recipient.error : undefined,
            sentAt: toIsoString(recipient.sentAt),
          })),
        },
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de lire cette campagne.");
  }
}
