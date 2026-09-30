import assert from "node:assert/strict";
import test from "node:test";
import { formatPaperSignatureEmail } from "../lib/paperSignature.ts";

test("[SPEC-PET-SCAN-04] identifie les signatures papier par le membre qui les a scannées", () => {
  assert.equal(formatPaperSignatureEmail("  Camille   Le Cam "), "Signature papier - Camille Le Cam");
});

test("[SPEC-PET-SCAN-04] utilise un libellé de repli si le profil n'a pas de nom", () => {
  assert.equal(formatPaperSignatureEmail("  "), "Signature papier - Membre du collectif");
});