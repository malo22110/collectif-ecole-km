import { FieldValue } from "firebase-admin/firestore";
import { campaignIdSchema, campaignRouteInputSchema } from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  errorResponse,
  readJsonBody,
  tractationDb
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class CampaignRouteError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

// [SPEC-TRACTATION-05] Claim all route places atomically so no campaign member gets a partial tour.
export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> }
) {
  const authorization = await authorizeTractationMember(request);
  if (!authorization.member) return authorization.response;

  const { campaignId } = await context.params;
  if (!campaignIdSchema.safeParse(campaignId).success) {
    return Response.json({ error: "Identifiant de campagne invalide." }, { status: 400 });
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Format de requête invalide." }, { status: 415 });
  }

  try {
    const parsed = campaignRouteInputSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return Response.json({ error: "Choisissez au moins un lieu, sans répétition." }, { status: 400 });

    const campaignRef = tractationDb.collection("tractationCampaigns").doc(campaignId);
    const participantRef = campaignRef.collection("participants").doc(authorization.member.uid);
    const assignmentRefs = parsed.data.lieuDitIds.map(id => campaignRef.collection("placeAssignments").doc(id));

    await tractationDb.runTransaction(async transaction => {
      const campaign = await transaction.get(campaignRef);
      const participant = await transaction.get(participantRef);
      const assignments = await Promise.all(assignmentRefs.map(reference => transaction.get(reference)));

      if (!campaign.exists) throw new CampaignRouteError(404, "Campagne introuvable.");
      if (campaign.get("status") !== "active") throw new CampaignRouteError(409, "Cette campagne n'est plus ouverte.");
      if (!participant.exists) throw new CampaignRouteError(403, "Rejoignez la campagne avant de prendre une tournée.");

      const selectedPlaces = campaign.get("lieuDits");
      const placeById = new Map(Array.isArray(selectedPlaces)
        ? selectedPlaces.filter(place => place && typeof place === "object").map(place => [place.id, place])
        : []);
      if (parsed.data.lieuDitIds.some(id => !placeById.has(id))) {
        throw new CampaignRouteError(404, "Un lieu choisi ne fait pas partie de cette campagne.");
      }

      const existingRoute = participant.get("routePlaceIds");
      if (Array.isArray(existingRoute) && existingRoute.length > 0) {
        throw new CampaignRouteError(409, "Vous avez déjà une tournée dans cette campagne. Terminez-la ou libérez ses lieux avant d'en prendre une nouvelle.");
      }

      const conflictingAssignment = assignments.find(assignment =>
        assignment.exists && assignment.get("claimedByUid") !== authorization.member!.uid
      );
      if (conflictingAssignment) {
        throw new CampaignRouteError(409, "Au moins un lieu vient d'être pris par un autre membre. Actualisez la campagne et ajustez votre tournée.");
      }

      const timestamp = FieldValue.serverTimestamp();
      for (let index = 0; index < assignmentRefs.length; index++) {
        const reference = assignmentRefs[index];
        const assignment = assignments[index];
        const place = placeById.get(reference.id);
        if (assignment.exists) {
          transaction.update(reference, { routeOrder: index, updatedAt: timestamp });
        } else {
          transaction.create(reference, {
            lieuDitId: reference.id,
            lieuDitName: String(place?.nom || "Lieu-dit"),
            claimedByUid: authorization.member!.uid,
            status: "claimed",
            routeOrder: index,
            claimedAt: timestamp,
            updatedAt: timestamp
          });
        }
      }
      transaction.update(participantRef, {
        routePlaceIds: parsed.data.lieuDitIds,
        routeUpdatedAt: timestamp
      });
    });

    return Response.json({ routePlaceIds: parsed.data.lieuDitIds }, { status: 200, headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof CampaignRouteError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return errorResponse(error, "Impossible de réserver cette tournée.");
  }
}