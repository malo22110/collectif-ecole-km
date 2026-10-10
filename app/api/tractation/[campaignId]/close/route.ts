import { FieldValue } from "firebase-admin/firestore";
import { campaignIdSchema, canCloseCampaign } from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  errorResponse,
  tractationDb,
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class CampaignCloseError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// [SPEC-TRACTATION-14] Only campaign managers may close an active campaign; its records stay in Firestore.
export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const authorization = await authorizeTractationMember(request, true);
  if (!authorization.member) return authorization.response;

  const { campaignId } = await context.params;
  if (!campaignIdSchema.safeParse(campaignId).success) {
    return Response.json({ error: "Identifiant de campagne invalide." }, { status: 400 });
  }

  const campaignRef = tractationDb.collection("tractationCampaigns").doc(campaignId);
  try {
    await tractationDb.runTransaction(async (transaction) => {
      const campaign = await transaction.get(campaignRef);
      if (!campaign.exists) throw new CampaignCloseError(404, "Campagne introuvable.");
      if (!canCloseCampaign(campaign.get("status"))) {
        throw new CampaignCloseError(409, "Cette campagne n’est plus en cours.");
      }

      transaction.update(campaignRef, {
        status: "closed",
        closedAt: FieldValue.serverTimestamp(),
        closedByUid: authorization.member!.uid,
        closedByName: authorization.member!.displayName,
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: authorization.member!.uid,
      });
    });

    return Response.json(
      { id: campaignId, status: "closed" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof CampaignCloseError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return errorResponse(error, "Impossible de clôturer la campagne.");
  }
}