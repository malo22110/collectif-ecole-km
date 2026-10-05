import assert from "node:assert/strict";
import test from "node:test";
import {
  extractPublishedArticleText,
  pickCmsBlocks,
  sanitizeStructuredCmsData,
} from "../lib/assistantCmsContext.ts";

// [SPEC-ASSISTANT-CMS-02] Financial blocks remain structured tool data; unrelated blocks are not returned.
test("sélectionne les blocs financiers structurés sans aplatir le CMS", () => {
  const data = pickCmsBlocks(
    {
      header: { title: "Livre des comptes", email: "private@example.test" },
      version: 4,
      blocks: [
        {
          type: "financial_overview",
          data: {
            title: "Dépenses",
            rows: [{ label: "Architecte", amount: "2 170 €" }],
          },
        },
        { type: "comments", data: { text: "ignored" } },
      ],
    },
    ["financial_overview"],
  );
  assert.equal(data.header.title, "Livre des comptes");
  assert.equal(data.header.email, undefined);
  assert.equal(data.blocks.length, 1);
  assert.equal(data.blocks[0].data.rows[0].amount, "2 170 €");
  assert.equal(data.blocks[0].type, "financial_overview");
});

// [SPEC-ASSISTANT-CMS-02] Nested structured data is bounded and private fields are omitted.
test("borne les blocs CMS structurés et retire les champs privés", () => {
  const data = sanitizeStructuredCmsData(
    {
      title: "Contenu public",
      email: "private@example.test",
      storagePath: "private/object",
      rows: [{ amount: "2 170 €", note: "x".repeat(1000) }],
    },
    100,
  );
  assert.equal(data.email, undefined);
  assert.equal(data.storagePath, undefined);
  assert.equal(data.rows[0].amount, "2 170 €");
  assert.ok(JSON.stringify(data).length < 180);
});

// [SPEC-ASSISTANT-CMS-02] Published article content is cleaned before exposing it to the model tool.
test("nettoie le HTML d’un article publié et retire scripts/styles", () => {
  const text = extractPublishedArticleText({
    title: "Réunion publique",
    content:
      "<p>Budget &amp; école</p><script>secret()</script><style>.x{}</style>",
  });
  assert.match(text, /Budget & école/);
  assert.doesNotMatch(text, /secret|\.x\{/);
});
