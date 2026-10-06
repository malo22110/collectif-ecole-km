import { FieldValue } from "firebase-admin/firestore";
import { managedTourPlaceSchema } from "@/lib/managedTourPlace";
import { campaignIdSchema } from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  errorResponse,
  readJsonBody,
  tractationDb,
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ placeId: string }> };

// [SPEC-TRACTATION-14] Source fields are authoritative for maps and campaign sector lists.
export async function PUT(request: Request, context: Context) {
  const authorization = await authorizeTractationMember(request, true);
  if (!authorization.member) return authorization.response;
  const { placeId } = await context.params;
  if (!campaignIdSchema.safeParse(placeId).success) {
    return Response.json({ error: "Identifiant de lieu invalide." }, { status: 400 });
  }
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
    const reference = tractationDb.collection("lieuxDits").doc(placeId);
    const snapshot = await reference.get();
    if (!snapshot.exists) return Response.json({ error: "Lieu-dit introuvable." }, { status: 404 });
    await reference.update({
      ...parsed.data,
      geocodeStatus: parsed.data.lat === null ? "unlocated" : "located",
      householdStatus: parsed.data.foyers === 0 ? "zero" : "positive",
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Response.json(
      { place: { id: placeId, ...parsed.data } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error, "Impossible de modifier le lieu-dit.");
  }
}

export async function DELETE(request: Request, context: Context) {
  const authorization = await authorizeTractationMember(request, true);
  if (!authorization.member) return authorization.response;
  const { placeId } = await context.params;
  if (!campaignIdSchema.safeParse(placeId).success) {
    return Response.json({ error: "Identifiant de lieu invalide." }, { status: 400 });
  }
  try {
    const reference = tractationDb.collection("lieuxDits").doc(placeId);
    const result = await tractationDb.runTransaction(async (transaction) => {
      const [place, campaigns] = await Promise.all([
        transaction.get(reference),
        transaction.get(
          tractationDb.collection("tractationCampaigns").select("lieuDits").limit(501),
        ),
      ]);
      if (!place.exists) return "missing";
      if (campaigns.size > 500) return "limit";
      const referenced = campaigns.docs.some((campaign) => {
        const places = campaign.get("lieuDits");
        return (
          Array.isArray(places) &&
          places.some(
            (item: unknown) =>
              item !== null && typeof item === "object" && "id" in item && item.id === placeId,
          )
        );
      });
      if (referenced) return "used";
      transaction.delete(reference);
      return "deleted";
    });
    if (result !== "deleted") {
      const messages = {
        missing: ["Lieu-dit introuvable.", 404],
        limit: ["Trop de campagnes pour vérifier la suppression.", 503],
        used: ["Ce lieu est utilisé par une campagne et ne peut pas être supprimé.", 409],
      } as const;
      const [error, status] = messages[result];
      return Response.json({ error }, { status });
    }
    return Response.json({ deleted: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error, "Impossible de supprimer le lieu-dit.");
  }
}
