import test from "node:test";
import assert from "node:assert/strict";
import { memberSkillsProfileSchema } from "../lib/memberSkills.ts";

// [SPEC-MEMBER-SKILLS-01] Directory publication and contact details require separate explicit consent.
const baseProfile = {
  skills: ["batiment_technique", "chantiers"],
  availability: "ponctuelle",
  profession: "Artisane du bâtiment",
  summary: "Expérience en rénovation et petits travaux.",
  directoryVisible: true,
  shareContact: false,
};

test("accepte un profil visible avec compétences et disponibilité autodéclarées", () => {
  assert.equal(memberSkillsProfileSchema.safeParse(baseProfile).success, true);
});

test("accepte les profils historiques sans métier et un métier sans employeur", () => {
  const { profession, ...legacyProfile } = baseProfile;
  assert.equal(memberSkillsProfileSchema.safeParse(legacyProfile).data.profession, "");
  assert.equal(memberSkillsProfileSchema.safeParse(baseProfile).data.profession, profession);
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, profession: "Ex. artisan du bâtiment" }).success,
    true,
  );
});

test("refuse les compétences inconnues, doublons et dépassements", () => {
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, skills: ["chantiers", "chantiers"] }).success,
    false,
  );
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, skills: ["invented"] }).success,
    false,
  );
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, skills: Array(9).fill("chantiers") }).success,
    false,
  );
});

test("exige une compétence avant publication et permet de signaler une indisponibilité", () => {
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, directoryVisible: false, skills: [] }).success,
    true,
  );
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, skills: [] }).success,
    false,
  );
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, availability: "pas_actuellement" }).success,
    true,
  );
});

test("exige un opt-in séparé et filtre les coordonnées personnelles du résumé", () => {
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, shareContact: true }).success,
    true,
  );
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, directoryVisible: false, shareContact: true }).success,
    false,
  );
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, summary: "Écrivez-moi à membre@example.fr" }).success,
    false,
  );
  assert.equal(
    memberSkillsProfileSchema.safeParse({ ...baseProfile, profession: "Contact: membre@example.fr" }).success,
    false,
  );
});