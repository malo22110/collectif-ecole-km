import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import {
  findPotentialPetitionDuplicatePairs,
  groupPetitionSigners,
  type PetitionSigner,
} from "@/lib/petitionSignerGroups";
import { calculatePetitionStats } from "@/functions/src/petitionStats";

export const dynamic = "force-dynamic";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function GET(request: Request) {
  // [SPEC-PET-EXPORT-01] L'export nominatif est réservé aux admins et inclut les signatures papier et en ligne.
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
    const signaturesSnapshot = await adminDb
      .collection("signatures")
      .select("prenom", "nom", "email", "ville", "qualite", "source", "potentialDuplicate")
      .get();

    const signers: PetitionSigner[] = signaturesSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        prenom: String(data.prenom || ""),
        nom: String(data.nom || ""),
        ville: String(data.ville || ""),
        qualite: String(data.qualite || ""),
        source:
          data.source === "papier"
            ? "papier"
            : data.source === "accord_collectif"
              ? "accord_collectif"
              : "en ligne",
        signature:
          data.source === "papier"
            ? String(data.email || "Signature recueillie sur papier")
            : data.source === "accord_collectif"
              ? "Accord de principe — réunion fondatrice"
              : String(data.email || document.id),
        potentialDuplicate: data.potentialDuplicate === true,
      };
    });
    const signerGroups = groupPetitionSigners(signers);
    const signerCount = signerGroups.reduce((total, group) => total + group.signers.length, 0);
    const potentialDuplicates = findPotentialPetitionDuplicatePairs(signerGroups);
    const petitionStats = calculatePetitionStats(signers);

    const extractedAt = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    }).format(capturedAt);

    let signerIndex = 0;
    const rows = signerGroups
      .map((group) => {
        const sectionHeader = `<tr class="section-heading"><th colspan="5">${escapeHtml(group.title)} (${group.signers.length})</th></tr>`;
        const groupRows = group.signers
          .map((signer) => {
            signerIndex += 1;
            return `
      <tr>
        <td class="number">${signerIndex}</td>
        <td>${escapeHtml(`${signer.prenom} ${signer.nom}`.trim())}</td>
        <td>${escapeHtml(signer.ville)}</td>
        <td>${escapeHtml(signer.qualite)}</td>
        <td>${escapeHtml(signer.signature)}</td>
      </tr>`;
          })
          .join("");
        return group.signers.length ? sectionHeader + groupRows : "";
      })
      .join("");
    const getSignerSourceLabel = (signer: PetitionSigner) =>
      signer.source === "papier"
        ? "papier"
        : signer.source === "accord_collectif"
          ? "accord de principe"
          : "en ligne";
    const duplicateRows = potentialDuplicates
      .map(
        (pair) => `
      <li><strong>N° ${pair.firstRow}</strong> — ${escapeHtml(`${pair.first.prenom} ${pair.first.nom}`.trim())} (${getSignerSourceLabel(pair.first)}), ${escapeHtml(pair.first.ville || "commune non précisée")} et <strong>N° ${pair.secondRow}</strong> — ${escapeHtml(`${pair.second.prenom} ${pair.second.nom}`.trim())} (${getSignerSourceLabel(pair.second)}), ${escapeHtml(pair.second.ville || "commune non précisée")}</li>`,
      )
      .join("");
    const statisticRows = [
      [
        "Habitants de Kergrist-Moëlou",
        petitionStats.habitantsKergrist,
        `${petitionStats.habitantsKergristPercent}%`,
      ],
      [
        "Parents d’élèves (catégorie statistique)",
        petitionStats.parentsEleves,
        `${petitionStats.parentsElevesPercent}%`,
      ],
      [
        "Communes voisines",
        petitionStats.communesVoisines,
        `${petitionStats.communesVoisinesPercent}%`,
      ],
      ["Autres soutiens", petitionStats.autres, `${petitionStats.autresPercent}%`],
      [
        "Qualité déclarée « parent d’élève » (non vérifiée)",
        petitionStats.declaredParentOfPupilQuality,
        `${petitionStats.declaredParentOfPupilQualityPercent}%`,
      ],
      [
        "Signataires déclarés parent d’élève / 47 parents au total",
        `${petitionStats.declaredParentOfPupilQuality} / 47`,
        `${petitionStats.parentSignersOfKnownParentsPercent.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
      ],
      [
        "Part estimée des électeurs kergristois (base 539)",
        petitionStats.habitantsKergrist,
        `${(petitionStats.kergristElectorateEstimatePercent ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
      ],
    ]
      .map(
        ([label, count, share]) =>
          `<tr><th>${escapeHtml(label)}</th><td>${count}</td><td>${escapeHtml(share)}</td></tr>`,
      )
      .join("");

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
    .petition-heading { border-bottom: 2px solid #1c1917; margin-bottom: 12px; padding-bottom: 8px; text-align: center; }
    .petition-heading h1 { font-size: 17px; font-weight: 900; margin: 0 0 5px; text-transform: uppercase; }
    .petition-heading h2 { font-size: 13px; font-weight: 700; margin: 0; }
    .meta { color: #57534e; margin: 0 0 4px; }
    .notice { border: 1px solid #1c1917; font-weight: 700; margin: 10px 0; padding: 7px; }
    .petition-arguments { font-size: 9px; line-height: 1.3; margin: 8px 0 12px; padding-left: 18px; }
    .petition-arguments li { margin: 3px 0; }
    .caps-notice { border: 2px solid #1c1917; font-size: 10px; font-weight: 700; letter-spacing: .08em; margin: 10px 0; padding: 6px; text-align: center; text-transform: uppercase; }
    .hint { font-size: 8px; font-weight: 400; font-style: italic; }
    .duplicate-analysis { border: 1px solid #d6d3d1; margin-top: 14px; padding: 8px; break-inside: avoid; }
    .duplicate-analysis h3 { font-size: 10px; margin: 0 0 5px; }
    .duplicate-analysis p, .duplicate-analysis ul { font-size: 9px; margin: 4px 0; }
    .duplicate-analysis ul { padding-left: 18px; }
    .duplicate-analysis li { margin: 3px 0; }
    .petition-statistics { border: 1px solid #a8a29e; margin-top: 14px; padding: 8px; break-inside: avoid; }
    .petition-statistics h3 { font-size: 11px; margin: 0 0 6px; }
    .petition-statistics table { font-size: 9px; margin-bottom: 6px; }
    .petition-statistics th { font-weight: 600; width: 68%; }
    .petition-statistics td { text-align: right; white-space: nowrap; }
    .petition-statistics p { font-size: 8px; line-height: 1.35; margin: 4px 0; }
    table { border-collapse: collapse; table-layout: fixed; width: 100%; }
    th, td { border: 1px solid #a8a29e; overflow-wrap: anywhere; padding: 5px 4px; text-align: left; vertical-align: top; }
    th { background: #f5f5f4; font-size: 9px; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    .number { text-align: right; width: 7mm; }
    .section-heading th { background: #e7e5e4; break-after: avoid; font-size: 10px; padding-top: 7px; padding-bottom: 7px; }
    th:nth-child(2), td:nth-child(2) { width: 25%; }
    th:nth-child(3), td:nth-child(3) { width: 20%; }
    th:nth-child(4), td:nth-child(4) { width: 35%; }
    th:nth-child(5), td:nth-child(5) { width: 15%; }
    .footer { border-top: 1px solid #d6d3d1; color: #57534e; font-size: 8px; font-weight: 700; margin-top: 16px; padding-top: 8px; text-align: center; }
    @media screen { body { padding: 18px; } }
    @media print { body { max-width: none; } }
  </style>
</head>
<body>
  <div class="petition-heading">
    <h1>Pétition citoyenne</h1>
    <h2>Rénovation de l'école de Kergrist-Moëlou : valorisons les études engagées vers un projet maîtrisé</h2>
  </div>
  <p class="meta">Liste consolidée des signataires - Extraction du ${escapeHtml(extractedAt)} - ${signerCount} signataire(s)</p>
  <p class="meta">Les mentions « Accord de principe — réunion fondatrice » rapportent un accord enregistré par un administrateur; elles ne constituent pas une signature manuscrite ou en ligne.</p>
  <p class="notice">Nous demandons la poursuite et la réévaluation à la baisse du dossier de rénovation déjà engagé, afin d'aboutir à une solution économe (retour à l'enveloppe de 550 000 € HT) et adaptée aux capacités de la commune, plutôt qu'à un blocage ou un abandon qui contraindrait à repartir de zéro.</p>
  <ul class="petition-arguments">
    <li><strong>Un projet déjà mature :</strong> L'état d'avancement des études permet de démarrer sans repartir de zéro.</li>
    <li><strong>La préservation de l'argent public :</strong> 127 110 € de fonds communaux ont déjà été engagés. Abandonner le projet transforme cet argent en pure perte.</li>
    <li><strong>Le risque sur les subventions :</strong> Le dossier actuel sécurise 340 000 € d'aides. Un abandon nous ferait perdre définitivement cette manne financière.</li>
    <li><strong>L'urgence :</strong> Différer les travaux repousse la livraison et fragilise l'accueil des enfants.</li>
    <li><strong>Les contraintes sanitaires :</strong> Les diagnostics imposent des travaux urgents (radon, amiante, électricité, PMR).</li>
  </ul>
  <p class="caps-notice">⚠️ Merci d'écrire lisiblement EN MAJUSCULES ⚠️</p>
  <table>
    <thead><tr><th class="number">N°</th><th>PRÉNOM ET NOM</th><th>COMMUNE DE RÉSIDENCE<br><span class="hint">("KM" pour Kergrist-Moëlou)</span></th><th>LIEN AVEC L'ÉCOLE (Parent, Habitant, Ancien...)</th><th>SIGNATURE</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">Aucun signataire trouvé.</td></tr>'}</tbody>
  </table>
  <section class="duplicate-analysis">
    <h3>Analyse de doublons potentiels (${potentialDuplicates.length} paire(s) à vérifier)</h3>
    <p>Cette comparaison signale des noms identiques ou proches selon la commune. Elle ne confirme pas qu’il s’agit de la même personne et ne fusionne aucune signature.</p>
    ${duplicateRows ? `<ul>${duplicateRows}</ul>` : "<p>Aucune paire de doublons potentiels détectée.</p>"}
  </section>
  <section class="petition-statistics">
    <h3>Détail statistique des soutiens (${petitionStats.total} au total)</h3>
    <table><thead><tr><th>Indicateur</th><th>Nombre</th><th>Part</th></tr></thead><tbody>${statisticRows}</tbody></table>
    <p><strong>Règles de classement, appliquées dans cet ordre :</strong> Kergrist si la commune contient « kergrist » ou si le lien contient « habitant(e) de Kergrist »; sinon parent d’élève si la qualité déclarée correspond à « Parent d’élève » (accent ignoré); sinon commune voisine si le lien contient « voisine » ou si une commune non vide est renseignée; toutes les autres entrées sont classées « Autres soutiens ». Chaque entrée est comptée une seule fois. Le ratio parent d’élève utilise 47 parents au total, valeur communiquée à confirmer; la qualité déclarée ne constitue pas une vérification individuelle. La base de 539 personnes en âge de voter utilisée pour l’estimation Kergrist est à confirmer et actualiser avant publication comme chiffre officiel.</p>
  </section>
  <p class="footer">Pétition lancée par le Collectif citoyen pour la rénovation de l'école de Kergrist-Moëlou.<br>Les données collectées serviront uniquement à valider le soutien citoyen à cette démarche.</p>
</body>
</html>`;

    return htmlResponse(html);
  } catch (error) {
    console.error("Erreur lors de l'export de la pétition:", error);
    return NextResponse.json({ error: "Impossible de générer l'extraction." }, { status: 500 });
  }
}
