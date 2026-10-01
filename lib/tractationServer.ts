import { randomUUID } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import fs from "node:fs";
import path from "node:path";
import { canCreateCampaign, getMemberRoles, isValidatedMember } from "@/lib/tractationValidation";

const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./secrets/firebase-service-account.json");
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const projectId = process.env.GCLOUD_PROJECT || "collectif-ecole-km";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  }

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    return initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  }

  return initializeApp({ projectId });
}

export const tractationAdminApp = getAdminApp();
export const tractationDb = getFirestore(tractationAdminApp, "ecole-db");
export const tractationAuth = getAuth(tractationAdminApp);
export const tractationBucket = getStorage(tractationAdminApp)
  .bucket(process.env.FIREBASE_STORAGE_BUCKET || "collectif-ecole-km.firebasestorage.app");

export type TractationMember = {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  canCreate: boolean;
};

export type MemberAuthorization =
  | { member: TractationMember; response?: never }
  | { member?: never; response: Response };

export async function authorizeTractationMember(request: Request, requireCreator = false): Promise<MemberAuthorization> {
  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { response: Response.json({ error: "Authentification requise." }, { status: 401 }) };

  let decodedToken;
  try {
    decodedToken = await tractationAuth.verifyIdToken(token, true);
  } catch {
    return { response: Response.json({ error: "Session invalide." }, { status: 401 }) };
  }

  if (!decodedToken.email) {
    return { response: Response.json({ error: "Adresse e-mail absente du compte." }, { status: 401 }) };
  }

  const memberSnapshot = await tractationDb.collection("membres").doc(decodedToken.email).get();
  const memberData = memberSnapshot.data();
  if (!memberSnapshot.exists || !memberData || !isValidatedMember(memberData)) {
    return { response: Response.json({ error: "Accès réservé aux membres validés." }, { status: 403 }) };
  }

  const roles = getMemberRoles(memberData);
  const canCreate = canCreateCampaign(memberData, decodedToken.email);
  if (requireCreator && !canCreate) {
    return { response: Response.json({ error: "Le rôle Responsable tractation est nécessaire pour cette action." }, { status: 403 }) };
  }

  return {
    member: {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: [memberData.prenom, memberData.nom].filter(value => typeof value === "string" && value.trim()).join(" ") || "Membre",
      roles,
      canCreate
    }
  };
}

export class RequestPayloadError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function readLimitedBody(request: Request, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestPayloadError(413, "Le fichier dépasse la taille maximale autorisée.");
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
      throw new RequestPayloadError(413, "Le contenu dépasse la taille maximale autorisée.");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), totalBytes);
}

export async function readJsonBody(request: Request, maxBytes = 64 * 1024) {
  const bytes = await readLimitedBody(request, maxBytes);
  try {
    return JSON.parse(bytes.toString("utf8")) as unknown;
  } catch {
    throw new RequestPayloadError(400, "Le contenu JSON est invalide.");
  }
}

export function errorResponse(error: unknown, fallback: string) {
  if (error instanceof RequestPayloadError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}

export function newStorageObjectId() {
  return randomUUID();
}