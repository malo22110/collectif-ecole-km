export interface PetitionStatsEntry {
  qualite?: string | null;
  ville?: string | null;
}

export interface PetitionStatsBreakdown {
  total: number;
  habitantsKergrist: number;
  parentsEleves: number;
  communesVoisines: number;
  autres: number;
  declaredParentOfPupilQuality: number;
  habitantsKergristPercent: number;
  parentsElevesPercent: number;
  communesVoisinesPercent: number;
  autresPercent: number;
  declaredParentOfPupilQualityPercent: number;
  parentSignersOfKnownParentsPercent: number;
  kergristElectorateEstimatePercent: number | null;
}

export const KERGRIST_VOTING_AGE_POPULATION_ESTIMATE = 539;
export const TOTAL_KNOWN_PARENTS = 47;

function percent(part: number, total: number, decimals = 1) {
  const factor = 10 ** decimals;
  return total === 0 ? 0 : Math.round((part / total) * 100 * factor) / factor;
}

function normalizeQuality(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isDeclaredParentOfPupil(quality: string) {
  const normalized = normalizeQuality(quality)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return /^parents? d eleves?(?: actuel(?:le)? ou futur(?:e)?)?$/.test(normalized);
}

// [SPEC-PET-STATS-01] Keep the public counters, admin export, and reviewer view on the same precedence rules.
export function calculatePetitionStats(entries: PetitionStatsEntry[]): PetitionStatsBreakdown {
  const breakdown: PetitionStatsBreakdown = {
    total: entries.length,
    habitantsKergrist: 0,
    parentsEleves: 0,
    communesVoisines: 0,
    autres: 0,
    declaredParentOfPupilQuality: 0,
    habitantsKergristPercent: 0,
    parentsElevesPercent: 0,
    communesVoisinesPercent: 0,
    autresPercent: 0,
    declaredParentOfPupilQualityPercent: 0,
    parentSignersOfKnownParentsPercent: 0,
    kergristElectorateEstimatePercent: null
  };

  for (const entry of entries) {
    const quality = normalizeQuality(String(entry.qualite || ""));
    const town = String(entry.ville || "").toLowerCase();
    const declaresParentOfPupil = isDeclaredParentOfPupil(quality);
    if (declaresParentOfPupil) breakdown.declaredParentOfPupilQuality++;
    if (quality.includes("habitant(e) de kergrist") || town.includes("kergrist")) {
      breakdown.habitantsKergrist++;
    } else if (declaresParentOfPupil) {
      breakdown.parentsEleves++;
    } else if (quality.includes("voisine") || (town.length > 0 && !town.includes("kergrist"))) {
      breakdown.communesVoisines++;
    } else {
      breakdown.autres++;
    }
  }

  breakdown.habitantsKergristPercent = percent(breakdown.habitantsKergrist, breakdown.total);
  breakdown.parentsElevesPercent = percent(breakdown.parentsEleves, breakdown.total);
  breakdown.communesVoisinesPercent = percent(breakdown.communesVoisines, breakdown.total);
  breakdown.autresPercent = percent(breakdown.autres, breakdown.total);
  breakdown.declaredParentOfPupilQualityPercent = percent(breakdown.declaredParentOfPupilQuality, breakdown.total);
  breakdown.parentSignersOfKnownParentsPercent = percent(breakdown.declaredParentOfPupilQuality, TOTAL_KNOWN_PARENTS, 2);
  breakdown.kergristElectorateEstimatePercent = breakdown.total > 0
    ? percent(breakdown.habitantsKergrist, KERGRIST_VOTING_AGE_POPULATION_ESTIMATE, 2)
    : null;

  return breakdown;
}