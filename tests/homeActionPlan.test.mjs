import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_HOME_ACTION_PLAN,
  normalizeHomeActionPlan,
  sanitizeHomeActionPlanLink,
} from "../lib/homeActionPlan.ts";

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
