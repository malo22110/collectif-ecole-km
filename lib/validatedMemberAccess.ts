import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

const ADMIN_EMAILS = [
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com",
];

type MemberAccessResult =
  { allowed: true; uid: string } | { allowed: false; status: 401 | 403; error: string };

export async function verifyValidatedMember(request: Request): Promise<MemberAccessResult> {
  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { allowed: false, status: 401, error: "Authentification requise." };

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token, true);
  } catch {
    return { allowed: false, status: 401, error: "Session invalide." };
  }

  if (!decodedToken.email) {
    return { allowed: false, status: 401, error: "Adresse e-mail absente du compte." };
  }

  const email = decodedToken.email;
  const memberSnapshot = await adminDb.collection("membres").doc(email).get();
  const memberData = memberSnapshot.data();
  const roles = Array.isArray(memberData?.roles)
    ? memberData.roles
    : memberData?.role
      ? [memberData.role]
      : [];
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase()) || roles.includes("admin");

  if ((!memberSnapshot.exists || memberData?.status !== "validated") && !isAdmin) {
    return { allowed: false, status: 403, error: "Accès réservé aux membres validés." };
  }

  return { allowed: true, uid: decodedToken.uid };
}
