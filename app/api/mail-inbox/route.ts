import { authorizeMailInboxStaff, mailInboxDb, toIsoString } from "@/lib/mailInboxServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE_MAX = 50;
const MESSAGE_ID_PATTERN = /^[a-f0-9]{64}$/;

// [SPEC-MAIL-02] Inbox summaries are staff-only and paginated; message bodies use the detail route.
export async function GET(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;

  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") || 25);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > PAGE_SIZE_MAX) {
    return Response.json({ error: `La limite doit être comprise entre 1 et ${PAGE_SIZE_MAX}.` }, { status: 400 });
  }
  const cursor = url.searchParams.get("cursor");
  if (cursor && !MESSAGE_ID_PATTERN.test(cursor)) {
    return Response.json({ error: "Curseur de pagination invalide." }, { status: 400 });
  }
  const unreadOnly = url.searchParams.get("unread") === "true";

  try {
    let query = mailInboxDb.collection("mailInbox").orderBy("receivedAt", "desc");
    if (unreadOnly) query = query.where("isRead", "==", false) as typeof query;
    if (cursor) {
      const cursorDocument = await mailInboxDb.collection("mailInbox").doc(cursor).get();
      if (!cursorDocument.exists) return Response.json({ error: "Curseur de pagination inconnu." }, { status: 400 });
      query = query.startAfter(cursorDocument);
    }

    const snapshot = await query.limit(requestedLimit + 1).get();
    const pageDocuments = snapshot.docs.slice(0, requestedLimit);
    const items = await Promise.all(pageDocuments.map(async document => {
      const data = document.data();
      const text = typeof data.text === "string" ? data.text : "";
      const threadId = typeof data.threadId === "string" && data.threadId ? data.threadId : document.id;
      const threadCount = data.threadId
        ? await mailInboxDb.collection("mailInbox").where("threadId", "==", threadId).count().get()
        : null;
      const unreadCount = data.threadId
        ? await mailInboxDb.collection("mailInbox").where("threadId", "==", threadId).where("isRead", "==", false).count().get()
        : null;
      return {
        id: document.id,
        threadId,
        messageCount: threadCount?.data().count || 1,
        from: data.from && typeof data.from === "object" ? {
          name: String(data.from.name || ""),
          email: String(data.from.email || "")
        } : { name: "", email: "" },
        subject: String(data.subject || "(sans objet)"),
        receivedAt: toIsoString(data.receivedAt),
        preview: text.slice(0, 220),
        isRead: unreadCount ? unreadCount.data().count === 0 : data.isRead === true,
        attachmentCount: Array.isArray(data.attachments) ? data.attachments.length : 0,
        omittedAttachmentCount: Number(data.omittedAttachmentCount || 0)
      };
    }));

    return Response.json({
      items,
      nextCursor: snapshot.docs.length > requestedLimit ? pageDocuments.at(-1)?.id || null : null
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    console.error("Erreur de lecture de la boîte de réception:", error);
    return Response.json({ error: "Impossible de charger la boîte de réception." }, { status: 500 });
  }
}