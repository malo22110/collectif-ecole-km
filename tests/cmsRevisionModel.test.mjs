import assert from "node:assert/strict";
import test from "node:test";
import { buildCmsRevisionSnapshot, buildVersionedCmsPageData } from "../lib/cmsRevisionModel.ts";

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
