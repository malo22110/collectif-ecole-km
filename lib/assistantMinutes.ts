const MAX_QUERY_LENGTH = 180;
const MAX_RESULTS = 4;
const MAX_EXCERPTS_PER_DOCUMENT = 4;
const MAX_EXCERPT_CHARS = 1100;
const MAX_TOTAL_CHARS = 9000;
const STOP_WORDS = new Set([
  "avec", "dans", "depuis", "des", "elle", "elles", "est", "et", "etre", "fait", "il", "ils", "la", "le", "les", "leur", "leurs", "mais", "nos", "notre", "ou", "par", "pas", "pour", "que", "qui", "quoi", "sa", "ses", "son", "sur", "une", "un", "vos", "votre"
]);

export interface CouncilMinutesSearchResult {
  source: "public/context.txt";
  query: string;
  totalMatchingDocuments: number;
  documents: Array<{
    title: string;
    score: number;
    excerpts: Array<{ line: number; text: string }>;
  }>;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function queryTerms(query: string) {
  return Array.from(new Set(normalize(query).match(/[a-z0-9]+/g) || []))
    .filter(term => term.length > 1 && !STOP_WORDS.has(term))
    .slice(0, 16);
}

function extractDocuments(source: string) {
  const documents: Array<{ title: string; content: string }> = [];
  const starts: Array<{ index: number; end: number; title: string }> = [];
  const startPattern = /^--- DEBUT DU DOCUMENT : (.+?) ---\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = startPattern.exec(source)) !== null) {
    starts.push({ index: match.index, end: match.index + match[0].length, title: match[1] });
  }
  for (let index = 0; index < starts.length; index++) {
    const start = starts[index];
    const startIndex = start.end;
    const endIndex = starts[index + 1]?.index ?? source.length;
    const segment = source.slice(startIndex, endIndex);
    const endMarker = segment.search(/^--- FIN DU DOCUMENT : .*? ---\s*$/m);
    const content = (endMarker >= 0 ? segment.slice(0, endMarker) : segment).trim();
    const title = (start.title || "Procès-verbal municipal").replace(/\s+/g, " ").trim();
    if (content) documents.push({ title, content });
  }
  return documents;
}

function scoreLine(line: string, terms: string[]) {
  const normalized = normalize(line);
  return terms.reduce((score, term) => score + (new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(normalized) ? 1 : 0), 0);
}

function redactContactDetails(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[adresse e-mail masquée]")
    .replace(/(?:https?:\/\/|www\.)\S+/gi, "[lien retiré]")
    .replace(/(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}\b/g, "[numéro de téléphone masqué]")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
}

function excerptsForDocument(content: string, terms: string[]) {
  const lines = content.split(/\r?\n/);
  const matches = lines.flatMap((line, index) => {
    const score = scoreLine(line, terms);
    return score ? [{ index, score }] : [];
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = new Set<number>();
  for (const match of matches) {
    for (let index = Math.max(0, match.index - 1); index <= Math.min(lines.length - 1, match.index + 1); index++) selected.add(index);
    if (selected.size >= 18) break;
  }

  const indices = Array.from(selected).sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const index of indices) {
    const previous = groups[groups.length - 1];
    if (previous && index <= previous[previous.length - 1] + 1) previous.push(index);
    else groups.push([index]);
  }

  const excerpts = groups.slice(0, MAX_EXCERPTS_PER_DOCUMENT).map(group => {
    const first = group[0];
    const last = group[group.length - 1];
    const text = group.map(index => lines[index]).join(" ").replace(/\s+/g, " ").trim();
    return { line: first + 1, text: redactContactDetails(text).slice(0, MAX_EXCERPT_CHARS), lastLine: last + 1 };
  }).filter(excerpt => excerpt.text);

  return { score: matches.reduce((sum, match) => sum + match.score, 0), excerpts };
}

// [SPEC-ASSISTANT-CMS-03] Search council minutes on demand and return only bounded relevant excerpts with their document source.
export function searchCouncilMinutes(source: string, query: string): CouncilMinutesSearchResult {
  const normalizedQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
  const terms = queryTerms(normalizedQuery);
  if (terms.length === 0) return { source: "public/context.txt", query: normalizedQuery, totalMatchingDocuments: 0, documents: [] };

  const ranked = extractDocuments(source).map(document => {
    const result = excerptsForDocument(document.content, terms);
    return { title: document.title, ...result };
  }).filter(document => document.score > 0)
    .sort((first, second) => second.score - first.score || first.title.localeCompare(second.title, "fr"));

  let remaining = MAX_TOTAL_CHARS;
  const documents = ranked.slice(0, MAX_RESULTS).flatMap(document => {
    const excerpts = document.excerpts.flatMap(excerpt => {
      const boundedText = excerpt.text.slice(0, Math.max(0, Math.min(MAX_EXCERPT_CHARS, remaining)));
      if (!boundedText) return [];
      remaining -= boundedText.length;
      return [{ line: excerpt.line, text: boundedText }];
    });
    if (!excerpts.length || remaining <= 0) return [];
    remaining -= document.title.length;
    return [{ title: document.title, score: document.score, excerpts }];
  });

  return {
    source: "public/context.txt",
    query: normalizedQuery,
    totalMatchingDocuments: ranked.length,
    documents
  };
}
