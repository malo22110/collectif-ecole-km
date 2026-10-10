import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { verifyValidatedMember } from "@/lib/validatedMemberAccess";

const MAX_BODY_BYTES = 16 * 1024;
const ADMIN_EMAILS = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com",
]);

export type ActionBoardMember = {
  uid: string;
  displayName: string;
  roles: string[];
  canCoordinate: boolean;
};

// [SPEC-ACTION-BOARD-02] All board endpoints use the same validated-member and coordinator check.
export async function authorizeActionBoardMember(request: Request) {
  const access = await verifyValidatedMember(request);
  if (!access.allowed) return { response: NextResponse.json({ error: access.error }, { status: access.status }) };

  try {
    const authUser = await adminAuth.getUser(access.uid);
    if (!authUser.email) return { response: NextResponse.json({ error: "Adresse e-mail absente." }, { status: 401 }) };
    const memberSnapshot = await adminDb.collection("membres").doc(authUser.email).get();
    const data = memberSnapshot.data();
    const roles = Array.isArray(data?.roles)
      ? data.roles.filter((role): role is string => typeof role === "string")
      : typeof data?.role === "string"
        ? [data.role]
        : [];
    const isAdmin = roles.includes("admin") || ADMIN_EMAILS.has(authUser.email.toLowerCase());
    if (!isAdmin && (!memberSnapshot.exists || data?.status !== "validated")) {
      return { response: NextResponse.json({ error: "Accès réservé aux membres validés." }, { status: 403 }) };
    }
    return {
      member: {
        uid: access.uid,
        displayName: [data?.prenom, data?.nom]
          .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
          .join(" ") || "Membre du collectif",
        roles,
        canCoordinate: isAdmin || roles.includes("gestionnaire"),
      } satisfies ActionBoardMember,
    };
  } catch (error) {
    console.error("Erreur d’autorisation du tableau d’actions:", error);
    return { response: NextResponse.json({ error: "Impossible de vérifier votre accès." }, { status: 500 }) };
  }
}

export async function readActionBoardBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new Error("Le contenu dépasse la taille maximale autorisée.");
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new Error("Le format de requête doit être JSON.");
  }
  if (!request.body) throw new Error("Le contenu est vide.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("Le contenu dépasse la taille maximale autorisée.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8")) as unknown;
  } catch {
    throw new Error("Le contenu JSON est invalide.");
  }
}
