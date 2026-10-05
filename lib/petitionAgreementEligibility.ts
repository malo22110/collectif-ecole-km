import { isPotentialPetitionDuplicate } from "./petitionDuplicates.ts";

export interface PetitionAgreementMemberIdentity {
  email: string;
  prenom: string;
  nom: string;
  ville: string;
}

export interface ExistingPetitionEntry {
  email: string;
  source: string;
  prenom: string;
  nom: string;
  ville: string;
}

export interface PetitionAgreementEligibility {
  isAlreadySigned: boolean;
  hasAgreement: boolean;
  hasPotentialPaperSignature: boolean;
  available: boolean;
}

// [SPEC-PET-AGREEMENT-01] Do not offer members already represented by a recorded or likely paper signature.
export function classifyPetitionAgreementMember(
  member: PetitionAgreementMemberIdentity,
  entries: ExistingPetitionEntry[],
): PetitionAgreementEligibility {
  const memberEmail = member.email.trim().toLowerCase();
  const matchingEntries = entries.filter(
    (entry) => entry.email.trim().toLowerCase() === memberEmail,
  );
  const hasAgreement = matchingEntries.some(
    (entry) => entry.source === "accord_collectif",
  );
  const isAlreadySigned = matchingEntries.some(
    (entry) => entry.source !== "accord_collectif",
  );
  const hasPotentialPaperSignature = entries.some(
    (entry) =>
      entry.source === "papier" &&
      isPotentialPetitionDuplicate(
        {
          fullName: `${member.prenom} ${member.nom}`.trim(),
          ville: member.ville,
        },
        { fullName: `${entry.prenom} ${entry.nom}`.trim(), ville: entry.ville },
      ),
  );

  return {
    isAlreadySigned,
    hasAgreement,
    hasPotentialPaperSignature,
    available: !isAlreadySigned && !hasAgreement && !hasPotentialPaperSignature,
  };
}
