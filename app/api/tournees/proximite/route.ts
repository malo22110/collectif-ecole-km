import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebaseAdmin";
import { nearestLocatedPlaces, type TourLieuDit } from "@/lib/tourneeGeo";
import { verifyValidatedMember } from "@/lib/validatedMemberAccess";
import { hasEligibleHouseholds } from "@/lib/tractationValidation";

export const dynamic = "force-dynamic";

const requestSchema = z
  .object({ address: z.string().trim().min(5).max(180) })
  .strict();
const banResponseSchema = z.object({
  features: z.array(
    z.object({
      properties: z.object({
        citycode: z.string(),
        postcode: z.string(),
        score: z.number(),
        label: z.string(),
      }),
      geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
    }),
  ),
});

export async function POST(request: Request) {
  // [SPEC-TOURNEE-03] Geocode only for this request; do not persist the member address.
  try {
    if (
      !request.headers
        .get("Content-Type")
        ?.toLowerCase()
        .includes("application/json")
    ) {
      return NextResponse.json(
        { error: "Format de requête invalide." },
        { status: 415 },
      );
    }
    if (Number(request.headers.get("Content-Length") || 0) > 4096) {
      return NextResponse.json(
        { error: "Adresse trop longue." },
        { status: 413 },
      );
    }

    const access = await verifyValidatedMember(request);
    if (!access.allowed)
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );

    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Saisissez une adresse valide de Kergrist-Moëlou." },
        { status: 400 },
      );
    }

    const url = new URL("https://api-adresse.data.gouv.fr/search/");
    url.search = new URLSearchParams({
      q: parsed.data.address,
      limit: "5",
    }).toString();
    const response = await fetch(url, {
      headers: { "User-Agent": "KergristMoelou-Collectif-Tournees/1.0" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Le service d'adresses est temporairement indisponible." },
        { status: 502 },
      );
    }

    const upstream: unknown = await response.json();
    const validated = banResponseSchema.safeParse(upstream);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Réponse invalide du service d'adresses." },
        { status: 502 },
      );
    }
    const candidate = validated.data.features
      .filter(
        (feature) =>
          feature.properties.score >= 0.35 &&
          Number.isFinite(feature.geometry.coordinates[0]) &&
          Number.isFinite(feature.geometry.coordinates[1]),
      )
      .sort(
        (first, second) => second.properties.score - first.properties.score,
      )[0];
    if (!candidate || candidate.properties.score < 0.35) {
      return NextResponse.json(
        {
          error:
            "Adresse non trouvée. Vérifiez l'adresse et précisez la commune si nécessaire.",
        },
        { status: 404 },
      );
    }

    const [lon, lat] = candidate.geometry.coordinates;
    const snapshot = await adminDb
      .collection("lieuxDits")
      .select("nom", "foyers", "lat", "lon")
      .limit(501)
      .get();
    if (snapshot.size > 500) {
      return NextResponse.json(
        { error: "La carte dépasse la limite de lieux autorisée." },
        { status: 503 },
      );
    }

    const places: TourLieuDit[] = snapshot.docs.flatMap((document) => {
      const data = document.data();
      const foyers =
        Number.isInteger(data.foyers) && data.foyers >= 0 ? data.foyers : 0;
      if (
        !Number.isFinite(data.lat) ||
        !Number.isFinite(data.lon) ||
        !hasEligibleHouseholds(foyers)
      )
        return [];
      return [
        {
          id: document.id,
          nom: String(data.nom || "Lieu sans nom"),
          foyers,
          lat: data.lat as number,
          lon: data.lon as number,
          geocodeStatus: "located",
          householdStatus: foyers === 0 ? "zero" : "positive",
        },
      ];
    });

    return NextResponse.json(
      {
        matchedAddress: candidate.properties.label,
        origin: { lat, lon },
        nearest: nearestLocatedPlaces({ lat, lon }, places, 3),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Erreur de recherche des lieux-dits proches:", error);
    return NextResponse.json(
      { error: "Impossible de calculer les lieux les plus proches." },
      { status: 500 },
    );
  }
}
