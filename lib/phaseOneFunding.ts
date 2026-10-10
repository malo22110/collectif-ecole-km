export const PHASE_ONE_TOTAL_EUROS = 552_170;
export const PHASE_ONE_WORKS_TARGET_EUROS = 550_000;
export const PHASE_ONE_STUDIES_PROVISION_EUROS = 127_110;
export const PHASE_ONE_OPERATION_TOTAL_HT_EUROS =
  PHASE_ONE_WORKS_TARGET_EUROS + PHASE_ONE_STUDIES_PROVISION_EUROS;
export const PHASE_ONE_OPERATION_VAT_RATE = 0.2;
export const PREFECTURE_OPERATION_CEILING_TTC_EUROS = 800_000;

export function estimateOperationTtc(totalHtEuros: number) {
  return Math.round(totalHtEuros * (1 + PHASE_ONE_OPERATION_VAT_RATE));
}

export const PHASE_ONE_AIDS = [
  { key: "department", amount: 99_405 },
  { key: "region", amount: 60_450 },
  { key: "detr", amount: 180_145 },
] as const;

export type PhaseOneAidKey = (typeof PHASE_ONE_AIDS)[number]["key"];
export type PhaseOneAidSelection = Record<PhaseOneAidKey, boolean>;

export function calculatePhaseOneRemainder(selection: PhaseOneAidSelection) {
  const selectedAidTotal = PHASE_ONE_AIDS.reduce(
    (total, aid) => total + (selection[aid.key] ? aid.amount : 0),
    0,
  );
  return PHASE_ONE_TOTAL_EUROS - selectedAidTotal;
}