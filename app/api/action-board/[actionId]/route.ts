import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  actionEditSchema,
  actionTransitionSchema,
  canEditAction,
  canTransitionAction,
  type ActionStatus,
} from "@/lib/actionBoard";
import { authorizeActionBoardMember, readActionBoardBody } from "@/lib/actionBoardServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-ACTION-BOARD-03] Authors may edit only their own new proposals; coordinators may advance the shared workflow.
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
        const currentStatus = snapshot.get("status") as ActionStatus;
        if (!canEditAction(String(snapshot.get("createdByUid")), authorization.member!.uid, currentStatus)) {
          throw Object.assign(new Error("Seul l’auteur peut modifier une proposition encore nouvelle."), { status: 403 });
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