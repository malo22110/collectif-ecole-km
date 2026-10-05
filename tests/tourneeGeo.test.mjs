import assert from "node:assert/strict";
import test from "node:test";
import { buildTourRouteSegments } from "../lib/tourneeGeo.ts";

// [SPEC-TOURNEE-05] Segment tours without losing order or repeating/omitting stops.
test("découpe une tournée longue en tronçons courts compatibles mobile", () => {
  const stops = Array.from({ length: 19 }, (_, index) => ({
    id: `stop-${index + 1}`,
    lat: 48 + index / 100,
    lon: -3 - index / 100,
  }));
  const origin = { lat: 47.9, lon: -3.1 };
  const segments = buildTourRouteSegments(origin, stops);

  assert.equal(segments.length, 5);
  assert.deepEqual(segments[0].origin, origin);
  assert.equal(segments[0].destination.id, "stop-4");
  assert.equal(segments[0].waypoints.length, 3);
  assert.deepEqual(segments[1].origin, {
    lat: stops[3].lat,
    lon: stops[3].lon,
  });
  assert.equal(segments[1].destination.id, "stop-8");
  assert.equal(segments[4].destination.id, "stop-19");
  assert.ok(segments.every((segment) => segment.waypoints.length <= 3));
  assert.equal(
    segments.flatMap((segment) => [...segment.waypoints, segment.destination]).length,
    stops.length,
  );
});

// [SPEC-TOURNEE-05] Empty tours return no routes and segment sizes stay within mobile limits.
test("gère une tournée vide et refuse une taille de tronçon incompatible", () => {
  assert.deepEqual(buildTourRouteSegments({ lat: 48, lon: -3 }, []), []);
  assert.throws(() => buildTourRouteSegments({ lat: 48, lon: -3 }, [], 5), RangeError);
});
