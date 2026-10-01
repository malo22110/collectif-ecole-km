import assert from "node:assert/strict";
import test from "node:test";
import { getPersonalTestRecipient, resolveMailRecipients } from "../lib/mailOutboxUtils.ts";

// [SPEC-MAIL-03] The all audience contains members and signers, never press contacts.
test("Tous fusionne membres et signataires, exclut les journalistes et déduplique les adresses", () => {
  const recipients = resolveMailRecipients("all", {
    members: [
      { email: " Membre@exemple.fr ", name: "Membre" },
      { email: "partagé@exemple.fr", name: "Adhérent" },
      { email: "rebond@exemple.fr", emailBounced: true }
    ],
    signers: [
      { email: "partagé@exemple.fr", name: "Signataire" },
      { email: "signature@exemple.fr", name: "Signature" }
    ],
    journalists: [{ email: "presse@exemple.fr", name: "Presse" }]
  });

  assert.deepEqual(recipients.map(recipient => recipient.email), ["membre@exemple.fr", "partagé@exemple.fr", "signature@exemple.fr"]);
  assert.equal(recipients[1].name, "Adhérent");
  assert.ok(recipients.every(recipient => recipient.status === "pending"));
});

// [SPEC-MAIL-03] Each explicit audience remains isolated and bounced addresses are excluded.
test("Les audiences Membres, non-signataires et Journalistes restent séparées", () => {
  const sources = {
    members: [{ email: "a@example.fr" }, { email: "b@example.fr" }, { email: "c@example.fr", emailBounced: true }],
    signers: [{ email: "b@example.fr" }],
    journalists: [{ email: "presse@example.fr" }]
  };

  assert.deepEqual(resolveMailRecipients("membres", sources).map(item => item.email), ["a@example.fr", "b@example.fr"]);
  assert.deepEqual(resolveMailRecipients("membres_non_signataires", sources).map(item => item.email), ["a@example.fr"]);
  assert.deepEqual(resolveMailRecipients("journalistes", sources).map(item => item.email), ["presse@example.fr"]);
});

// [SPEC-MAIL-03] Test sends only to the authenticated user's own address.
test("Le mode test ne cible que l’adresse authentifiée", () => {
  assert.deepEqual(getPersonalTestRecipient("ADMIN@EXEMPLE.FR"), [
    { email: "admin@exemple.fr", name: "Test personnel", status: "pending" }
  ]);
});
