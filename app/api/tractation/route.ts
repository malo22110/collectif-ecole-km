import { FieldValue } from "firebase-admin/firestore";
import {
  campaignInputSchema,
  campaignIdSchema,
  hasEligibleHouseholds,
} from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  errorResponse,
  readJsonBody,
  tractationDb,
} from "@/lib/tractationServer";
import { toPublicPlaceAssignment } from "@/lib/tractationAssignmentDisplay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const MAX_PLACES = 300;

function toIsoString(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return null;
}

// [SPEC-TRACTATION-01] Validated members see active campaigns and shared taken/completed place states.
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
      if (!parsedCursor.success)
        return Response.json({ error: "Curseur invalide." }, { status: 400 });
      const cursorDocument = await campaigns.doc(parsedCursor.data).get();
      if (!cursorDocument.exists)
        return Response.json({ error: "Curseur inconnu." }, { status: 400 });
      campaignQuery = campaignQuery.startAfter(cursorDocument);
    }

    const [campaignSnapshot, placesSnapshot] = await Promise.all([
      campaignQuery.limit(PAGE_SIZE + 1).get(),
      tractationDb
        .collection("lieuxDits")
        .limit(MAX_PLACES + 1)
        .get(),
    ]);
    if (placesSnapshot.size > MAX_PLACES) {
      return Response.json(
        { error: "La liste des lieux-dits dépasse la limite de chargement." },
        { status: 413 },
      );
    }
    const placeDataById = new Map(placesSnapshot.docs.map((place) => [place.id, place.data()]));

    const pageDocuments = campaignSnapshot.docs.slice(0, PAGE_SIZE);
    const campaignData = await Promise.all(
      pageDocuments.map(async (document) => {
        const data = document.data();
        const participantRef = document.ref
          .collection("participants")
          .doc(authorization.member.uid);
        const [participant, assignmentSnapshot] = await Promise.all([
          participantRef.get(),
          document.ref.collection("placeAssignments").limit(201).get(),
        ]);
        if (assignmentSnapshot.size > 200) {
          throw new Error("Le nombre de lieux réservés dépasse la limite autorisée.");
        }
        const visiblePlaceIds = new Set(
          Array.isArray(data.lieuDits)
            ? data.lieuDits.flatMap((place: unknown) => {
                if (!place || typeof place !== "object") return [];
                const id = (place as Record<string, unknown>).id;
                if (typeof id !== "string") return [];
                const sourcePlace = placeDataById.get(id);
                return hasEligibleHouseholds(sourcePlace?.foyers) ? [id] : [];
              })
            : [],
        );
        const visibleAssignments = assignmentSnapshot.docs.filter(
          (assignmentDocument) =>
            visiblePlaceIds.has(assignmentDocument.id) &&
            (assignmentDocument.get("status") === "claimed" ||
              assignmentDocument.get("status") === "completed"),
        );
        const legacyOwnerUids = Array.from(
          new Set(
            visibleAssignments.flatMap((assignmentDocument) => {
              const assignment = assignmentDocument.data();
              return typeof assignment.claimedByUid === "string" &&
                typeof assignment.claimedByName !== "string"
                ? [assignment.claimedByUid]
                : [];
            }),
          ),
        );
        const legacyOwnerNames = new Map<string, string>();
        for (let offset = 0; offset < legacyOwnerUids.length; offset += 30) {
          const ownerChunk = legacyOwnerUids.slice(offset, offset + 30);
          const ownerSnapshot = await document.ref
            .collection("participants")
            .where("uid", "in", ownerChunk)
            .get();
          ownerSnapshot.docs.forEach((participantDocument) => {
            const uid = participantDocument.get("uid");
            const displayName = participantDocument.get("displayName");
            if (typeof uid === "string" && typeof displayName === "string") {
              legacyOwnerNames.set(uid, displayName);
            }
          });
        }
        const assignedPlaces = Object.fromEntries(
          visibleAssignments.flatMap((assignmentDocument) => {
            const assignment = assignmentDocument.data();
            const publicAssignment = toPublicPlaceAssignment(
              {
                status: assignment.status,
                claimedByUid: assignment.claimedByUid,
                claimedByName: assignment.claimedByName,
              },
              authorization.member.uid,
              typeof assignment.claimedByUid === "string"
                ? legacyOwnerNames.get(assignment.claimedByUid)
                : undefined,
            );
            return publicAssignment ? [[assignmentDocument.id, publicAssignment]] : [];
          }),
        );

        return {
          id: document.id,
          title: String(data.title || ""),
          message: String(data.message || ""),
          createdByName: String(data.createdByName || "Membre"),
          createdAt: toIsoString(data.createdAt),
          lieuDits: Array.isArray(data.lieuDits)
            ? data.lieuDits.flatMap((place: unknown) => {
                if (!place || typeof place !== "object") return [];
                const campaignPlace = place as Record<string, unknown>;
                if (typeof campaignPlace.id !== "string") return [];
                const placeData = placeDataById.get(campaignPlace.id);
                const foyers = Number.isInteger(placeData?.foyers) ? Number(placeData!.foyers) : 0;
                if (!hasEligibleHouseholds(foyers)) return [];
                const lat = placeData?.lat;
                const lon = placeData?.lon;
                return [
                  {
                    id: campaignPlace.id,
                    nom: String(placeData?.nom || campaignPlace.nom || "Lieu-dit"),
                    foyers,
                    lat: Number.isFinite(lat) ? (lat as number) : null,
                    lon: Number.isFinite(lon) ? (lon as number) : null,
                    hasCoordinates: Number.isFinite(lat) && Number.isFinite(lon),
                  },
                ];
              })
            : [],
          attachment:
            data.attachment && typeof data.attachment === "object"
              ? {
                  fileName: String(data.attachment.fileName || "document"),
                  contentType: String(data.attachment.contentType || "application/octet-stream"),
                  size: Number(data.attachment.size || 0),
                }
              : null,
          joined: participant.exists,
          assignedPlaces,
          myRoutePlaceIds: Array.isArray(participant.data()?.routePlaceIds)
            ? participant
                .data()!
                .routePlaceIds.filter(
                  (id: unknown): id is string => typeof id === "string" && visiblePlaceIds.has(id),
                )
            : [],
        };
      }),
    );

    const places = placesSnapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          nom: String(data.nom || ""),
          foyers: Number.isInteger(data.foyers) ? data.foyers : 0,
          hasCoordinates: Number.isFinite(data.lat) && Number.isFinite(data.lon),
          lat: Number.isFinite(data.lat) ? (data.lat as number) : null,
          lon: Number.isFinite(data.lon) ? (data.lon as number) : null,
        };
      })
      .filter((place) => hasEligibleHouseholds(place.foyers))
      .sort((first, second) => first.nom.localeCompare(second.nom, "fr"));

    return Response.json(
      {
        campaigns: campaignData,
        places,
        canCreate: authorization.member.canCreate,
        showStatistics: authorization.member.roles.includes("tractation"),
        nextCursor:
          campaignSnapshot.docs.length > PAGE_SIZE ? pageDocuments.at(-1)?.id || null : null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
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
      return Response.json(
        { error: "Vérifiez le titre, le message et les lieux sélectionnés." },
        { status: 400 },
      );
    }

    const placeRefs = parsed.data.lieuDitIds.map((id) =>
      tractationDb.collection("lieuxDits").doc(id),
    );
    const placeSnapshots = await Promise.all(placeRefs.map((reference) => reference.get()));
    if (placeSnapshots.some((snapshot) => !snapshot.exists)) {
      return Response.json(
        { error: "Un ou plusieurs lieux-dits ne sont plus disponibles." },
        { status: 400 },
      );
    }
    if (placeSnapshots.some((snapshot) => !hasEligibleHouseholds(snapshot.get("foyers")))) {
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
      updatedAt: FieldValue.serverTimestamp(),
    });

    return Response.json(
      { id: campaignRef.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, "Impossible de créer la campagne.");
  }
}
