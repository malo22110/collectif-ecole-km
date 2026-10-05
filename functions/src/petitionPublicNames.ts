interface PublicSignatureName {
  source?: string;
  prenom?: string;
  nom?: string;
  qualite?: string;
}

// [SPEC-PET-SCAN-05] Paper signatures and collective assent records are shown generically in public summaries.
export function formatPublicRecentSigner(
  signature: PublicSignatureName,
): string {
  if (signature.source === "papier") return "Signataire papier";
  if (signature.source === "accord_collectif")
    return "Accord de principe enregistré";

  const prenom = signature.prenom || "Anonyme";
  const nom = signature.nom || "";
  const qualite = signature.qualite ? ` (${signature.qualite})` : "";
  const initiale = nom ? `${nom.charAt(0).toUpperCase()}.` : "";
  return `${prenom} ${initiale}${qualite}`.trim();
}
