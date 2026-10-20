import assert from "node:assert/strict";
import test from "node:test";
import { getPersonalTestRecipient, resolveMailRecipients } from "../lib/mailOutboxUtils.ts";
import {
  filterSuppressedRecipients,
  getMailSuppressionId,
} from "../functions/src/mailSuppression.ts";

// [SPEC-MAIL-OPT-OUT-01] Real server filtering is bounded and fails closed.
test("le filtre serveur exclut par empreinte, limite les lots et conserve les données sources", async () => {
  const recipients = Array.from({ length: 401 }, (_, index) => ({
    email: `contact${index}@example.fr`,
  }));
  const excludedId = getMailSuppressionId(recipients[0].email);
  const batches = [];
  const allowed = await filterSuppressedRecipients(recipients, async (ids) => {
    batches.push(ids.length);
    return ids.map((id) => id === excludedId);
  });
  assert.deepEqual(batches, [400, 1]);
  assert.equal(allowed.length, 400);
  assert.equal(
    allowed.some((recipient) => recipient.email === recipients[0].email),
    false,
  );
  assert.equal(recipients.length, 401);
  assert.deepEqual(
    await filterSuppressedRecipients([], async () => {
      throw Error("Unexpected query");
    }),
    [],
  );
});

test("une panne ou une vérification incomplète bloque l'envoi", async () => {
  const recipients = [{ email: "contact@example.fr" }];
  await assert.rejects(
    filterSuppressedRecipients(recipients, async () => {
      throw Error("DB unavailable");
    }),
  );
  await assert.rejects(filterSuppressedRecipients(recipients, async () => []));
});

// [SPEC-MAIL-OPT-OUT-01] Opt-out survives duplicated membership/signature records.
test("une opposition exclut l'adresse de toutes les audiences sans supprimer les sources", () => {
  const sources = {
    members: [{ email: "personne@example.fr" }],
    signers: [{ email: "PERSONNE@example.fr" }],
    journalists: [{ email: "personne@example.fr" }],
  };
  for (const audience of [
    "all",
    "membres",
    "signataires",
    "membres_non_signataires",
    "journalistes",
    "individuel",
  ]) {
    assert.deepEqual(resolveMailRecipients(audience, sources, [" PERSONNE@example.fr "]), []);
  }
  assert.equal(sources.members.length, 1);
  assert.equal(sources.signers.length, 1);
  assert.equal(
    getMailSuppressionId(" PERSONNE@example.fr "),
    getMailSuppressionId("personne@example.fr"),
  );
  assert.match(getMailSuppressionId("personne@example.fr"), /^[a-f0-9]{64}$/);
});
import {
  canRetryFailedRecipients,
  isDailySmtpQuotaError,
  isMailDueForDelivery,
} from "../functions/src/mailQueue.ts";

// [SPEC-MAIL-03] The all audience contains members and signers, never press contacts.
test("Tous fusionne membres et signataires, exclut les journalistes et déduplique les adresses", () => {
  const recipients = resolveMailRecipients("all", {
    members: [
      { email: " Membre@exemple.fr ", name: "Membre" },
      { email: "partagé@exemple.fr", name: "Adhérent" },
      { email: "rebond@exemple.fr", emailBounced: true },
    ],
    signers: [
      { email: "partagé@exemple.fr", name: "Signataire" },
      { email: "signature@exemple.fr", name: "Signature" },
    ],
    journalists: [{ email: "presse@exemple.fr", name: "Presse" }],
  });

  assert.deepEqual(
    recipients.map((recipient) => recipient.email),
    ["membre@exemple.fr", "partagé@exemple.fr", "signature@exemple.fr"],
  );
  assert.equal(recipients[1].name, "Adhérent");
  assert.ok(recipients.every((recipient) => recipient.status === "pending"));
});

// [SPEC-MAIL-03] Each explicit audience remains isolated and bounced addresses are excluded.
test("Les audiences Membres, non-signataires et Journalistes restent séparées", () => {
  const sources = {
    members: [
      { email: "a@example.fr" },
      { email: "b@example.fr" },
      { email: "c@example.fr", emailBounced: true },
    ],
    signers: [{ email: "b@example.fr" }],
    journalists: [{ email: "presse@example.fr" }],
  };

  assert.deepEqual(
    resolveMailRecipients("membres", sources).map((item) => item.email),
    ["a@example.fr", "b@example.fr"],
  );
  assert.deepEqual(
    resolveMailRecipients("membres_non_signataires", sources).map((item) => item.email),
    ["a@example.fr"],
  );
  assert.deepEqual(
    resolveMailRecipients("journalistes", sources).map((item) => item.email),
    ["presse@example.fr"],
  );
});

// [SPEC-MAIL-03] Test sends only to the authenticated user's own address.
test("Le mode test ne cible que l’adresse authentifiée", () => {
  assert.deepEqual(getPersonalTestRecipient("ADMIN@EXEMPLE.FR"), [
    { email: "admin@exemple.fr", name: "Test personnel", status: "pending" },
  ]);
});

// [SPEC-MAIL-03] Immediate and due messages are eligible for the periodic delivery recovery.
test("la reprise accepte les envois immédiats et échus, mais pas les envois futurs", () => {
  const now = new Date("2026-10-05T12:00:00.000Z");
  assert.equal(isMailDueForDelivery(undefined, now), true);
  assert.equal(isMailDueForDelivery(null, now), true);
  assert.equal(isMailDueForDelivery(new Date("2026-10-05T11:59:00.000Z"), now), true);
  assert.equal(
    isMailDueForDelivery({ toDate: () => new Date("2026-10-05T12:00:00.000Z") }, now),
    true,
  );
  assert.equal(isMailDueForDelivery(new Date("2026-10-05T12:01:00.000Z"), now), false);
});

// [SPEC-MAIL-03] Only Infomaniak's 24-hour quota error pauses a campaign.
test("le quota quotidien SMTP est distingué des autres refus", () => {
  assert.equal(
    isDailySmtpQuotaError({
      responseCode: 451,
      response:
        "451 4.3.0 You have reached the maximum number of sent emails within a 24-hours period.",
    }),
    true,
  );
  assert.equal(
    isDailySmtpQuotaError({ responseCode: 451, response: "Temporary mailbox failure" }),
    false,
  );
  assert.equal(
    isDailySmtpQuotaError({
      responseCode: 550,
      response: "maximum number of sent emails within a 24-hours period",
    }),
    false,
  );
  assert.equal(isDailySmtpQuotaError(new Error("timeout")), false);
});

// [SPEC-MAIL-03] Manual retry cannot resend accepted recipients or overlap a running campaign.
test("la relance ne reprend que les échecs d'une campagne terminée", () => {
  assert.equal(canRetryFailedRecipients("partial", 483, 0, 483), true);
  assert.equal(canRetryFailedRecipients("error", 494, 0, 494), true);
  assert.equal(canRetryFailedRecipients("sending", 483, 0, 483), false);
  assert.equal(canRetryFailedRecipients("partial", 483, 1, 483), false);
  assert.equal(canRetryFailedRecipients("partial", 483, 0, 482), false);
});
