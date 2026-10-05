export function cleanDeletedSignatureReference(
  value: unknown,
  deletedSignatureId: string,
) {
  const candidates = Array.isArray(value)
    ? value.filter(
        (candidate): candidate is string =>
          typeof candidate === "string" && candidate !== deletedSignatureId,
      )
    : [];
  return { candidates, potentialDuplicate: candidates.length > 0 };
}
