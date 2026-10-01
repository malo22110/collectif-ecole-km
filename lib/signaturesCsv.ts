export interface SignatureExportRow {
  prenom?: string;
  nom?: string;
  email?: string;
  ville?: string;
  qualite?: string;
  source?: string;
  potentialDuplicate?: boolean;
  createdAt?: string;
}

function safeSpreadsheetCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

// [SPEC-CORRECTEUR-EXPORT-01] Use a French Excel/Sheets-compatible CSV and neutralize formula cells.
export function buildSignaturesCsv(rows: SignatureExportRow[]): string {
  const header = [
    "Prénom",
    "Nom",
    "E-mail / mention papier",
    "Commune",
    "Lien avec l'école",
    "Source",
    "Doublon potentiel",
    "Date de signature"
  ];
  const lines = [header, ...rows.map(row => [
    row.prenom,
    row.nom,
    row.email,
    row.ville,
    row.qualite,
    row.source === "papier" ? "Papier" : row.source === "accord_collectif" ? "Accord de principe (réunion fondatrice)" : "En ligne",
    row.potentialDuplicate ? "Oui" : "Non",
    row.createdAt
  ])];

  return `\uFEFF${lines.map(line => line.map(safeSpreadsheetCell).join(";")).join("\r\n")}`;
}