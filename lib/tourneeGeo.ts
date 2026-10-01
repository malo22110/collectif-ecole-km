export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface TourLieuDit extends GeoPoint {
  id: string;
  nom: string;
  foyers: number;
  geocodeStatus: "located" | "unlocated";
  householdStatus: "positive" | "zero";
}

export function distanceKm(first: GeoPoint, second: GeoPoint): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371.0088;
  const deltaLat = radians(second.lat - first.lat);
  const deltaLon = radians(second.lon - first.lon);
  const firstLat = radians(first.lat);
  const secondLat = radians(second.lat);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function nearestLocatedPlaces<T extends TourLieuDit>(origin: GeoPoint, places: T[], limit = 3) {
  return places
    .filter(place => Number.isFinite(place.lat) && Number.isFinite(place.lon))
    .map(place => ({ ...place, distanceKm: distanceKm(origin, place) }))
    .sort((first, second) => first.distanceKm - second.distanceKm)
    .slice(0, limit);
}
