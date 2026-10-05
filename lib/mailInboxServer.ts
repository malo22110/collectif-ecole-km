import { getStorage } from "firebase-admin/storage";
import { adminApp, adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getMemberRoles, isValidatedMember } from "@/lib/tractationValidation";

const MAIL_ADMIN_EMAILS = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com",
]);

export const mailInboxDb = adminDb;
export const mailInboxBucket = getStorage(adminApp).bucket(
  process.env.FIREBASE_STORAGE_BUCKET ||
    "collectif-ecole-km.firebasestorage.app",
);

export type MailInboxStaff = {
  uid: string;
  email: string;
  isAdmin: boolean;
};

export type MailInboxAuthorization =
  | { staff: MailInboxStaff; response?: never }
  | { staff?: never; response: Response };

export class MailInboxRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function authorizeMailInboxStaff(
  request: Request,
): Promise<MailInboxAuthorization> {
  const token = request.headers
    .get("Authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token)
    return {
      response: Response.json(
        { error: "Authentification requise." },
        { status: 401 },
      ),
    };

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token, true);
  } catch {
    return {
      response: Response.json({ error: "Session invalide." }, { status: 401 }),
    };
  }

  if (!decodedToken.email) {
    return {
      response: Response.json(
        { error: "Adresse e-mail absente du compte." },
        { status: 401 },
      ),
    };
  }

  const memberSnapshot = await mailInboxDb
    .collection("membres")
    .doc(decodedToken.email)
    .get();
  const memberData = memberSnapshot.data();
  const roles = getMemberRoles(memberData || {});
  const isAdmin =
    roles.includes("admin") ||
    MAIL_ADMIN_EMAILS.has(decodedToken.email.toLowerCase());
  const isAuthorized =
    isAdmin ||
    (memberSnapshot.exists &&
      Boolean(memberData) &&
      isValidatedMember(memberData!) &&
      roles.includes("mail"));
  if (!isAuthorized) {
    return {
      response: Response.json(
        { error: "Accès réservé aux administrateurs et au rôle e-mail." },
        { status: 403 },
      ),
    };
  }

  return {
    staff: { uid: decodedToken.uid, email: decodedToken.email, isAdmin },
  };
}

export function mailInboxErrorResponse(
  error: unknown,
  fallback = "Impossible de traiter le message.",
) {
  if (error instanceof MailInboxRequestError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : fallback;
    return Response.json({ error: message }, { status: error.status });
  }
  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}

export async function readMailInboxJsonBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new MailInboxRequestError(
      413,
      "La requête dépasse la taille maximale.",
    );
  }
  if (!request.body)
    throw new MailInboxRequestError(400, "Corps JSON manquant.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes || chunks.length >= 64) {
      await reader.cancel();
      throw new MailInboxRequestError(
        413,
        "La requête dépasse la taille maximale.",
      );
    }
    chunks.push(value);
  }

  try {
    return JSON.parse(
      Buffer.concat(
        chunks.map((chunk) => Buffer.from(chunk)),
        totalBytes,
      ).toString("utf8"),
    ) as unknown;
  } catch {
    throw new MailInboxRequestError(400, "Corps JSON invalide.");
  }
}

export function toIsoString(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return null;
}
