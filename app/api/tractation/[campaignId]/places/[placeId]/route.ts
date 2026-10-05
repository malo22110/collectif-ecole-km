import { FieldValue } from "firebase-admin/firestore";
import {
  campaignIdSchema,
  canCorrectPlaceAssignment,
  canReopenPlaceAssignment,
  hasEligibleHouseholds,
  placeAssignmentInputSchema,
} from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  errorResponse,
  readJsonBody,
  tractationDb,
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class PlaceAssignmentError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// [SPEC-TRACTATION-04] Members manage their own places; campaign managers can correct any assignment.
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
    const parsed = placeAssignmentInputSchema.safeParse(
      await readJsonBody(request),
    );
    if (!parsed.success)
      return Response.json(
        { error: "Action de réservation invalide." },
        { status: 400 },
      );

    const campaignRef = tractationDb
      .collection("tractationCampaigns")
      .doc(campaignId);
    const participantRef = campaignRef
      .collection("participants")
      .doc(authorization.member.uid);
    const assignmentRef = campaignRef
      .collection("placeAssignments")
      .doc(placeId);
    const sourcePlaceRef = tractationDb.collection("lieuxDits").doc(placeId);
    let result: {
      status: "claimed" | "completed" | null;
      isMine: boolean;
      memberName?: string;
    } = {
      status: null,
      isMine: false,
    };

    await tractationDb.runTransaction(async (transaction) => {
      const [campaign, participant, assignment, sourcePlace] =
        await Promise.all([
          transaction.get(campaignRef),
          transaction.get(participantRef),
          transaction.get(assignmentRef),
          transaction.get(sourcePlaceRef),
        ]);

      if (!campaign.exists)
        throw new PlaceAssignmentError(404, "Campagne introuvable.");
      if (campaign.get("status") !== "active")
        throw new PlaceAssignmentError(
          409,
          "Cette campagne n'est plus ouverte.",
        );
      const campaignPlaces = campaign.get("lieuDits");
      const selectedPlace = Array.isArray(campaignPlaces)
        ? campaignPlaces.find(
            (place) =>
              place && typeof place === "object" && place.id === placeId,
          )
        : undefined;
      if (!selectedPlace)
        throw new PlaceAssignmentError(
          404,
          "Ce lieu ne fait pas partie de la campagne.",
        );

      const current = assignment.data();
      const action = parsed.data.action;
      if (action === "claim") {
        if (!participant.exists)
          throw new PlaceAssignmentError(
            403,
            "Rejoignez la campagne avant de réserver un lieu.",
          );
        if (
          !hasEligibleHouseholds(sourcePlace.get("foyers")) ||
          !hasEligibleHouseholds(
            (selectedPlace as Record<string, unknown>).foyers,
          )
        ) {
          throw new PlaceAssignmentError(
            400,
            "Ce secteur n'a aucun foyer recensé et ne peut pas être réservé.",
          );
        }
        if (
          assignment.exists &&
          current?.claimedByUid !== authorization.member.uid
        ) {
          throw new PlaceAssignmentError(
            409,
            "Ce lieu a déjà été pris par un autre membre.",
          );
        }
        if (!assignment.exists) {
          transaction.create(assignmentRef, {
            lieuDitId: placeId,
            lieuDitName: String(selectedPlace.nom || "Lieu-dit"),
            claimedByUid: authorization.member.uid,
            claimedByName: authorization.member.displayName,
            status: "claimed",
            claimedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          result = {
            status: "claimed",
            isMine: true,
            memberName: authorization.member.displayName,
          };
        } else {
          transaction.update(assignmentRef, {
            claimedByName: authorization.member.displayName,
            updatedAt: FieldValue.serverTimestamp(),
          });
          result = {
            status: current?.status === "completed" ? "completed" : "claimed",
            isMine: true,
            memberName: authorization.member.displayName,
          };
        }
        return;
      }

      const isMine = current?.claimedByUid === authorization.member.uid;
      if (
        !assignment.exists ||
        !canCorrectPlaceAssignment(
          current?.claimedByUid,
          authorization.member.uid,
          authorization.member.canCreate,
        )
      ) {
        throw new PlaceAssignmentError(
          403,
          "Seul le titulaire ou un responsable de campagne peut corriger cette réservation.",
        );
      }

      let assignmentOwnerParticipant = participant;
      let assignmentOwnerParticipantRef = participantRef;
      if (
        action === "release" &&
        typeof current?.claimedByUid === "string" &&
        !isMine
      ) {
        assignmentOwnerParticipantRef = campaignRef
          .collection("participants")
          .doc(current.claimedByUid);
        assignmentOwnerParticipant = await transaction.get(
          assignmentOwnerParticipantRef,
        );
      }

      if (action === "reopen") {
        if (
          !canReopenPlaceAssignment(
            current?.status,
            current?.claimedByUid,
            authorization.member.uid,
            authorization.member.canCreate,
          )
        ) {
          throw new PlaceAssignmentError(
            409,
            "Seul le titulaire ou un responsable peut rouvrir un lieu terminé.",
          );
        }
        transaction.update(assignmentRef, {
          status: "claimed",
          completedAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        result = {
          status: "claimed",
          isMine,
          ...(typeof current?.claimedByName === "string"
            ? { memberName: current.claimedByName }
            : {}),
        };
        return;
      }

      if (action === "complete") {
        if (current?.status !== "completed") {
          transaction.update(assignmentRef, {
            status: "completed",
            completedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        result = {
          status: "completed",
          isMine,
          ...(typeof current?.claimedByName === "string"
            ? { memberName: current.claimedByName }
            : isMine
              ? { memberName: authorization.member.displayName }
              : {}),
        };
        return;
      }

      transaction.delete(assignmentRef);
      if (assignmentOwnerParticipant.exists) {
        transaction.update(assignmentOwnerParticipantRef, {
          routePlaceIds: FieldValue.arrayRemove(placeId),
          routeUpdatedAt: FieldValue.serverTimestamp(),
        });
      }
      result = { status: null, isMine: false };
    });

    return Response.json(
      { placeId, ...result },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof PlaceAssignmentError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return errorResponse(error, "Impossible de mettre à jour ce lieu.");
  }
}
