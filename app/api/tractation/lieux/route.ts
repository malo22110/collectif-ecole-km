import { FieldValue } from "firebase-admin/firestore";
import { managedTourPlace, managedTourPlaceSchema } from "@/lib/managedTourPlace";
import {
  authorizeTractationMember,
  errorResponse,
  readJsonBody,
  tractationDb,
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-TRACTATION-14] Only campaign managers can list all places, including unlocated and zero-household ones.
export async function GET(request: Request) {
  const authorization = await authorizeTractationMember(request, true);
  if (!authorization.member) return authorization.response;

  try {
    const snapshot = await tractationDb.collection("lieuxDits").limit(301).get();
    if (snapshot.size > 300) {
      return Response.json({ error: "La liste dépasse 300 lieux-dits." }, { status: 503 });
    }
    const places = snapshot.docs
      .map(managedTourPlace)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    return Response.json({ places }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error, "Impossible de charger les lieux-dits.");
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeTractationMember(request, true);
  if (!authorization.member) return authorization.response;
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Format de requête invalide." }, { status: 415 });
  }
  try {
    const parsed = managedTourPlaceSchema.safeParse(await readJsonBody(request, 2048));
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Lieu-dit invalide." },
        { status: 400 },
      );
    }
    const places = tractationDb.collection("lieuxDits");
    const limit = await places.limit(301).get();
    if (limit.size >= 300) {
      return Response.json({ error: "La limite de 300 lieux-dits est atteinte." }, { status: 409 });
    }
    const reference = places.doc();
    await reference.create({
      ...parsed.data,
      geocodeStatus: parsed.data.lat === null ? "unlocated" : "located",
      householdStatus: parsed.data.foyers === 0 ? "zero" : "positive",
      source: "manual",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Response.json(
      { place: { id: reference.id, ...parsed.data } },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error, "Impossible d'ajouter le lieu-dit.");
  }
}
