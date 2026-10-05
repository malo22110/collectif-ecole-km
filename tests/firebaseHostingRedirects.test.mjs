import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const config = JSON.parse(
  await readFile(new URL("../firebase.json", import.meta.url), "utf8"),
);

// [SPEC-MAIL-01] Keep Firebase Auth's reserved handler/configuration endpoints on firebaseapp.com.
test("les redirections vers le domaine canonique ne capturent pas les endpoints Firebase réservés", () => {
  const redirects = config.hosting.redirects;
  assert.ok(redirects.length > 0);
  assert.ok(
    redirects.every(({ source }) => !source.startsWith("/:path")),
    "aucune redirection globale ne doit intercepter /__/firebase/*",
  );
  assert.ok(
    redirects.every(({ source }) => !source.startsWith("/__/")),
    "les routes internes Firebase ne doivent pas être redirigées",
  );

  for (const path of ["/", "/connexion", "/historique", "/petition", "/actualites", "/espace-membre"]) {
    assert.ok(
      redirects.some(({ source }) => source === path),
      `la route publique ${path} reste redirigée vers le domaine canonique`,
    );
  }
});