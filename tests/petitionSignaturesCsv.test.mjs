import assert from "node:assert/strict";
import test from "node:test";
import { buildSignaturesCsv } from "../lib/signaturesCsv.ts";

test("[SPEC-CORRECTEUR-EXPORT-01] produit un CSV français avec BOM, colonnes et marqueurs papier", () => {
  const csv = buildSignaturesCsv([{
    prenom: "Camille",
    nom: "Le Cam",
    email: "Signature papier - Alice Correctrice",
    ville: "Kergrist-Moëlou",
    qualite: "Habitante",
    source: "papier",
    potentialDuplicate: true,
    createdAt: "2026-10-01T12:00:00.000Z"
  }]);

  assert.ok(csv.startsWith("\uFEFF\"Prénom\";\"Nom\";"));
  assert.match(csv, /"Signature papier - Alice Correctrice"/);
  assert.match(csv, /"Papier";"Oui"/);
  assert.ok(csv.includes("\r\n"));
});

test("[SPEC-CORRECTEUR-EXPORT-01] échappe les guillemets et neutralise les formules spreadsheet", () => {
  const csv = buildSignaturesCsv([{
    prenom: "=HYPERLINK(\"https://example.test\")",
    nom: "Doe; Test",
    email: "+cmd",
    ville: "Town",
    qualite: "@SUM(A1)",
    createdAt: "-2+3"
  }]);

  assert.ok(csv.includes("\"'=HYPERLINK(\"\"https://example.test\"\")\""));
  assert.ok(csv.includes("\"Doe; Test\""));
  assert.ok(csv.includes("\"'+cmd\""));
  assert.ok(csv.includes("\"'@SUM(A1)\""));
  assert.ok(csv.includes("\"'-2+3\""));
});