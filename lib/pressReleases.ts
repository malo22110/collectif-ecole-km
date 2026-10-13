import { z } from "zod";

export const pressReleaseSchema = z
  .object({
    title: z.string().trim().min(1).max(240),
    body: z.string().trim().min(1).max(30000),
    date: z.iso.date(),
  })
  .strict();

export type PressRelease = z.infer<typeof pressReleaseSchema> & { id: string; mailId?: string };
export type PressArticle = { id: string; releaseId?: string; [key: string]: unknown };

// [SPEC-PRESS-03] Plain-text editorial copy becomes safe email HTML.
export function pressBodyToHtml(body: string): string {
  const escaped = body.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] || character,
  );
  return escaped
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// [SPEC-PRESS-01] A press link appears only beside its explicitly linked release.
export function groupPressReleases<T extends PressArticle>(
  releases: PressRelease[],
  articles: T[],
) {
  return [...releases]
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id))
    .map((release) => ({
      release,
      articles: articles.filter((article) => article.releaseId === release.id),
    }));
}

export function getUnlinkedPressArticles<T extends PressArticle>(
  releases: PressRelease[],
  articles: T[],
  allReleasesLoaded = true,
): T[] {
  const releaseIds = new Set(releases.map((release) => release.id));
  return articles.filter(
    (article) => !article.releaseId || (allReleasesLoaded && !releaseIds.has(article.releaseId)),
  );
}
