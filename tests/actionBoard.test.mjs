import test from "node:test";
import assert from "node:assert/strict";
import {
  actionCreateSchema,
  actionEditSchema,
  actionTransitionSchema,
  canEditAction,
  canTransitionAction,
} from "../lib/actionBoard.ts";

// [SPEC-ACTION-BOARD-01] Proposal input is bounded and cannot forge workflow state.
test("valide une nouvelle proposition avec un pôle connu", () => {
  assert.equal(
    actionCreateSchema.safeParse({
      pole: "expertise",
      title: "Comparer les solutions de ventilation",
      description: "Rassembler les éléments techniques disponibles pour préparer une comparaison.",
      meetingId: "b8b76c94-f222-43c9-967a-97b6dca9f674",
    }).success,
    true,
  );
  assert.equal(
    actionCreateSchema.safeParse({
      pole: "admin",
      title: "Décider le marché",
      description: "Cette proposition ne doit pas décider à la place de la commune.",
      meetingId: null,
      status: "realisee",
    }).success,
    false,
  );
});

test("limite l’édition aux auteurs tant que la proposition est nouvelle", () => {
  assert.equal(canEditAction("uid-a", "uid-a", "proposition"), true);
  assert.equal(canEditAction("uid-a", "uid-b", "proposition"), false);
  assert.equal(canEditAction("uid-a", "uid-a", "a_etudier"), false);
  assert.equal(
    actionEditSchema.safeParse({
      pole: "chantiers",
      title: "Préparer un chantier participatif",
      description: "Lister les besoins qui pourront être discutés avec la commune.",
      nextStep: "Recueillir les questions des membres.",
      meetingId: null,
    }).success,
    true,
  );
  assert.equal(
    actionCreateSchema.safeParse({
      pole: "expertise",
      title: "Comparer les solutions de ventilation",
      description: "Rassembler les éléments techniques disponibles pour préparer une comparaison.",
    }).data.meetingId,
    null,
  );
  assert.equal(
    actionCreateSchema.safeParse({
      pole: "expertise",
      title: "Comparer les solutions de ventilation",
      description: "Rassembler les éléments techniques disponibles pour préparer une comparaison.",
      meetingId: "not-a-meeting-id",
    }).success,
    false,
  );
});

test("limite les changements de statut à un parcours de coordination explicite", () => {
  assert.equal(canTransitionAction("proposition", "a_etudier"), true);
  assert.equal(canTransitionAction("a_etudier", "a_discuter_commune"), true);
  assert.equal(canTransitionAction("transmise_commune", "attente_retour"), true);
  assert.equal(canTransitionAction("proposition", "realisee"), false);
  assert.equal(canTransitionAction("realisee", "transmise_commune"), false);
  assert.equal(actionTransitionSchema.safeParse({ status: "realisee" }).success, true);
});