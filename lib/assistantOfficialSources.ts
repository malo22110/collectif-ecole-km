import { load } from "cheerio";

const ORIGIN = "https://www.collectivites-locales.gouv.fr";
const MAX_HTML_BYTES = 600_000;
const MAX_RESULTS = 3;
const TIMEOUT_MS = 6000;

function officialUrl(pathname: string) {
  const url = new URL(pathname, ORIGIN);
  if (
    url.origin !== ORIGIN ||
    (!url.pathname.startsWith("/gerer-les-finances-publiques-locales/") &&
      !url.pathname.startsWith("/animer-les-territoires/") &&
      !url.pathname.startsWith("/connaitre-les-acteurs-et-les-institutions/"))
  )
    return null;
  if (url.pathname.includes("/files/") || url.search || url.hash) return null;
  return url.toString();
}

async function readOfficialHtml(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "text/html" },
  });
  if (
    response.status !== 200 ||
    !response.headers.get("content-type")?.toLowerCase().includes("text/html")
  )
    throw new Error("Source institutionnelle inaccessible.");
  if (Number(response.headers.get("content-length") || 0) > MAX_HTML_BYTES)
    throw new Error("Page institutionnelle trop volumineuse.");
  if (!response.body) throw new Error("Page institutionnelle vide.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_HTML_BYTES)
        throw new Error("Page institutionnelle trop volumineuse.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(
    chunks.map((chunk) => Buffer.from(chunk)),
    size,
  ).toString("utf8");
}

// [SPEC-ASSISTANT-LEGAL-01] Only live official government pages actually fetched may be cited; no claims of legal validity follow from site search alone.
export async function searchOfficialSources(
  query: string,
  fetcher: typeof fetch = fetch,
) {
  const searchUrl = `${ORIGIN}/recherche?search_api_fulltext=${encodeURIComponent(query)}`;
  const $ = load(await readOfficialHtml(searchUrl, fetcher));
  const candidates = $("main .view-content .views-row .fr-card__title a")
    .toArray()
    .map((element) => {
      const link = $(element);
      const url = officialUrl(link.attr("href") || "");
      return url
        ? { title: link.text().replace(/\s+/g, " ").trim().slice(0, 180), url }
        : null;
    })
    .filter((result): result is { title: string; url: string } =>
      Boolean(result?.title),
    )
    .slice(0, MAX_RESULTS);

  const sources = [];
  for (const candidate of candidates) {
    try {
      const page = load(await readOfficialHtml(candidate.url, fetcher));
      page("script, style, nav, footer, header, form, aside").remove();
      const content = page(
        "main article, main .field--name-body, main .fr-container .fr-col",
      ).first();
      const text = (content.length ? content : page("main"))
        .text()
        .replace(/\s+/g, " ")
        .trim();
      if (!text || !page("main h1").length) continue;
      sources.push({
        title:
          page("main h1")
            .first()
            .text()
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 180) || candidate.title,
        url: candidate.url,
        excerpt: text.slice(0, 2400),
      });
    } catch {
      continue;
    }
  }

  return {
    query,
    consultedAt: new Date().toISOString(),
    searchUrl,
    sources,
    warning:
      "Ces fiches institutionnelles ne remplacent pas la vérification sur Légifrance de l'article de loi en vigueur ni le règlement annuel exact d'une subvention.",
  };
}
