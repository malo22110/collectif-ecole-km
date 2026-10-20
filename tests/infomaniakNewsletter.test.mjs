import assert from "node:assert/strict";
import test from "node:test";
import {
  canRunNewsletterAction,
  createNewsletterClient,
  NewsletterApiError,
  remainingNewsletterAudience,
  selectNewsletterRecipients,
  newsletterRecipientPayload,
  newsletterDraftSchema,
} from "../lib/infomaniakNewsletter.ts";

const config = { token: "test-token", domainId: "123" };
const reply = (data) => new Response(JSON.stringify(data), { status: 200 });

// [SPEC-NEWSLETTER-GROUP-01] Group targeting never falls back to the entire subscriber list.
test("le ciblage inclut uniquement le groupe choisi et refuse un identifiant absent", () => {
  assert.deepEqual(newsletterRecipientPayload(42), {
    all_subscribers: false,
    emails: [],
    expert: { id: 0, conditions: null },
    groups: { include: [42], exclude: [] },
    segments: { include: [], exclude: [] },
  });
  assert.throws(() => newsletterRecipientPayload(undefined));
  assert.deepEqual(
    selectNewsletterRecipients(
      [
        { id: 1, email: "test@example.fr", status: "active", groups: [{ id: 42, name: "test" }] },
        { id: 2, email: "news@example.fr", status: "active", groups: [{ id: 10, name: "news" }] },
        {
          id: 3,
          email: "out@example.fr",
          status: "unsubscribed",
          groups: [{ id: 42, name: "test" }],
        },
      ],
      [],
      42,
    ),
    ["test@example.fr"],
  );
});

test("un brouillon doit préciser un groupe valide", () => {
  const draft = {
    subject: "Test",
    body: "Texte",
    requestId: "00000000-0000-4000-8000-000000000001",
  };
  assert.equal(newsletterDraftSchema.safeParse(draft).success, false);
  assert.equal(newsletterDraftSchema.safeParse({ ...draft, groupId: 42 }).success, true);
  assert.equal(newsletterDraftSchema.safeParse({ ...draft, groupId: 0 }).success, false);
});

test("les groupes sont lus avec pagination et la mise à jour conserve uniquement le groupe choisi", async () => {
  const calls = [];
  const client = createNewsletterClient(config, async (url, init) => {
    calls.push(url);
    if (init.method === "PUT") {
      assert.deepEqual(JSON.parse(init.body).recipients, newsletterRecipientPayload(42));
      return reply({ result: "success", data: { id: 12, subject: "Test", status: "draft" } });
    }
    const page = calls.length;
    return reply({
      result: "success",
      data: [{ id: page, name: page === 1 ? "test" : "news", subscribed_count: page }],
      page,
      pages: 2,
    });
  });
  assert.deepEqual(
    (await client.groups()).map((group) => group.name),
    ["test", "news"],
  );
  await client.updateRecipients(12, 42);
});

test("un refus conserve uniquement les champs et codes, sans message privé", async () => {
  const client = createNewsletterClient(
    config,
    async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "validation_failed",
            errors: { "recipients.emails": ["private@example.fr"] },
          },
        }),
        { status: 422 },
      ),
  );
  await assert.rejects(
    client.createCampaign({
      subject: "Titre",
      html: "Texte",
      senderEmail: "a@example.fr",
      senderName: "Collectif",
      emails: ["private@example.fr"],
      groupId: 42,
    }),
    (error) => {
      assert.ok(error instanceof NewsletterApiError);
      assert.equal(error.httpStatus, 422);
      assert.deepEqual(error.fields, ["recipients.emails"]);
      assert.deepEqual(error.codes, ["validation_failed"]);
      assert.equal(error.message.includes("private@example.fr"), false);
      return true;
    },
  );
});

// [SPEC-NEWSLETTER-CAMPAIGN-02] A retry must not double-send or enlarge the original audience.
test("seul un brouillon testé peut être programmé et les états ambigus restent bloqués", () => {
  assert.equal(canRunNewsletterAction("draft", "schedule", 2), false);
  assert.equal(canRunNewsletterAction("tested", "schedule", 2), true);
  assert.equal(canRunNewsletterAction("draft", "test", 2), true);
  assert.equal(canRunNewsletterAction("tested", "schedule", 1), false);
  assert.equal(canRunNewsletterAction("tested", "test"), false);
  for (const state of ["creating", "testing", "scheduling", "scheduled", "review-required"]) {
    assert.equal(canRunNewsletterAction(state, "schedule", 2), false);
    assert.equal(canRunNewsletterAction(state, "test", 2), false);
  }
});

test("la programmation réduit l'audience et n'ajoute jamais les nouveaux abonnés", () => {
  assert.deepEqual(
    remainingNewsletterAudience(["a@example.fr", "b@example.fr"], ["a@example.fr", "c@example.fr"]),
    ["a@example.fr"],
  );
});

test("seuls les abonnés actifs et non opposés sont sélectionnés sans doublon", () => {
  assert.deepEqual(
    selectNewsletterRecipients(
      [
        { id: 1, email: "a@example.fr", status: "active" },
        { id: 2, email: "b@example.fr", status: "unsubscribed" },
        { id: 3, email: "c@example.fr", status: "bounced_import" },
        { id: 4, email: "d@example.fr", status: "active" },
        { id: 5, email: "a@example.fr", status: "active" },
      ],
      ["D@example.fr"],
    ),
    ["a@example.fr"],
  );
});

test("la création utilise une audience explicite sans suivi et aucun envoi immédiat", async () => {
  const client = createNewsletterClient(config, async (url, init) => {
    assert.equal(url.endsWith("/campaigns"), true);
    const body = JSON.parse(init.body);
    assert.deepEqual(body.recipients, newsletterRecipientPayload(42));
    assert.equal(body.tracking_opening, false);
    assert.equal(body.tracking_link, false);
    assert.equal(body.unsub_link, true);
    assert.equal(body.started_at, undefined);
    return reply({ result: "success", data: { id: 12, subject: body.subject, status: "draft" } });
  });
  assert.equal(
    (
      await client.createCampaign({
        subject: "Titre",
        html: "<p>Texte</p>",
        senderEmail: "sender@example.fr",
        senderName: "Collectif",
        groupId: 42,
        emails: ["a@example.fr"],
      })
    ).id,
    12,
  );
});

test("un refus de programmation ne peut pas être annoncé comme réussi", async () => {
  const client = createNewsletterClient(config, async () =>
    reply({ result: "success", data: false }),
  );
  await assert.rejects(client.scheduleCampaign(1, 1792000000), /pas été confirmée/);
});

test("le test de campagne cible une seule adresse via le contrat email", async () => {
  const client = createNewsletterClient(config, async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), { email: "admin@example.fr" });
    return reply({ result: "success", data: true });
  });
  assert.equal(await client.testCampaign(1, "admin@example.fr"), true);
});

// [SPEC-NEWSLETTER-API-01] Follow every page and never silently drop opposition records.
test("les abonnés sont lus avec pagination et normalisation", async () => {
  const calls = [];
  const client = createNewsletterClient(config, async (url, init) => {
    calls.push({ url, init });
    const page = calls.length;
    return reply({
      result: "success",
      data: [
        {
          id: page,
          email: ` USER${page}@example.fr `,
          status: page === 1 ? "active" : "unsubscribed",
        },
      ],
      page,
      pages: 2,
    });
  });
  assert.deepEqual(
    (await client.subscribers()).map((item) => item.email),
    ["user1@example.fr", "user2@example.fr"],
  );
  assert.match(calls[1].url, /page=2/);
  assert.equal(calls[0].init.redirect, "error");
});

test("une opposition ne modifie aucun champ et ne peut pas réactiver", async () => {
  const client = createNewsletterClient(config, async (url, init) => {
    assert.equal(url, "https://api.infomaniak.com/1/newsletters/123/subscribers/42");
    assert.equal(init.method, "PUT");
    assert.deepEqual(JSON.parse(init.body), { status: "unsubscribed" });
    return reply({
      result: "success",
      data: { id: 42, email: "user@example.fr", status: "unsubscribed" },
    });
  });
  assert.equal((await client.unsubscribe(42)).status, "unsubscribed");
});

test("les erreurs HTTP et réponses inattendues bloquent le traitement sans exposer le token", async () => {
  const client = createNewsletterClient(
    config,
    async () => new Response("secret upstream data", { status: 403 }),
  );
  await assert.rejects(client.subscribers(), /HTTP 403/);
  const malformed = createNewsletterClient(config, async () =>
    reply({ result: "success", data: [], page: 1, pages: 101 }),
  );
  await assert.rejects(malformed.subscribers());
});

test("une réponse trop volumineuse est interrompue avant parsing", async () => {
  const client = createNewsletterClient(config, async () => new Response("x".repeat(2_000_001)));
  await assert.rejects(client.subscribers(), /trop volumineuse/);
});
