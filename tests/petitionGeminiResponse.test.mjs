import assert from "node:assert/strict";
import test from "node:test";
import { parseGeminiPetitionResponse } from "../lib/petitionGeminiResponse.ts";

test("[SPEC-PET-SCAN-03] valide les lignes et normalise KM", () => {
  const entries = parseGeminiPetitionResponse(JSON.stringify({
    entries: [{ fullName: " TEST SYNTHETIQUE ", town: "K.M.", relationship: " Parent ", confidence: 84 }]
  }));

  assert.deepEqual(entries, [{
    fullName: "TEST SYNTHETIQUE",
    ville: "Kergrist-Moëlou",
    qualite: "Parent",
    confidence: 84,
    method: "gemini"
  }]);
});

test("[SPEC-PET-SCAN-03] rejette un score invalide et les lots de plus de 60 lignes", () => {
  assert.throws(() => parseGeminiPetitionResponse(JSON.stringify({
    entries: [{ fullName: "Test", town: "KM", relationship: "Parent", confidence: 120 }]
  })), /format de lignes invalide/);

  const tooMany = Array.from({ length: 61 }, () => ({
    fullName: "Test",
    town: "KM",
    relationship: "Parent",
    confidence: 80
  }));
  assert.throws(() => parseGeminiPetitionResponse(JSON.stringify({ entries: tooMany })), /format de lignes invalide/);
});

test("[SPEC-PET-SCAN-03] rejette le JSON mal formé", () => {
  assert.throws(() => parseGeminiPetitionResponse("{"));
});