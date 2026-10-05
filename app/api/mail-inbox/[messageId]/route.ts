import { z } from "zod";
import {
  authorizeMailInboxStaff,
  mailInboxDb,
  mailInboxErrorResponse,
  readMailInboxJsonBody,
  toIsoString,
} from "@/lib/mailInboxServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageIdSchema = z.string().regex(/^[a-f0-9]{64}$/);
const updateSchema = z.object({ isRead: z.boolean() }).strict();

async function getParams(context: { params: Promise<{ messageId: string }> }) {
  return await context.params;
}

export async function GET(request: Request, context: { params: Promise<{ messageId: string }> }) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;

  const { messageId } = await getParams(context);
  if (!messageIdSchema.safeParse(messageId).success)
    return Response.json({ error: "Identifiant de message invalide." }, { status: 400 });

  try {
    const messageRef = mailInboxDb.collection("mailInbox").doc(messageId);
    const messageSnapshot = await messageRef.get();
    if (!messageSnapshot.exists)
      return Response.json({ error: "Message introuvable." }, { status: 404 });

    const selectedData = messageSnapshot.data()!;
    const threadId =
      typeof selectedData.threadId === "string" && selectedData.threadId
        ? selectedData.threadId
        : messageId;
    const threadSnapshot = selectedData.threadId
      ? await mailInboxDb
          .collection("mailInbox")
          .where("threadId", "==", threadId)
          .orderBy("receivedAt", "desc")
          .limit(50)
          .get()
      : null;
    const messageDocuments = (
      threadSnapshot?.docs.length ? threadSnapshot.docs : [messageSnapshot]
    ).sort(
      (first, second) =>
        (first.get("receivedAt")?.toMillis?.() || 0) -
        (second.get("receivedAt")?.toMillis?.() || 0),
    );
    const messagesWithReplies = await Promise.all(
      messageDocuments.map(async (document) => {
        const data = document.data() || {};
        const repliesSnapshot = await document.ref
          .collection("replies")
          .orderBy("createdAt", "asc")
          .limit(30)
          .get();
        const attachments = Array.isArray(data.attachments)
          ? data.attachments.map((attachment: Record<string, unknown>) => ({
              id: String(attachment.id || ""),
              fileName: String(attachment.fileName || "piece-jointe"),
              contentType: String(attachment.contentType || "application/octet-stream"),
              size: Number(attachment.size || 0),
            }))
          : [];
        const replies = repliesSnapshot.docs.map((replyDocument) => {
          const reply = replyDocument.data();
          return {
            id: replyDocument.id,
            messageId: document.id,
            text: String(reply.text || ""),
            status: String(reply.status || "pending"),
            createdAt: toIsoString(reply.createdAt),
            sentAt: toIsoString(reply.sentAt),
            sentByEmail: String(reply.sentByEmail || ""),
          };
        });
        return {
          id: document.id,
          threadId: typeof data.threadId === "string" ? data.threadId : document.id,
          from:
            data.from && typeof data.from === "object"
              ? {
                  name: String(data.from.name || ""),
                  email: String(data.from.email || ""),
                }
              : { name: "", email: "" },
          subject: String(data.subject || "(sans objet)"),
          receivedAt: toIsoString(data.receivedAt),
          text: String(data.text || ""),
          messageId: String(data.messageId || ""),
          references: Array.isArray(data.references)
            ? data.references
                .filter((value: unknown): value is string => typeof value === "string")
                .slice(-10)
            : [],
          isRead: data.isRead === true,
          attachments,
          omittedAttachmentCount: Number(data.omittedAttachmentCount || 0),
          syncStatus: String(data.syncStatus || "stored"),
          replies,
        };
      }),
    );
    const selectedMessage =
      messagesWithReplies.find((message) => message.id === messageId) ||
      messagesWithReplies.at(-1)!;
    selectedMessage.isRead = messagesWithReplies.every((message) => message.isRead);
    const replies = messagesWithReplies.flatMap((message) => message.replies);

    return Response.json(
      {
        message: selectedMessage,
        messages: messagesWithReplies,
        replies,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de charger ce message.");
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ messageId: string }> }) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;

  const { messageId } = await getParams(context);
  if (!messageIdSchema.safeParse(messageId).success)
    return Response.json({ error: "Identifiant de message invalide." }, { status: 400 });
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Format de requête invalide." }, { status: 415 });
  }

  try {
    const value = await readMailInboxJsonBody(request, 2048);
    const parsed = updateSchema.safeParse(value);
    if (!parsed.success)
      return Response.json({ error: "État lu/non lu invalide." }, { status: 400 });

    const messageRef = mailInboxDb.collection("mailInbox").doc(messageId);
    const snapshot = await messageRef.get();
    if (!snapshot.exists) return Response.json({ error: "Message introuvable." }, { status: 404 });
    const threadId = snapshot.get("threadId");
    if (typeof threadId === "string" && threadId) {
      let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
      while (true) {
        let query = mailInboxDb
          .collection("mailInbox")
          .where("threadId", "==", threadId)
          .limit(400);
        if (cursor) query = query.startAfter(cursor);
        const thread = await query.get();
        if (thread.empty) break;
        const batch = mailInboxDb.batch();
        thread.docs.forEach((document) =>
          batch.update(document.ref, { isRead: parsed.data.isRead }),
        );
        await batch.commit();
        if (thread.size < 400) break;
        cursor = thread.docs[thread.docs.length - 1];
      }
    } else {
      await messageRef.update({ isRead: parsed.data.isRead });
    }
    return Response.json(
      { isRead: parsed.data.isRead },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de mettre à jour ce message.");
  }
}
