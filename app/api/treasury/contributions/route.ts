import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { contributionInputSchema, nextTreasuryTotals, treasuryBalanceCents } from "@/lib/treasuryModel";
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

// [SPEC-TREASURY-04] Published contribution entries contain only an anonymous category and are written with totals atomically.
export async function POST(request: Request) {
  const authorization = await authorizeTreasuryMember(request);
  if (!authorization.member) return authorization.response;
  if (!authorization.member.canManageTreasury) {
    return Response.json({ error: "Action réservée au trésorier ou aux administrateurs." }, { status: 403 });
  }

  try {
    const parsed = contributionInputSchema.safeParse(await readTreasuryJson(request));
    if (!parsed.success) throw new TreasuryRouteError(400, "Les informations de contribution sont invalides.");
    const { amountCents, occurredOn, method, note, idempotencyKey } = parsed.data;
    const entryRef = treasuryEntriesRef.doc(idempotencyKey);
    const occurredAt = Timestamp.fromDate(new Date(`${occurredOn}T12:00:00.000Z`));
    let alreadyRecorded = false;

    await treasuryConfigRef.firestore.runTransaction(async (transaction) => {
      const [configSnapshot, existingEntry] = await Promise.all([
        transaction.get(treasuryConfigRef),
        transaction.get(entryRef),
      ]);
      if (existingEntry.exists) {
        const existing = existingEntry.data()!;
        if (
          existing.kind !== "contribution" ||
          existing.createdByUid !== authorization.member.uid ||
          existing.amountCents !== amountCents ||
          existing.occurredOn !== occurredOn ||
          existing.method !== method ||
          existing.note !== note
        ) {
          throw new TreasuryRouteError(409, "La clé de cette contribution a déjà été utilisée.");
        }
        alreadyRecorded = true;
        return;
      }
      if (!configSnapshot.exists || configSnapshot.get("initialized") !== true) {
        throw new TreasuryRouteError(409, "Enregistrez d’abord le solde initial.");
      }
      const current = {
        initialized: true,
        openingBalanceCents: configSnapshot.get("openingBalanceCents") || 0,
        contributionsCents: configSnapshot.get("contributionsCents") || 0,
        expensesCents: configSnapshot.get("expensesCents") || 0,
      };
      const next = nextTreasuryTotals(current, "contribution", amountCents);
      transaction.create(entryRef, {
        kind: "contribution",
        amountCents,
        label:
          method === "paypal"
            ? "Contribution PayPal"
            : method === "especes"
              ? "Contribution en espèces"
              : "Autre contribution",
        method,
        note,
        occurredOn,
        occurredAt,
        createdAt: FieldValue.serverTimestamp(),
        createdByUid: authorization.member.uid,
      });
      transaction.update(treasuryConfigRef, {
        contributionsCents: next.contributionsCents,
        balanceCents: treasuryBalanceCents(next),
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: authorization.member.uid,
      });
    });

    return Response.json({ ok: true, entryId: entryRef.id, alreadyRecorded });
  } catch (error) {
    return treasuryErrorResponse(error, "Impossible d’enregistrer la contribution.");
  }
}