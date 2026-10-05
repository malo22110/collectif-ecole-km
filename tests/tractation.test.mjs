import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  campaignInputSchema,
  campaignIdSchema,
  canUpdateCampaignPlaces,
  canCreateCampaign,
  canReopenPlaceAssignment,
  canStartAnotherRoute,
  campaignRouteInputSchema,
  canCorrectPlaceAssignment,
  detectCampaignDocumentType,
  getMemberRoles,
  hasEligibleHouseholds,
  isValidatedMember,
  memberPlacePreferencesSchema,
  placeAssignmentInputSchema,
  sanitizeCampaignFileName,
  visitInputSchema,
} from "../lib/tractationValidation.ts";
import { chunkOrderedRoutePoints } from "../lib/tourneeGeo.ts";
import { toPublicPlaceAssignment } from "../lib/tractationAssignmentDisplay.ts";
import { getBottomOverlayOcclusion, getMapFocusPanOffset } from "../lib/missionMapViewport.ts";

// [SPEC-TRACTATION-06] Campaign participation and route preparation actions stay fixed and reachable while viewing campaign details.
test("place les actions de campagne dans un footer fixe avec dégagement mobile", async () => {
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );
  const page = await readFile(
    new URL("../app/espace-membre/tournees/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(panel, /footer className="fixed inset-x-0 bottom-0[^\"]*md:left-64/);
  assert.match(panel, /Rejoindre cette campagne/);
  assert.match(panel, /Préparer ma tournée/);
  assert.match(panel, /Modifier la tournée/);
  assert.match(page, /Infos sur la tournée/);
  assert.match(panel, /showCampaignDetails = true/);
  assert.match(panel, /selectedCampaignId && !showCampaignDetails \? null/);
  assert.match(panel, /h-\[50dvh\] max-h-\[50dvh\]/);
  assert.match(panel, /onPointerDown=\{\(event\) =>/);
  assert.match(panel, /deltaY > 72/);
  assert.match(panel, /setMissionCampaignId\(null\)/);
  assert.match(panel, /max-h-\[18dvh\]/);
  assert.match(page, /pb-\[calc\(7rem\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(page, /"campaignInfo"/);
  assert.match(page, /onClick=\{\(\) => setView\("campaignInfo"\)\}/);
  assert.match(page, /missionMode=\{missionMode\}/);
  assert.match(page, /showCampaignDetails=\{false\}/);
  assert.doesNotMatch(page, /Choisissez parmi tous les secteurs de cette campagne/);
});

// [SPEC-TRACTATION-06] Keep a selected map marker centered in the unobscured map area.
test("compense le recentrage en fonction de la partie de carte cachée par le tiroir", () => {
  const mapRect = { top: 100, right: 390, bottom: 760, left: 0, height: 660, width: 390 };
  const expandedSheet = {
    top: 520,
    right: 390,
    bottom: 844,
    left: 0,
    height: 324,
    width: 390,
  };
  const collapsedSheet = {
    top: 700,
    right: 390,
    bottom: 844,
    left: 0,
    height: 144,
    width: 390,
  };

  assert.equal(getBottomOverlayOcclusion(mapRect, expandedSheet), 240);
  assert.equal(getMapFocusPanOffset(240), 120);
  assert.equal(getBottomOverlayOcclusion(mapRect, collapsedSheet), 60);
  assert.equal(getMapFocusPanOffset(60), 30);
  assert.equal(getBottomOverlayOcclusion(mapRect, { ...expandedSheet, left: 400, right: 790 }), 0);
});

// [SPEC-TRACTATION-01] Campaign creation rejects empty, oversized, or duplicate location selections.
test("valide les champs de campagne et refuse les lieux répétés", () => {
  const valid = {
    title: "Tractation du bourg",
    message: "Passage auprès des habitants.",
    lieuDitIds: ["lieu-1"],
  };
  assert.equal(campaignInputSchema.safeParse(valid).success, true);
  assert.equal(
    campaignInputSchema.safeParse({
      ...valid,
      lieuDitIds: ["lieu-1", "lieu-1"],
    }).success,
    false,
  );
  assert.equal(
    campaignInputSchema.safeParse({
      ...valid,
      lieuDitIds: ["lieu-1/visits/other"],
    }).success,
    false,
  );
  assert.equal(campaignInputSchema.safeParse({ ...valid, message: "" }).success, false);
  assert.equal(campaignIdSchema.safeParse("lieu-1").success, true);
});

// [SPEC-TRACTATION-07] A campaign edit can change unclaimed places but never detach an assigned place.
test("protège les secteurs déjà pris lors de la modification d’une campagne", () => {
  assert.equal(
    canUpdateCampaignPlaces(["place-1", "place-2"], ["place-1", "place-2", "place-3"]),
    true,
  );
  assert.equal(canUpdateCampaignPlaces(["place-1", "place-2"], ["place-2", "place-3"]), false);
  assert.equal(canUpdateCampaignPlaces([], ["place-3"]), true);
});

// [SPEC-TRACTATION-08] Zero-household and unknown-count places are not campaign or route options.
test("exclut les lieux sans foyer des possibilités de mobilisation", () => {
  assert.equal(hasEligibleHouseholds(1), true);
  assert.equal(hasEligibleHouseholds(24), true);
  assert.equal(hasEligibleHouseholds(0), false);
  assert.equal(hasEligibleHouseholds(undefined), false);
  assert.equal(hasEligibleHouseholds(1.5), false);
});

// [SPEC-TRACTATION-09] A participant may take another route after completing every previous assignment.
test("autorise une nouvelle tournée seulement après la fin de la précédente", () => {
  assert.equal(canStartAnotherRoute([]), true);
  assert.equal(canStartAnotherRoute(["completed", "completed"]), true);
  assert.equal(canStartAnotherRoute(["completed", "claimed"]), false);
  assert.equal(canStartAnotherRoute([undefined]), false);
});

// [SPEC-TRACTATION-10] Routing chunks preserve the exact chosen order and join at the previous endpoint.
test("découpe les requêtes routières sans changer l’ordre des étapes", () => {
  const stops = Array.from({ length: 5 }, (_, index) => ({
    lat: 48 + index / 100,
    lon: -3 - index / 100,
  }));
  const chunks = chunkOrderedRoutePoints({ lat: 47.9, lon: -3.1 }, stops, 3);
  assert.deepEqual(chunks, [
    [{ lat: 47.9, lon: -3.1 }, stops[0], stops[1]],
    [stops[1], stops[2], stops[3]],
    [stops[3], stops[4]],
  ]);
  assert.throws(() => chunkOrderedRoutePoints({ lat: 0, lon: 0 }, stops, 1), RangeError);

  const longStops = Array.from({ length: 200 }, (_, index) => ({
    lat: 48 + index / 10000,
    lon: -3 - index / 10000,
  }));
  const longChunks = chunkOrderedRoutePoints({ lat: 47.9, lon: -3.1 }, longStops);
  assert.ok(longChunks.every((chunk) => chunk.length <= 100));
  assert.equal(longChunks.flatMap((chunk, index) => (index ? chunk.slice(1) : chunk)).length, 201);
  assert.deepEqual(
    longChunks.flatMap((chunk, index) => (index ? chunk.slice(1) : chunk)).slice(1),
    longStops,
  );
});

// [SPEC-TRACTATION-04] Only explicit claim, complete, reopen, and release transitions are accepted.
test("valide les actions d’une réservation partagée de lieu", () => {
  for (const action of ["claim", "complete", "release", "reopen"]) {
    assert.equal(placeAssignmentInputSchema.safeParse({ action }).success, true);
  }
  assert.equal(placeAssignmentInputSchema.safeParse({ action: "delete" }).success, false);
  assert.equal(
    placeAssignmentInputSchema.safeParse({
      action: "claim",
      uid: "another-member",
    }).success,
    false,
  );
});

// [SPEC-TRACTATION-04] The owner or campaign manager may correct an assignment; only completed places can reopen.
test("le titulaire ou un responsable peut corriger une affectation", () => {
  assert.equal(canCorrectPlaceAssignment("member-1", "member-1", false), true);
  assert.equal(canCorrectPlaceAssignment("member-1", "member-2", true), true);
  assert.equal(canCorrectPlaceAssignment("member-1", "member-2", false), false);
  assert.equal(canReopenPlaceAssignment("completed", "member-1", "member-1"), true);
  assert.equal(canReopenPlaceAssignment("claimed", "member-1", "member-1"), false);
  assert.equal(canReopenPlaceAssignment("completed", "member-1", "member-2"), false);
  assert.equal(canReopenPlaceAssignment("completed", "member-1", "manager", true), true);
});

// [SPEC-TRACTATION-04] Campaign members see the claimant display name, never account identifiers.
test("expose le nom du membre qui a pris un lieu sans exposer UID ni e-mail", () => {
  const assignment = toPublicPlaceAssignment(
    {
      status: "claimed",
      claimedByUid: "private-auth-uid",
      claimedByName: "Malo Le Cam",
      email: "private@example.org",
    },
    "another-member",
  );

  assert.deepEqual(assignment, {
    status: "claimed",
    isMine: false,
    memberName: "Malo Le Cam",
  });
  assert.equal(
    toPublicPlaceAssignment({ status: "released", claimedByUid: "uid" }, "viewer"),
    null,
  );
  assert.equal(
    toPublicPlaceAssignment(
      { status: "completed", claimedByUid: "uid" },
      "viewer",
      "Ancienne Membre",
    )?.memberName,
    "Ancienne Membre",
  );
});

// [SPEC-TRACTATION-05] Campaign route reservations are ordered, unique, bounded, and nonempty.
test("valide la tournée d’un participant dans une campagne", () => {
  assert.equal(
    campaignRouteInputSchema.safeParse({ lieuDitIds: ["place-1", "place-2"] }).success,
    true,
  );
  assert.equal(campaignRouteInputSchema.safeParse({ lieuDitIds: [] }).success, false);
  assert.equal(
    campaignRouteInputSchema.safeParse({ lieuDitIds: ["place-1", "place-1"] }).success,
    false,
  );
  assert.equal(
    campaignRouteInputSchema.safeParse({
      lieuDitIds: Array.from({ length: 201 }, (_, i) => `place-${i}`),
    }).success,
    false,
  );
});

// [SPEC-TOURNEE-04] Favorite places are private bounded IDs; saved address requires explicit non-empty input.
test("valide les préférences privées des lieux favoris", () => {
  const valid = {
    favoritePlaceIds: ["place-1"],
    setupComplete: true,
    savedAddress: null,
  };
  assert.equal(memberPlacePreferencesSchema.safeParse(valid).success, true);
  assert.equal(
    memberPlacePreferencesSchema.safeParse({
      ...valid,
      favoritePlaceIds: ["place-1", "place-1"],
    }).success,
    false,
  );
  assert.equal(
    memberPlacePreferencesSchema.safeParse({
      ...valid,
      favoritePlaceIds: Array(21).fill("place"),
    }).success,
    false,
  );
  assert.equal(
    memberPlacePreferencesSchema.safeParse({ ...valid, savedAddress: "12 rue" }).success,
    true,
  );
  assert.equal(
    memberPlacePreferencesSchema.safeParse({ ...valid, savedAddress: "" }).success,
    false,
  );
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
  assert.equal(
    detectCampaignDocumentType(new TextEncoder().encode("%PDF-1.7"))?.contentType,
    "application/pdf",
  );
  assert.equal(
    detectCampaignDocumentType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))?.extension,
    "jpg",
  );
  assert.equal(detectCampaignDocumentType(new TextEncoder().encode("not a file")), null);
  assert.equal(sanitizeCampaignFileName("../../tracts.pdf"), "_.._tracts.pdf");
});
