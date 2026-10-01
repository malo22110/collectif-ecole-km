import assert from "node:assert/strict";
import test from "node:test";
import { groupPetitionSigners } from "../lib/petitionSignerGroups.ts";

const signer = (nom, ville, qualite, source = "en ligne") => ({
  nom,
  prenom: "Alex",
  ville,
  qualite,
  signature: source === "papier" ? "Signature papier" : "alex@example.test",
  potentialDuplicate: false
});

// [SPEC-PET-EXPORT-02] Export all signatures, grouping Kergrist residents before non-local parents and others.
test("classe toutes les signatures en Kergrist, parents, puis autres", () => {
  const groups = groupPetitionSigners([
    signer("Parent hors commune", "Rostrenen", "Parent d’élève", "papier"),
    signer("Autre", "Plouguernével", "Habitant"),
    signer("Habitante", "Rostrenen", "Habitante de Kergrist-Moëlou"),
    signer("Parent de Kergrist", "Kergrist-Moëlou", "Parent d’élève")
  ]);

  assert.deepEqual(groups.map(group => group.key), ["kergrist", "parents", "autres"]);
  assert.deepEqual(groups.map(group => group.signers.map(item => item.nom)), [
    ["Habitante", "Parent de Kergrist"],
    ["Parent hors commune"],
    ["Autre"]
  ]);
  assert.equal(groups.reduce((total, group) => total + group.signers.length, 0), 4);
  assert.equal(groups[1].signers[0].signature, "Signature papier");
});

// [SPEC-PET-EXPORT-02] Sorting inside each group is stable by surname then first name.
test("trie alphabétiquement les signataires de chaque groupe", () => {
  const groups = groupPetitionSigners([
    { ...signer("Zoé", "Kergrist-Moëlou", "Habitante"), prenom: "Zoé" },
    { ...signer("Aubert", "Kergrist-Moëlou", "Habitant"), prenom: "Paul" },
    { ...signer("Aubert", "Kergrist-Moëlou", "Habitant"), prenom: "Alice" }
  ]);
  assert.deepEqual(groups[0].signers.map(item => `${item.nom} ${item.prenom}`), ["Aubert Alice", "Aubert Paul", "Zoé Zoé"]);
});