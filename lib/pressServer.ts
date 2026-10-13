import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getMemberRoles, isValidatedMember } from "@/lib/tractationValidation";

export const pressDb = adminDb;
const pressAdminEmails = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com",
]);

// [SPEC-PRESS-02] Server writes require a verified, validated press member or administrator.
export async function authorizePressStaff(request: Request) {
  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token)
    return { response: Response.json({ error: "Authentification requise." }, { status: 401 }) };
  try {
    const identity = await adminAuth.verifyIdToken(token, true);
    if (!identity.email) throw new Error("Missing email");
    const member = await pressDb.collection("membres").doc(identity.email).get();
    const data = member.data();
    const roles = getMemberRoles(data || {});
    const isAdmin = roles.includes("admin") || pressAdminEmails.has(identity.email.toLowerCase());
    if (
      !isAdmin &&
      (!member.exists || !data || !isValidatedMember(data) || !roles.includes("presse"))
    ) {
      return {
        response: Response.json({ error: "Accès réservé au pôle presse." }, { status: 403 }),
      };
    }
    return { email: identity.email, uid: identity.uid };
  } catch {
    return { response: Response.json({ error: "Session invalide." }, { status: 401 }) };
  }
}

export const pressReleaseIdPattern = /^[A-Za-z0-9_-]{1,200}$/;
