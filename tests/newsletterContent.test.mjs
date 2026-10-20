import assert from "node:assert/strict";
import test from "node:test";
import { load } from "cheerio";
import { getEmailFooter, getBaseHtmlTemplate } from "../functions/src/emailTemplates.ts";
import {
  buildNewsletterHtml,
  newsletterHtmlHasContent,
  sanitizeNewsletterHtml,
  safeNewsletterUrl,
} from "../lib/newsletterContent.ts";

// [SPEC-NEWSLETTER-CONTENT-01] Formatting, links and images survive without executable HTML.
test("le contenu riche conserve listes, gras, liens et images HTTPS", () => {
  const html = sanitizeNewsletterHtml(
    '<p><strong>Bonjour</strong> <em>tous</em></p><ul><li>Un</li></ul><a href="https://example.org">Lien</a><img src="https://example.org/image.png" alt="Photo">',
  );
  const $ = load(html);
  assert.equal($("strong").text(), "Bonjour");
  assert.equal($("ul li").text(), "Un");
  assert.equal($("img").attr("alt"), "Photo");
  assert.equal($("a").attr("href"), "https://example.org/");
});

test("le contenu HTML non fiable ne peut injecter scripts, styles ou liens dangereux", () => {
  const html = sanitizeNewsletterHtml(
    '<script>alert(1)</script><p onclick="evil()" style="color:red">Texte</p><a href="javascript:evil()">Lien</a><img src="data:image/svg+xml,bad"><iframe src="https://example.org"></iframe><a href="*|UNSUBSCRIBED|*">Faux</a>',
  );
  assert.doesNotMatch(html, /script|onclick|javascript|iframe|data:|style=|UNSUBSCRIBED/);
  assert.equal(newsletterHtmlHasContent("<p><br></p>"), false);
  assert.equal(safeNewsletterUrl("javascript:alert(1)"), null);
});

test("le pied collectif et la désinscription sont ajoutés une seule fois après nettoyage", () => {
  const $ = load(buildNewsletterHtml("<p>Actualités</p>"));
  assert.equal($("a[href='*|UNSUBSCRIBED|*']").length, 1);
  assert.match($.text(), /Axelle & Malo/);
  assert.equal($("img[alt='Logo Collectif']").length, 1);
  assert.equal($("a[href='https://collectif-ecole-km.fr/']").length, 1);
});

test("les emails existants conservent leur pied sans lien de newsletter", () => {
  assert.match(getEmailFooter(), /collectif-ecole-km\.web\.app/);
  assert.match(getEmailFooter(false), /Axelle & Malo/);
  assert.doesNotMatch(getBaseHtmlTemplate("<p>Connexion</p>"), /UNSUBSCRIBED/);
});
