import { load } from "cheerio";
import { getEmailFooter } from "../functions/src/emailTemplates.ts";

export const NEWSLETTER_UNSUBSCRIBE_URL = "*|UNSUBSCRIBED|*";

export function safeNewsletterUrl(value: string, image = false): string | null {
  try {
    const url = new URL(value.trim());
    return (image ? ["https:"] : ["https:", "http:", "mailto:"]).includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

// [SPEC-NEWSLETTER-CONTENT-01] Only editorial HTML survives; provider tokens belong to the trusted footer.
export function sanitizeNewsletterHtml(html: string): string {
  const $ = load(html, null, false);
  $(
    "script,style,iframe,object,embed,svg,math,form,input,button,textarea,select,template",
  ).remove();
  const allowed = new Set([
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "blockquote",
    "a",
    "img",
    "hr",
  ]);
  $("*")
    .toArray()
    .reverse()
    .forEach((element) => {
      if (element.type !== "tag") return;
      const tag = element.tagName.toLowerCase();
      const node = $(element);
      if (!allowed.has(tag)) {
        node.replaceWith(node.contents());
        return;
      }
      const href = node.attr("href");
      const src = node.attr("src");
      const alt = node.attr("alt");
      const title = node.attr("title");
      Object.keys(element.attribs).forEach((attribute) => node.removeAttr(attribute));
      if (tag === "a") {
        const safe = safeNewsletterUrl(href || "");
        if (safe) node.attr("href", safe).attr("rel", "noopener noreferrer");
        else {
          node.replaceWith(node.contents());
          return;
        }
        if (title) node.attr("title", title.slice(0, 300));
      }
      if (tag === "img") {
        const safe = safeNewsletterUrl(src || "", true);
        if (!safe) {
          node.remove();
          return;
        }
        node
          .attr("src", safe)
          .attr("alt", (alt || "").slice(0, 300))
          .attr("style", "max-width:100%;height:auto;display:block;");
      }
    });
  return $.html();
}

export function newsletterHtmlHasContent(html: string): boolean {
  const $ = load(html, null, false);
  return $.text().trim().length > 0 || $("img").length > 0;
}

export function buildNewsletterHtml(html: string): string {
  const content = sanitizeNewsletterHtml(html);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica,Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#fff;">${content}${getEmailFooter(true, true)}<p style="margin-top:24px;font-size:12px;text-align:center;"><a href="${NEWSLETTER_UNSUBSCRIBE_URL}" style="color:#475569;text-decoration:underline;">Se désinscrire de cette newsletter</a></p></body></html>`;
}
