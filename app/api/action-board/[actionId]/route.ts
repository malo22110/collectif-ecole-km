import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  actionEditSchema,
  actionTransitionSchema,
  canManageAction,
  canTransitionAction,
  type ActionStatus,
} from "@/lib/actionBoard";
import { authorizeActionBoardMember, readActionBoardBody } from "@/lib/actionBoardServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-ACTION-BOARD-03] Authors and coordinators may edit proposal content; only coordinators advance workflow.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ actionId: string }> },
) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;

  const { actionId } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,150}$/.test(actionId)) {
    return NextResponse.json({ error: "Identifiant de proposition invalide." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await readActionBoardBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Requête invalide.";
    return NextResponse.json({ error: message }, { status: message.includes("taille maximale") ? 413 : 400 });
  }

  if (!body || typeof body !== "object" || !("action" in body) || !("data" in body)) {
    return NextResponse.json({ error: "Action de mise à jour invalide." }, { status: 400 });
  }

  const actionRef = adminDb.collection("memberActionBoard").doc(actionId);
  try {
    if (body.action === "edit") {
      const parsed = actionEditSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ error: "Vérifiez le pôle, le titre et le contenu." }, { status: 400 });
      }
      await adminDb.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(actionRef);
        if (!snapshot.exists) throw Object.assign(new Error("Proposition introuvable."), { status: 404 });
        if (snapshot.get("deletedAt")) throw Object.assign(new Error("Proposition introuvable."), { status: 404 });
        if (!canManageAction(String(snapshot.get("createdByUid")), authorization.member!.uid, authorization.member!.canCoordinate)) {
          throw Object.assign(new Error("La modification est réservée à l’auteur et aux coordinateurs."), { status: 403 });
        }
        if (parsed.data.meetingId) {
          const meetingRef = adminDb.collection("memberMeetings").doc(parsed.data.meetingId);
          const meeting = await transaction.get(meetingRef);
          if (!meeting.exists || meeting.get("deletedAt") || meeting.get("status") !== "published") {
            throw Object.assign(new Error("Choisissez une réunion publiée."), { status: 400 });
          }
        }
        transaction.update(actionRef, {
          ...parsed.data,
          updatedAt: FieldValue.serverTimestamp(),
          updatedByUid: authorization.member!.uid,
          updatedByName: authorization.member!.displayName,
        });
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "transition") {
      if (!authorization.member.canCoordinate) {
        return NextResponse.json({ error: "Seuls les responsables de coordination peuvent faire évoluer le suivi." }, { status: 403 });
      }
      const parsed = actionTransitionSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ error: "Le nouvel état de suivi est invalide." }, { status: 400 });
      }
      await adminDb.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(actionRef);
        if (!snapshot.exists) throw Object.assign(new Error("Proposition introuvable."), { status: 404 });
        if (snapshot.get("deletedAt")) throw Object.assign(new Error("Proposition introuvable."), { status: 404 });
        const currentStatus = snapshot.get("status") as ActionStatus;
        if (!canTransitionAction(currentStatus, parsed.data.status)) {
          throw Object.assign(new Error("Cette transition n’est pas permise depuis l’état actuel."), { status: 409 });
        }
        transaction.update(actionRef, {
          status: parsed.data.status,
          statusNote: parsed.data.statusNote,
          updatedAt: FieldValue.serverTimestamp(),
          updatedByUid: authorization.member!.uid,
          updatedByName: authorization.member!.displayName,
        });
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action de mise à jour inconnue." }, { status: 400 });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
    if (status >= 400 && status < 500) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Mise à jour refusée." }, { status });
    }
    console.error("Erreur de mise à jour du tableau d’actions:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour la proposition." }, { status: 500 });
  }
}

// [SPEC-ACTION-BOARD-04] Authors and coordinators can withdraw a proposal without erasing its history.
export async function DELETE(
  request: Request,
  context: { params: Promise<{ actionId: string }> },
) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;

  const { actionId } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,150}$/.test(actionId)) {
    return NextResponse.json({ error: "Identifiant de proposition invalide." }, { status: 400 });
  }

  const actionRef = adminDb.collection("memberActionBoard").doc(actionId);
  try {
    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(actionRef);
      if (!snapshot.exists || snapshot.get("deletedAt")) {
        throw Object.assign(new Error("Proposition introuvable."), { status: 404 });
      }
      if (!canManageAction(String(snapshot.get("createdByUid")), authorization.member!.uid, authorization.member!.canCoordinate)) {
        throw Object.assign(new Error("La suppression est réservée à l’auteur et aux coordinateurs."), { status: 403 });
      }
      transaction.update(actionRef, {
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
    console.error("Erreur de suppression d’une proposition:", error);
    return NextResponse.json({ error: "Impossible de supprimer la proposition." }, { status: 500 });
  }
}