import assert from "node:assert/strict";
import test from "node:test";
import {
  campaignInputSchema,
  campaignIdSchema,
  canCreateCampaign,
  detectCampaignDocumentType,
  getMemberRoles,
  isValidatedMember,
  memberPlacePreferencesSchema,
  sanitizeCampaignFileName,
  visitInputSchema
} from "../lib/tractationValidation.ts";

// [SPEC-TRACTATION-01] Campaign creation rejects empty, oversized, or duplicate location selections.
test("valide les champs de campagne et refuse les lieux répétés", () => {
  const valid = { title: "Tractation du bourg", message: "Passage auprès des habitants.", lieuDitIds: ["lieu-1"] };
  assert.equal(campaignInputSchema.safeParse(valid).success, true);
  assert.equal(campaignInputSchema.safeParse({ ...valid, lieuDitIds: ["lieu-1", "lieu-1"] }).success, false);
  assert.equal(campaignInputSchema.safeParse({ ...valid, lieuDitIds: ["lieu-1/visits/other"] }).success, false);
  assert.equal(campaignInputSchema.safeParse({ ...valid, message: "" }).success, false);
  assert.equal(campaignIdSchema.safeParse("lieu-1").success, true);
});

// [SPEC-TOURNEE-04] Favorite places are private bounded IDs; saved address requires explicit non-empty input.
test("valide les préférences privées des lieux favoris", () => {
  const valid = { favoritePlaceIds: ["place-1"], setupComplete: true, savedAddress: null };
  assert.equal(memberPlacePreferencesSchema.safeParse(valid).success, true);
  assert.equal(memberPlacePreferencesSchema.safeParse({ ...valid, favoritePlaceIds: ["place-1", "place-1"] }).success, false);
  assert.equal(memberPlacePreferencesSchema.safeParse({ ...valid, favoritePlaceIds: Array(21).fill("place") }).success, false);
  assert.equal(memberPlacePreferencesSchema.safeParse({ ...valid, savedAddress: "12 rue" }).success, true);
  assert.equal(memberPlacePreferencesSchema.safeParse({ ...valid, savedAddress: "" }).success, false);
  assert.equal(memberPlacePreferencesSchema.safeParse({ ...valid, isPublic: true }).success, false);
});

// [SPEC-TRACTATION-01] Visit changes accept an explicit boolean only.
test("valide une mise à jour de passage booléenne stricte", () => {
  assert.equal(visitInputSchema.safeParse({ visited: true }).success, true);
  assert.equal(visitInputSchema.safeParse({ visited: "true" }).success, false);
  assert.equal(visitInputSchema.safeParse({ visited: true, uid: "other" }).success, false);
});

// [SPEC-TRACTATION-02] Only persisted tractation/admin roles and the established admin allowlist can create campaigns.
test("autorise la création selon les rôles persistés et le statut membre", () => {
  assert.equal(canCreateCampaign({ roles: ["tractation"] }, "membre@example.com"), true);
  assert.equal(canCreateCampaign({ role: "admin" }, "membre@example.com"), true);
  assert.equal(canCreateCampaign({ roles: ["membre"] }, "membre@example.com"), false);
  assert.deepEqual(getMemberRoles({ roles: ["membre", 1] }), ["membre"]);
  assert.equal(isValidatedMember({ status: "validated" }), true);
  assert.equal(isValidatedMember({ status: "pending" }), false);
});

// [SPEC-TRACTATION-03] Uploads are classified from their signatures and filenames cannot escape storage paths.
test("détecte uniquement les signatures PDF et image autorisées", () => {
  assert.equal(detectCampaignDocumentType(new TextEncoder().encode("%PDF-1.7"))?.contentType, "application/pdf");
  assert.equal(detectCampaignDocumentType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))?.extension, "jpg");
  assert.equal(detectCampaignDocumentType(new TextEncoder().encode("not a file")), null);
  assert.equal(sanitizeCampaignFileName("../../tracts.pdf"), "_.._tracts.pdf");
});