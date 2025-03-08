// GridUtils.ts
export function calculateOffsets(
  containerWidth: number,
  containerHeight: number,
  mapWidthInTiles: number,
  mapHeightInTiles: number,
  tileWidth: number,
  tileHeight: number,
): { offsetX: number; offsetY: number } {
  const layerWidth = mapWidthInTiles * tileWidth;
  const layerHeight = mapHeightInTiles * tileHeight;
  return {
    offsetX: (containerWidth - layerWidth) / 2,
    offsetY: (containerHeight - layerHeight) / 2,
  };
}

export function getTileCoordinates(
  x: number,
  y: number,
  tileWidth: number,
  tileHeight: number,
  offsetX: number,
  offsetY: number,
): { tileX: number; tileY: number } {
  const adjustedX = x - offsetX;
  const adjustedY = y - offsetY;
  const tileX = Math.floor(adjustedX / tileWidth);
  const tileY = Math.floor(adjustedY / tileHeight);
  return { tileX, tileY };
}
