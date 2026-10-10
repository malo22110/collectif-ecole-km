import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { authorizeActionBoardMember, readActionBoardBody } from "@/lib/actionBoardServer";
import {
  agendaSuggestionSchema,
  canManageAgendaSuggestion,
  canSuggestAgenda,
} from "@/lib/memberMeetings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-MEMBER-MEETINGS-04] Members can suggest agenda points for upcoming published meetings; only coordinators see the queue.
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
    const meetingRef = adminDb.collection("memberMeetings").doc(meetingId);
    const meeting = await meetingRef.get();
    if (!meeting.exists || meeting.get("deletedAt") || meeting.get("status") !== "published") {
      return NextResponse.json({ error: "Réunion introuvable." }, { status: 404 });
    }
    const suggestionsRef = meetingRef.collection("agendaSuggestions");
    const snapshot = authorization.member.canCoordinate
      ? await suggestionsRef.orderBy("createdAt", "desc").limit(50).get()
      : await suggestionsRef.where("createdByUid", "==", authorization.member.uid).limit(50).get();
    const suggestions = snapshot.docs
      .filter((document) => !document.get("deletedAt"))
      .map((document) => ({
        id: document.id,
        text: document.get("text"),
        createdByName: document.get("createdByName"),
        status: document.get("status"),
        createdAtMillis: document.get("createdAt")?.toMillis?.() ?? null,
        canEdit: canManageAgendaSuggestion(
          String(document.get("createdByUid")),
          authorization.member!.uid,
          authorization.member!.canCoordinate,
          document.get("status"),
        ),
        canDelete: canManageAgendaSuggestion(
          String(document.get("createdByUid")),
          authorization.member!.uid,
          authorization.member!.canCoordinate,
          document.get("status"),
        ),
      }))
      .sort((left, right) => (right.createdAtMillis || 0) - (left.createdAtMillis || 0));
    return NextResponse.json(
      { suggestions },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Erreur de lecture des propositions d’ordre du jour:", error);
    return NextResponse.json({ error: "Impossible de charger les propositions." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ meetingId: string }> },
) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;
  const { meetingId } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,150}$/.test(meetingId)) {
    return NextResponse.json({ error: "Identifiant de réunion invalide." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await readActionBoardBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Requête invalide.";
    return NextResponse.json({ error: message }, { status: message.includes("taille maximale") ? 413 : 400 });
  }
  const parsed = agendaSuggestionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Le point proposé doit contenir 5 à 240 caractères." }, { status: 400 });

  try {
    const meetingRef = adminDb.collection("memberMeetings").doc(meetingId);
    const suggestionRef = meetingRef.collection("agendaSuggestions").doc();
    await adminDb.runTransaction(async (transaction) => {
      const meeting = await transaction.get(meetingRef);
      if (!meeting.exists || meeting.get("deletedAt")) throw Object.assign(new Error("Réunion introuvable."), { status: 404 });
      if (!canSuggestAgenda(meeting.get("status"), meeting.get("startsAt"))) {
        throw Object.assign(new Error("Les propositions sont ouvertes seulement avant une réunion publiée."), { status: 409 });
      }
      transaction.create(suggestionRef, {
        text: parsed.data.text,
        status: "pending",
        createdByUid: authorization.member!.uid,
        createdByName: authorization.member!.displayName,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    return NextResponse.json({ ok: true, id: suggestionRef.id }, { status: 201 });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
    if (status >= 400 && status < 500) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Proposition refusée." }, { status });
    }
    console.error("Erreur de création d’une proposition d’ordre du jour:", error);
    return NextResponse.json({ error: "Impossible d’envoyer ce point." }, { status: 500 });
  }
}