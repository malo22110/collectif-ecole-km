import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { authorizeActionBoardMember, readActionBoardBody } from "@/lib/actionBoardServer";
import {
  ACTION_BOARD_PAGE_SIZE,
  actionCreateSchema,
} from "@/lib/actionBoard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = "memberActionBoard";
const MEETINGS = "memberMeetings";
const MAX_BODY_BYTES = 16 * 1024;
const MAX_CURSOR_LENGTH = 150;

function serializeAction(
  document: FirebaseFirestore.QueryDocumentSnapshot,
  viewerUid: string,
  meeting?: { id: string; title: string; startsAt: string } | null,
) {
  const data = document.data();
  return {
    id: document.id,
    pole: data.pole,
    title: data.title,
    description: data.description,
    nextStep: data.nextStep || "",
    status: data.status,
    statusNote: data.statusNote || "",
    createdByName: data.createdByName,
    updatedByName: data.updatedByName || data.createdByName,
    createdAtMillis: data.createdAt?.toMillis?.() ?? null,
    updatedAtMillis: data.updatedAt?.toMillis?.() ?? null,
    canEdit: data.createdByUid === viewerUid && data.status === "proposition",
    meeting: meeting || null,
  };
}

// [SPEC-ACTION-BOARD-02] Only validated members can browse a bounded page of proposals.
export async function GET(request: Request) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;

  const cursor = new URL(request.url).searchParams.get("cursor");
  if (cursor && cursor.length > MAX_CURSOR_LENGTH) {
    return NextResponse.json({ error: "Curseur de page invalide." }, { status: 400 });
  }

  try {
    if (cursor && !/^[A-Za-z0-9_-]+$/.test(cursor)) {
      return NextResponse.json({ error: "Curseur de page invalide." }, { status: 400 });
    }
    let query = adminDb.collection(ACTIONS).orderBy("updatedAt", "desc").limit(ACTION_BOARD_PAGE_SIZE + 1);
    if (cursor) {
      const cursorDoc = await adminDb.collection(ACTIONS).doc(cursor).get();
      if (!cursorDoc.exists) return NextResponse.json({ error: "Curseur de page invalide." }, { status: 400 });
      query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();
    const visibleDocs = snapshot.docs.slice(0, ACTION_BOARD_PAGE_SIZE);
    const linkedMeetingIds = Array.from(
      new Set(
        visibleDocs
          .map((document) => document.get("meetingId"))
          .filter((id): id is string => typeof id === "string"),
      ),
    );
    const [linkedMeetingSnapshots, linkableMeetingSnapshot] = await Promise.all([
      linkedMeetingIds.length
        ? adminDb.getAll(...linkedMeetingIds.map((id) => adminDb.collection("memberMeetings").doc(id)))
        : Promise.resolve([]),
      adminDb.collection(MEETINGS).orderBy("startsAt", "desc").limit(100).get(),
    ]);
    const meetingsById = new Map(
      linkedMeetingSnapshots
        .filter((meeting) => meeting.exists && meeting.get("status") === "published")
        .map((meeting) => [meeting.id, { id: meeting.id, title: meeting.get("title"), startsAt: meeting.get("startsAt") }]),
    );
    const linkableMeetings = linkableMeetingSnapshot.docs
      .filter((meeting) => meeting.get("status") === "published")
      .map((meeting) => ({ id: meeting.id, title: meeting.get("title"), startsAt: meeting.get("startsAt") }));
    return NextResponse.json(
      {
        actions: visibleDocs.map((document) =>
          serializeAction(
            document,
            authorization.member!.uid,
            meetingsById.get(String(document.get("meetingId"))) || null,
          ),
        ),
        linkableMeetings,
        canCoordinate: authorization.member.canCoordinate,
        hasMore: snapshot.docs.length > ACTION_BOARD_PAGE_SIZE,
        nextCursor: snapshot.docs.length > ACTION_BOARD_PAGE_SIZE ? visibleDocs.at(-1)?.id ?? null : null,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Erreur de lecture du tableau d’actions:", error);
    return NextResponse.json({ error: "Impossible de charger les propositions." }, { status: 500 });
  }
}

// [SPEC-ACTION-BOARD-01] Any validated member can suggest a proposal; the initial state is assigned server-side.
export async function POST(request: Request) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;

  let body: unknown;
  try {
    body = await readActionBoardBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Requête invalide.";
    return NextResponse.json({ error: message }, { status: message.includes("taille maximale") ? 413 : 400 });
  }

  const parsed = actionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Vérifiez le pôle, le titre et le contenu de la proposition." }, { status: 400 });
  }

  if (parsed.data.meetingId) {
    const meeting = await adminDb.collection("memberMeetings").doc(parsed.data.meetingId).get();
    if (!meeting.exists || meeting.get("status") !== "published") {
      return NextResponse.json({ error: "Choisissez une réunion publiée." }, { status: 400 });
    }
  }

  try {
    const actionRef = adminDb.collection(ACTIONS).doc();
    await actionRef.create({
      ...parsed.data,
      status: "proposition",
      statusNote: "",
      createdByUid: authorization.member.uid,
      createdByName: authorization.member.displayName,
      updatedByUid: authorization.member.uid,
      updatedByName: authorization.member.displayName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: actionRef.id }, { status: 201 });
  } catch (error) {
    console.error("Erreur de création de proposition:", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la proposition." }, { status: 500 });
  }
}