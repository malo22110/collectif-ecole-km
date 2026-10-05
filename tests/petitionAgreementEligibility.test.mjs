import assert from "node:assert/strict";
import test from "node:test";
import { classifyPetitionAgreementMember } from "../lib/petitionAgreementEligibility.ts";

const member = {
  email: "camille@example.test",
  prenom: "Camille",
  nom: "Le Cam",
  ville: "Rostrenen",
};

// [SPEC-PET-AGREEMENT-01] Existing online signers, recorded assent, and possible paper matches are not selectable.
test("masque les membres déjà signataires, déjà représentés ou rapprochés d’une signature papier", () => {
  assert.equal(classifyPetitionAgreementMember(member, []).available, true);
  assert.equal(
    classifyPetitionAgreementMember(member, [{ ...member, source: "en ligne" }])
      .isAlreadySigned,
    true,
  );
  assert.equal(
    classifyPetitionAgreementMember(member, [
      { ...member, source: "accord_collectif" },
    ]).hasAgreement,
    true,
  );
  const paperMatch = {
    email: "Signature papier - scanner",
    source: "papier",
    ...member,
  };
  assert.equal(
    classifyPetitionAgreementMember(member, [paperMatch])
      .hasPotentialPaperSignature,
    true,
  );
  assert.equal(
    classifyPetitionAgreementMember(member, [paperMatch]).available,
    false,
  );
});

test("ne bloque pas un membre pour une entrée papier sans correspondance de nom/commune", () => {
  const unrelatedPaper = {
    email: "Signature papier - scanner",
    source: "papier",
    prenom: "Jean",
    nom: "Dupont",
    ville: "Dinan",
  };
  assert.equal(
    classifyPetitionAgreementMember(member, [unrelatedPaper]).available,
    true,
  );
});
