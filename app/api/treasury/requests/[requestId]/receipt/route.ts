import { authorizeTreasuryMember, reimbursementRequestsRef, treasuryBucket } from "@/lib/treasuryServer";
import { MAX_ARTICLE_ATTACHMENT_BYTES, sanitizeUploadFileName, SUPPORTED_UPLOAD_TYPES } from "@/lib/uploadValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-TREASURY-08] Receipts are never public; only their owner or an administrator can retrieve them.
export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  const authorization = await authorizeTreasuryMember(request);
  if (!authorization.member) return authorization.response;

  const { requestId } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,50}$/.test(requestId)) {
    return Response.json({ error: "Identifiant de demande invalide." }, { status: 400 });
  }

  try {
    const requestSnapshot = await reimbursementRequestsRef.doc(requestId).get();
    if (!requestSnapshot.exists) return Response.json({ error: "Demande introuvable." }, { status: 404 });
    const data = requestSnapshot.data()!;
    if (!authorization.member.canManageTreasury && data.submittedByUid !== authorization.member.uid) {
      return Response.json({ error: "Demande introuvable." }, { status: 404 });
    }

    const receipt = data.receipt;
    const prefix = `treasury/receipts/${requestId}/`;
    if (!receipt || typeof receipt.storagePath !== "string" || !receipt.storagePath.startsWith(prefix)) {
      return Response.json({ error: "Justificatif introuvable." }, { status: 404 });
    }
    const file = treasuryBucket.file(receipt.storagePath);
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size || 0);
    const contentType = String(metadata.contentType || "");
    if (
      size < 1 ||
      size > MAX_ARTICLE_ATTACHMENT_BYTES ||
      size !== receipt.size ||
      contentType !== receipt.contentType ||
      !SUPPORTED_UPLOAD_TYPES.includes(contentType as (typeof SUPPORTED_UPLOAD_TYPES)[number])
    ) {
      return Response.json({ error: "Le justificatif enregistré n’est pas valide." }, { status: 500 });
    }

    const [contents] = await file.download();
    const safeName = sanitizeUploadFileName(String(receipt.fileName || "justificatif"));
    const asciiName = safeName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    return new Response(new Uint8Array(contents), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("Erreur de téléchargement de justificatif de trésorerie:", error);
    return Response.json({ error: "Impossible de télécharger le justificatif." }, { status: 500 });
  }
}