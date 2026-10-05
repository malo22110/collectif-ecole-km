import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildDirectMagicLink,
  MAGIC_LINK_ACTION_CODE_SETTINGS,
} from "../functions/src/magicLinkConfig.ts";

// [SPEC-MAIL-01] Magic links always return to the authorized canonical domain and its sign-in handler.
test("le lien magique revient sur le domaine canonique et la page de connexion", () => {
  const continueUrl = new URL(MAGIC_LINK_ACTION_CODE_SETTINGS.url);
  assert.equal(continueUrl.protocol, "https:");
  assert.equal(continueUrl.hostname, "collectif-ecole-km.fr");
  assert.equal(continueUrl.pathname, "/connexion");
  assert.equal(MAGIC_LINK_ACTION_CODE_SETTINGS.handleCodeInApp, true);
  assert.equal("linkDomain" in MAGIC_LINK_ACTION_CODE_SETTINGS, false);
});

// [SPEC-MAIL-01] Direct links avoid the cached Firebase action-handler redirect while preserving its signed parameters.
test("redirige les paramètres signés vers le callback du domaine du collectif", () => {
  const firebaseActionLink = new URL("https://collectif-ecole-km.firebaseapp.com/__/auth/action");
  firebaseActionLink.search = new URLSearchParams({
    apiKey: "test-api-key",
    mode: "signIn",
    oobCode: "test-one-time-code",
    continueUrl: MAGIC_LINK_ACTION_CODE_SETTINGS.url,
    lang: "fr",
  }).toString();

  const directLink = new URL(buildDirectMagicLink(firebaseActionLink.toString()));
  assert.equal(`${directLink.origin}${directLink.pathname}`, MAGIC_LINK_ACTION_CODE_SETTINGS.url);
  assert.equal(directLink.searchParams.get("apiKey"), "test-api-key");
  assert.equal(directLink.searchParams.get("mode"), "signIn");
  assert.equal(directLink.searchParams.get("oobCode"), "test-one-time-code");
  assert.equal(directLink.searchParams.get("continueUrl"), MAGIC_LINK_ACTION_CODE_SETTINGS.url);
  assert.equal(directLink.searchParams.get("lang"), "fr");
});

test("refuse de réécrire un lien qui ne vient pas du handler Firebase attendu", () => {
  assert.throws(
    () => buildDirectMagicLink("https://attacker.example/__/auth/action?mode=signIn"),
    /lien de connexion inattendu/,
  );
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
