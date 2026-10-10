import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { authorizeActionBoardMember, readActionBoardBody } from "@/lib/actionBoardServer";
import { meetingInputSchema } from "@/lib/memberMeetings";
import { canManageMemberEntity } from "@/lib/memberEntityAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEETINGS = "memberMeetings";
const PAGE_LIMIT = 50;

function serializeMeeting(
  document: FirebaseFirestore.QueryDocumentSnapshot,
  viewerUid: string,
  canCoordinate: boolean,
) {
  const data = document.data();
  return {
    id: document.id,
    title: data.title,
    startsAt: data.startsAt,
    location: data.location || "",
    agendaItems: Array.isArray(data.agendaItems) ? data.agendaItems : [],
    minutes: data.minutes || "",
    status: data.status,
    createdByName: data.createdByName || "Collectif",
    updatedAtMillis: data.updatedAt?.toMillis?.() ?? null,
    canEdit: canManageMemberEntity(String(data.createdByUid), viewerUid, canCoordinate),
    canDelete: canManageMemberEntity(String(data.createdByUid), viewerUid, canCoordinate),
  };
}

// [SPEC-MEMBER-MEETINGS-02] Members see published meeting notes; only coordinators also see drafts.
export async function GET(request: Request) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;

  const cursor = new URL(request.url).searchParams.get("cursor");
  if (cursor && !/^[A-Za-z0-9_-]{1,150}$/.test(cursor)) {
    return NextResponse.json({ error: "Curseur de page invalide." }, { status: 400 });
  }

  try {
    let query = adminDb.collection(MEETINGS).orderBy("startsAt", "desc").limit(PAGE_LIMIT + 1);
    if (cursor) {
      const cursorSnapshot = await adminDb.collection(MEETINGS).doc(cursor).get();
      if (!cursorSnapshot.exists) return NextResponse.json({ error: "Curseur de page invalide." }, { status: 400 });
      query = query.startAfter(cursorSnapshot);
    }
    const snapshot = await query.get();
    const visible = snapshot.docs.filter((document) =>
      !document.get("deletedAt") &&
      (authorization.member!.canCoordinate || document.get("status") === "published"),
    );
    const meetings = visible.map((document) =>
      serializeMeeting(document, authorization.member!.uid, authorization.member!.canCoordinate),
    ).sort((left, right) => {
      const leftTime = Date.parse(left.startsAt);
      const rightTime = Date.parse(right.startsAt);
      const now = Date.now();
      const leftUpcoming = leftTime >= now;
      const rightUpcoming = rightTime >= now;
      if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1;
      return leftUpcoming ? leftTime - rightTime : rightTime - leftTime;
    });

    return NextResponse.json(
      {
        meetings,
        canCoordinate: authorization.member.canCoordinate,
        hasMore: snapshot.docs.length > PAGE_LIMIT,
        nextCursor: snapshot.docs.length > PAGE_LIMIT ? snapshot.docs[PAGE_LIMIT - 1]?.id ?? null : null,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Erreur de lecture de l’agenda membre:", error);
    return NextResponse.json({ error: "Impossible de charger l’agenda." }, { status: 500 });
  }
}

// [SPEC-MEMBER-MEETINGS-03] Only coordinators create shared meeting records; publication is explicit.
export async function POST(request: Request) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;
  if (!authorization.member.canCoordinate) {
    return NextResponse.json({ error: "Seuls les coordinateurs peuvent créer une réunion." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readActionBoardBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Requête invalide.";
    return NextResponse.json({ error: message }, { status: message.includes("taille maximale") ? 413 : 400 });
  }
  const parsed = meetingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Vérifiez le titre, la date, le lieu et l’ordre du jour." }, { status: 400 });
  }

  try {
    const ref = adminDb.collection(MEETINGS).doc();
    const { publish, ...meeting } = parsed.data;
    await ref.create({
      ...meeting,
      status: publish ? "published" : "draft",
      createdByUid: authorization.member.uid,
      createdByName: authorization.member.displayName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: ref.id, status: publish ? "published" : "draft" }, { status: 201 });
  } catch (error) {
    console.error("Erreur de création de réunion:", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la réunion." }, { status: 500 });
  }
}