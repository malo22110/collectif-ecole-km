import assert from "node:assert/strict";
import test from "node:test";
import {
  getUnlinkedPressArticles,
  groupPressReleases,
  pressBodyToHtml,
  pressReleaseSchema,
} from "../lib/pressReleases.ts";

// [SPEC-PRESS-01] Sort by the editorial date, not the Firestore creation date.
test("le dernier communiqué et ses seuls articles associés arrivent en premier", () => {
  const grouped = groupPressReleases(
    [
      { id: "ancien", title: "Ancien", body: "Texte", date: "2026-09-01" },
      { id: "recent", title: "Récent", body: "Texte", date: "2026-10-12" },
    ],
    [{ id: "un", releaseId: "ancien" }, { id: "deux", releaseId: "recent" }, { id: "sans-lien" }],
  );
  assert.deepEqual(
    grouped.map((entry) => [entry.release.id, entry.articles.map((article) => article.id)]),
    [
      ["recent", ["deux"]],
      ["ancien", ["un"]],
    ],
  );
});

test("les communiqués exigent une date ISO et un contenu", () => {
  assert.equal(
    pressReleaseSchema.safeParse({ title: "Titre", body: "Texte", date: "2026-10-12" }).success,
    true,
  );
  assert.equal(
    pressReleaseSchema.safeParse({ title: "Titre", body: "Texte", date: "12/10/2026" }).success,
    false,
  );
  assert.equal(
    pressReleaseSchema.safeParse({ title: "Titre", body: "", date: "2026-10-12" }).success,
    false,
  );
});

test("le corps du communiqué ne peut pas injecter de HTML dans le mail", () => {
  assert.equal(
    pressBodyToHtml("Bonjour <script>\nÀ demain & merci"),
    "<p>Bonjour &lt;script&gt;<br>À demain &amp; merci</p>",
  );
});

test("les articles historiques ou liés à un communiqué absent restent visibles", () => {
  const releases = [{ id: "existant", title: "Titre", body: "Texte", date: "2026-10-12" }];
  const articles = [
    { id: "ancien" },
    { id: "inconnu", releaseId: "supprimé" },
    { id: "lié", releaseId: "existant" },
  ];
  assert.deepEqual(
    getUnlinkedPressArticles(releases, articles).map((article) => article.id),
    ["ancien", "inconnu"],
  );
  assert.deepEqual(
    getUnlinkedPressArticles(releases, articles, false).map((article) => article.id),
    ["ancien"],
  );
});
