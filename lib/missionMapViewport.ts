export type ViewportRect = Pick<DOMRect, "top" | "right" | "bottom" | "left" | "height" | "width">;

export function getBottomOverlayOcclusion(
  mapRect: ViewportRect,
  overlayRect: ViewportRect,
): number {
  const overlapsHorizontally = overlayRect.left < mapRect.right && overlayRect.right > mapRect.left;
  const overlapsVertically = overlayRect.top < mapRect.bottom && overlayRect.bottom > mapRect.top;
  if (!overlapsHorizontally || !overlapsVertically) return 0;

  return Math.max(
    0,
    Math.min(mapRect.bottom, overlayRect.bottom) - Math.max(mapRect.top, overlayRect.top),
  );
}

export function getMapFocusPanOffset(occlusionHeight: number): number {
  return Math.max(0, Math.round(occlusionHeight / 2));
}
