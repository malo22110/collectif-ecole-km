import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  canApplyReimbursementAction,
  canAdminProcessReimbursement,
  nextTreasuryTotals,
  reimbursementDecisionSchema,
  treasuryBalanceCents,
  type ReimbursementStatus,
} from "@/lib/treasuryModel";
import {
  authorizeTreasuryMember,
  reimbursementRequestsRef,
  treasuryConfigRef,
  treasuryEntriesRef,
  treasuryErrorResponse,
  readTreasuryJson,
  TreasuryRouteError,
} from "@/lib/treasuryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-TREASURY-07] Only admins may decide requests; payment and ledger totals change atomically once.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  const authorization = await authorizeTreasuryMember(request);
  if (!authorization.member) return authorization.response;
  if (!authorization.member.canManageTreasury) {
    return Response.json({ error: "Action réservée au trésorier ou aux administrateurs." }, { status: 403 });
  }

  const { requestId } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,50}$/.test(requestId)) {
    return Response.json({ error: "Identifiant de demande invalide." }, { status: 400 });
  }

  try {
    const parsed = reimbursementDecisionSchema.safeParse(await readTreasuryJson(request));
    if (!parsed.success) {
      throw new TreasuryRouteError(400, "L’action et les informations associées sont invalides.");
    }
    const { action, paidOn, rejectionReason } = parsed.data;
    const requestRef = reimbursementRequestsRef.doc(requestId);
    const entryRef = treasuryEntriesRef.doc();

    await requestRef.firestore.runTransaction(async (transaction) => {
      const requestSnapshot = await transaction.get(requestRef);
      if (!requestSnapshot.exists) throw new TreasuryRouteError(404, "Demande introuvable.");
      const reimbursement = requestSnapshot.data()!;
      const currentStatus = reimbursement.status as ReimbursementStatus;
      if (!canApplyReimbursementAction(currentStatus, action)) {
        throw new TreasuryRouteError(409, "Cette action n’est pas possible pour l’état actuel.");
      }
      if (
        !canAdminProcessReimbursement(
          action,
          reimbursement.submittedByUid,
          authorization.member.uid,
          reimbursement.decidedByUid,
        )
      ) {
        throw new TreasuryRouteError(
          403,
          action === "pay"
            ? "Le remboursement doit être effectué par un administrateur différent de l’approbateur et du demandeur."
            : "Un administrateur ne peut pas traiter sa propre demande.",
        );
      }

      if (action === "approve") {
        transaction.update(requestRef, {
          status: "approved",
          decidedByUid: authorization.member.uid,
          decidedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      if (action === "reject") {
        transaction.update(requestRef, {
          status: "rejected",
          rejectionReason,
          decidedByUid: authorization.member.uid,
          decidedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      const amountCents = reimbursement.amountCents;
      if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
        throw new TreasuryRouteError(500, "Le montant enregistré de cette demande est invalide.");
      }
      const receiptPath = reimbursement.receipt?.storagePath;
      if (
        typeof receiptPath !== "string" ||
        !receiptPath.startsWith(`treasury/receipts/${requestId}/`)
      ) {
        throw new TreasuryRouteError(409, "Le justificatif de cette demande est introuvable.");
      }

      const configSnapshot = await transaction.get(treasuryConfigRef);
      if (!configSnapshot.exists || configSnapshot.get("initialized") !== true) {
        throw new TreasuryRouteError(409, "Le solde initial n’est pas configuré.");
      }
      const currentTotals = {
        initialized: true,
        openingBalanceCents: Number(configSnapshot.get("openingBalanceCents")) || 0,
        contributionsCents: Number(configSnapshot.get("contributionsCents")) || 0,
        expensesCents: Number(configSnapshot.get("expensesCents")) || 0,
      };
      const nextTotals = nextTreasuryTotals(currentTotals, "expense", amountCents);
      if (treasuryBalanceCents(nextTotals) < 0) {
        throw new TreasuryRouteError(409, "Le solde comptabilisé est insuffisant pour ce remboursement.");
      }

      const occurredAt = Timestamp.fromDate(new Date(`${paidOn}T12:00:00.000Z`));
      transaction.create(entryRef, {
        kind: "expense",
        amountCents,
        label: reimbursement.publicLabel,
        occurredOn: paidOn,
        occurredAt,
        reimbursementId: requestId,
        createdAt: FieldValue.serverTimestamp(),
        createdByUid: authorization.member.uid,
      });
      transaction.update(treasuryConfigRef, {
        expensesCents: nextTotals.expensesCents,
        balanceCents: treasuryBalanceCents(nextTotals),
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: authorization.member.uid,
      });
      transaction.update(requestRef, {
        status: "paid",
        paidOn,
        paidByUid: authorization.member.uid,
        paidAt: FieldValue.serverTimestamp(),
        ledgerEntryId: entryRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return Response.json({ ok: true });
  } catch (error) {
    return treasuryErrorResponse(error, "Impossible de mettre à jour cette demande.");
  }
}