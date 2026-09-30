export interface MemberRecord {
  prenom?: string;
  nom?: string;
  email?: string;
  status?: string;
  emailBounced?: boolean;
}

export interface SignatureRecord {
  email?: string;
}

function normalizeEmail(email: string | undefined): string {
  return (email || "").trim().toLowerCase();
}

// [SPEC-MEMBERS-NONSIGN-01] Match the mailing audience while returning names only.
export function findValidatedMembersWithoutSignature(
  members: MemberRecord[],
  signatures: SignatureRecord[]
) {
  const signedEmails = new Set(
    signatures.map(signature => normalizeEmail(signature.email)).filter(Boolean)
  );
  const seenEmails = new Set<string>();

  return members.flatMap(member => {
    const email = normalizeEmail(member.email);
    if (member.status !== "validated" || member.emailBounced || !email || signedEmails.has(email) || seenEmails.has(email)) {
      return [];
    }

    seenEmails.add(email);
    const name = [member.prenom, member.nom]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .map(part => part.trim())
      .join(" ");

    return name ? [{ name }] : [];
  }).sort((first, second) => first.name.localeCompare(second.name, "fr"));
}