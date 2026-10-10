import test from "node:test";
import assert from "node:assert/strict";
import {
  agendaSuggestionSchema,
  canManageAgendaSuggestion,
  canPublishMeeting,
  canSuggestAgenda,
  meetingInputSchema,
} from "../lib/memberMeetings.ts";

// [SPEC-MEMBER-MEETINGS-01] Validate shared meeting content and safe member suggestions.
const meeting = {
  title: "Réunion de préparation du collectif",
  startsAt: "2026-11-12T18:30:00+01:00",
  location: "Salle communale",
  agendaItems: [{ id: "b8b76c94-f222-43c9-967a-97b6dca9f674", text: "Faire le point sur les besoins" }],
  minutes: "",
  publish: true,
};

test("valide une réunion et un point d’ordre du jour", () => {
  assert.equal(meetingInputSchema.safeParse(meeting).success, true);
  assert.equal(agendaSuggestionSchema.safeParse({ text: "État des demandes de subvention" }).success, true);
});

test("refuse les coordonnées, liens et listes d’ordre du jour trop longues", () => {
  assert.equal(meetingInputSchema.safeParse({ ...meeting, title: "Réunion membre@example.fr" }).success, false);
  assert.equal(agendaSuggestionSchema.safeParse({ text: "Voir https://example.org pour le point" }).success, false);
  assert.equal(
    meetingInputSchema.safeParse({
      ...meeting,
      agendaItems: Array.from({ length: 21 }, (_, index) => ({
        id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        text: "Point d’ordre du jour",
      })),
    }).success,
    false,
  );
});

test("un membre peut suggérer avant une réunion publiée seulement", () => {
  const future = "2026-11-12T18:30:00+01:00";
  assert.equal(canSuggestAgenda("published", future, Date.parse("2026-10-10T12:00:00Z")), true);
  assert.equal(canSuggestAgenda("draft", future, Date.parse("2026-10-10T12:00:00Z")), false);
  assert.equal(canSuggestAgenda("published", "2026-10-01T18:30:00+01:00", Date.parse("2026-10-10T12:00:00Z")), false);
});

test("seul un coordinateur peut publier un brouillon", () => {
  assert.equal(canPublishMeeting(true, "draft"), true);
  assert.equal(canPublishMeeting(false, "draft"), false);
  assert.equal(canPublishMeeting(true, "published"), false);
});

// [SPEC-MEMBER-MEETINGS-07] The author or a coordinator may manage a pending agenda suggestion.
test("réserve la gestion des suggestions à leur auteur et aux coordinateurs tant qu’elles attendent", () => {
  assert.equal(canManageAgendaSuggestion("uid-a", "uid-a", false, "pending"), true);
  assert.equal(canManageAgendaSuggestion("uid-a", "uid-b", true, "pending"), true);
  assert.equal(canManageAgendaSuggestion("uid-a", "uid-b", false, "pending"), false);
  assert.equal(canManageAgendaSuggestion("uid-a", "uid-a", false, "accepted"), false);
  assert.equal(canManageAgendaSuggestion("uid-a", "uid-a", false, "rejected"), false);
});