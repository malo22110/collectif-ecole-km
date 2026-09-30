import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { findValidatedMembersWithoutSignature } from "@/lib/nonSignatoryMembers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // [SPEC-MEMBERS-NONSIGN-01] Only validated members may see names; email addresses remain server-side.
  try {
    const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });

    let email: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token, true);
      if (!decodedToken.email) return NextResponse.json({ error: "Adresse e-mail absente du compte." }, { status: 401 });
      email = decodedToken.email;
    } catch {
      return NextResponse.json({ error: "Session invalide." }, { status: 401 });
    }

    const currentMember = await adminDb.collection("membres").doc(email).get();
    const currentData = currentMember.data();
    const roles = Array.isArray(currentData?.roles)
      ? currentData.roles
      : currentData?.role
        ? [currentData.role]
        : [];
    const isAdmin = roles.includes("admin") || [
      "lecam.malo@gmail.com",
      "contact@collectif-ecole-km.fr",
      "collectif.ecole.km@gmail.com"
    ].includes(email.toLowerCase());

    if (!currentMember.exists || (currentData?.status !== "validated" && !isAdmin)) {
      return NextResponse.json({ error: "Accès réservé aux membres validés." }, { status: 403 });
    }

    const [membersSnapshot, signaturesSnapshot] = await Promise.all([
      adminDb.collection("membres")
        .select("prenom", "nom", "email", "status", "emailBounced")
        .limit(5001)
        .get(),
      adminDb.collection("signatures")
        .select("email")
        .limit(5001)
        .get()
    ]);

    if (membersSnapshot.size > 5000 || signaturesSnapshot.size > 5000) {
      return NextResponse.json({ error: "La liste dépasse la limite de consultation. Contactez un administrateur." }, { status: 503 });
    }

    const members = membersSnapshot.docs.map(document => document.data());
    const signatures = signaturesSnapshot.docs.map(document => document.data());
    const names = findValidatedMembersWithoutSignature(members, signatures);

    return NextResponse.json({ members: names, count: names.length }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" }
    });
  } catch (error) {
    console.error("Erreur lors du chargement des membres non signataires:", error);
    return NextResponse.json({ error: "Impossible de charger la liste." }, { status: 500 });
  }
}