import { FieldValue } from "firebase-admin/firestore";
import {
  campaignIdSchema,
  campaignRouteInputSchema,
  canStartAnotherRoute,
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

class CampaignRouteError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly placeId?: string,
  ) {
    super(message);
  }
}

// [SPEC-TRACTATION-05] Claim all route places atomically so no campaign member gets a partial tour.
export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const authorization = await authorizeTractationMember(request);
  if (!authorization.member) return authorization.response;

  const { campaignId } = await context.params;
  if (!campaignIdSchema.safeParse(campaignId).success) {
    return Response.json(
      { error: "Identifiant de campagne invalide." },
      { status: 400 },
    );
  }
  if (
    !request.headers
      .get("Content-Type")
      ?.toLowerCase()
      .includes("application/json")
  ) {
    return Response.json(
      { error: "Format de requête invalide." },
      { status: 415 },
    );
  }

  try {
    const parsed = campaignRouteInputSchema.safeParse(
      await readJsonBody(request),
    );
    if (!parsed.success)
      return Response.json(
        { error: "Choisissez au moins un lieu, sans répétition." },
        { status: 400 },
      );

    const campaignRef = tractationDb
      .collection("tractationCampaigns")
      .doc(campaignId);
    const participantRef = campaignRef
      .collection("participants")
      .doc(authorization.member.uid);
    const assignmentRefs = parsed.data.lieuDitIds.map((id) =>
      campaignRef.collection("placeAssignments").doc(id),
    );
    const sourcePlaceRefs = parsed.data.lieuDitIds.map((id) =>
      tractationDb.collection("lieuxDits").doc(id),
    );

    await tractationDb.runTransaction(async (transaction) => {
      const [campaign, participant, assignments, sourcePlaces] =
        await Promise.all([
          transaction.get(campaignRef),
          transaction.get(participantRef),
          Promise.all(
            assignmentRefs.map((reference) => transaction.get(reference)),
          ),
          Promise.all(
            sourcePlaceRefs.map((reference) => transaction.get(reference)),
          ),
        ]);

      if (!campaign.exists)
        throw new CampaignRouteError(404, "Campagne introuvable.");
      if (campaign.get("status") !== "active")
        throw new CampaignRouteError(409, "Cette campagne n'est plus ouverte.");
      if (!participant.exists)
        throw new CampaignRouteError(
          403,
          "Rejoignez la campagne avant de prendre une tournée.",
        );

      const selectedPlaces = campaign.get("lieuDits");
      const allPlaces = new Map(
        Array.isArray(selectedPlaces)
          ? selectedPlaces
              .filter((place) => place && typeof place === "object")
              .map((place) => [place.id, place])
          : [],
      );
      if (parsed.data.lieuDitIds.some((id) => !allPlaces.has(id))) {
        throw new CampaignRouteError(
          404,
          "Un lieu choisi ne fait pas partie de cette campagne.",
        );
      }
      if (
        parsed.data.lieuDitIds.some(
          (id) => !hasEligibleHouseholds(allPlaces.get(id)?.foyers),
        )
      ) {
        throw new CampaignRouteError(
          400,
          "Les secteurs choisis doivent avoir au moins un foyer recensé.",
        );
      }
      if (
        sourcePlaces.some(
          (place) =>
            !place.exists || !hasEligibleHouseholds(place.get("foyers")),
        )
      ) {
        throw new CampaignRouteError(
          400,
          "Un secteur sélectionné n'a plus de foyer recensé.",
        );
      }
      const placeById = new Map(
        Array.from(allPlaces.entries()).filter(([, place]) =>
          hasEligibleHouseholds(place?.foyers),
        ),
      );

      const existingRoute = participant.get("routePlaceIds");
      const existingRouteIds = Array.isArray(existingRoute)
        ? existingRoute.filter(
            (id: unknown): id is string => typeof id === "string",
          )
        : [];
      const previousEligibleRouteRefs = existingRouteIds
        .filter((id) => placeById.has(id))
        .map((id) => campaignRef.collection("placeAssignments").doc(id));
      const previousEligibleAssignments = await Promise.all(
        previousEligibleRouteRefs.map((reference) =>
          transaction.get(reference),
        ),
      );
      if (
        !canStartAnotherRoute(
          previousEligibleAssignments.map((assignment) =>
            assignment.exists ? assignment.get("status") : undefined,
          ),
        )
      ) {
        throw new CampaignRouteError(
          409,
          "Vous avez déjà une tournée dans cette campagne. Terminez-la ou libérez ses lieux avant d'en prendre une nouvelle.",
        );
      }
      const obsoleteAssignmentRefs = existingRouteIds
        .filter((id) => !placeById.has(id))
        .map((id) => campaignRef.collection("placeAssignments").doc(id));
      const obsoleteAssignments = await Promise.all(
        obsoleteAssignmentRefs.map((reference) => transaction.get(reference)),
      );

      const conflictingAssignment = assignments.find(
        (assignment) =>
          assignment.exists &&
          assignment.get("claimedByUid") !== authorization.member!.uid,
      );
      if (conflictingAssignment) {
        throw new CampaignRouteError(
          409,
          "Un secteur vient d'être réservé par un autre membre.",
          conflictingAssignment.id,
        );
      }
      const alreadyCompleted = assignments.find(
        (assignment) =>
          assignment.exists && assignment.get("status") === "completed",
      );
      if (alreadyCompleted) {
        throw new CampaignRouteError(
          409,
          "Un secteur déjà terminé ne peut pas être ajouté à une nouvelle tournée.",
          alreadyCompleted.id,
        );
      }

      const timestamp = FieldValue.serverTimestamp();
      obsoleteAssignments.forEach((assignment, index) => {
        if (
          assignment.exists &&
          assignment.get("claimedByUid") === authorization.member!.uid
        ) {
          transaction.delete(obsoleteAssignmentRefs[index]);
        }
      });
      for (let index = 0; index < assignmentRefs.length; index++) {
        const reference = assignmentRefs[index];
        const assignment = assignments[index];
        const place = placeById.get(reference.id);
        if (assignment.exists) {
          transaction.update(reference, {
            routeOrder: index,
            claimedByName: authorization.member!.displayName,
            updatedAt: timestamp,
          });
        } else {
          transaction.create(reference, {
            lieuDitId: reference.id,
            lieuDitName: String(place?.nom || "Lieu-dit"),
            claimedByUid: authorization.member!.uid,
            claimedByName: authorization.member!.displayName,
            status: "claimed",
            routeOrder: index,
            claimedAt: timestamp,
            updatedAt: timestamp,
          });
        }
      }
      transaction.update(participantRef, {
        routePlaceIds: parsed.data.lieuDitIds,
        routeUpdatedAt: timestamp,
      });
    });

    return Response.json(
      { routePlaceIds: parsed.data.lieuDitIds },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  } catch (error) {
    if (error instanceof CampaignRouteError) {
      return Response.json(
        {
          error: error.message,
          ...(error.placeId ? { placeId: error.placeId } : {}),
        },
        { status: error.status },
      );
    }
    return errorResponse(error, "Impossible de réserver cette tournée.");
  }
}
