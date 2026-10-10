import { adminApp, adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { Timestamp } from "firebase-admin/firestore";
import { getMemberRoles, isValidatedMember } from "@/lib/tractationValidation";
import {
  canManageTreasury as hasTreasuryManagementRole,
  TREASURY_PAGE_SIZE,
  type TreasuryEntryKind,
} from "@/lib/treasuryModel";

const ADMIN_EMAILS = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com",
]);

export const treasuryBucket = getStorage(adminApp).bucket(
  process.env.FIREBASE_STORAGE_BUCKET || "collectif-ecole-km.firebasestorage.app",
);
export const treasuryConfigRef = adminDb.collection("treasuryConfig").doc("public");
export const treasuryEntriesRef = adminDb.collection("treasuryEntries");
export const reimbursementRequestsRef = adminDb.collection("reimbursementRequests");

export type TreasuryMember = {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  canManageTreasury: boolean;
};

export type TreasuryAuthorization =
  | { member: TreasuryMember; response?: never }
  | { member?: never; response: Response };

export async function authorizeTreasuryMember(request: Request): Promise<TreasuryAuthorization> {
  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return { response: Response.json({ error: "Authentification requise." }, { status: 401 }) };
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token, true);
  } catch {
    return { response: Response.json({ error: "Session invalide." }, { status: 401 }) };
  }
  if (!decodedToken.email) {
    return {
      response: Response.json({ error: "Adresse e-mail absente du compte." }, { status: 401 }),
    };
  }

  const memberSnapshot = await adminDb.collection("membres").doc(decodedToken.email).get();
  const memberData = memberSnapshot.data();
  const roles = getMemberRoles(memberData || {});
  const isAdmin = roles.includes("admin") || ADMIN_EMAILS.has(decodedToken.email.toLowerCase());
  const canManageTreasury = isAdmin || hasTreasuryManagementRole(roles);
  if (canManageTreasury && decodedToken.email_verified !== true) {
    return {
      response: Response.json(
        { error: "L’adresse e-mail doit être vérifiée pour gérer la trésorerie." },
        { status: 403 },
      ),
    };
  }
  if ((!memberSnapshot.exists || !memberData || !isValidatedMember(memberData)) && !isAdmin) {
    return {
      response: Response.json(
        { error: "Accès réservé aux membres validés." },
        { status: 403 },
      ),
    };
  }

  return {
    member: {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName:
        [memberData?.prenom, memberData?.nom]
          .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
          .join(" ") || "Membre",
      isAdmin,
          canManageTreasury,
    },
  };
}

export class TreasuryRouteError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function readTreasuryBody(request: Request, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new TreasuryRouteError(413, "Le fichier dépasse la taille maximale autorisée.");
  }
  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes || chunks.length >= 1024) {
      await reader.cancel();
      throw new TreasuryRouteError(413, "Le contenu dépasse la taille maximale autorisée.");
    }
    chunks.push(value);
  }
  return Buffer.concat(
    chunks.map((chunk) => Buffer.from(chunk)),
    totalBytes,
  );
}

export async function readTreasuryJson(request: Request, maxBytes = 16 * 1024) {
  const body = await readTreasuryBody(request, maxBytes);
  try {
    return JSON.parse(body.toString("utf8")) as unknown;
  } catch {
    throw new TreasuryRouteError(400, "Le contenu JSON est invalide.");
  }
}

export function treasuryErrorResponse(error: unknown, fallback: string) {
  if (error instanceof TreasuryRouteError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}

export function isTreasuryEntryKind(value: unknown): value is TreasuryEntryKind {
  return value === "opening" || value === "contribution" || value === "expense";
}

export function timestampMillis(value: unknown) {
  if (value instanceof Timestamp) return value.toMillis();
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillis = value.toMillis;
    if (typeof toMillis === "function") {
      const result = toMillis.call(value);
      return Number.isFinite(result) ? result : null;
    }
  }
  return null;
}

function safeInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : 0;
}

export async function getTreasuryPublicSnapshot(cursor?: string) {
  const [summarySnapshot, cursorSnapshot] = await Promise.all([
    treasuryConfigRef.get(),
    cursor
      ? treasuryEntriesRef.doc(cursor).get()
      : Promise.resolve(null),
  ]);
  const summary = summarySnapshot.data();
  const initialized = summary?.initialized === true;
  let query = treasuryEntriesRef
    .orderBy("occurredAt", "desc")
    .limit(TREASURY_PAGE_SIZE + 1);

  if (cursorSnapshot) {
    if (!cursorSnapshot.exists) throw new TreasuryRouteError(400, "Curseur de page invalide.");
    query = query.startAfter(cursorSnapshot);
  }

  const entriesSnapshot = await query.get();
  const visibleDocs = entriesSnapshot.docs.slice(0, TREASURY_PAGE_SIZE);
  const entries = visibleDocs.flatMap((document) => {
    const data = document.data();
    const occurredAtMillis = timestampMillis(data.occurredAt);
    if (
      !isTreasuryEntryKind(data.kind) ||
      !Number.isSafeInteger(data.amountCents) ||
      data.amountCents <= 0 ||
      typeof data.label !== "string" ||
      typeof data.occurredOn !== "string" ||
      occurredAtMillis === null
    ) {
      return [];
    }
    return [
      {
        id: document.id,
        kind: data.kind,
        amountCents: data.amountCents,
        label: data.label,
        occurredOn: data.occurredOn,
        occurredAtMillis,
      },
    ];
  });

  return {
    summary: {
      initialized,
      openingBalanceCents: safeInteger(summary?.openingBalanceCents),
      contributionsCents: safeInteger(summary?.contributionsCents),
      expensesCents: safeInteger(summary?.expensesCents),
      balanceCents: safeInteger(summary?.openingBalanceCents) +
        safeInteger(summary?.contributionsCents) -
        safeInteger(summary?.expensesCents),
      updatedAtMillis: timestampMillis(summary?.updatedAt),
    },
    entries,
    hasMore: entriesSnapshot.docs.length > TREASURY_PAGE_SIZE,
    nextCursor:
      entriesSnapshot.docs.length > TREASURY_PAGE_SIZE
        ? visibleDocs.at(-1)?.id || null
        : null,
  };
}