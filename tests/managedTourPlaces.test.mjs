import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { managedTourPlace, managedTourPlaceSchema } from "../lib/managedTourPlace.ts";

// [SPEC-TRACTATION-14] GPS coordinates must be paired and validated before writing a place.
test("valide les lieux-dits avec ou sans paire GPS complète", () => {
  const base = { nom: " Le Bourg ", foyers: 0, lat: null, lon: null };
  assert.deepEqual(managedTourPlaceSchema.parse(base), { ...base, nom: "Le Bourg" });
  assert.equal(managedTourPlaceSchema.safeParse({ ...base, lat: 48.28, lon: -3.31 }).success, true);
  for (const invalid of [
    { ...base, lat: 48.28 },
    { ...base, lat: 91, lon: 0 },
    { ...base, lat: 48, lon: -181 },
    { ...base, foyers: -1 },
    { ...base, foyers: 0.5 },
    { ...base, nom: "   " },
    { ...base, extra: "unexpected" },
  ]) {
    assert.equal(managedTourPlaceSchema.safeParse(invalid).success, false);
  }
  assert.deepEqual(
    managedTourPlace({ id: "missing", data: () => ({ nom: "Sans GPS", foyers: 2 }) }),
    { id: "missing", nom: "Sans GPS", foyers: 2, lat: null, lon: null },
  );
});

// [SPEC-TRACTATION-14] The manager endpoints enforce role checks and bounded reads.
test("réserve les mutations de lieux-dits aux responsables et borne les accès", async () => {
  const list = await readFile(
    new URL("../app/api/tractation/lieux/route.ts", import.meta.url),
    "utf8",
  );
  const detail = await readFile(
    new URL("../app/api/tractation/lieux/[placeId]/route.ts", import.meta.url),
    "utf8",
  );
  const page = await readFile(
    new URL("../app/espace-membre/tournees/page.tsx", import.meta.url),
    "utf8",
  );
  const managerPage = await readFile(
    new URL("../app/espace-membre/tournees/lieux/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(list, /authorizeTractationMember\(request, true\)/);
  assert.match(detail, /authorizeTractationMember\(request, true\)/);
  assert.match(list, /readJsonBody\(request, 2048\)/);
  assert.match(detail, /readJsonBody\(request, 2048\)/);
  assert.match(list, /\.limit\(301\)/);
  assert.match(detail, /campaignIdSchema\.safeParse\(placeId\)/);
  assert.match(page, /canCreateCampaign &&[\s\S]*?href="\/espace-membre\/tournees\/lieux"/);
  assert.match(managerPage, /allowed &&/);
  assert.match(managerPage, /Sans GPS/);
  assert.match(managerPage, /<CoordinatePicker\s+value=\{pickerValue\}/);
  assert.match(managerPage, /type="number"\s+min=\{-90\}\s+max=\{90\}/);
  assert.match(managerPage, /type="number"\s+min=\{-180\}\s+max=\{180\}/);
});

// [SPEC-TRACTATION-14] Deletion must be confirmed and must not leave campaign references behind.
test("confirme la suppression et bloque les lieux présents dans une campagne", async () => {
  const detail = await readFile(
    new URL("../app/api/tractation/lieux/[placeId]/route.ts", import.meta.url),
    "utf8",
  );
  const page = await readFile(
    new URL("../app/espace-membre/tournees/lieux/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(detail, /runTransaction/);
  assert.match(detail, /campaigns\.size > 500/);
  assert.match(detail, /item\.id === placeId/);
  assert.match(detail, /if \(referenced\) return "used"/);
  assert.match(detail, /transaction\.delete\(reference\)/);
  assert.match(page, /<dialog/);
  assert.match(page, /Cette action est irréversible/);
  assert.match(page, /autoFocus/);
  assert.match(page, /Supprimer le lieu/);
  assert.match(page, /onClose=\{\(\) => setToDelete\(null\)\}/);
  assert.match(page, /role="alert"/);
});
