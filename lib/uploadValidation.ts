export const MAX_ARTICLE_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ARTICLE_ATTACHMENTS = 10;

export const SUPPORTED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function detectSupportedUploadType(bytes: Uint8Array) {
  if (
    bytes.length >= 5 &&
    new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-"
  ) {
    return { contentType: "application/pdf", extension: "pdf" };
  }

  if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => bytes[index] === byte,
    )
  ) {
    return { contentType: "image/png", extension: "png" };
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }

  if (
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP"
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }

  return null;
}

export function sanitizeUploadFileName(fileName: string) {
  const cleaned = fileName
    .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 160);
  return cleaned || "document";
}
