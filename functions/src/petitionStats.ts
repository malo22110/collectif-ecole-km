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
  declaredParentQuality: number;
  habitantsKergristPercent: number;
  parentsElevesPercent: number;
  communesVoisinesPercent: number;
  autresPercent: number;
  declaredParentQualityPercent: number;
  kergristElectorateEstimatePercent: number | null;
}

export const KERGRIST_VOTING_AGE_POPULATION_ESTIMATE = 539;

function percent(part: number, total: number, decimals = 1) {
  const factor = 10 ** decimals;
  return total === 0 ? 0 : Math.round((part / total) * 100 * factor) / factor;
}

// [SPEC-PET-STATS-01] Keep the public counters, admin export, and reviewer view on the same precedence rules.
export function calculatePetitionStats(entries: PetitionStatsEntry[]): PetitionStatsBreakdown {
  const breakdown: PetitionStatsBreakdown = {
    total: entries.length,
    habitantsKergrist: 0,
    parentsEleves: 0,
    communesVoisines: 0,
    autres: 0,
    declaredParentQuality: 0,
    habitantsKergristPercent: 0,
    parentsElevesPercent: 0,
    communesVoisinesPercent: 0,
    autresPercent: 0,
    declaredParentQualityPercent: 0,
    kergristElectorateEstimatePercent: null
  };

  for (const entry of entries) {
    const quality = String(entry.qualite || "").toLowerCase();
    const town = String(entry.ville || "").toLowerCase();
    if (quality.includes("parent")) breakdown.declaredParentQuality++;
    if (quality.includes("habitant(e) de kergrist") || town.includes("kergrist")) {
      breakdown.habitantsKergrist++;
    } else if (quality.includes("parent")) {
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
  breakdown.declaredParentQualityPercent = percent(breakdown.declaredParentQuality, breakdown.total);
  breakdown.kergristElectorateEstimatePercent = breakdown.total > 0
    ? percent(breakdown.habitantsKergrist, KERGRIST_VOTING_AGE_POPULATION_ESTIMATE, 2)
    : null;

  return breakdown;
}