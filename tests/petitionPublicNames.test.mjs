import assert from "node:assert/strict";
import test from "node:test";
import { formatPublicRecentSigner } from "../functions/src/petitionPublicNames.ts";

test("[SPEC-PET-SCAN-05] masque le nom complet des signatures papier dans le résumé public", () => {
  assert.equal(
    formatPublicRecentSigner({
      source: "papier",
      prenom: "Nom Prénom Complet",
      nom: "",
      qualite: "Habitant",
    }),
    "Signataire papier",
  );
});

test("[SPEC-PET-SCAN-05] conserve le format existant pour les signatures en ligne", () => {
  assert.equal(
    formatPublicRecentSigner({
      source: "en ligne",
      prenom: "Camille",
      nom: "Le Cam",
      qualite: "Parent d'élève",
    }),
    "Camille L. (Parent d'élève)",
  );
});

test("[SPEC-PET-SCAN-05] masque l’identité dans le résumé public d’un accord de principe", () => {
  assert.equal(
    formatPublicRecentSigner({
      source: "accord_collectif",
      prenom: "Camille",
      nom: "Le Cam",
      qualite: "Membre du collectif",
    }),
    "Accord de principe enregistré",
  );
});
