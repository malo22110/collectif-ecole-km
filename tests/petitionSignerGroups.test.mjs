import assert from "node:assert/strict";
import test from "node:test";
import {
  findPotentialPetitionDuplicatePairs,
  groupPetitionSigners,
} from "../lib/petitionSignerGroups.ts";

const signer = (nom, ville, qualite, source = "en ligne") => ({
  nom,
  prenom: "Alex",
  ville,
  qualite,
  signature: source === "papier" ? "Signature papier" : "alex@example.test",
  potentialDuplicate: false,
});

// [SPEC-PET-EXPORT-02] Export all signatures, grouping Kergrist residents before non-local parents and others.
test("classe toutes les signatures en Kergrist, parents, puis autres", () => {
  const groups = groupPetitionSigners([
    signer("Parent hors commune", "Rostrenen", "Parent d’élève", "papier"),
    signer("Autre", "Plouguernével", "Habitant"),
    signer("Habitante", "Rostrenen", "Habitante de Kergrist-Moëlou"),
    signer("Parent de Kergrist", "Kergrist-Moëlou", "Parent d’élève"),
  ]);

  assert.deepEqual(
    groups.map((group) => group.key),
    ["kergrist", "parents", "autres"],
  );
  assert.deepEqual(
    groups.map((group) => group.signers.map((item) => item.nom)),
    [["Habitante", "Parent de Kergrist"], ["Parent hors commune"], ["Autre"]],
  );
  assert.equal(
    groups.reduce((total, group) => total + group.signers.length, 0),
    4,
  );
  assert.equal(groups[1].signers[0].signature, "Signature papier");
});

// [SPEC-PET-EXPORT-02] Sorting inside each group is stable by surname then first name.
test("trie alphabétiquement les signataires de chaque groupe", () => {
  const groups = groupPetitionSigners([
    { ...signer("Zoé", "Kergrist-Moëlou", "Habitante"), prenom: "Zoé" },
    { ...signer("Aubert", "Kergrist-Moëlou", "Habitant"), prenom: "Paul" },
    { ...signer("Aubert", "Kergrist-Moëlou", "Habitant"), prenom: "Alice" },
  ]);
  assert.deepEqual(
    groups[0].signers.map((item) => `${item.nom} ${item.prenom}`),
    ["Aubert Alice", "Aubert Paul", "Zoé Zoé"],
  );
});

// [SPEC-PET-EXPORT-03] The consolidated print analysis flags likely duplicate pairs without merging records.
test("repère les doublons potentiels papier et en ligne par numéro de ligne", () => {
  const groups = groupPetitionSigners([
    { ...signer("Le Cam", "KM", "Habitante", "papier"), prenom: "Élodie" },
    { ...signer("Le Cam", "Kergrist-Moëlou", "Habitante"), prenom: "Elodie" },
    { ...signer("Dupont", "Rostrenen", "Parent", "papier"), prenom: "Jean" },
    { ...signer("Dupond", "Rostrenen", "Parent"), prenom: "Jean" },
    signer("Martin", "Plouguernével", "Habitant"),
  ]);
  const pairs = findPotentialPetitionDuplicatePairs(groups);

  assert.equal(
    groups.reduce((count, group) => count + group.signers.length, 0),
    5,
  );
  assert.deepEqual(
    pairs.map((pair) => [pair.firstRow, pair.secondRow]),
    [
      [1, 4],
      [2, 3],
    ],
  );
  assert.deepEqual(
    [pairs[0].first.signature, pairs[0].second.signature].sort(),
    ["Signature papier", "alex@example.test"].sort(),
  );
  assert.equal(pairs[1].first.nom, "Dupond");
  assert.equal(pairs[1].second.nom, "Dupont");
});
