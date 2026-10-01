export interface PetitionSigner {
  prenom: string;
  nom: string;
  ville: string;
  qualite: string;
  signature: string;
  potentialDuplicate: boolean;
}

export interface PetitionSignerGroup {
  key: "kergrist" | "parents" | "autres";
  title: string;
  signers: PetitionSigner[];
}

function normalizeForClassification(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function compareSigners(first: PetitionSigner, second: PetitionSigner) {
  return first.nom.localeCompare(second.nom, "fr") || first.prenom.localeCompare(second.prenom, "fr");
}

// [SPEC-PET-EXPORT-02] Include every consolidated signature in the requested geographic and audience order.
export function groupPetitionSigners(signers: PetitionSigner[]): PetitionSignerGroup[] {
  const groups: PetitionSignerGroup[] = [
    { key: "kergrist", title: "Habitants de Kergrist-Moëlou", signers: [] },
    { key: "parents", title: "Parents d’élèves", signers: [] },
    { key: "autres", title: "Autres signataires", signers: [] }
  ];

  for (const signer of signers) {
    const city = normalizeForClassification(signer.ville);
    const quality = normalizeForClassification(signer.qualite);
    if (city.includes("kergrist") || (quality.includes("habitant") && quality.includes("kergrist"))) {
      groups[0].signers.push(signer);
    } else if (quality.includes("parent")) {
      groups[1].signers.push(signer);
    } else {
      groups[2].signers.push(signer);
    }
  }

  return groups.map(group => ({ ...group, signers: group.signers.sort(compareSigners) }));
}