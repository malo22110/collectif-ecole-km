import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { openingBalanceInputSchema } from "@/lib/treasuryModel";
import {
  authorizeTreasuryMember,
  treasuryConfigRef,
  treasuryEntriesRef,
  treasuryErrorResponse,
  readTreasuryJson,
  TreasuryRouteError,
} from "@/lib/treasuryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-TREASURY-03] Only a treasury administrator can establish the one-time opening PayPal balance.
export async function POST(request: Request) {
  const authorization = await authorizeTreasuryMember(request);
  if (!authorization.member) return authorization.response;
  if (!authorization.member.canManageTreasury) {
    return Response.json({ error: "Action réservée au trésorier ou aux administrateurs." }, { status: 403 });
  }

  try {
    const parsed = openingBalanceInputSchema.safeParse(await readTreasuryJson(request));
    if (!parsed.success) throw new TreasuryRouteError(400, "Le solde initial ou sa date est invalide.");
    const { amountCents, occurredOn } = parsed.data;
    const entryRef = amountCents > 0 ? treasuryEntriesRef.doc() : null;
    const occurredAt = Timestamp.fromDate(new Date(`${occurredOn}T12:00:00.000Z`));

    await treasuryConfigRef.firestore.runTransaction(async (transaction) => {
      const configSnapshot = await transaction.get(treasuryConfigRef);
      if (configSnapshot.get("initialized") === true) {
        throw new TreasuryRouteError(409, "Le solde initial est déjà enregistré.");
      }
      transaction.set(treasuryConfigRef, {
        initialized: true,
        openingBalanceCents: amountCents,
        contributionsCents: 0,
        expensesCents: 0,
        balanceCents: amountCents,
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: authorization.member.uid,
      });
      if (entryRef) {
        transaction.create(entryRef, {
          kind: "opening",
          amountCents,
          label: "Solde au lancement du registre",
          occurredOn,
          occurredAt,
          createdAt: FieldValue.serverTimestamp(),
          createdByUid: authorization.member.uid,
        });
      }
    });

    return Response.json({ ok: true });
  } catch (error) {
    return treasuryErrorResponse(error, "Impossible d’enregistrer le solde initial.");
  }
}