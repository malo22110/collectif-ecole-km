import { FieldValue } from "firebase-admin/firestore";
import {
  campaignIdSchema,
  detectCampaignDocumentType,
  sanitizeCampaignFileName,
} from "@/lib/tractationValidation";
import {
  authorizeTractationMember,
  errorResponse,
  newStorageObjectId,
  readLimitedBody,
  tractationBucket,
  tractationDb,
} from "@/lib/tractationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

// [SPEC-TRACTATION-03] All valid members may download campaign materials through an authenticated route.
export async function GET(request: Request, context: { params: Promise<{ campaignId: string }> }) {
  const authorization = await authorizeTractationMember(request);
  if (!authorization.member) return authorization.response;

  const { campaignId } = await context.params;
  if (!campaignIdSchema.safeParse(campaignId).success) {
    return Response.json({ error: "Identifiant de campagne invalide." }, { status: 400 });
  }

  try {
    const campaign = await tractationDb.collection("tractationCampaigns").doc(campaignId).get();
    const attachment = campaign.data()?.attachment;
    if (!campaign.exists || !attachment || typeof attachment.storagePath !== "string") {
      return Response.json({ error: "Document introuvable." }, { status: 404 });
    }
    if (!attachment.storagePath.startsWith(`tractationCampaigns/${campaignId}/`)) {
      return Response.json({ error: "Chemin de document invalide." }, { status: 500 });
    }

    const file = tractationBucket.file(attachment.storagePath);
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size || 0);
    const contentType = String(metadata.contentType || "");
    if (
      size < 1 ||
      size > MAX_DOCUMENT_BYTES ||
      !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(contentType)
    ) {
      return Response.json({ error: "Le document enregistré n'est pas valide." }, { status: 500 });
    }

    const [contents] = await file.download();
    const safeName = sanitizeCampaignFileName(String(attachment.fileName || "document"));
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
    if (error && typeof error === "object" && "code" in error && error.code === 404) {
      return Response.json({ error: "Document introuvable." }, { status: 404 });
    }
    return errorResponse(error, "Impossible de télécharger le document.");
  }
}

// [SPEC-TRACTATION-03] Uploads require the campaign role, a bounded body, and a verified PDF/image signature.
export async function POST(request: Request, context: { params: Promise<{ campaignId: string }> }) {
  const authorization = await authorizeTractationMember(request, true);
  if (!authorization.member) return authorization.response;

  const { campaignId } = await context.params;
  if (!campaignIdSchema.safeParse(campaignId).success) {
    return Response.json({ error: "Identifiant de campagne invalide." }, { status: 400 });
  }

  try {
    const campaignRef = tractationDb.collection("tractationCampaigns").doc(campaignId);
    const campaign = await campaignRef.get();
    if (!campaign.exists) return Response.json({ error: "Campagne introuvable." }, { status: 404 });
    if (campaign.get("status") !== "active")
      return Response.json({ error: "Cette campagne n'est plus ouverte." }, { status: 409 });

    const contents = await readLimitedBody(request, MAX_DOCUMENT_BYTES);
    const detectedType = detectCampaignDocumentType(contents);
    const declaredType =
      request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "";
    if (
      !detectedType ||
      (declaredType &&
        declaredType !== "application/octet-stream" &&
        declaredType !== detectedType.contentType)
    ) {
      return Response.json(
        {
          error: "Choisissez un document PDF ou une image JPEG, PNG ou WebP valide.",
        },
        { status: 415 },
      );
    }

    let suppliedName = request.headers.get("x-file-name") || "document";
    try {
      suppliedName = decodeURIComponent(suppliedName);
    } catch {
      return Response.json({ error: "Nom de fichier invalide." }, { status: 400 });
    }
    const fileName = sanitizeCampaignFileName(suppliedName);
    const storagePath = `tractationCampaigns/${campaignId}/${newStorageObjectId()}.${detectedType.extension}`;
    const file = tractationBucket.file(storagePath);
    const previousAttachment = campaign.get("attachment");

    await file.save(contents, {
      resumable: false,
      metadata: {
        contentType: detectedType.contentType,
        cacheControl: "private, no-store",
        metadata: { uploadedByUid: authorization.member.uid },
      },
    });

    try {
      await campaignRef.update({
        attachment: {
          fileName,
          contentType: detectedType.contentType,
          size: contents.byteLength,
          storagePath,
          uploadedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      await file.delete({ ignoreNotFound: true }).catch(() => undefined);
      throw error;
    }

    if (previousAttachment && typeof previousAttachment.storagePath === "string") {
      await tractationBucket
        .file(previousAttachment.storagePath)
        .delete({ ignoreNotFound: true })
        .catch((error) => {
          console.warn("Ancienne pièce jointe non supprimée après remplacement:", error);
        });
    }

    return Response.json({
      fileName,
      contentType: detectedType.contentType,
      size: contents.byteLength,
    });
  } catch (error) {
    return errorResponse(error, "Impossible de téléverser le document.");
  }
}
