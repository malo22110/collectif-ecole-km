import { createHash } from "node:crypto";

// [SPEC-MAIL-OPT-OUT-01] A single private record excludes every occurrence of an address.
export function getMailSuppressionId(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

// [SPEC-MAIL-OPT-OUT-01] Failed or incomplete checks must never authorize a campaign.
export async function filterSuppressedRecipients<T extends { email: string }>(
  recipients: T[],
  readSuppressions: (ids: string[]) => Promise<boolean[]>,
): Promise<T[]> {
  const allowed: T[] = [];
  for (let offset = 0; offset < recipients.length; offset += 400) {
    const slice = recipients.slice(offset, offset + 400);
    const excluded = await readSuppressions(
      slice.map((recipient) => getMailSuppressionId(recipient.email)),
    );
    if (excluded.length !== slice.length || excluded.some((value) => typeof value !== "boolean")) {
      throw new Error("Vérification des désabonnements incomplète.");
    }
    slice.forEach((recipient, index) => {
      if (!excluded[index]) allowed.push(recipient);
    });
  }
  return allowed;
}
