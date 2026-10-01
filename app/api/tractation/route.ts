import { FieldValue } from "firebase-admin/firestore";
import { campaignInputSchema, campaignIdSchema } from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  errorResponse,
  readJsonBody,
  tractationDb
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const MAX_PLACES = 300;

function toIsoString(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return null;
}

// [SPEC-TRACTATION-01] Only validated members can list active campaigns and their own visits.
export async function GET(request: Request) {
  const authorization = await authorizeTractationMember(request);
  if (!authorization.member) return authorization.response;

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const campaigns = tractationDb.collection("tractationCampaigns");
    let campaignQuery = campaigns.where("status", "==", "active");

    if (cursor) {
      const parsedCursor = campaignIdSchema.safeParse(cursor);
      if (!parsedCursor.success) return Response.json({ error: "Curseur invalide." }, { status: 400 });
      const cursorDocument = await campaigns.doc(parsedCursor.data).get();
      if (!cursorDocument.exists) return Response.json({ error: "Curseur inconnu." }, { status: 400 });
      campaignQuery = campaignQuery.startAfter(cursorDocument);
    }

    const [campaignSnapshot, placesSnapshot] = await Promise.all([
      campaignQuery.limit(PAGE_SIZE + 1).get(),
      tractationDb.collection("lieuxDits").limit(MAX_PLACES + 1).get()
    ]);
    if (placesSnapshot.size > MAX_PLACES) {
      return Response.json({ error: "La liste des lieux-dits dépasse la limite de chargement." }, { status: 413 });
    }

    const pageDocuments = campaignSnapshot.docs.slice(0, PAGE_SIZE);
    const campaignData = await Promise.all(pageDocuments.map(async document => {
      const data = document.data();
      const participantRef = document.ref.collection("participants").doc(authorization.member.uid);
      const participant = await participantRef.get();
      const visits = participant.exists
        ? await participantRef.collection("visits").select("lieuDitId").limit(200).get()
        : null;

      return {
        id: document.id,
        title: String(data.title || ""),
        message: String(data.message || ""),
        createdByName: String(data.createdByName || "Membre"),
        createdAt: toIsoString(data.createdAt),
        lieuDits: Array.isArray(data.lieuDits) ? data.lieuDits : [],
        attachment: data.attachment && typeof data.attachment === "object"
          ? {
              fileName: String(data.attachment.fileName || "document"),
              contentType: String(data.attachment.contentType || "application/octet-stream"),
              size: Number(data.attachment.size || 0)
            }
          : null,
        joined: participant.exists,
        visitedIds: visits?.docs.map(visit => visit.id) || []
      };
    }));

    const places = placesSnapshot.docs.map(document => {
      const data = document.data();
      return {
        id: document.id,
        nom: String(data.nom || ""),
        foyers: Number.isInteger(data.foyers) ? data.foyers : 0,
        hasCoordinates: Number.isFinite(data.lat) && Number.isFinite(data.lon)
      };
    }).sort((first, second) => first.nom.localeCompare(second.nom, "fr"));

    return Response.json({
      campaigns: campaignData,
      places,
      canCreate: authorization.member.canCreate,
      showStatistics: authorization.member.roles.includes("tractation"),
      nextCursor: campaignSnapshot.docs.length > PAGE_SIZE ? pageDocuments.at(-1)?.id || null : null
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error, "Impossible de charger les campagnes de tractation.");
  }
}

// [SPEC-TRACTATION-02] Only holders of the approved tractation role or admins may create campaigns.
export async function POST(request: Request) {
  const authorization = await authorizeTractationMember(request, true);
  if (!authorization.member) return authorization.response;

  try {
    const parsed = campaignInputSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Vérifiez le titre, le message et les lieux sélectionnés." }, { status: 400 });
    }

    const placeRefs = parsed.data.lieuDitIds.map(id => tractationDb.collection("lieuxDits").doc(id));
    const placeSnapshots = await Promise.all(placeRefs.map(reference => reference.get()));
    if (placeSnapshots.some(snapshot => !snapshot.exists)) {
      return Response.json({ error: "Un ou plusieurs lieux-dits ne sont plus disponibles." }, { status: 400 });
    }

    const lieuDits = placeSnapshots.map(snapshot => {
      const data = snapshot.data()!;
      return { id: snapshot.id, nom: String(data.nom || "Lieu-dit"), foyers: Number(data.foyers) || 0 };
    });
    const campaignRef = tractationDb.collection("tractationCampaigns").doc();
    await campaignRef.create({
      title: parsed.data.title,
      message: parsed.data.message,
      lieuDits,
      createdByUid: authorization.member.uid,
      createdByName: authorization.member.displayName,
      status: "active",
      attachment: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return Response.json({ id: campaignRef.id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Impossible de créer la campagne.");
  }
}