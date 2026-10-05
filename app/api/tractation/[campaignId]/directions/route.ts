import { z } from "zod";
import { chunkOrderedRoutePoints, type GeoPoint } from "@/lib/tourneeGeo";
import {
  campaignIdSchema,
  hasEligibleHouseholds,
} from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  errorResponse,
  readJsonBody,
  tractationDb,
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const originSchema = z
  .object({
    origin: z
      .object({
        lat: z.number().finite().min(-90).max(90),
        lon: z.number().finite().min(-180).max(180),
      })
      .strict(),
  })
  .strict();

const routingResponseSchema = z.object({
  code: z.string(),
  routes: z
    .array(
      z.object({
        distance: z.number().finite().nonnegative(),
        duration: z.number().finite().nonnegative(),
        geometry: z.object({
          coordinates: z
            .array(z.tuple([z.number().finite(), z.number().finite()]))
            .min(2)
            .max(20000),
        }),
      }),
    )
    .min(1),
});

class DirectionsError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const MAX_STOPS = 200;
const ROUTING_MAX_COORDINATES = 100;
const MAX_ROUTING_RESPONSE_BYTES = 2 * 1024 * 1024;

async function readLimitedJson(
  response: Response,
  maxBytes: number,
): Promise<unknown> {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes || !response.body)
    throw new DirectionsError(
      502,
      "La réponse du service routier dépasse la taille autorisée.",
    );
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new DirectionsError(
        502,
        "La réponse du service routier dépasse la taille autorisée.",
      );
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new DirectionsError(
      502,
      "Le service routier a renvoyé une réponse invalide.",
    );
  }
}

// [SPEC-TRACTATION-10] Route only the authenticated participant's persisted ordered campaign stops.
export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const authorization = await authorizeTractationMember(request);
  if (!authorization.member) return authorization.response;
  const { campaignId } = await context.params;
  if (!campaignIdSchema.safeParse(campaignId).success)
    return Response.json(
      { error: "Identifiant de campagne invalide." },
      { status: 400 },
    );
  if (
    !request.headers
      .get("Content-Type")
      ?.toLowerCase()
      .includes("application/json")
  )
    return Response.json(
      { error: "Format de requête invalide." },
      { status: 415 },
    );

  try {
    const input = originSchema.safeParse(await readJsonBody(request, 2048));
    if (!input.success)
      return Response.json(
        { error: "Position de départ invalide." },
        { status: 400 },
      );

    const campaignRef = tractationDb
      .collection("tractationCampaigns")
      .doc(campaignId);
    const participantRef = campaignRef
      .collection("participants")
      .doc(authorization.member.uid);
    const [campaignSnapshot, participantSnapshot] = await Promise.all([
      campaignRef.get(),
      participantRef.get(),
    ]);
    if (!campaignSnapshot.exists || campaignSnapshot.get("status") !== "active")
      throw new DirectionsError(404, "Campagne introuvable ou terminée.");
    if (!participantSnapshot.exists)
      throw new DirectionsError(
        403,
        "Rejoignez cette campagne pour calculer votre tournée.",
      );

    const routePlaceIds = participantSnapshot.get("routePlaceIds");
    if (
      !Array.isArray(routePlaceIds) ||
      routePlaceIds.length < 1 ||
      routePlaceIds.length > MAX_STOPS ||
      routePlaceIds.some((id: unknown) => typeof id !== "string") ||
      new Set(routePlaceIds).size !== routePlaceIds.length
    ) {
      throw new DirectionsError(409, "Aucune tournée valide à calculer.");
    }

    const campaignPlaces = campaignSnapshot.get("lieuDits");
    const campaignPlaceById = new Map(
      Array.isArray(campaignPlaces)
        ? campaignPlaces
            .filter((place) => place && typeof place === "object")
            .map((place: Record<string, unknown>) => [place.id, place])
        : [],
    );
    const assignmentRefs = routePlaceIds.map((id: string) =>
      campaignRef.collection("placeAssignments").doc(id),
    );
    const sourceRefs = routePlaceIds.map((id: string) =>
      tractationDb.collection("lieuxDits").doc(id),
    );
    const [assignments, sourcePlaces] = await Promise.all([
      Promise.all(assignmentRefs.map((reference) => reference.get())),
      Promise.all(sourceRefs.map((reference) => reference.get())),
    ]);

    const stops: Array<GeoPoint & { id: string }> = [];
    for (let index = 0; index < routePlaceIds.length; index++) {
      const placeId = routePlaceIds[index] as string;
      const campaignPlace = campaignPlaceById.get(placeId);
      const assignment = assignments[index];
      const sourcePlace = sourcePlaces[index];
      const sourceData = sourcePlace.data();
      if (
        !campaignPlace ||
        !assignment.exists ||
        assignment.get("claimedByUid") !== authorization.member.uid ||
        !["claimed", "completed"].includes(String(assignment.get("status"))) ||
        !sourcePlace.exists ||
        !hasEligibleHouseholds(sourceData?.foyers) ||
        !Number.isFinite(sourceData?.lat) ||
        !Number.isFinite(sourceData?.lon)
      ) {
        throw new DirectionsError(
          409,
          "Un secteur de votre tournée n’est plus disponible pour le calcul routier.",
        );
      }
      stops.push({
        id: placeId,
        lat: sourceData!.lat as number,
        lon: sourceData!.lon as number,
      });
    }

    const chunks = chunkOrderedRoutePoints(
      input.data.origin,
      stops,
      ROUTING_MAX_COORDINATES,
    );
    let baseUrl: URL;
    try {
      baseUrl = new URL(
        process.env.OSRM_BASE_URL || "https://router.project-osrm.org",
      );
      if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password)
        throw new Error("Invalid routing URL");
      baseUrl.pathname = baseUrl.pathname.replace(/\/+$/, "");
    } catch {
      throw new DirectionsError(
        500,
        "Le service de calcul routier n'est pas configuré correctement.",
      );
    }
    let distanceMeters = 0;
    let durationSeconds = 0;
    const geometry: Array<[number, number]> = [];

    for (const chunk of chunks) {
      const coordinates = chunk
        .map((point) => `${point.lon},${point.lat}`)
        .join(";");
      const url = `${baseUrl.toString().replace(/\/$/, "")}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;
      let upstreamResponse: Response;
      try {
        upstreamResponse = await fetch(url, {
          headers: { "User-Agent": "KergristMoelou-Collectif-Tournees/1.0" },
          signal: AbortSignal.timeout(15000),
          cache: "no-store",
        });
      } catch {
        throw new DirectionsError(
          504,
          "Le calcul routier a dépassé le délai. Réessayez dans un instant.",
        );
      }
      if (!upstreamResponse.ok)
        throw new DirectionsError(
          502,
          "Le service de calcul routier est temporairement indisponible.",
        );
      const result = routingResponseSchema.safeParse(
        await readLimitedJson(upstreamResponse, MAX_ROUTING_RESPONSE_BYTES),
      );
      if (!result.success || result.data.code !== "Ok")
        throw new DirectionsError(
          502,
          "Aucun itinéraire routier n’a pu être calculé pour cette tournée.",
        );
      const route = result.data.routes[0];
      if (!route)
        throw new DirectionsError(
          502,
          "Le service routier n’a pas retourné d’itinéraire.",
        );
      distanceMeters += route.distance;
      durationSeconds += route.duration;
      const chunkGeometry = route.geometry.coordinates.map(
        ([lon, lat]) => [lat, lon] as [number, number],
      );
      geometry.push(
        ...(geometry.length ? chunkGeometry.slice(1) : chunkGeometry),
      );
    }

    return Response.json(
      {
        campaignId,
        stopIds: routePlaceIds,
        geometry,
        distanceMeters: Math.round(distanceMeters),
        durationSeconds: Math.round(durationSeconds),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof DirectionsError)
      return Response.json({ error: error.message }, { status: error.status });
    return errorResponse(error, "Impossible de calculer l’itinéraire routier.");
  }
}
