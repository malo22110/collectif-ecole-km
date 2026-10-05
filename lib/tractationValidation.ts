import { z } from "zod";
import {
  detectSupportedUploadType,
  sanitizeUploadFileName,
} from "./uploadValidation.ts";

export const campaignIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{1,150}$/);

// [SPEC-TRACTATION-01] Validate campaign content, selected places, and per-member visit updates.
export const campaignInputSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    message: z.string().trim().min(1).max(4000),
    lieuDitIds: z
      .array(campaignIdSchema)
      .min(1)
      .max(200)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Les lieux-dits ne doivent pas être répétés.",
      ),
  })
  .strict();

// [SPEC-TRACTATION-07] Campaign edits must retain every place that already has a shared assignment.
export function canUpdateCampaignPlaces(
  assignedPlaceIds: string[],
  requestedPlaceIds: string[],
) {
  const requested = new Set(requestedPlaceIds);
  return assignedPlaceIds.every((placeId) => requested.has(placeId));
}

// [SPEC-TRACTATION-08] A place is mobilizable only when it has at least one known household.
export function hasEligibleHouseholds(value: unknown) {
  return Number.isInteger(value) && Number(value) > 0;
}

// [SPEC-TRACTATION-09] A participant can replace an existing route only after every eligible assignment is completed.
export function canStartAnotherRoute(assignmentStatuses: unknown[]) {
  return assignmentStatuses.every((status) => status === "completed");
}

export const visitInputSchema = z.object({ visited: z.boolean() }).strict();

// [SPEC-TRACTATION-04] Shared place claims transition through an explicit bounded action set.
export const placeAssignmentInputSchema = z
  .object({
    action: z.enum(["claim", "complete", "release", "reopen"]),
  })
  .strict();

export function canCorrectPlaceAssignment(
  claimedByUid: unknown,
  requesterUid: string,
  isCampaignManager: boolean,
) {
  return claimedByUid === requesterUid || isCampaignManager;
}

export function canReopenPlaceAssignment(
  status: unknown,
  claimedByUid: unknown,
  requesterUid: string,
  isCampaignManager = false,
) {
  return status === "completed" &&
    canCorrectPlaceAssignment(claimedByUid, requesterUid, isCampaignManager);
}

// [SPEC-TRACTATION-05] A member claims one ordered campaign route as a unique bounded set of places.
export const campaignRouteInputSchema = z
  .object({
    lieuDitIds: z
      .array(campaignIdSchema)
      .min(1)
      .max(200)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Les étapes de la tournée ne doivent pas être répétées.",
      ),
  })
  .strict();

// [SPEC-TOURNEE-04] Home address is optional; favorites are bounded IDs, never public profile data.
export const memberPlacePreferencesSchema = z
  .object({
    favoritePlaceIds: z
      .array(campaignIdSchema)
      .max(20)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Les favoris ne doivent pas être répétés.",
      ),
    setupComplete: z.boolean(),
    savedAddress: z.string().trim().min(5).max(180).nullable(),
  })
  .strict();

const ADMIN_EMAILS = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com",
]);

export function getMemberRoles(memberData: Record<string, unknown>) {
  if (Array.isArray(memberData.roles))
    return memberData.roles.filter(
      (role): role is string => typeof role === "string",
    );
  return typeof memberData.role === "string" ? [memberData.role] : [];
}

export function isValidatedMember(memberData: Record<string, unknown>) {
  return memberData.status === "validated";
}

// [SPEC-TRACTATION-02] Campaign creation depends on server-stored role grants, not request input.
export function canCreateCampaign(
  memberData: Record<string, unknown>,
  email: string,
) {
  const roles = getMemberRoles(memberData);
  return (
    roles.includes("admin") ||
    roles.includes("tractation") ||
    ADMIN_EMAILS.has(email.toLowerCase())
  );
}

// [SPEC-TRACTATION-03] Accept only supported image/PDF signatures, not client MIME claims alone.
export function detectCampaignDocumentType(bytes: Uint8Array) {
  return detectSupportedUploadType(bytes);
}

export function sanitizeCampaignFileName(fileName: string) {
  return sanitizeUploadFileName(fileName);
}
