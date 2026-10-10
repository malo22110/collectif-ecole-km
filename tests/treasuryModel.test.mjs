import test from "node:test";
import assert from "node:assert/strict";
import {
  canAdminProcessReimbursement,
  canApplyReimbursementAction,
  canManageTreasury,
  contributionInputSchema,
  euroInputToCents,
  nextTreasuryTotals,
  reimbursementDecisionSchema,
  reimbursementInputSchema,
  treasuryBalanceCents,
} from "../lib/treasuryModel.ts";

// [SPEC-TREASURY-01] Validate precise money arithmetic and the public/private ledger boundary.
test("conversion euros-centimes exacte et bornée", () => {
  assert.equal(euroInputToCents("12,5"), 1250);
  assert.equal(euroInputToCents("0.09"), 9);
  assert.equal(euroInputToCents("10000"), 1_000_000);
  assert.equal(euroInputToCents("10000.01"), null);
  assert.equal(euroInputToCents("1.234"), null);
});

test("une demande impose un libellé public sans coordonnées et une vraie date", () => {
  const validRequest = {
    submissionId: "b8b76c94-f222-43c9-967a-97b6dca9f674",
    amountCents: 2450,
    publicLabel: "Impressions et affiches",
    description: "Avance pour impression des affiches de la réunion.",
    occurredOn: "2026-10-09",
  };
  assert.equal(reimbursementInputSchema.safeParse(validRequest).success, true);
  assert.equal(
    reimbursementInputSchema.safeParse({ ...validRequest, publicLabel: "jean@example.fr" }).success,
    false,
  );
  assert.equal(
    reimbursementInputSchema.safeParse({ ...validRequest, occurredOn: "2026-02-30" }).success,
    false,
  );
});

test("une contribution est limitée aux montants, dates et modes attendus", () => {
  assert.equal(
    contributionInputSchema.safeParse({
      idempotencyKey: "b8b76c94-f222-43c9-967a-97b6dca9f674",
      amountCents: 500,
      occurredOn: "2026-10-10",
      method: "paypal",
    }).success,
    true,
  );
  assert.equal(
    contributionInputSchema.safeParse({
      idempotencyKey: "b8b76c94-f222-43c9-967a-97b6dca9f674",
      amountCents: -1,
      occurredOn: "2026-10-10",
      method: "paypal",
    }).success,
    false,
  );
});

test("le solde suit les écritures validées et le solde initial est unique", () => {
  const empty = {
    initialized: false,
    openingBalanceCents: 0,
    contributionsCents: 0,
    expensesCents: 0,
  };
  const opened = nextTreasuryTotals(empty, "opening", 5000);
  const funded = nextTreasuryTotals(opened, "contribution", 2500);
  const spent = nextTreasuryTotals(funded, "expense", 1250);
  assert.equal(treasuryBalanceCents(spent), 6250);
  assert.throws(() => nextTreasuryTotals(opened, "opening", 1));
  assert.throws(() => nextTreasuryTotals(empty, "contribution", 1));
});

test("un remboursement ne peut être payé qu’après approbation", () => {
  assert.equal(canApplyReimbursementAction("pending", "approve"), true);
  assert.equal(canApplyReimbursementAction("approved", "pay"), true);
  assert.equal(canApplyReimbursementAction("pending", "pay"), false);
  assert.equal(canApplyReimbursementAction("paid", "pay"), false);
  assert.equal(
    reimbursementDecisionSchema.safeParse({ action: "reject" }).success,
    false,
  );
  assert.equal(
    reimbursementDecisionSchema.safeParse({ action: "pay" }).success,
    false,
  );
  assert.equal(
    reimbursementDecisionSchema.safeParse({ action: "pay", paidOn: "2026-10-10" }).success,
    true,
  );
  assert.equal(canAdminProcessReimbursement("approve", "member-1", "admin-1"), true);
  assert.equal(canAdminProcessReimbursement("approve", "admin-1", "admin-1"), false);
  assert.equal(canAdminProcessReimbursement("pay", "member-1", "admin-2", "admin-1"), true);
  assert.equal(canAdminProcessReimbursement("pay", "member-1", "admin-1", "admin-1"), false);
  assert.equal(canAdminProcessReimbursement("pay", "admin-2", "admin-1", "admin-1"), false);
});

test("seuls le rôle trésorier et les administrateurs gèrent la trésorerie", () => {
  assert.equal(canManageTreasury(["tresorier"]), true);
  assert.equal(canManageTreasury(["membre", "tresorier"]), true);
  assert.equal(canManageTreasury(["admin"]), true);
  assert.equal(canManageTreasury(["gestionnaire"]), false);
  assert.equal(canManageTreasury(["redacteur"]), false);
});