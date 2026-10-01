import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { authorizeMailInboxStaff, mailInboxDb, mailInboxErrorResponse, readMailInboxJsonBody } from "@/lib/mailInboxServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageIdSchema = z.string().regex(/^[a-f0-9]{64}$/);
const replySchema = z.object({ text: z.string().trim().min(1).max(12000) }).strict();

// [SPEC-MAIL-02] Staff replies are queued against the stored sender and IMAP threading headers, never client-supplied recipients.
export async function POST(request: Request, context: { params: Promise<{ messageId: string }> }) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;

  const { messageId } = await context.params;
  if (!messageIdSchema.safeParse(messageId).success) return Response.json({ error: "Identifiant de message invalide." }, { status: 400 });
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Format de requête invalide." }, { status: 415 });
  }

  try {
    const value = await readMailInboxJsonBody(request, 16_384);
    const parsed = replySchema.safeParse(value);
    if (!parsed.success) return Response.json({ error: "Le texte de réponse doit contenir au plus 12 000 caractères." }, { status: 400 });

    const messageRef = mailInboxDb.collection("mailInbox").doc(messageId);
    const messageSnapshot = await messageRef.get();
    if (!messageSnapshot.exists) return Response.json({ error: "Message introuvable." }, { status: 404 });
    const message = messageSnapshot.data()!;
    const recipient = message.from?.email;
    if (typeof recipient !== "string" || !z.string().email().safeParse(recipient).success) {
      return Response.json({ error: "L’adresse de l’expéditeur n’est pas valide." }, { status: 409 });
    }

    const originalSubject = String(message.subject || "").trim();
    const subject = (/^re:/i.test(originalSubject) ? originalSubject : `Re: ${originalSubject || "Votre message"}`).slice(0, 500);
    const replyRef = messageRef.collection("replies").doc();
    await replyRef.create({
      to: recipient,
      subject,
      text: parsed.data.text,
      originalMessageId: typeof message.messageId === "string" ? message.messageId : "",
      originalReferences: Array.isArray(message.references) ? message.references.slice(-10) : [],
      status: "pending",
      sentByUid: authorization.staff.uid,
      sentByEmail: authorization.staff.email,
      createdAt: FieldValue.serverTimestamp()
    });
    await messageRef.update({ isRead: true });

    return Response.json({ replyId: replyRef.id, status: "pending" }, { status: 202, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de mettre la réponse en file d’attente.");
  }
}