export type CmsDraftEditConflict = "not-pending" | "stale-edit";

export function getCmsDraftEditConflict(
  status: string | undefined,
  currentEditVersion: number,
  expectedEditVersion: number,
): CmsDraftEditConflict | null {
  if (status !== "pending") return "not-pending";
  if (currentEditVersion !== expectedEditVersion) return "stale-edit";
  return null;
}
