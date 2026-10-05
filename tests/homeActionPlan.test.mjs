import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEFAULT_HOME_ACTION_PLAN,
  getNextHomeActionPlanEntry,
  normalizeHomeActionPlan,
  sanitizeHomeActionPlanLink,
} from "../lib/homeActionPlan.ts";
import { homeActionPlanDraftSchema } from "../lib/homeActionPlanSchema.ts";

// [SPEC-HOME-ACTION-PLAN-01] The homepage plan has editable, validated entries and safe optional links.
test("fournit le plan actuel lorsque le document CMS ne contient pas encore le champ", () => {
  assert.deepEqual(normalizeHomeActionPlan(undefined), DEFAULT_HOME_ACTION_PLAN);
});

test("normalise les entrées CMS, ignore les entrées incomplètes et filtre les liens dangereux", () => {
  assert.deepEqual(
    normalizeHomeActionPlan([
      {
        date: "  Aujourd’hui  ",
        title: "  Étape 1  ",
        description: "  Description  ",
        status: "current",
        linkUrl: "javascript:alert(1)",
      },
      { date: "", title: "Incomplète", description: "Ignorer" },
      null,
    ]),
    [
      {
        date: "Aujourd’hui",
        title: "Étape 1",
        description: "Description",
        status: "current",
      },
    ],
  );
  assert.equal(sanitizeHomeActionPlanLink("/petition"), "/petition");
  assert.equal(sanitizeHomeActionPlanLink("https://example.org/info"), "https://example.org/info");
  assert.equal(sanitizeHomeActionPlanLink("//evil.example/path"), undefined);
  assert.equal(sanitizeHomeActionPlanLink("javascript:alert(1)"), undefined);
});

// [SPEC-HOME-ACTION-PLAN-01] Editorial drafts accept only bounded, safe plan entries.
test("valide strictement les propositions du plan d’action", () => {
  const validPlan = {
    homeActionPlan: [
      {
        date: "Automne",
        title: "Étape",
        description: "Description",
        status: "upcoming",
        linkUrl: "/petition",
      },
    ],
  };

  assert.equal(homeActionPlanDraftSchema.safeParse(validPlan).success, true);
  assert.equal(
    homeActionPlanDraftSchema.safeParse({
      homeActionPlan: [{ ...validPlan.homeActionPlan[0], linkUrl: "javascript:alert(1)" }],
    }).success,
    false,
  );
  assert.equal(
    homeActionPlanDraftSchema.safeParse({
      homeActionPlan: [{ ...validPlan.homeActionPlan[0], extra: "unexpected" }],
    }).success,
    false,
  );
});

// [SPEC-HOME-ACTION-PLAN-01] Editing a field must not change the React identity of its row.
test("garde une clé de ligne stable pendant la saisie des champs", async () => {
  const editor = await readFile(
    new URL("../app/admin/VisualCmsEditor.tsx", import.meta.url),
    "utf8",
  );
  assert.match(editor, /<li key=\{itemIndex\}/);
  assert.doesNotMatch(editor, /<li key=\{`\$\{item\.date\}/);
});

// [SPEC-HOME-ACTION-PLAN-01] The hero highlights the next upcoming step, falling back to the current step.
test("sélectionne le prochain jalon à venir, puis l’étape en cours en repli", () => {
  const current = { date: "Maintenant", title: "En cours", description: "...", status: "current" };
  const upcoming = { date: "Demain", title: "À venir", description: "...", status: "upcoming" };

  assert.equal(getNextHomeActionPlanEntry([current, upcoming]), upcoming);
  assert.equal(getNextHomeActionPlanEntry([current]), current);
  assert.equal(getNextHomeActionPlanEntry([]), undefined);
});
