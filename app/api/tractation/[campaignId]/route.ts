import { FieldValue } from "firebase-admin/firestore";
import {
  campaignIdSchema,
  campaignInputSchema,
  canUpdateCampaignPlaces,
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

class CampaignUpdateError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// [SPEC-TRACTATION-07] Managers may edit active campaign details without removing assigned places.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const authorization = await authorizeTractationMember(request, true);
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
    const parsed = campaignInputSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return Response.json(
        { error: "Vérifiez le titre, le message et les lieux sélectionnés." },
        { status: 400 },
      );
    }

    const placeRefs = parsed.data.lieuDitIds.map((id) =>
      tractationDb.collection("lieuxDits").doc(id),
    );
    const placeSnapshots = await Promise.all(
      placeRefs.map((reference) => reference.get()),
    );
    if (placeSnapshots.some((snapshot) => !snapshot.exists)) {
      return Response.json(
        { error: "Un ou plusieurs lieux-dits n'existent plus." },
        { status: 400 },
      );
    }
    if (
      placeSnapshots.some(
        (snapshot) => !hasEligibleHouseholds(snapshot.get("foyers")),
      )
    ) {
      return Response.json(
        { error: "Les lieux ciblés doivent avoir au moins un foyer recensé." },
        { status: 400 },
      );
    }
    const lieuDits = placeSnapshots.map((snapshot) => {
      const data = snapshot.data()!;
      return {
        id: snapshot.id,
        nom: String(data.nom || "Lieu-dit"),
        foyers: Number(data.foyers) || 0,
      };
    });

    const campaignRef = tractationDb
      .collection("tractationCampaigns")
      .doc(campaignId);
    await tractationDb.runTransaction(async (transaction) => {
      const campaignSnapshot = await transaction.get(campaignRef);
      if (!campaignSnapshot.exists)
        throw new CampaignUpdateError(404, "Campagne introuvable.");
      if (campaignSnapshot.get("status") !== "active") {
        throw new CampaignUpdateError(
          409,
          "Cette campagne n'est plus modifiable.",
        );
      }

      const assignmentSnapshot = await transaction.get(
        campaignRef.collection("placeAssignments"),
      );
      const activeAssignments = assignmentSnapshot.docs.filter(
        (document) =>
          document.get("status") === "claimed" ||
          document.get("status") === "completed",
      );
      const assignmentPlaceSnapshots = await Promise.all(
        activeAssignments.map((document) =>
          transaction.get(
            tractationDb.collection("lieuxDits").doc(document.id),
          ),
        ),
      );
      const assignedPlaceIds = activeAssignments.flatMap((document, index) =>
        hasEligibleHouseholds(assignmentPlaceSnapshots[index]?.get("foyers"))
          ? [document.id]
          : [],
      );
      if (!canUpdateCampaignPlaces(assignedPlaceIds, parsed.data.lieuDitIds)) {
        throw new CampaignUpdateError(
          409,
          "Un secteur déjà pris ou terminé ne peut pas être retiré de la campagne.",
        );
      }

      activeAssignments.forEach((document, index) => {
        if (
          !hasEligibleHouseholds(assignmentPlaceSnapshots[index]?.get("foyers"))
        )
          transaction.delete(document.ref);
      });

      transaction.update(campaignRef, {
        title: parsed.data.title,
        message: parsed.data.message,
        lieuDits,
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: authorization.member!.uid,
      });
    });

    return Response.json(
      { id: campaignId, title: parsed.data.title, lieuDits },
      {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  } catch (error) {
    if (error instanceof CampaignUpdateError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return errorResponse(error, "Impossible de modifier la campagne.");
  }
}
