import assert from "node:assert/strict";
import test from "node:test";
import {
  articleAttachmentDeleteSchema,
  articleAttachmentListSchema,
  articleAttachmentMetadataSchema,
  articleIdSchema,
} from "../lib/articleAttachmentValidation.ts";
import {
  detectSupportedUploadType,
  MAX_ARTICLE_ATTACHMENT_BYTES,
  MAX_ARTICLE_ATTACHMENTS,
  sanitizeUploadFileName,
} from "../lib/uploadValidation.ts";

// [SPEC-ARTICLE-ATTACHMENTS-01] Bound article attachments and validate their stored metadata.
test("valide les métadonnées et les limites des pièces jointes d’article", () => {
  const valid = {
    id: "d9428888-122b-4c2c-a2a8-1193d3ebf504",
    fileName: "compte-rendu.pdf",
    contentType: "application/pdf",
    extension: "pdf",
    size: 1024,
  };

  assert.equal(articleIdSchema.safeParse("article_123").success, true);
  assert.equal(articleIdSchema.safeParse("../secret").success, false);
  assert.equal(articleAttachmentMetadataSchema.safeParse(valid).success, true);
  assert.equal(
    articleAttachmentMetadataSchema.safeParse({ ...valid, extension: "png" }).success,
    false,
  );
  assert.equal(
    articleAttachmentMetadataSchema.safeParse({
      ...valid,
      size: MAX_ARTICLE_ATTACHMENT_BYTES + 1,
    }).success,
    false,
  );
  assert.equal(
    articleAttachmentListSchema.safeParse(
      Array.from({ length: 10 }, (_, index) => ({
        ...valid,
        id: `d9428888-122b-4c2c-a2a8-${String(index).padStart(12, "0")}`,
      })),
    ).success,
    true,
  );
  assert.equal(
    articleAttachmentListSchema.safeParse(
      Array.from({ length: 11 }, (_, index) => ({
        ...valid,
        id: `d9428888-122b-4c2c-a2a8-${String(index).padStart(12, "0")}`,
      })),
    ).success,
    false,
  );
  assert.equal(articleAttachmentDeleteSchema.safeParse({ attachmentId: valid.id }).success, true);
  assert.equal(MAX_ARTICLE_ATTACHMENTS, 10);
});

// [SPEC-ARTICLE-ATTACHMENTS-01] Accept supported file signatures only and sanitize names.
test("détecte le type réel et neutralise les chemins de fichier", () => {
  assert.deepEqual(detectSupportedUploadType(new TextEncoder().encode("%PDF-1.7")), {
    contentType: "application/pdf",
    extension: "pdf",
  });
  assert.equal(detectSupportedUploadType(new TextEncoder().encode("not a document")), null);
  assert.equal(sanitizeUploadFileName("../../rapport.pdf"), "_.._rapport.pdf");
});
