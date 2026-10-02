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

export interface TourRouteSegment<T extends GeoPoint> {
  origin: GeoPoint;
  destination: T;
  waypoints: T[];
}

// [SPEC-TRACTATION-10] Routing chunks preserve the selected order and chain through each previous endpoint.
export function chunkOrderedRoutePoints<T extends GeoPoint>(origin: GeoPoint, stops: T[], maxCoordinates = 100): GeoPoint[][] {
  if (!Number.isInteger(maxCoordinates) || maxCoordinates < 2 || maxCoordinates > 100) {
    throw new RangeError("Une requête de routage doit contenir de 2 à 100 coordonnées.");
  }

  const chunks: GeoPoint[][] = [];
  let segmentOrigin: GeoPoint = origin;
  for (let offset = 0; offset < stops.length; offset += maxCoordinates - 1) {
    const segmentStops = stops.slice(offset, offset + maxCoordinates - 1);
    const points = [segmentOrigin, ...segmentStops];
    if (points.length > 1) chunks.push(points);
    segmentOrigin = points[points.length - 1];
  }
  return chunks;
}

// [SPEC-TOURNEE-05] Keep Google Maps links short enough for mobile by splitting long tours into ordered segments.
export function buildTourRouteSegments<T extends GeoPoint>(origin: GeoPoint, stops: T[], stopsPerSegment = 4): TourRouteSegment<T>[] {
  if (!Number.isInteger(stopsPerSegment) || stopsPerSegment < 1 || stopsPerSegment > 4) {
    throw new RangeError("Une étape d’itinéraire doit contenir entre 1 et 4 lieux.");
  }

  const segments: TourRouteSegment<T>[] = [];
  let segmentOrigin: GeoPoint = origin;
  for (let offset = 0; offset < stops.length; offset += stopsPerSegment) {
    const segmentStops = stops.slice(offset, offset + stopsPerSegment);
    const destination = segmentStops[segmentStops.length - 1];
    if (!destination) continue;
    segments.push({
      origin: segmentOrigin,
      destination,
      waypoints: segmentStops.slice(0, -1)
    });
    segmentOrigin = { lat: destination.lat, lon: destination.lon };
  }
  return segments;
}
