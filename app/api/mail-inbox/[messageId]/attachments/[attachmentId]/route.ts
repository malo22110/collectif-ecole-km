import { z } from "zod";
import { authorizeMailInboxStaff, mailInboxDb, mailInboxBucket, mailInboxErrorResponse } from "@/lib/mailInboxServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageIdSchema = z.string().regex(/^[a-f0-9]{64}$/);
const attachmentIdSchema = z.string().uuid();
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

// [SPEC-MAIL-02] Attachment downloads remain private to authenticated mail staff.
export async function GET(
  request: Request,
  context: { params: Promise<{ messageId: string; attachmentId: string }> }
) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;

  const { messageId, attachmentId } = await context.params;
  if (!messageIdSchema.safeParse(messageId).success || !attachmentIdSchema.safeParse(attachmentId).success) {
    return Response.json({ error: "Identifiant de pièce jointe invalide." }, { status: 400 });
  }

  try {
    const message = await mailInboxDb.collection("mailInbox").doc(messageId).get();
    if (!message.exists) return Response.json({ error: "Message introuvable." }, { status: 404 });
    const attachments = message.get("attachments");
    const attachment = Array.isArray(attachments)
      ? attachments.find((item: unknown) => item && typeof item === "object" && "id" in item && item.id === attachmentId)
      : null;
    if (!attachment || typeof attachment !== "object" || !("storagePath" in attachment) || typeof attachment.storagePath !== "string") {
      return Response.json({ error: "Pièce jointe introuvable." }, { status: 404 });
    }
    const expectedPrefix = `mailInbox/${messageId}/attachments/${attachmentId}`;
    if (attachment.storagePath !== expectedPrefix) return Response.json({ error: "Chemin de pièce jointe invalide." }, { status: 500 });

    const [metadata] = await mailInboxBucket.file(attachment.storagePath).getMetadata();
    const size = Number(metadata.size || 0);
    const contentType = String(metadata.contentType || "application/octet-stream");
    if (size < 1 || size > MAX_ATTACHMENT_BYTES || size !== Number(attachment.size)) {
      return Response.json({ error: "Cette pièce jointe dépasse les limites autorisées." }, { status: 500 });
    }

    const [contents] = await mailInboxBucket.file(attachment.storagePath).download();
    const fileName = String(attachment.fileName || "piece-jointe")
      .replace(/[\r\n"\\]/g, "_")
      .slice(0, 160);
    const asciiName = fileName.replace(/[^\x20-\x7e]/g, "_");
    return new Response(new Uint8Array(contents), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer"
      }
    });
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de télécharger la pièce jointe.");
  }
}