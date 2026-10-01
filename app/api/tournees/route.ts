import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyValidatedMember } from "@/lib/validatedMemberAccess";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	// [SPEC-TOURNEE-02] Only validated members may read aggregated locality data.
	try {
		const access = await verifyValidatedMember(request);
		if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });

		const snapshot = await adminDb.collection("lieuxDits")
			.select("nom", "foyers", "lat", "lon")
			.limit(501)
			.get();
		if (snapshot.size > 500) {
			return NextResponse.json({ error: "La carte dépasse la limite de lieux autorisée." }, { status: 503 });
		}

		const locations = snapshot.docs.map(document => {
			const data = document.data();
			const foyers = Number.isInteger(data.foyers) && data.foyers >= 0 ? data.foyers : 0;
			const located = Number.isFinite(data.lat) && Number.isFinite(data.lon);
			return {
				id: document.id,
				nom: String(data.nom || "Lieu sans nom"),
				foyers,
				lat: located ? data.lat as number : null,
				lon: located ? data.lon as number : null,
				geocodeStatus: located ? "located" : "unlocated",
				householdStatus: foyers === 0 ? "zero" : "positive"
			};
		}).sort((first, second) => first.nom.localeCompare(second.nom, "fr"));

		return NextResponse.json({ locations }, {
			headers: { "Cache-Control": "private, no-store, max-age=0" }
		});
	} catch (error) {
		console.error("Erreur lors du chargement des lieux de tournée:", error);
		return NextResponse.json({ error: "Impossible de charger les lieux-dits." }, { status: 500 });
	}
}
