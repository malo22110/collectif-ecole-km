import {
  authorizeMailInboxStaff,
  mailInboxDb,
  mailInboxErrorResponse,
} from "@/lib/mailInboxServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-MAIL-05] Count unread messages without exposing mailbox data to the client SDK.
export async function GET(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  try {
    const result = await mailInboxDb
      .collection("mailInbox")
      .where("isRead", "==", false)
      .count()
      .get();
    return Response.json(
      { count: result.data().count },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de compter les messages non lus.");
  }
}
