import { z } from "zod";
import {
  MAX_ARTICLE_ATTACHMENT_BYTES,
  MAX_ARTICLE_ATTACHMENTS,
  SUPPORTED_UPLOAD_TYPES,
} from "./uploadValidation.ts";

export const articleIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{1,150}$/);
export const articleAttachmentIdSchema = z.string().uuid();
export const articleAttachmentTypeSchema = z.enum(SUPPORTED_UPLOAD_TYPES);

export const articleAttachmentMetadataSchema = z
  .object({
    id: articleAttachmentIdSchema,
    fileName: z.string().trim().min(1).max(160),
    contentType: articleAttachmentTypeSchema,
    extension: z.enum(["pdf", "jpg", "png", "webp"]),
    size: z.number().int().min(1).max(MAX_ARTICLE_ATTACHMENT_BYTES),
  })
  .strict()
  .refine((attachment) => {
    const expectedExtension: Record<string, string> = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    return expectedExtension[attachment.contentType] === attachment.extension;
  }, "L’extension doit correspondre au type du fichier.");

export const articleAttachmentListSchema = z
  .array(articleAttachmentMetadataSchema)
  .max(MAX_ARTICLE_ATTACHMENTS);

export const articleAttachmentDeleteSchema = z
  .object({
    attachmentId: articleAttachmentIdSchema,
  })
  .strict();

export type ArticleAttachmentMetadata = z.infer<
  typeof articleAttachmentMetadataSchema
>;
