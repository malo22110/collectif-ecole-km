const MAX_FIELD_CHARS = 12_000;
const MAX_STRUCTURED_CHARS = 30_000;
const OMITTED_KEYS = new Set([
  "id",
  "uid",
  "authoremail",
  "email",
  "url",
  "imageurl",
  "storagepath",
  "attachment",
  "attachments",
  "token",
  "secret",
  "password",
  "photourl",
]);

function isOmittedKey(key: string) {
  return OMITTED_KEYS.has(key.replace(/[^a-z0-9]/gi, "").toLowerCase());
}

function cleanCmsText(value: string) {
  return value
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPublishedArticleText(value: unknown, maxChars = 3500) {
  if (!value || typeof value !== "object") return "";
  const article = value as Record<string, unknown>;
  const fields = [
    ["Titre", article.title],
    ["Résumé", article.excerpt],
    ["Contenu", article.content],
  ] as const;
  return fields
    .flatMap(([label, field]) => {
      if (typeof field !== "string") return [];
      const text = cleanCmsText(field).slice(0, MAX_FIELD_CHARS);
      return text ? [`${label}: ${text}`] : [];
    })
    .join("\n")
    .slice(0, maxChars);
}

function sanitizeStructuredValue(
  value: unknown,
  budget: { remaining: number },
  depth: number,
): unknown {
  if (budget.remaining <= 0 || depth > 12 || value == null) return undefined;
  if (typeof value === "string") {
    const text = value.slice(0, Math.min(MAX_FIELD_CHARS, budget.remaining));
    budget.remaining -= text.length;
    return text;
  }
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const result: unknown[] = [];
    for (const item of value.slice(0, 100)) {
      const safeItem = sanitizeStructuredValue(item, budget, depth + 1);
      if (safeItem !== undefined) result.push(safeItem);
      if (budget.remaining <= 0) break;
    }
    return result;
  }
  if (typeof value === "object") {
    const timestamp = value as { toDate?: () => Date };
    if (typeof timestamp.toDate === "function") {
      const date = timestamp.toDate();
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    }
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (isOmittedKey(key)) continue;
      const safeChild = sanitizeStructuredValue(child, budget, depth + 1);
      if (safeChild !== undefined) result[key] = safeChild;
      if (budget.remaining <= 0) break;
    }
    return result;
  }
  return undefined;
}

// [SPEC-ASSISTANT-CMS-02] Return bounded structured CMS fields to function tools without scraping rendered HTML.
export function sanitizeStructuredCmsData(
  value: unknown,
  maxChars = MAX_STRUCTURED_CHARS,
) {
  const budget = {
    remaining: Math.max(0, Math.min(maxChars, MAX_STRUCTURED_CHARS)),
  };
  return sanitizeStructuredValue(value, budget, 0);
}

export function pickCmsBlocks(
  value: unknown,
  allowedTypes: string[],
  maxChars = MAX_STRUCTURED_CHARS,
) {
  if (!value || typeof value !== "object")
    return { header: null, version: null, blocks: [] };
  const page = value as Record<string, unknown>;
  const blocks = Array.isArray(page.blocks) ? page.blocks : [];
  const selected = blocks.flatMap((block) => {
    if (!block || typeof block !== "object") return [];
    const candidate = block as Record<string, unknown>;
    if (
      typeof candidate.type !== "string" ||
      !allowedTypes.includes(candidate.type)
    )
      return [];
    return [{ type: candidate.type, data: candidate.data }];
  });
  return sanitizeStructuredCmsData(
    { header: page.header, version: page.version, blocks: selected },
    maxChars,
  );
}
