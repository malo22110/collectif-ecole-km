export type PlaceAssignmentStatus = "claimed" | "completed";

export interface PublicPlaceAssignment {
  status: PlaceAssignmentStatus;
  isMine: boolean;
  memberName: string;
}

export function toPublicPlaceAssignment(
  assignment: {
    status: unknown;
    claimedByUid: unknown;
    claimedByName?: unknown;
  },
  viewerUid: string,
  fallbackDisplayName?: unknown,
): PublicPlaceAssignment | null {
  if (assignment.status !== "claimed" && assignment.status !== "completed") {
    return null;
  }

  const storedName =
    typeof assignment.claimedByName === "string"
      ? assignment.claimedByName.trim()
      : "";
  const fallbackName =
    typeof fallbackDisplayName === "string" ? fallbackDisplayName.trim() : "";

  return {
    status: assignment.status,
    isMine: assignment.claimedByUid === viewerUid,
    memberName: (storedName || fallbackName || "Membre").slice(0, 120),
  };
}
