import { FieldValue } from "firebase-admin/firestore";
import { campaignIdSchema, visitInputSchema } from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  errorResponse,
  readJsonBody,
  tractationDb,
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class VisitRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// [SPEC-TRACTATION-01] A member can validate only their own visit, after joining an active campaign.
export async function PUT(
  request: Request,
  context: { params: Promise<{ campaignId: string; placeId: string }> },
) {
  const authorization = await authorizeTractationMember(request);
  if (!authorization.member) return authorization.response;

  const { campaignId, placeId } = await context.params;
  if (
    !campaignIdSchema.safeParse(campaignId).success ||
    !campaignIdSchema.safeParse(placeId).success
  ) {
    return Response.json(
      { error: "Identifiant de campagne ou de lieu invalide." },
      { status: 400 },
    );
  }

  try {
    const parsed = visitInputSchema.safeParse(await readJsonBody(request));
    if (!parsed.success)
      return Response.json({ error: "État de passage invalide." }, { status: 400 });

    const campaignRef = tractationDb.collection("tractationCampaigns").doc(campaignId);
    const participantRef = campaignRef.collection("participants").doc(authorization.member.uid);
    const visitRef = participantRef.collection("visits").doc(placeId);

    await tractationDb.runTransaction(async (transaction) => {
      const campaign = await transaction.get(campaignRef);
      const participant = await transaction.get(participantRef);
      const visit = await transaction.get(visitRef);

      if (!campaign.exists) throw new VisitRequestError(404, "Campagne introuvable.");
      if (campaign.get("status") !== "active")
        throw new VisitRequestError(409, "Cette campagne n'est plus ouverte.");
      if (!participant.exists)
        throw new VisitRequestError(403, "Rejoignez la campagne avant de valider un passage.");

      const selectedPlaces = campaign.get("lieuDits");
      const place = Array.isArray(selectedPlaces)
        ? selectedPlaces.find((item) => item && typeof item === "object" && item.id === placeId)
        : undefined;
      if (!place) throw new VisitRequestError(404, "Ce lieu ne fait pas partie de la campagne.");

      if (parsed.data.visited) {
        if (!visit.exists) {
          transaction.create(visitRef, {
            uid: authorization.member.uid,
            lieuDitId: placeId,
            lieuDitName: String(place.nom || "Lieu-dit"),
            visitedAt: FieldValue.serverTimestamp(),
          });
        }
      } else if (visit.exists) {
        transaction.delete(visitRef);
      }
    });

    return Response.json({ visited: parsed.data.visited });
  } catch (error) {
    if (error instanceof VisitRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return errorResponse(error, "Impossible d'enregistrer ce passage.");
  }
}
