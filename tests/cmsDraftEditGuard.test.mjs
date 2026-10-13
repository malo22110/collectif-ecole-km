import assert from "node:assert/strict";
import test from "node:test";
import { getCmsDraftEditConflict } from "../lib/cmsDraftEditGuard.ts";

// [SPEC-CMS-DRAFT-EDIT-01] Draft edits cannot change approved drafts or overwrite a concurrent edit.
test("refuse la modification d’une révision qui n’est plus en attente", () => {
  assert.equal(getCmsDraftEditConflict("approved", 1, 1), "not-pending");
  assert.equal(getCmsDraftEditConflict("rejected", 1, 1), "not-pending");
});

test("refuse l’écrasement d’une modification concurrente", () => {
  assert.equal(getCmsDraftEditConflict("pending", 3, 2), "stale-edit");
});

test("autorise la mise à jour de la révision pending courante", () => {
  assert.equal(getCmsDraftEditConflict("pending", 2, 2), null);
});
