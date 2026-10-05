import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { MAGIC_LINK_ACTION_CODE_SETTINGS } from "../functions/src/magicLinkConfig.ts";

// [SPEC-MAIL-01] Magic links always return to the authorized canonical domain and its sign-in handler.
test("le lien magique revient sur le domaine canonique et la page de connexion", () => {
  const continueUrl = new URL(MAGIC_LINK_ACTION_CODE_SETTINGS.url);
  assert.equal(continueUrl.protocol, "https:");
  assert.equal(continueUrl.hostname, "collectif-ecole-km.fr");
  assert.equal(continueUrl.pathname, "/connexion");
  assert.equal(MAGIC_LINK_ACTION_CODE_SETTINGS.handleCodeInApp, true);
  assert.equal(MAGIC_LINK_ACTION_CODE_SETTINGS.linkDomain, "collectif-ecole-km.web.app");
});

// [SPEC-MAIL-01] The callback must ask for an email in-page before attempting Firebase sign-in.
test("la page de connexion confirme l’adresse avant tout appel Firebase et n’utilise pas prompt", async () => {
  const page = await readFile(new URL("../app/connexion/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /window\.prompt/);
  assert.match(page, /setIsMagicLink\(true\)/);
  assert.match(page, /handleCompleteMagicLink/);
  assert.match(page, /id="magic-link-email"/);
  assert.match(page, /await signInWithEmailLink\(auth, confirmedEmail/);
});
