import assert from "node:assert/strict";
import test from "node:test";
import { calculatePetitionStats } from "../functions/src/petitionStats.ts";

// [SPEC-PET-STATS-01] Every petition record belongs to exactly one public category using the established precedence.
test("calcule la ventilation officielle avec priorité Kergrist puis parent puis commune voisine", () => {
  const stats = calculatePetitionStats([
    { ville: "Kergrist-Moëlou", qualite: "Parent d’élève" },
    { ville: "Rostrenen", qualite: "Parent d’élève" },
    { ville: "Plouguernével", qualite: "Habitant d’une commune voisine" },
    { ville: "Saint-Brieuc", qualite: "Autre soutien" },
    { ville: "", qualite: "" },
    { ville: "", qualite: "Habitant(e) de Kergrist" }
  ]);

  assert.deepEqual(stats, {
    total: 6,
    habitantsKergrist: 2,
    parentsEleves: 1,
    communesVoisines: 2,
    autres: 1,
    declaredParentQuality: 2,
    habitantsKergristPercent: 33.3,
    parentsElevesPercent: 16.7,
    communesVoisinesPercent: 33.3,
    autresPercent: 16.7,
    declaredParentQualityPercent: 33.3,
    kergristElectorateEstimatePercent: 0.37
  });
  assert.equal(stats.habitantsKergrist + stats.parentsEleves + stats.communesVoisines + stats.autres, stats.total);
});

test("renvoie des compteurs nuls pour une liste vide", () => {
  assert.deepEqual(calculatePetitionStats([]), {
    total: 0,
    habitantsKergrist: 0,
    parentsEleves: 0,
    communesVoisines: 0,
    autres: 0,
    declaredParentQuality: 0,
    habitantsKergristPercent: 0,
    parentsElevesPercent: 0,
    communesVoisinesPercent: 0,
    autresPercent: 0,
    declaredParentQualityPercent: 0,
    kergristElectorateEstimatePercent: null
  });
});

test("calcule l’estimation de part de population électorale au centième", () => {
  const entries = Array.from({ length: 126 }, () => ({ ville: "Kergrist-Moëlou", qualite: "Habitant(e) de Kergrist" }));
  assert.equal(calculatePetitionStats(entries).kergristElectorateEstimatePercent, 23.38);
});