import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { authorizeActionBoardMember, readActionBoardBody } from "@/lib/actionBoardServer";
import { meetingUpdateSchema } from "@/lib/memberMeetings";
import { canManageMemberEntity } from "@/lib/memberEntityAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-MEMBER-MEETINGS-03] Coordinators can edit notes and publish a draft without creating a municipal decision.
export async function PATCH(
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
  if (!body || typeof body !== "object" || !("action" in body)) {
    return NextResponse.json({ error: "Action de réunion invalide." }, { status: 400 });
  }

  const meetingRef = adminDb.collection("memberMeetings").doc(meetingId);
  try {
    if (body.action === "publish") {
      if (!authorization.member.canCoordinate) {
        return NextResponse.json({ error: "Seuls les coordinateurs peuvent publier une réunion." }, { status: 403 });
      }
      await adminDb.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(meetingRef);
        if (!snapshot.exists || snapshot.get("deletedAt")) throw Object.assign(new Error("Réunion introuvable."), { status: 404 });
        if (snapshot.get("status") !== "draft") throw Object.assign(new Error("Seul un brouillon peut être publié."), { status: 409 });
        transaction.update(meetingRef, {
          status: "published",
          publishedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedByName: authorization.member!.displayName,
        });
      });
      return NextResponse.json({ ok: true, status: "published" });
    }

    if (body.action === "save" && "data" in body) {
      const parsed = meetingUpdateSchema.safeParse(body.data);
      if (!parsed.success) return NextResponse.json({ error: "Vérifiez les champs de la réunion." }, { status: 400 });
      await adminDb.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(meetingRef);
        if (!snapshot.exists || snapshot.get("deletedAt")) throw Object.assign(new Error("Réunion introuvable."), { status: 404 });
        if (!canManageMemberEntity(String(snapshot.get("createdByUid")), authorization.member!.uid, authorization.member!.canCoordinate)) {
          throw Object.assign(new Error("La modification est réservée à l’auteur et aux coordinateurs."), { status: 403 });
        }
        transaction.update(meetingRef, {
          ...parsed.data,
          updatedAt: FieldValue.serverTimestamp(),
          updatedByUid: authorization.member!.uid,
          updatedByName: authorization.member!.displayName,
        });
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action de réunion inconnue." }, { status: 400 });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
    if (status >= 400 && status < 500) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Action refusée." }, { status });
    }
    console.error("Erreur de modification de réunion:", error);
    return NextResponse.json({ error: "Impossible de modifier la réunion." }, { status: 500 });
  }
}

// [SPEC-MEMBER-MEETINGS-06] Authors and coordinators can withdraw a meeting while preserving linked records.
export async function DELETE(
  request: Request,
  context: { params: Promise<{ meetingId: string }> },
) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;
  const { meetingId } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,150}$/.test(meetingId)) {
    return NextResponse.json({ error: "Identifiant de réunion invalide." }, { status: 400 });
  }

  const meetingRef = adminDb.collection("memberMeetings").doc(meetingId);
  try {
    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(meetingRef);
      if (!snapshot.exists || snapshot.get("deletedAt")) {
        throw Object.assign(new Error("Réunion introuvable."), { status: 404 });
      }
      if (!canManageMemberEntity(String(snapshot.get("createdByUid")), authorization.member!.uid, authorization.member!.canCoordinate)) {
        throw Object.assign(new Error("La suppression est réservée à l’auteur et aux coordinateurs."), { status: 403 });
      }
      transaction.update(meetingRef, {
        deletedAt: FieldValue.serverTimestamp(),
        deletedByUid: authorization.member!.uid,
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: authorization.member!.uid,
        updatedByName: authorization.member!.displayName,
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
    if (status >= 400 && status < 500) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Suppression refusée." }, { status });
    }
    console.error("Erreur de suppression d’une réunion:", error);
    return NextResponse.json({ error: "Impossible de supprimer la réunion." }, { status: 500 });
  }
}