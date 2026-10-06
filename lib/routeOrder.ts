import { distanceKm, type GeoPoint } from "./tourneeGeo.ts";

// [SPEC-TRACTATION-11] Suggest a short route without changing the member's chosen stops.
export function suggestRouteOrder<T extends GeoPoint & { id: string }>(
  places: T[],
  origin: GeoPoint | null,
): string[] {
  const remaining = [...places];
  const ordered: T[] = [];
  const first = origin ? null : remaining.shift();
  if (first) ordered.push(first);
  let current: GeoPoint | null = origin ?? first ?? null;

  while (current && remaining.length) {
    let nearestIndex = 0;
    for (let index = 1; index < remaining.length; index++) {
      if (distanceKm(current, remaining[index]) < distanceKm(current, remaining[nearestIndex])) {
        nearestIndex = index;
      }
    }
    const [nearest] = remaining.splice(nearestIndex, 1);
    ordered.push(nearest);
    current = nearest;
  }

  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (let start = 0; start < ordered.length - 1; start++) {
      if (!origin && start === 0) continue;
      for (let end = start + 1; end < ordered.length; end++) {
        const before = start ? ordered[start - 1] : origin;
        if (!before) continue;
        const after = ordered[end + 1];
        const original =
          distanceKm(before, ordered[start]) + (after ? distanceKm(ordered[end], after) : 0);
        const reversed =
          distanceKm(before, ordered[end]) + (after ? distanceKm(ordered[start], after) : 0);
        if (reversed + 1e-9 < original) {
          const segment = ordered.slice(start, end + 1).reverse();
          ordered.splice(start, segment.length, ...segment);
          improved = true;
        }
      }
    }
    if (!improved) break;
  }

  return ordered.map((place) => place.id);
}
