import assert from "node:assert/strict";
import test from "node:test";
import { MAGIC_LINK_CONTINUE_URL } from "../functions/src/magicLinkConfig.ts";

// [SPEC-MAIL-01] Magic links always return to the authorized canonical domain and its sign-in handler.
test("le lien magique revient sur le domaine canonique et la page de connexion", () => {
  const continueUrl = new URL(MAGIC_LINK_CONTINUE_URL);
  assert.equal(continueUrl.protocol, "https:");
  assert.equal(continueUrl.hostname, "collectif-ecole-km.fr");
  assert.equal(continueUrl.pathname, "/connexion");
});