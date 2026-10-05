import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getMemberRoles, isValidatedMember } from "@/lib/tractationValidation";
import { cleanDeletedSignatureReference } from "@/lib/petitionDuplicateCleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com",
]);
const signatureIdSchema = z
  .string()
  .min(1)
  .max(320)
  .refine((id) => !id.includes("/") && !id.includes("\\"));
const deleteSchema = z.object({ confirmed: z.literal(true) }).strict();
const MAX_REFERENCING_SIGNATURES = 200;

// [SPEC-CORRECTEUR-04] A confirmed duplicate deletion is performed server-side and its stale candidate references are cleaned.
export async function DELETE(
  request: Request,
  context: { params: Promise<{ signatureId: string }> },
) {
  const token = request.headers
    .get("Authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token)
    return NextResponse.json(
      { error: "Authentification requise." },
      { status: 401 },
    );

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token, true);
  } catch {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }
  if (!decodedToken.email)
    return NextResponse.json(
      { error: "Adresse e-mail absente du compte." },
      { status: 401 },
    );

  const memberSnapshot = await adminDb
    .collection("membres")
    .doc(decodedToken.email)
    .get();
  const memberData = memberSnapshot.data();
  const roles = getMemberRoles(memberData || {});
  const isAdmin =
    ADMIN_EMAILS.has(decodedToken.email.toLowerCase()) ||
    roles.includes("admin");
  const isCorrector =
    memberSnapshot.exists &&
    Boolean(memberData) &&
    isValidatedMember(memberData!) &&
    roles.includes("correcteur");
  if (!isAdmin && !isCorrector) {
    return NextResponse.json(
      { error: "Accès réservé aux correcteurs et administrateurs." },
      { status: 403 },
    );
  }

  const { signatureId } = await context.params;
  if (!signatureIdSchema.safeParse(signatureId).success) {
    return NextResponse.json(
      { error: "Identifiant de signature invalide." },
      { status: 400 },
    );
  }
  if (
    !request.headers
      .get("Content-Type")
      ?.toLowerCase()
      .includes("application/json")
  ) {
    return NextResponse.json(
      { error: "Confirmation de suppression requise." },
      { status: 415 },
    );
  }

  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > 1024) {
      return NextResponse.json(
        { error: "Requête trop volumineuse." },
        { status: 413 },
      );
    }
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > 1024)
      return NextResponse.json(
        { error: "Requête trop volumineuse." },
        { status: 413 },
      );
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
    }
    if (!deleteSchema.safeParse(body).success)
      return NextResponse.json(
        { error: "Confirmation de suppression requise." },
        { status: 400 },
      );

    const signatures = adminDb.collection("signatures");
    const signatureRef = signatures.doc(signatureId);
    const linkedQuery = signatures
      .where("potentialDuplicateCandidates", "array-contains", signatureId)
      .limit(MAX_REFERENCING_SIGNATURES + 1);
    await adminDb.runTransaction(async (transaction) => {
      const [signatureSnapshot, linkedSnapshot] = await Promise.all([
        transaction.get(signatureRef),
        transaction.get(linkedQuery),
      ]);
      if (!signatureSnapshot.exists)
        throw Object.assign(new Error("Cette signature n’existe plus."), {
          status: 404,
        });
      if (linkedSnapshot.size > MAX_REFERENCING_SIGNATURES) {
        throw Object.assign(
          new Error(
            "Trop de références liées; demande une intervention administrateur.",
          ),
          { status: 409 },
        );
      }

      for (const linkedDocument of linkedSnapshot.docs) {
        const updated = cleanDeletedSignatureReference(
          linkedDocument.data().potentialDuplicateCandidates,
          signatureId,
        );
        transaction.update(linkedDocument.ref, {
          potentialDuplicateCandidates: updated.candidates,
          potentialDuplicate: updated.potentialDuplicate,
        });
      }
      transaction.delete(signatureRef);
    });

    return NextResponse.json(
      { deleted: true, signatureId },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de supprimer cette signature.";
    if (status === 500)
      console.error(
        "Erreur de suppression de signature depuis le correcteur:",
        error,
      );
    return NextResponse.json({ error: message }, { status });
  }
}
