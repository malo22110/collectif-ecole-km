import { z } from "zod";

export const campaignIdSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{1,150}$/);

// [SPEC-TRACTATION-01] Validate campaign content, selected places, and per-member visit updates.
export const campaignInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(1).max(4000),
  lieuDitIds: z.array(campaignIdSchema).min(1).max(200)
    .refine(ids => new Set(ids).size === ids.length, "Les lieux-dits ne doivent pas être répétés.")
}).strict();

export const visitInputSchema = z.object({ visited: z.boolean() }).strict();

// [SPEC-TRACTATION-04] Shared place claims transition through an explicit bounded action set.
export const placeAssignmentInputSchema = z.object({
  action: z.enum(["claim", "complete", "release"])
}).strict();

// [SPEC-TRACTATION-05] A member claims one ordered campaign route as a unique bounded set of places.
export const campaignRouteInputSchema = z.object({
  lieuDitIds: z.array(campaignIdSchema).min(1).max(200)
    .refine(ids => new Set(ids).size === ids.length, "Les étapes de la tournée ne doivent pas être répétées.")
}).strict();

// [SPEC-TOURNEE-04] Home address is optional; favorites are bounded IDs, never public profile data.
export const memberPlacePreferencesSchema = z.object({
  favoritePlaceIds: z.array(campaignIdSchema).max(20)
    .refine(ids => new Set(ids).size === ids.length, "Les favoris ne doivent pas être répétés."),
  setupComplete: z.boolean(),
  savedAddress: z.string().trim().min(5).max(180).nullable()
}).strict();

const ADMIN_EMAILS = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com"
]);

export function getMemberRoles(memberData: Record<string, unknown>) {
  if (Array.isArray(memberData.roles)) return memberData.roles.filter((role): role is string => typeof role === "string");
  return typeof memberData.role === "string" ? [memberData.role] : [];
}

export function isValidatedMember(memberData: Record<string, unknown>) {
  return memberData.status === "validated";
}

// [SPEC-TRACTATION-02] Campaign creation depends on server-stored role grants, not request input.
export function canCreateCampaign(memberData: Record<string, unknown>, email: string) {
  const roles = getMemberRoles(memberData);
  return roles.includes("admin") || roles.includes("tractation") || ADMIN_EMAILS.has(email.toLowerCase());
}

// [SPEC-TRACTATION-03] Accept only supported image/PDF signatures, not client MIME claims alone.
export function detectCampaignDocumentType(bytes: Uint8Array) {
  if (bytes.length >= 5 && new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-") {
    return { contentType: "application/pdf", extension: "pdf" };
  }

  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) {
    return { contentType: "image/png", extension: "png" };
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }

  if (bytes.length >= 12
    && new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF"
    && new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }

  return null;
}

export function sanitizeCampaignFileName(fileName: string) {
  const cleaned = fileName
    .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 160);
  return cleaned || "document";
}