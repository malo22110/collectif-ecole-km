import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { buildSignaturesCsv, type SignatureExportRow } from "@/lib/signaturesCsv";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = [
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com"
];

export async function GET(request: Request) {
  // [SPEC-CORRECTEUR-EXPORT-01] Export all petition records only to admins and petition proofreaders.
  try {
    const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token, true);
    } catch {
      return NextResponse.json({ error: "Session invalide." }, { status: 401 });
    }

    if (!decodedToken.email) {
      return NextResponse.json({ error: "Adresse e-mail absente du compte." }, { status: 401 });
    }

    const email = decodedToken.email.toLowerCase();
    const memberSnapshot = await adminDb.collection("membres").doc(decodedToken.email).get();
    const memberData = memberSnapshot.data();
    const roles = Array.isArray(memberData?.roles)
      ? memberData.roles
      : memberData?.role
        ? [memberData.role]
        : [];
    const isAdmin = ADMIN_EMAILS.includes(email) || roles.includes("admin");
    const hasExportRole = isAdmin || (memberSnapshot.exists
      && memberData?.status === "validated"
      && roles.includes("correcteur"));

    if (!hasExportRole) {
      return NextResponse.json({ error: "Accès réservé aux correcteurs et administrateurs." }, { status: 403 });
    }

    const snapshot = await adminDb.collection("signatures")
      .select("prenom", "nom", "email", "ville", "qualite", "source", "potentialDuplicate", "createdAt")
      .limit(10001)
      .get();
    if (snapshot.size > 10000) {
      return NextResponse.json({ error: "La liste dépasse la limite d'export autorisée." }, { status: 413 });
    }

    const signatures: SignatureExportRow[] = snapshot.docs.map(document => {
      const data = document.data();
      const createdAt = data.createdAt && typeof data.createdAt.toDate === "function"
        ? data.createdAt.toDate().toISOString()
        : "";

      return {
        prenom: String(data.prenom || ""),
        nom: String(data.nom || ""),
        email: String(data.email || ""),
        ville: String(data.ville || ""),
        qualite: String(data.qualite || ""),
        source: data.source === "papier" ? "papier" : data.source === "accord_collectif" ? "accord_collectif" : "en ligne",
        potentialDuplicate: data.potentialDuplicate === true,
        createdAt
      };
    }).sort((first, second) => first.createdAt.localeCompare(second.createdAt));

    return new Response(buildSignaturesCsv(signatures), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="signataires-petition-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer"
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'export CSV des signatures:", error);
    return NextResponse.json({ error: "Impossible de générer l'export des signataires." }, { status: 500 });
  }
}