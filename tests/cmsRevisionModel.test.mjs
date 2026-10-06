import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCmsRevisionSnapshot,
  buildVersionedCmsPageData,
  buildVersionedHomeActionPlanData,
  isCurrentCmsDraftVersion,
} from "../lib/cmsRevisionModel.ts";

// [SPEC-CMS-HISTORY-01] Each publication archives the previous document and the client cannot select its version.
test("archive l’état précédent et calcule la version côté serveur", () => {
  const previous = {
    version: 7,
    blocks: [{ type: "financial_overview", data: { title: "Avant" } }],
  };
  const proposed = {
    version: 999,
    blocks: [{ type: "financial_overview", data: { title: "Après" } }],
  };
  const snapshot = buildCmsRevisionSnapshot(previous, "admin@example.com", "visual");
  const next = buildVersionedCmsPageData(previous, proposed);

  assert.equal(snapshot.data, previous);
  assert.equal(snapshot.version, 7);
  assert.equal(snapshot.changedBy, "admin@example.com");
  assert.equal(next.version, 8);
  assert.deepEqual(next.blocks, proposed.blocks);
});
test("une page historique sans version démarre à la version 1", () => {
  assert.deepEqual(buildVersionedCmsPageData({}, { version: 42, header: { title: "Page" } }), {
    header: { title: "Page" },
    version: 1,
  });
});

// [SPEC-CMS-HISTORY-01] A full-page draft cannot overwrite a newer published page.
test("refuse la publication d’un brouillon basé sur une ancienne version", () => {
  assert.equal(isCurrentCmsDraftVersion({ version: 8 }, 8), true);
  assert.equal(isCurrentCmsDraftVersion({ version: 9 }, 8), false);
  assert.equal(isCurrentCmsDraftVersion({ version: 9 }), true);
});

// [SPEC-HOME-ACTION-PLAN-01] Approval of a plan draft must preserve newer unrelated CMS content.
test("publie le plan d’action sur la page courante sans remplacer ses autres champs", () => {
  const latestPage = { version: 4, header: { title: "Titre récent" }, homeActionPlan: [] };
  const proposedPlan = { homeActionPlan: [{ title: "Nouvelle étape" }] };

  assert.deepEqual(buildVersionedHomeActionPlanData(latestPage, proposedPlan), {
    version: 5,
    header: { title: "Titre récent" },
    homeActionPlan: [{ title: "Nouvelle étape" }],
  });
});
