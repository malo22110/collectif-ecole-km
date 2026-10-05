import assert from "node:assert/strict";
import test from "node:test";
import { searchCouncilMinutes } from "../lib/assistantMinutes.ts";

// [SPEC-ASSISTANT-CMS-03] Search results include the source PV and a relevant, contact-redacted excerpt.
test("retrouve un passage de PV avec le titre source et masque les coordonnées", () => {
  const corpus = [
    "--- DEBUT DU DOCUMENT : PV DU 14 décembre 2023.pdf ---",
    "Conseil municipal du 14 décembre 2023.",
    "Le conseil vote une subvention de 12 000 euros pour la rénovation de l'école.",
    "Contacter mairie@example.test au 02 96 00 00 00 pour les détails.",
    "--- FIN DU DOCUMENT : PV DU 14 décembre 2023.pdf ---",
  ].join("\n");

  const result = searchCouncilMinutes(corpus, "subvention rénovation école");
  assert.equal(result.totalMatchingDocuments, 1);
  assert.equal(result.documents[0].title, "PV DU 14 décembre 2023.pdf");
  assert.match(result.documents[0].excerpts[0].text, /subvention de 12 000 euros/);
  assert.doesNotMatch(JSON.stringify(result), /mairie@example|02 96 00 00 00/);
  assert.equal(result.source, "public/context.txt");
});

// [SPEC-ASSISTANT-CMS-03] Search results stay bounded and return no snippets for an unmatched query.
test("borne les résultats et ne retourne rien sans correspondance", () => {
  const documents = Array.from({ length: 7 }, (_, index) =>
    [
      `--- DEBUT DU DOCUMENT : PV ${index}.pdf ---`,
      `${"Compte rendu détaillé. ".repeat(90)} rénovation école ${"données publiques. ".repeat(90)}`,
      `--- FIN DU DOCUMENT : PV ${index}.pdf ---`,
    ].join("\n"),
  );
  const result = searchCouncilMinutes(documents.join("\n"), "rénovation école");
  assert.equal(result.totalMatchingDocuments, 7);
  assert.ok(result.documents.length <= 4);
  assert.ok(result.documents.every((document) => document.excerpts.length <= 4));
  assert.ok(JSON.stringify(result).length < 10000);

  const empty = searchCouncilMinutes(documents.join("\n"), "délibération introuvable");
  assert.equal(empty.totalMatchingDocuments, 0);
  assert.deepEqual(empty.documents, []);
});
