import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { authorizeActionBoardMember } from "@/lib/actionBoardServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-MEMBER-MEETINGS-05] Expose bounded, non-sensitive action summaries attached to a published meeting.
export async function GET(
  request: Request,
  context: { params: Promise<{ meetingId: string }> },
) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;

  const { meetingId } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,150}$/.test(meetingId)) {
    return NextResponse.json({ error: "Identifiant de réunion invalide." }, { status: 400 });
  }

  try {
    const meeting = await adminDb.collection("memberMeetings").doc(meetingId).get();
    if (!meeting.exists || meeting.get("deletedAt") || meeting.get("status") !== "published") {
      return NextResponse.json({ error: "Réunion introuvable." }, { status: 404 });
    }
    const snapshot = await adminDb
      .collection("memberActionBoard")
      .where("meetingId", "==", meetingId)
      .limit(50)
      .get();
    const activeActions = snapshot.docs.filter((document) => !document.get("deletedAt"));
    return NextResponse.json(
      {
        actions: activeActions.map((document) => ({
          id: document.id,
          pole: document.get("pole"),
          title: document.get("title"),
          status: document.get("status"),
          nextStep: document.get("nextStep") || "",
          updatedAtMillis: document.get("updatedAt")?.toMillis?.() ?? null,
        })),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Erreur de lecture des actions associées à une réunion:", error);
    return NextResponse.json({ error: "Impossible de charger les actions liées." }, { status: 500 });
  }
}