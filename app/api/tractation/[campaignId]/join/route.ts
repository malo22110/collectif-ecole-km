import { FieldValue } from "firebase-admin/firestore";
import { campaignIdSchema } from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  tractationDb,
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class CampaignRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// [SPEC-TRACTATION-01] Joining is restricted to validated members and is idempotent per campaign/UID.
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

  try {
    const campaignRef = tractationDb
      .collection("tractationCampaigns")
      .doc(campaignId);
    const participantRef = campaignRef
      .collection("participants")
      .doc(authorization.member.uid);
    let alreadyJoined = false;

    await tractationDb.runTransaction(async (transaction) => {
      const campaign = await transaction.get(campaignRef);
      if (!campaign.exists)
        throw new CampaignRequestError(404, "Campagne introuvable.");
      if (campaign.get("status") !== "active")
        throw new CampaignRequestError(
          409,
          "Cette campagne n'est plus ouverte.",
        );

      const participant = await transaction.get(participantRef);
      if (participant.exists) {
        alreadyJoined = true;
        return;
      }

      transaction.create(participantRef, {
        uid: authorization.member.uid,
        displayName: authorization.member.displayName,
        joinedAt: FieldValue.serverTimestamp(),
      });
    });

    return Response.json(
      { joined: true, alreadyJoined },
      { status: alreadyJoined ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof CampaignRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Erreur lors de l'inscription à la campagne:", error);
    return Response.json(
      { error: "Impossible de rejoindre cette campagne." },
      { status: 500 },
    );
  }
}
