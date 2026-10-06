import { distanceKm, type GeoPoint } from "./tourneeGeo.ts";

type CampaignAssignment = { status: "claimed" | "completed" };

// [SPEC-TRACTATION-12] A new selection shows the campaign; preview and active routes show only their stops.
export function visibleCampaignPlaceIds(campaign: {
  placeIds: string[];
  routePlaceIds: string[];
  previewPlaceIds: string[] | null;
  runningRoute: boolean;
}): string[] {
  if (campaign.previewPlaceIds !== null) return campaign.previewPlaceIds;
  return campaign.runningRoute ? campaign.routePlaceIds : campaign.placeIds;
}

export function sortCampaignPlaces<
  T extends { id: string; lat: number | null; lon: number | null },
>(
  places: T[],
  assignments: Record<string, CampaignAssignment | undefined>,
  origin: GeoPoint | null,
): T[] {
  return places
    .map((place, index) => ({ place, index }))
    .sort((first, second) => {
      const firstAssignment = assignments[first.place.id];
      const secondAssignment = assignments[second.place.id];
      const firstGroup = firstAssignment?.status === "completed" ? 2 : firstAssignment ? 1 : 0;
      const secondGroup = secondAssignment?.status === "completed" ? 2 : secondAssignment ? 1 : 0;
      if (firstGroup !== secondGroup) return firstGroup - secondGroup;

      if (firstGroup === 0 && origin) {
        const firstDistance =
          first.place.lat !== null && first.place.lon !== null
            ? distanceKm(origin, { lat: first.place.lat, lon: first.place.lon })
            : Number.POSITIVE_INFINITY;
        const secondDistance =
          second.place.lat !== null && second.place.lon !== null
            ? distanceKm(origin, { lat: second.place.lat, lon: second.place.lon })
            : Number.POSITIVE_INFINITY;
        if (firstDistance !== secondDistance) return firstDistance - secondDistance;
      }

      return first.index - second.index;
    })
    .map(({ place }) => place);
}
