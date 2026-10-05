import { isPotentialPetitionDuplicate } from "./petitionDuplicates.ts";

export interface PetitionSigner {
  id?: string;
  prenom: string;
  nom: string;
  ville: string;
  qualite: string;
  signature: string;
  source?: "papier" | "en ligne" | "accord_collectif";
  potentialDuplicate: boolean;
}

export interface PetitionSignerGroup {
  key: "kergrist" | "parents" | "autres";
  title: string;
  signers: PetitionSigner[];
}

export interface PotentialPetitionDuplicatePair {
  firstRow: number;
  secondRow: number;
  first: PetitionSigner;
  second: PetitionSigner;
}

function normalizeForClassification(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
}

function compareSigners(first: PetitionSigner, second: PetitionSigner) {
  return (
    first.nom.localeCompare(second.nom, "fr") || first.prenom.localeCompare(second.prenom, "fr")
  );
}

// [SPEC-PET-EXPORT-02] Include every consolidated signature in the requested geographic and audience order.
export function groupPetitionSigners(signers: PetitionSigner[]): PetitionSignerGroup[] {
  const groups: PetitionSignerGroup[] = [
    { key: "kergrist", title: "Habitants de Kergrist-Moëlou", signers: [] },
    { key: "parents", title: "Parents d’élèves", signers: [] },
    { key: "autres", title: "Autres signataires", signers: [] },
  ];

  for (const signer of signers) {
    const city = normalizeForClassification(signer.ville);
    const quality = normalizeForClassification(signer.qualite);
    if (
      city.includes("kergrist") ||
      (quality.includes("habitant") && quality.includes("kergrist"))
    ) {
      groups[0].signers.push(signer);
    } else if (quality.includes("parent")) {
      groups[1].signers.push(signer);
    } else {
      groups[2].signers.push(signer);
    }
  }

  return groups.map((group) => ({
    ...group,
    signers: group.signers.sort(compareSigners),
  }));
}

// [SPEC-PET-EXPORT-03] Report possible duplicates by their printed row numbers; never merge signatures automatically.
export function findPotentialPetitionDuplicatePairs(
  groups: PetitionSignerGroup[],
): PotentialPetitionDuplicatePair[] {
  const numberedSigners = groups
    .flatMap((group) => group.signers)
    .map((signer, index) => ({ signer, row: index + 1 }));
  const pairs: PotentialPetitionDuplicatePair[] = [];

  for (let firstIndex = 0; firstIndex < numberedSigners.length; firstIndex++) {
    const first = numberedSigners[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < numberedSigners.length; secondIndex++) {
      const second = numberedSigners[secondIndex];
      if (
        isPotentialPetitionDuplicate(
          {
            fullName: `${first.signer.prenom} ${first.signer.nom}`,
            ville: first.signer.ville,
          },
          {
            fullName: `${second.signer.prenom} ${second.signer.nom}`,
            ville: second.signer.ville,
          },
        )
      ) {
        pairs.push({
          firstRow: first.row,
          secondRow: second.row,
          first: first.signer,
          second: second.signer,
        });
      }
    }
  }

  return pairs;
}
