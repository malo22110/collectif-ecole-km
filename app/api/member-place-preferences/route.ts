import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { hasEligibleHouseholds, memberPlacePreferencesSchema } from "@/lib/tractationValidation";
import { errorResponse, readJsonBody } from "@/lib/tractationServer";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyValidatedMember } from "@/lib/validatedMemberAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_COLLECTION = "memberPrivate";

// [SPEC-TOURNEE-04] A member can read only their own private preference document through this authenticated API.
export async function GET(request: Request) {
  const access = await verifyValidatedMember(request);
  if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    const snapshot = await adminDb.collection(PRIVATE_COLLECTION).doc(access.uid).get();
    const data = snapshot.data();
    const storedFavoriteIds = Array.isArray(data?.favoritePlaceIds)
      ? data.favoritePlaceIds.filter((value): value is string => typeof value === "string")
      : [];
    const favoriteSnapshots = await Promise.all(storedFavoriteIds.map(id => adminDb.collection("lieuxDits").doc(id).get()));
    const favoritePlaceIds = storedFavoriteIds.filter((_, index) => hasEligibleHouseholds(favoriteSnapshots[index]?.get("foyers")));
    return NextResponse.json({
      favoritePlaceIds,
      setupComplete: data?.placePreferencesSetupComplete === true,
      savedAddress: typeof data?.homeAddress === "string" ? data.homeAddress : null
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    console.error("Erreur de lecture des préférences privées:", error);
    return NextResponse.json({ error: "Impossible de charger vos lieux favoris." }, { status: 500 });
  }
}

// [SPEC-TOURNEE-04] Persist only selected place IDs; retain a home address only after an explicit member opt-in.
export async function PUT(request: Request) {
  const access = await verifyValidatedMember(request);
  if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });

  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Format de requête invalide." }, { status: 415 });
  }

  try {
    const body = await readJsonBody(request, 16 * 1024);
    const parsed = memberPlacePreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Vérifiez la sélection des favoris et l'adresse facultative." }, { status: 400 });
    }

    const placeSnapshots = await Promise.all(parsed.data.favoritePlaceIds.map(id =>
      adminDb.collection("lieuxDits").doc(id).get()
    ));
    if (placeSnapshots.some(snapshot => !snapshot.exists)) {
      return NextResponse.json({ error: "Un lieu favori sélectionné n'existe plus." }, { status: 400 });
    }
    if (placeSnapshots.some(snapshot => !hasEligibleHouseholds(snapshot.get("foyers")))) {
      return NextResponse.json({ error: "Les lieux favoris doivent avoir au moins un foyer recensé." }, { status: 400 });
    }

    const memberPrivateRef = adminDb.collection(PRIVATE_COLLECTION).doc(access.uid);
    await memberPrivateRef.set({
      favoritePlaceIds: parsed.data.favoritePlaceIds,
      placePreferencesSetupComplete: parsed.data.setupComplete,
      ...(parsed.data.savedAddress
        ? { homeAddress: parsed.data.savedAddress }
        : { homeAddress: FieldValue.delete() }),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({
      favoritePlaceIds: parsed.data.favoritePlaceIds,
      setupComplete: parsed.data.setupComplete,
      savedAddress: parsed.data.savedAddress
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    return errorResponse(error, "Impossible d'enregistrer vos lieux favoris.");
  }
}