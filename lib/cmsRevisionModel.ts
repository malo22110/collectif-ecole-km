export type CmsPageData = Record<string, unknown>;

export function buildCmsRevisionSnapshot(
  currentData: CmsPageData,
  changedBy: string,
  origin: "visual" | "expert" | "draft" | "restore",
) {
  const version = currentData.version;
  return {
    data: currentData,
    version:
      typeof version === "number" &&
      Number.isSafeInteger(version) &&
      version >= 0
        ? version
        : 0,
    changedBy,
    origin,
  };
}

export function buildVersionedCmsPageData(
  currentData: CmsPageData,
  proposedData: CmsPageData,
): CmsPageData {
  const publishedData = { ...proposedData };
  delete publishedData.version;

  const currentVersion = currentData.version;
  const nextVersion =
    typeof currentVersion === "number" &&
    Number.isSafeInteger(currentVersion) &&
    currentVersion >= 0
      ? currentVersion + 1
      : 1;

  return { ...publishedData, version: nextVersion };
}
