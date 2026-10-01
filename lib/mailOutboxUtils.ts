export type MailAudience = "all" | "membres" | "signataires" | "membres_non_signataires" | "journalistes" | "individuel";

export interface MailRecipientSource {
  email?: unknown;
  name?: unknown;
  emailBounced?: unknown;
}

export interface MailRecipientRecord {
  email: string;
  name: string;
  status: "pending";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeRecords(records: MailRecipientSource[]) {
  const unique = new Map<string, string>();
  for (const record of records) {
    const email = normalizeEmail(record.email);
    if (!email || record.emailBounced === true || unique.has(email)) continue;
    unique.set(email, typeof record.name === "string" ? record.name.trim().slice(0, 200) : "");
  }
  return unique;
}

// [SPEC-MAIL-03] The all audience is explicitly the union of members and signers, never journalists.
export function resolveMailRecipients(
  audience: MailAudience,
  sources: { members?: MailRecipientSource[]; signers?: MailRecipientSource[]; journalists?: MailRecipientSource[] }
): MailRecipientRecord[] {
  const members = normalizeRecords(sources.members || []);
  const signers = normalizeRecords(sources.signers || []);
  let selected: Map<string, string>;

  switch (audience) {
    case "all":
      selected = new Map(members);
      signers.forEach((name, email) => { if (!selected.has(email)) selected.set(email, name); });
      break;
    case "membres":
      selected = members;
      break;
    case "signataires":
      selected = signers;
      break;
    case "membres_non_signataires":
      selected = new Map(Array.from(members.entries()).filter(([email]) => !signers.has(email)));
      break;
    case "journalistes":
      selected = normalizeRecords(sources.journalists || []);
      break;
    case "individuel":
      selected = members;
      break;
  }

  return Array.from(selected, ([email, name]) => ({ email, name, status: "pending" }));
}

// [SPEC-MAIL-03] Test delivery is always scoped to the authenticated staff address.
export function getPersonalTestRecipient(authenticatedEmail: string): MailRecipientRecord[] {
  return resolveMailRecipients("individuel", { members: [{ email: authenticatedEmail, name: "Test personnel" }] });
}
