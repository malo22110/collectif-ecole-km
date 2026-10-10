import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { authorizeActionBoardMember, readActionBoardBody } from "@/lib/actionBoardServer";
import { agendaSuggestionDecisionSchema } from "@/lib/memberMeetings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-MEMBER-MEETINGS-04] Coordinators may accept a suggestion into the agenda or decline it once.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ meetingId: string; suggestionId: string }> },
) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;
  if (!authorization.member.canCoordinate) {
    return NextResponse.json({ error: "Action réservée aux coordinateurs." }, { status: 403 });
  }
  const { meetingId, suggestionId } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,150}$/.test(meetingId) || !/^[A-Za-z0-9_-]{20,150}$/.test(suggestionId)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await readActionBoardBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Requête invalide.";
    return NextResponse.json({ error: message }, { status: message.includes("taille maximale") ? 413 : 400 });
  }
  const parsed = agendaSuggestionDecisionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Décision de proposition invalide." }, { status: 400 });

  try {
    const meetingRef = adminDb.collection("memberMeetings").doc(meetingId);
    const suggestionRef = meetingRef.collection("agendaSuggestions").doc(suggestionId);
    await adminDb.runTransaction(async (transaction) => {
      const [meeting, suggestion] = await Promise.all([
        transaction.get(meetingRef),
        transaction.get(suggestionRef),
      ]);
      if (!meeting.exists || !suggestion.exists) {
        throw Object.assign(new Error("Réunion ou proposition introuvable."), { status: 404 });
      }
      if (suggestion.get("status") !== "pending") {
        throw Object.assign(new Error("Cette proposition a déjà été traitée."), { status: 409 });
      }

      if (parsed.data.status === "accepted") {
        const agendaItems = meeting.get("agendaItems");
        const currentItems = Array.isArray(agendaItems) ? agendaItems : [];
        if (currentItems.length >= 20) {
          throw Object.assign(new Error("L’ordre du jour a atteint sa limite de 20 points."), { status: 409 });
        }
        transaction.update(meetingRef, {
          agendaItems: [
            ...currentItems,
            { id: randomUUID(), text: suggestion.get("text"), sourceSuggestionId: suggestionId },
          ],
          updatedAt: FieldValue.serverTimestamp(),
          updatedByName: authorization.member!.displayName,
        });
      }

      transaction.update(suggestionRef, {
        status: parsed.data.status,
        decidedByName: authorization.member!.displayName,
        decidedAt: FieldValue.serverTimestamp(),
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
    if (status >= 400 && status < 500) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Décision refusée." }, { status });
    }
    console.error("Erreur de décision sur une proposition d’ordre du jour:", error);
    return NextResponse.json({ error: "Impossible de traiter cette proposition." }, { status: 500 });
  }
}