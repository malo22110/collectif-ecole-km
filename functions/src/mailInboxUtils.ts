import { createHash } from "node:crypto";

export const MAX_INBOX_MESSAGE_BYTES = 8 * 1024 * 1024;
export const MAX_INBOX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
export const MAX_INBOX_ATTACHMENTS = 5;
export const MAX_INBOX_TEXT_LENGTH = 50_000;

export function getInboxMessageId(messageId: string | undefined, uidValidity: number, uid: number) {
  const identity = messageId?.trim().toLowerCase() || `${uidValidity}:${uid}`;
  return createHash("sha256").update(identity).digest("hex");
}

export function getMailMessageIndexId(messageId: string | undefined) {
  const normalized = (messageId || "").trim().toLowerCase();
  return normalized ? createHash("sha256").update(normalized).digest("hex") : "";
}

export function sanitizeInboxFileName(fileName: string | undefined) {
  const safeName = (fileName || "piece-jointe")
    .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 160);
  return safeName || "piece-jointe";
}

export function normalizeInboxText(text: string | undefined) {
  return (text || "").replace(/\u0000/g, "").slice(0, MAX_INBOX_TEXT_LENGTH);
}