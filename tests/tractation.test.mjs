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
  cancellableRoutePlaceIds,
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
import { sortCampaignPlaces, visibleCampaignPlaceIds } from "../lib/campaignPlaceSorting.ts";
import { suggestRouteOrder } from "../lib/routeOrder.ts";

// [SPEC-TRACTATION-06] Campaign participation and route preparation actions stay fixed and reachable while viewing campaign details.
test("place les actions de campagne dans un footer fixe avec dégagement mobile", async () => {
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );
  const preferences = await readFile(
    new URL("../app/espace-membre/components/MemberPlacePreferences.tsx", import.meta.url),
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
  assert.match(panel, /missionSheet === "run" && missionNextPlace/);
  assert.match(panel, /Mince, je libère ce secteur/);
  assert.match(
    panel,
    /min-h-11 rounded-lg border border-stone-300 px-2 text-xs font-semibold text-stone-700/,
  );
  assert.match(panel, /h-11 shrink-0 items-center gap-2 border-b/);
  assert.match(panel, /\{missionDraft\.length\} secteur\(s\)/);
  assert.doesNotMatch(panel, /Distribution de tract/);
  assert.doesNotMatch(panel, /\$\{missionDraft\.length\} secteur\(s\) sélectionné\(s\)/);
  assert.match(page, /Infos sur la tournée/);
  assert.match(panel, /showCampaignDetails = true/);
  assert.match(
    panel,
    /selectedCampaignId && !showCampaignDetails && !editCampaignRequested \? null/,
  );
  assert.match(panel, /h-\[50dvh\] max-h-\[50dvh\]/);
  assert.match(panel, /onPointerDown=\{\(event\) =>/);
  assert.match(panel, /deltaY > 72/);
  assert.match(panel, /setMissionCampaignId\(null\)/);
  assert.match(panel, /const closeMission = \(\) =>/);
  assert.doesNotMatch(panel, /const closeMission = \(\) => \{[^}]*setMapCampaignId\(null\)/s);
  assert.match(panel, /max-h-\[18dvh\]/);
  assert.match(page, /pb-\[calc\(10rem\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(page, /"campaignInfo"/);
  assert.match(page, /onClick=\{\(\) => setView\("campaignInfo"\)\}/);
  assert.match(page, /missionMode=\{missionMode\}/);
  assert.match(page, /showCampaignDetails=\{editingCampaign\}/);
  assert.doesNotMatch(page, /Choisissez parmi tous les secteurs de cette campagne/);
});

// [SPEC-TRACTATION-07] Campaign managers can reopen the existing editor from the campaign info view.
test("rend la modification de campagne accessible aux responsables tractation", async () => {
  const page = await readFile(
    new URL("../app/espace-membre/tournees/page.tsx", import.meta.url),
    "utf8",
  );
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );
  assert.match(page, /view === "campaignInfo" && campaignMap/);
  assert.match(
    page,
    /view === "campaign" && campaignMap && canCreateCampaign && !editingCampaign[\s\S]*?aria-label="Modifier la campagne"/,
  );
  assert.match(
    page,
    /canCreateCampaign && \([\s\S]*?setEditingCampaign\(true\);[\s\S]*?Modifier la campagne/,
  );
  assert.match(page, /editCampaignRequested=\{editingCampaign\}/);
  assert.match(page, /onCampaignEditClose=\{\(\) => setEditingCampaign\(false\)\}/);
  assert.match(
    panel,
    /if \(!editCampaignRequested \|\| !canCreate \|\| !selectedCampaignId \|\| loading\) return/,
  );
  assert.match(panel, /setEditingCampaignId\(campaign\.id\)/);
  assert.match(panel, /const closeCampaignEdit = \(\) => \{[\s\S]*?onCampaignEditClose\?\.\(\)/);
});

// [SPEC-TRACTATION-04] Releasing one stop keeps the active mission on the next remaining stop.
test("libère seulement le secteur courant sans revenir à la sélection", async () => {
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );
  const route = await readFile(
    new URL("../app/api/tractation/[campaignId]/places/[placeId]/route.ts", import.meta.url),
    "utf8",
  );

  const updateAssignment = panel
    .split("const updateAssignment = async (")[1]
    ?.split("const download = async")[0];
  assert.ok(updateAssignment);
  assert.match(updateAssignment, /item\.myRoutePlaceIds\.filter\(\(id\) => id !== place\.id\)/);
  assert.doesNotMatch(updateAssignment, /setMissionSheet\("select"\)/);
  assert.match(panel, /missionRoute\.find\([\s\S]*?status !== "completed"/);
  assert.match(panel, /missionRoute\.length \? "Tournée terminée" : "Aucun secteur restant"/);
  assert.match(panel, /Les secteurs libérés sont de nouveau disponibles pour les autres membres\./);
  assert.match(panel, /onClick=\{closeMission\}[\s\S]*?Retour à la campagne/);
  assert.match(route, /transaction\.delete\(assignmentRef\)/);
  assert.match(route, /routePlaceIds: FieldValue\.arrayRemove\(placeId\)/);
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

// [SPEC-TRACTATION-06] Campaign sectors are grouped by availability, with only available sectors ordered by proximity.
test("trie les secteurs disponibles par proximité avant les pris puis les terminés", () => {
  const origin = { lat: 48, lon: -3 };
  const places = [
    { id: "done", nom: "Terminé", lat: 48.001, lon: -3 },
    { id: "far", nom: "Disponible loin", lat: 48.1, lon: -3 },
    { id: "taken", nom: "Pris", lat: 48.0001, lon: -3 },
    { id: "near", nom: "Disponible proche", lat: 48.0002, lon: -3 },
  ];
  const assignments = {
    done: { status: "completed" },
    taken: { status: "claimed" },
  };

  assert.deepEqual(
    sortCampaignPlaces(places, assignments, origin).map((place) => place.id),
    ["near", "far", "taken", "done"],
  );
  assert.deepEqual(
    sortCampaignPlaces(places, assignments, null).map((place) => place.id),
    ["far", "near", "taken", "done"],
  );
});

// [SPEC-TRACTATION-06] Address lookup and GPS origins feed both campaign sector lists.
test("alimente les listes de campagne avec l’origine d’adresse ou de géolocalisation", async () => {
  const page = await readFile(
    new URL("../app/espace-membre/tournees/page.tsx", import.meta.url),
    "utf8",
  );
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );
  const preferences = await readFile(
    new URL("../app/espace-membre/components/MemberPlacePreferences.tsx", import.meta.url),
    "utf8",
  );

  assert.match(preferences, /onOriginChange\?\.\(\{ lat: origin\.lat, lon: origin\.lon \}\)/);
  assert.match(page, /suggestionOrigin=\{addressOrigin\}/);
  assert.match(panel, /routeOrigins\[campaignId\] \|\| suggestionOrigin/);
  assert.match(panel, /sortCampaignPlaces\(/);
  assert.match(panel, /getRouteOrigin\(missionCampaign\.id\)/);
});

// [SPEC-TRACTATION-11] The preview retains only selected stops and does not reserve until Start.
test("prévisualise les seuls secteurs choisis avant de démarrer la tournée", async () => {
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );
  const page = await readFile(
    new URL("../app/espace-membre/tournees/page.tsx", import.meta.url),
    "utf8",
  );
  const map = await readFile(
    new URL("../app/espace-membre/tournees/OpenStreetMap.tsx", import.meta.url),
    "utf8",
  );

  assert.match(panel, /setMissionSheet\("preview"\)/);
  assert.match(panel, /missionSheet !== "preview"/);
  assert.match(panel, /previewPlaceIds:[\s\S]*?getRouteDraft\(campaign\)/);
  assert.match(panel, /Prévisualiser ma tournée/);
  assert.match(panel, /Proposer un ordre plus court/);
  assert.match(panel, /Démarrer/);
  assert.match(page, /visibleCampaignPlaceIds\(campaignMap\)/);
  assert.match(page, /!campaignMap\?\.runningRoute/);
  assert.match(page, /campaignMap\.runningRoute\s*\? roadRoute\?\.geometry\s*:\s*\[\]/);
  assert.match(map, /previewMode\s*\? `Étape \$\{routeStep\} à démarrer`/);
  assert.match(map, /FocusPlace place=\{previewMode \? null : selectedPlace\}/);
  assert.match(map, /if \(!previewMode\) \{/);
  assert.doesNotMatch(panel, /La carte affiche uniquement les secteurs choisis\. Ajustez/);
  assert.doesNotMatch(panel, /Estimation à vol d’oiseau depuis votre départ/);
});

// [SPEC-TRACTATION-12] Pending stops are orange, favorites light red, and claimed/completed statuses keep priority.
test("distingue sur la carte les favoris des secteurs choisis", async () => {
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );
  const page = await readFile(
    new URL("../app/espace-membre/tournees/page.tsx", import.meta.url),
    "utf8",
  );
  const map = await readFile(
    new URL("../app/espace-membre/tournees/OpenStreetMap.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    panel,
    /draftPlaceIds:[\s\S]*?missionSheet === "select"[\s\S]*?getRouteDraft\(campaign\)/,
  );
  assert.match(panel, /\(campaign: Campaign\) => routeDrafts\[campaign\.id\] \?\? \[\]/);
  assert.match(panel, /missionCampaignId !== campaign\.id \|\| missionSheet === "select"/);
  assert.match(page, /draftPlaceIds=\{previewPlaceIds \?\? campaignMap\.draftPlaceIds\}/);
  assert.match(
    map,
    /assignmentStatus === "completed"[\s\S]*?assignmentStatus === "claimed"[\s\S]*?isDraft\s*\? "#9a3412"[\s\S]*?isFavorite\s*\? "#9f1239"/,
  );
  assert.match(map, /isDraft\s*\? "#fb923c"[\s\S]*?isFavorite\s*\? "#fda4af"/);
  assert.match(map, /isDraft\s*\? "Sélectionné pour ma tournée"/);
  assert.match(page, /border-orange-800 bg-orange-400/);
  assert.match(page, /border-rose-800 bg-rose-300/);
});

// [SPEC-TRACTATION-12] Hide other sectors during an active route, but restore them for a new selection.
test("affiche la campagne entière hors mission puis seulement les étapes en exécution", () => {
  const campaign = {
    placeIds: ["a", "b", "c"],
    routePlaceIds: ["c", "a"],
    previewPlaceIds: null,
    runningRoute: false,
  };
  assert.deepEqual(visibleCampaignPlaceIds(campaign), ["a", "b", "c"]);
  assert.deepEqual(visibleCampaignPlaceIds({ ...campaign, runningRoute: true }), ["c", "a"]);
  assert.deepEqual(visibleCampaignPlaceIds({ ...campaign, previewPlaceIds: ["b"] }), ["b"]);
  assert.deepEqual(visibleCampaignPlaceIds({ ...campaign, routePlaceIds: [] }), ["a", "b", "c"]);
});

// [SPEC-TRACTATION-13] Route cancellation is authenticated, atomic, and leaves completed stops intact.
test("annule uniquement les étapes encore prises par le participant", async () => {
  assert.deepEqual(
    cancellableRoutePlaceIds(
      [
        { id: "open", status: "claimed", claimedByUid: "member" },
        { id: "done", status: "completed", claimedByUid: "member" },
        null,
      ],
      "member",
    ),
    ["open"],
  );
  assert.equal(
    cancellableRoutePlaceIds([{ id: "other", status: "claimed", claimedByUid: "other" }], "member"),
    null,
  );
  assert.deepEqual(
    cancellableRoutePlaceIds(
      [{ id: "done", status: "completed", claimedByUid: "member" }],
      "member",
    ),
    [],
  );
  const route = await readFile(
    new URL("../app/api/tractation/[campaignId]/route/route.ts", import.meta.url),
    "utf8",
  );
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );
  assert.match(route, /export async function DELETE/);
  assert.match(route, /authorizeTractationMember\(request\)/);
  assert.match(route, /tractationDb\.runTransaction/);
  assert.match(route, /routePlaceIds: \[\]/);
  assert.match(panel, /Annuler ma tournée/);
  assert.match(panel, /onClick=\{\(\) => setRouteToCancel\(selectedCampaign\)\}/);
  assert.match(
    panel,
    /<dialog[\s\S]*?aria-labelledby="cancel-route-title"[\s\S]*?aria-describedby="cancel-route-description"/,
  );
  assert.match(panel, /Les secteurs déjà terminés resteront marqués comme terminés/);
  assert.match(panel, /Les secteurs non terminés\s+seront libérés/);
  assert.match(panel, /Garder ma tournée/);
  assert.match(panel, /Confirmer l’annulation/);
  assert.match(panel, /cancelDialogRef\.current\?\.close\(\);\s*void cancelRoute\(routeToCancel\)/);
  assert.doesNotMatch(panel, /window\.confirm/);
});

// [SPEC-TRACTATION-12] GPS refresh is requested on preparation/resume, and preview uses that origin.
test("actualise la position avant de proposer l'ordre des secteurs", async () => {
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    panel,
    /const openMission = \(campaign: Campaign, preview = false\) => \{[\s\S]*?locateCampaign\(\s*campaign\.id/,
  );
  assert.match(panel, /maximumAge: 0/);
  assert.match(panel, /if \(requestId !== locationRequestId\.current\) return/);
  assert.match(
    panel,
    /const openPreview = \(campaign: Campaign\) => \{[\s\S]*?optimizeRouteDraft\(campaign\)/,
  );
  assert.match(panel, /onClick=\{\(\) => openMission\(selectedCampaign, true\)\}/);
  assert.doesNotMatch(panel, /missionSearch|Chercher un secteur|aria-label="Me localiser"/);
});

// [SPEC-TRACTATION-11] The suggested order is deterministic and leaves the chosen stop set unchanged.
test("propose un ordre court, conserve les étapes et respecte un départ fourni", () => {
  const stops = [
    { id: "far", lat: 0, lon: 3 },
    { id: "near", lat: 0, lon: 1 },
    { id: "middle", lat: 0, lon: 2 },
  ];
  assert.deepEqual(suggestRouteOrder(stops, { lat: 0, lon: 0 }), ["near", "middle", "far"]);
  assert.deepEqual(suggestRouteOrder(stops, null), ["far", "middle", "near"]);
  assert.deepEqual(
    stops.map((place) => place.id),
    ["far", "near", "middle"],
  );
  assert.deepEqual(suggestRouteOrder([], null), []);
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

// [SPEC-TRACTATION-06] The first-route guide is skippable and advances from campaign actions.
test("guide le premier parcours avec favoris facultatifs et étapes reliées aux actions", async () => {
  const preferences = await readFile(
    new URL("../app/espace-membre/components/MemberPlacePreferences.tsx", import.meta.url),
    "utf8",
  );
  const page = await readFile(
    new URL("../app/espace-membre/tournees/page.tsx", import.meta.url),
    "utf8",
  );
  const panel = await readFile(
    new URL("../app/espace-membre/components/TractationPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /first-tour-guide:v1:/);
  assert.match(page, /if \(step === null\) return null/);
  assert.match(page, /Choisissez vos favoris/);
  assert.match(page, /C’est facultatif/);
  assert.match(page, /Ouvrez une campagne/);
  assert.match(page, /Vérifiez votre parcours/);
  assert.match(page, /Suivez votre tournée/);
  assert.match(page, /Libérer » retire seulement le secteur courant/);
  assert.doesNotMatch(
    page,
    /« Libérer » retire seulement le secteur courant; « Annuler ma tournée »/,
  );
  assert.match(page, /event === "tour-finished" && step === "run"/);
  assert.match(page, /event === "tour-cancelled" && step === "run"/);
  assert.match(page, /firstTourGuideStep === "preview" \|\| firstTourGuideStep === "run"/);
  assert.match(page, /onFirstTourGuideEvent=\{handleFirstTourGuideEvent\}/);
  assert.match(page, /suggestionOrigin=\{addressOrigin\}/);
  assert.match(page, /onOriginChange=\{setAddressOrigin\}/);
  assert.match(preferences, /onOriginChange\?\.\(\{ lat: origin\.lat, lon: origin\.lon \}\)/);
  assert.match(panel, /onFirstTourGuideEvent\?\.\("select-sectors"\)/);
  assert.match(
    panel,
    /routeInProgress \? "resume-tour" : preview \? "preview-route" : "select-sectors"/,
  );
  assert.match(panel, /onFirstTourGuideEvent\?\.\("preview-route"\)/);
  assert.match(panel, /onFirstTourGuideEvent\?\.\("tour-reserved"\)/);
  assert.match(panel, /onFirstTourGuideEvent\?\.\("tour-finished"\)/);
  assert.match(panel, /onFirstTourGuideEvent\?\.\("tour-cancelled"\)/);
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
