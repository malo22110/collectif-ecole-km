import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]!);
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    }
  });
}

export async function GET(request: Request) {
  // [SPEC-PET-EXPORT-01] L'export nominatif est réservé aux admins et reprend le filtre public Kergrist.
  try {
    const authorization = request.headers.get("Authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    let email: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token, true);
      if (!decodedToken.email) {
        return NextResponse.json({ error: "Adresse e-mail absente du compte." }, { status: 401 });
      }
      email = decodedToken.email;
    } catch {
      return NextResponse.json({ error: "Session invalide." }, { status: 401 });
    }

    const memberSnapshot = await adminDb.collection("membres").doc(email).get();
    const memberData = memberSnapshot.data();
    const roles = Array.isArray(memberData?.roles)
      ? memberData.roles
      : memberData?.role
        ? [memberData.role]
        : [];

    if (!memberSnapshot.exists || !roles.includes("admin")) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const capturedAt = new Date();
    const signaturesSnapshot = await adminDb.collection("signatures")
      .select("prenom", "nom", "email", "ville", "qualite", "source", "potentialDuplicate")
      .get();

    const signers = signaturesSnapshot.docs
      .map(document => {
        const data = document.data();
        const quality = String(data.qualite || "");
        const city = String(data.ville || "");
        const qualityLower = quality.toLowerCase();
        const cityLower = city.toLowerCase();

        if (!qualityLower.includes("habitant(e) de kergrist") && !cityLower.includes("kergrist")) {
          return null;
        }

        return {
          prenom: String(data.prenom || ""),
          nom: String(data.nom || ""),
          ville: city,
          qualite: quality,
          signature: data.source === "papier"
            ? String(data.email || "Signature recueillie sur papier")
            : String(data.email || document.id),
          potentialDuplicate: data.potentialDuplicate === true
        };
      })
      .filter((signer): signer is NonNullable<typeof signer> => signer !== null)
      .sort((first, second) => first.nom.localeCompare(second.nom, "fr") || first.prenom.localeCompare(second.prenom, "fr"));

    const extractedAt = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Paris"
    }).format(capturedAt);

    const rows = signers.map((signer, index) => `
      <tr>
        <td class="number">${index + 1}</td>
        <td>${escapeHtml(signer.prenom)}</td>
        <td>${escapeHtml(signer.nom)}</td>
        <td>${escapeHtml(signer.ville)}</td>
        <td>${escapeHtml(signer.qualite)}</td>
        <td>${escapeHtml(signer.signature)}</td>
        <td>${signer.potentialDuplicate ? "Potentiel doublon" : ""}</td>
      </tr>`).join("");

    const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>Pétition école de Kergrist - ${escapeHtml(capturedAt.toISOString().slice(0, 10))}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    body { color: #1c1917; font: 10px/1.35 Arial, sans-serif; margin: 0 auto; max-width: 190mm; }
    h1 { font-size: 18px; margin: 0 0 5px; }
    h2 { font-size: 12px; font-weight: 600; margin: 0 0 12px; }
    .meta { color: #57534e; margin: 0 0 4px; }
    .notice { border: 1px solid #a8a29e; margin: 12px 0; padding: 7px; }
    table { border-collapse: collapse; table-layout: fixed; width: 100%; }
    th, td { border: 1px solid #a8a29e; overflow-wrap: anywhere; padding: 5px 4px; text-align: left; vertical-align: top; }
    th { background: #f5f5f4; font-size: 9px; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    .number { text-align: right; width: 7mm; }
    th:nth-child(2), td:nth-child(2) { width: 16%; }
    th:nth-child(3), td:nth-child(3) { width: 13%; }
    th:nth-child(4), td:nth-child(4) { width: 14%; }
    th:nth-child(5), td:nth-child(5) { width: 16%; }
    th:nth-child(6), td:nth-child(6) { width: 25%; }
    th:nth-child(7), td:nth-child(7) { width: 16%; }
    .footer { color: #57534e; font-size: 8px; margin-top: 8px; }
    @media screen { body { padding: 18px; } }
    @media print { body { max-width: none; } }
  </style>
</head>
<body>
  <h1>Pétition citoyenne pour la sauvegarde de l'école</h1>
  <h2>Signataires ayant déclaré habiter à Kergrist-Moëlou</h2>
  <p class="meta">Extraction du ${escapeHtml(extractedAt)} - ${signers.length} signataire(s)</p>
  <p class="notice">Pour les signatures en ligne, le courriel déclaré est reproduit dans la colonne correspondante. Les signatures papier sont identifiées séparément. Les entrées signalées comme doublons potentiels restent distinctes. Document confidentiel.</p>
  <table>
    <thead><tr><th class="number">N°</th><th>Prénom</th><th>Nom</th><th>Commune</th><th>Lien avec l'école</th><th>Signature / courriel fourni</th><th>Vérification</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7">Aucune signature ne correspond au critère.</td></tr>'}</tbody>
  </table>
  <p class="footer">Le classement reprend le critère de la statistique publique : commune contenant « Kergrist » ou lien déclaré « habitant(e) de Kergrist ».</p>
</body>
</html>`;

    return htmlResponse(html);
  } catch (error) {
    console.error("Erreur lors de l'export de la pétition:", error);
    return NextResponse.json({ error: "Impossible de générer l'extraction." }, { status: 500 });
  }
}