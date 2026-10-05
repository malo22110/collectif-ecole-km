import { z } from "zod";

const extractedRowsSchema = z.object({
  entries: z
    .array(
      z.object({
        fullName: z.string().max(160),
        town: z.string().max(120),
        relationship: z.string().max(160),
        confidence: z.number().int().min(0).max(100),
      }),
    )
    .max(60),
});

function normalizeTown(value: string): string {
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return normalized === "km" || normalized === "k m" || normalized === "kergrist moelou"
    ? "Kergrist-Moëlou"
    : value.trim();
}

// [SPEC-PET-SCAN-03] Les réponses IA sont validées et limitées avant d'être proposées à un membre.
export function parseGeminiPetitionResponse(responseText: string) {
  const parsed = extractedRowsSchema.safeParse(JSON.parse(responseText));
  if (!parsed.success) throw new Error("Gemini a renvoyé un format de lignes invalide.");

  return parsed.data.entries
    .map((row) => ({
      fullName: row.fullName.trim(),
      ville: normalizeTown(row.town),
      qualite: row.relationship.trim(),
      confidence: row.confidence,
      method: "gemini" as const,
    }))
    .filter((row) => row.fullName.length >= 2);
}
