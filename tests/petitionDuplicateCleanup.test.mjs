import assert from "node:assert/strict";
import test from "node:test";
import { cleanDeletedSignatureReference } from "../lib/petitionDuplicateCleanup.ts";

// [SPEC-CORRECTEUR-04] Remove the deleted record from remaining candidate links and clear empty duplicate flags.
test("retire la référence supprimée et conserve les autres candidats", () => {
  assert.deepEqual(
    cleanDeletedSignatureReference(["gone", "keep", "gone"], "gone"),
    {
      candidates: ["keep"],
      potentialDuplicate: true,
    },
  );
});

test("désactive le marqueur lorsque la dernière référence candidate est supprimée", () => {
  assert.deepEqual(cleanDeletedSignatureReference(["gone"], "gone"), {
    candidates: [],
    potentialDuplicate: false,
  });
});
