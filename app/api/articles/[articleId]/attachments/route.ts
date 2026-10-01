import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { adminApp, adminAuth, adminDb } from "@/lib/firebaseAdmin";
import {
  articleAttachmentDeleteSchema,
  articleAttachmentIdSchema,
  articleAttachmentListSchema,
  articleAttachmentMetadataSchema,
  articleIdSchema
} from "@/lib/articleAttachmentValidation";
import { detectSupportedUploadType, MAX_ARTICLE_ATTACHMENT_BYTES, MAX_ARTICLE_ATTACHMENTS, sanitizeUploadFileName, SUPPORTED_UPLOAD_TYPES } from "@/lib/uploadValidation";
import { getMemberRoles, isValidatedMember } from "@/lib/tractationValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARTICLE_ADMIN_EMAILS = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com"
]);
const articleBucket = getStorage(adminApp).bucket(process.env.FIREBASE_STORAGE_BUCKET || "collectif-ecole-km.firebasestorage.app");

class AttachmentRouteError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type ArticleEditor = { uid: string; email: string; isAdmin: boolean };

async function authorizeEditor(request: Request): Promise<{ editor: ArticleEditor } | { response: Response }> {
  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { response: Response.json({ error: "Authentification requise." }, { status: 401 }) };

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token, true);
  } catch {
    return { response: Response.json({ error: "Session invalide." }, { status: 401 }) };
  }

  if (!decodedToken.email) {
    return { response: Response.json({ error: "Adresse e-mail absente du compte." }, { status: 401 }) };
  }

  const memberSnapshot = await adminDb.collection("membres").doc(decodedToken.email).get();
  const memberData = memberSnapshot.data();
  const roles = getMemberRoles(memberData || {});
  const isAdmin = roles.includes("admin") || ARTICLE_ADMIN_EMAILS.has(decodedToken.email.toLowerCase());
  const isEditor = roles.includes("redacteur");

  if (!isAdmin && (!memberSnapshot.exists || !memberData || !isValidatedMember(memberData) || !isEditor)) {
    return { response: Response.json({ error: "Accès réservé aux rédacteurs et administrateurs." }, { status: 403 }) };
  }

  return { editor: { uid: decodedToken.uid, email: decodedToken.email, isAdmin } };
}

function canEditArticle(editor: ArticleEditor, article: FirebaseFirestore.DocumentData) {
  return editor.isAdmin || (article.status === "draft" && article.authorEmail === editor.email);
}

async function readLimitedBody(request: Request, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new AttachmentRouteError(413, "Le fichier dépasse la limite de 10 Mio.");
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
      throw new AttachmentRouteError(413, "Le fichier dépasse la limite de 10 Mio.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), totalBytes);
}

function errorResponse(error: unknown) {
  if (error instanceof AttachmentRouteError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Erreur de pièce jointe d’article:", error);
  return Response.json({ error: "Impossible de traiter la pièce jointe." }, { status: 500 });
}

function getArticleReference(articleId: string) {
  return adminDb.collection("articles").doc(articleId);
}

function getAttachmentPath(articleId: string, attachment: { id: string; extension: string }) {
  return `articles/${articleId}/attachments/${attachment.id}.${attachment.extension}`;
}

async function getAttachment(articleId: string, attachmentId: string) {
  const articleSnapshot = await getArticleReference(articleId).get();
  if (!articleSnapshot.exists) throw new AttachmentRouteError(404, "Article introuvable.");

  const article = articleSnapshot.data()!;
  const rawAttachment = Array.isArray(article.attachments)
    ? article.attachments.find((item: unknown) => item && typeof item === "object" && "id" in item && item.id === attachmentId)
    : null;
  const parsedAttachment = articleAttachmentMetadataSchema.safeParse(rawAttachment);
  if (!parsedAttachment.success) throw new AttachmentRouteError(404, "Pièce jointe introuvable.");

  return { article, attachment: parsedAttachment.data, file: articleBucket.file(getAttachmentPath(articleId, parsedAttachment.data)) };
}

// [SPEC-ARTICLE-ATTACHMENTS-01] Published articles expose validated files; drafts require their authorized editor.
export async function GET(request: Request, context: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await context.params;
  if (!articleIdSchema.safeParse(articleId).success) return Response.json({ error: "Identifiant d’article invalide." }, { status: 400 });

  try {
    const attachmentId = new URL(request.url).searchParams.get("attachmentId") || "";
    if (!articleAttachmentIdSchema.safeParse(attachmentId).success) {
      return Response.json({ error: "Identifiant de pièce jointe invalide." }, { status: 400 });
    }

    const result = await getAttachment(articleId, attachmentId);
    if (result.article.status !== "published") {
      const authorization = await authorizeEditor(request);
      if ("response" in authorization) return authorization.response;
      if (!canEditArticle(authorization.editor, result.article)) {
        return Response.json({ error: "Cette pièce jointe n’est pas disponible." }, { status: 404 });
      }
    }

    const [metadata] = await result.file.getMetadata();
    if (Number(metadata.size) !== result.attachment.size || metadata.contentType !== result.attachment.contentType) {
      return Response.json({ error: "La pièce jointe enregistrée n’est pas valide." }, { status: 500 });
    }
    const [contents] = await result.file.download();
    const safeName = sanitizeUploadFileName(result.attachment.fileName);
    const asciiName = safeName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    return new Response(new Uint8Array(contents), {
      headers: {
        "Content-Type": result.attachment.contentType,
        "Content-Length": String(result.attachment.size),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer"
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// [SPEC-ARTICLE-ATTACHMENTS-01] Only editors may upload signed PDF/image files within bounded limits.
export async function POST(request: Request, context: { params: Promise<{ articleId: string }> }) {
  const authorization = await authorizeEditor(request);
  if ("response" in authorization) return authorization.response;

  const { articleId } = await context.params;
  if (!articleIdSchema.safeParse(articleId).success) return Response.json({ error: "Identifiant d’article invalide." }, { status: 400 });
  const articleRef = getArticleReference(articleId);

  try {
    const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "";
    if (![...SUPPORTED_UPLOAD_TYPES, "application/octet-stream"].includes(contentType)) {
      return Response.json({ error: "Choisissez un PDF ou une image JPEG, PNG ou WebP." }, { status: 415 });
    }

    const contents = await readLimitedBody(request, MAX_ARTICLE_ATTACHMENT_BYTES);
    const detectedType = detectSupportedUploadType(contents);
    if (!detectedType || (contentType !== "application/octet-stream" && contentType !== detectedType.contentType)) {
      return Response.json({ error: "Le contenu du fichier ne correspond pas à un PDF ou une image autorisée." }, { status: 415 });
    }

    let suppliedName = request.headers.get("x-file-name") || "piece-jointe";
    try {
      suppliedName = decodeURIComponent(suppliedName);
    } catch {
      return Response.json({ error: "Nom de fichier invalide." }, { status: 400 });
    }
    const attachment = {
      id: randomUUID(),
      fileName: sanitizeUploadFileName(suppliedName),
      contentType: detectedType.contentType,
      extension: detectedType.extension,
      size: contents.byteLength
    };
    const parsedAttachment = articleAttachmentMetadataSchema.safeParse(attachment);
    if (!parsedAttachment.success) return Response.json({ error: "Métadonnées de fichier invalides." }, { status: 400 });

    const [articleSnapshot] = await Promise.all([articleRef.get()]);
    if (!articleSnapshot.exists) return Response.json({ error: "Article introuvable." }, { status: 404 });
    if (!canEditArticle(authorization.editor, articleSnapshot.data()!)) {
      return Response.json({ error: "Modifiez uniquement vos brouillons." }, { status: 403 });
    }

    const file = articleBucket.file(getAttachmentPath(articleId, attachment));
    await file.save(contents, {
      resumable: false,
      metadata: {
        contentType: attachment.contentType,
        cacheControl: "private, no-store",
        metadata: { uploadedByUid: authorization.editor.uid }
      }
    });

    try {
      await adminDb.runTransaction(async transaction => {
        const latestArticle = await transaction.get(articleRef);
        if (!latestArticle.exists || !canEditArticle(authorization.editor, latestArticle.data()!)) {
          throw new AttachmentRouteError(403, "Modifiez uniquement vos brouillons.");
        }
        const existingAttachments = Array.isArray(latestArticle.get("attachments")) ? latestArticle.get("attachments") : [];
        if (existingAttachments.length >= MAX_ARTICLE_ATTACHMENTS) {
          throw new AttachmentRouteError(409, `Un article peut contenir au maximum ${MAX_ARTICLE_ATTACHMENTS} pièces jointes.`);
        }
        const nextAttachments = articleAttachmentListSchema.safeParse([...existingAttachments, attachment]);
        if (!nextAttachments.success) throw new AttachmentRouteError(409, "Les métadonnées des pièces jointes de cet article sont invalides.");
        transaction.update(articleRef, {
          attachments: nextAttachments.data,
          updatedAt: FieldValue.serverTimestamp()
        });
      });
    } catch (error) {
      await file.delete({ ignoreNotFound: true }).catch(() => undefined);
      throw error;
    }

    return Response.json({ attachment }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

// [SPEC-ARTICLE-ATTACHMENTS-01] Editors can remove only attachment records belonging to an editable article.
export async function DELETE(request: Request, context: { params: Promise<{ articleId: string }> }) {
  const authorization = await authorizeEditor(request);
  if ("response" in authorization) return authorization.response;

  const { articleId } = await context.params;
  if (!articleIdSchema.safeParse(articleId).success) return Response.json({ error: "Identifiant d’article invalide." }, { status: 400 });

  try {
    const body = await readLimitedBody(request, 2048);
    let value: unknown;
    try {
      value = JSON.parse(body.toString("utf8"));
    } catch {
      return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
    }
    const parsed = articleAttachmentDeleteSchema.safeParse(value);
    if (!parsed.success) return Response.json({ error: "Identifiant de pièce jointe invalide." }, { status: 400 });

    const articleRef = getArticleReference(articleId);
    let removedAttachment: unknown;
    await adminDb.runTransaction(async transaction => {
      const articleSnapshot = await transaction.get(articleRef);
      if (!articleSnapshot.exists) throw new AttachmentRouteError(404, "Article introuvable.");
      const article = articleSnapshot.data()!;
      if (!canEditArticle(authorization.editor, article)) throw new AttachmentRouteError(403, "Modifiez uniquement vos brouillons.");
      const attachments = Array.isArray(article.attachments) ? article.attachments : [];
      removedAttachment = attachments.find((item: unknown) => item && typeof item === "object" && "id" in item && item.id === parsed.data.attachmentId);
      if (!removedAttachment) throw new AttachmentRouteError(404, "Pièce jointe introuvable.");
      transaction.update(articleRef, {
        attachments: attachments.filter((item: unknown) => !item || typeof item !== "object" || !("id" in item) || item.id !== parsed.data.attachmentId),
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    const parsedAttachment = articleAttachmentMetadataSchema.safeParse(removedAttachment);
    if (parsedAttachment.success) {
      await articleBucket.file(getAttachmentPath(articleId, parsedAttachment.data)).delete({ ignoreNotFound: true }).catch(error => {
        console.warn("Pièce jointe retirée de l’article mais fichier Storage non supprimé:", error);
      });
    }
    return Response.json({ removed: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}