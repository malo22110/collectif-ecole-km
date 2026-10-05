export function formatPaperSignatureEmail(memberName: string): string {
  const normalizedName = memberName.trim().replace(/\s+/g, " ");
  return `Signature papier - ${normalizedName || "Membre du collectif"}`;
}
