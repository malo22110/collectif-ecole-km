import { z } from "zod";

export const MAX_TREASURY_AMOUNT_CENTS = 1_000_000;
export const TREASURY_PAGE_SIZE = 50;

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, "La date est invalide.");

export const PUBLIC_EXPENSE_CATEGORIES = [
  "Impressions et affiches",
  "Hébergement du site web",
  "Gâteaux et accueil",
  "Fournitures du collectif",
  "Frais de déplacement",
  "Autres frais du collectif",
] as const;

// [SPEC-TREASURY-01] Money is stored as integer cents and all public labels are PII-free.
export const reimbursementInputSchema = z
  .object({
    submissionId: z.string().uuid(),
    amountCents: z.number().int().positive().max(MAX_TREASURY_AMOUNT_CENTS),
    publicLabel: z.enum(PUBLIC_EXPENSE_CATEGORIES),
    description: z.string().trim().min(5).max(500),
    occurredOn: dateSchema,
  })
  .strict();

export const contributionInputSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    amountCents: z.number().int().positive().max(MAX_TREASURY_AMOUNT_CENTS),
    occurredOn: dateSchema,
    method: z.enum(["paypal", "especes", "autre"]),
    note: z.string().trim().max(300).optional().default(""),
  })
  .strict();

export const openingBalanceInputSchema = z
  .object({
    amountCents: z.number().int().nonnegative().max(MAX_TREASURY_AMOUNT_CENTS),
    occurredOn: dateSchema,
  })
  .strict();

export const reimbursementDecisionSchema = z
  .object({
    action: z.enum(["approve", "reject", "pay"]),
    rejectionReason: z.string().trim().min(5).max(300).optional(),
    paidOn: dateSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.action === "reject" && !value.rejectionReason) {
      context.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Un motif est requis pour refuser une demande.",
      });
    }
    if (value.action === "pay" && !value.paidOn) {
      context.addIssue({
        code: "custom",
        path: ["paidOn"],
        message: "La date du remboursement est requise.",
      });
    }
  });

export type TreasuryEntryKind = "opening" | "contribution" | "expense";
export type ReimbursementStatus = "draft" | "pending" | "approved" | "rejected" | "paid";
export type ReimbursementAction = "approve" | "reject" | "pay";

export type TreasuryTotals = {
  initialized: boolean;
  openingBalanceCents: number;
  contributionsCents: number;
  expensesCents: number;
};

export function euroInputToCents(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [euros, cents = ""] = normalized.split(".");
  const result = Number(euros) * 100 + Number(cents.padEnd(2, "0"));
  return Number.isSafeInteger(result) && result <= MAX_TREASURY_AMOUNT_CENTS ? result : null;
}

export function nextTreasuryTotals(
  current: TreasuryTotals,
  kind: TreasuryEntryKind,
  amountCents: number,
): TreasuryTotals {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("Le montant doit être un nombre entier positif de centimes.");
  }
  if (kind === "opening") {
    if (current.initialized) throw new Error("Le solde initial est déjà enregistré.");
    return { ...current, initialized: true, openingBalanceCents: amountCents };
  }
  if (!current.initialized) throw new Error("Le solde initial doit être enregistré avant les opérations.");
  if (kind === "contribution") {
    return { ...current, contributionsCents: current.contributionsCents + amountCents };
  }
  return { ...current, expensesCents: current.expensesCents + amountCents };
}

export function treasuryBalanceCents(totals: TreasuryTotals) {
  return totals.openingBalanceCents + totals.contributionsCents - totals.expensesCents;
}

export function canApplyReimbursementAction(
  status: ReimbursementStatus,
  action: ReimbursementAction,
) {
  return (
    (status === "pending" && (action === "approve" || action === "reject")) ||
    (status === "approved" && action === "pay")
  );
}

export function canAdminProcessReimbursement(
  action: ReimbursementAction,
  submittedByUid: string,
  actorUid: string,
  decidedByUid?: string,
) {
  if (submittedByUid === actorUid) return false;
  return action !== "pay" || (Boolean(decidedByUid) && decidedByUid !== actorUid);
}

export function canManageTreasury(roles: string[]) {
  return roles.includes("admin") || roles.includes("tresorier");
}

export function contributionPublicLabel(method: "paypal" | "especes" | "autre") {
  if (method === "paypal") return "Contribution PayPal";
  if (method === "especes") return "Contribution en espèces";
  return "Autre contribution";
}