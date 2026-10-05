import assert from "node:assert/strict";
import test from "node:test";
import { calculatePetitionStats } from "../functions/src/petitionStats.ts";

// [SPEC-PET-STATS-01] Every petition record belongs to exactly one public category using the established precedence.
test("calcule la ventilation officielle avec priorité Kergrist puis parent puis commune voisine", () => {
  const stats = calculatePetitionStats([
    { ville: "Kergrist-Moëlou", qualite: "Parent d’élève" },
    { ville: "Rostrenen", qualite: "Parent d'élève" },
    { ville: "Plouguernével", qualite: "Habitant d’une commune voisine" },
    { ville: "Saint-Brieuc", qualite: "Autre soutien" },
    { ville: "", qualite: "Ancien(ne) élève" },
    { ville: "", qualite: "Habitant(e) de Kergrist" },
    { ville: "Rostrenen", qualite: "Ami des parents" },
  ]);

  assert.deepEqual(stats, {
    total: 7,
    habitantsKergrist: 2,
    parentsEleves: 1,
    communesVoisines: 3,
    autres: 1,
    declaredParentOfPupilQuality: 2,
    habitantsKergristPercent: 28.6,
    parentsElevesPercent: 14.3,
    communesVoisinesPercent: 42.9,
    autresPercent: 14.3,
    declaredParentOfPupilQualityPercent: 28.6,
    parentSignersOfKnownParentsPercent: 4.26,
    kergristElectorateEstimatePercent: 0.37,
  });
  assert.equal(
    stats.habitantsKergrist + stats.parentsEleves + stats.communesVoisines + stats.autres,
    stats.total,
  );
});

test("renvoie des compteurs nuls pour une liste vide", () => {
  assert.deepEqual(calculatePetitionStats([]), {
    total: 0,
    habitantsKergrist: 0,
    parentsEleves: 0,
    communesVoisines: 0,
    autres: 0,
    declaredParentOfPupilQuality: 0,
    habitantsKergristPercent: 0,
    parentsElevesPercent: 0,
    communesVoisinesPercent: 0,
    autresPercent: 0,
    declaredParentOfPupilQualityPercent: 0,
    parentSignersOfKnownParentsPercent: 0,
    kergristElectorateEstimatePercent: null,
  });
});

test("calcule la part des parent d’élève signataires sur la base communiquée de 47 parents", () => {
  const entries = Array.from({ length: 41 }, () => ({
    ville: "Rostrenen",
    qualite: "Parent d’élève (actuel ou futur)",
  }));
  assert.equal(calculatePetitionStats(entries).parentSignersOfKnownParentsPercent, 87.23);
});

test("compte la qualité explicite Parent d’élève avec ou sans accent et exclut les amis", () => {
  const stats = calculatePetitionStats([
    { ville: "Rostrenen", qualite: "Parent d’élève (actuel ou futur)" },
    { ville: "Rostrenen", qualite: "Parent d eleve actuel ou futur" },
    { ville: "Rostrenen", qualite: "Ami des parents d’élève" },
    { ville: "Rostrenen", qualite: "Ami des parents" },
    { ville: "Rostrenen", qualite: "Parent" },
    { ville: "Rostrenen", qualite: "Élève" },
    { ville: "Rostrenen", qualite: "Eleve" },
    { ville: "Rostrenen", qualite: "Ancien(ne) élève" },
  ]);
  assert.equal(stats.parentsEleves, 2);
  assert.equal(stats.declaredParentOfPupilQuality, 2);
});

test("calcule l’estimation de part de population électorale au centième", () => {
  const entries = Array.from({ length: 126 }, () => ({
    ville: "Kergrist-Moëlou",
    qualite: "Habitant(e) de Kergrist",
  }));
  assert.equal(calculatePetitionStats(entries).kergristElectorateEstimatePercent, 23.38);
});
