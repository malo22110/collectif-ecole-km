import assert from "node:assert/strict";
import test from "node:test";
import { isPotentialPetitionDuplicate } from "../lib/petitionDuplicates.ts";

test("[SPEC-PET-SCAN-02] ignore les différences de casse et d'accent pour une même commune", () => {
  assert.equal(isPotentialPetitionDuplicate(
    { fullName: "Élodie Le Cam", ville: "KM" },
    { fullName: "Elodie Le Cam", ville: "Kergrist-Moëlou" }
  ), true);
});

test("[SPEC-PET-SCAN-02] signale une faute OCR possible uniquement dans la même commune", () => {
  assert.equal(isPotentialPetitionDuplicate(
    { fullName: "Jean Dupont", ville: "Rostrenen" },
    { fullName: "Jean Dupond", ville: "Rostrenen" }
  ), true);
  assert.equal(isPotentialPetitionDuplicate(
    { fullName: "Jean Dupont", ville: "Rostrenen" },
    { fullName: "Jean Dupond", ville: "Kergrist-Moëlou" }
  ), false);
});

test("[SPEC-PET-SCAN-02] ne signale pas automatiquement deux noms différents dans la même commune", () => {
  assert.equal(isPotentialPetitionDuplicate(
    { fullName: "Jean Dupont", ville: "Rostrenen" },
    { fullName: "Jeanne Durand", ville: "Rostrenen" }
  ), false);
});