/**
 * Map tile sources (Leaflet).
 *
 * CARTO basemaps (basemaps.cartocdn.com) now require an API key and serve an
 * "API KEY REQUIRED" watermark tile otherwise — don't use them. Esri's public
 * basemaps work without a key but must carry the Esri attribution.
 */

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

// Dark UI maps: base layer + labels layer. Dark Gray Canvas has native tiles to
// z16; Leaflet upscales beyond that via maxNativeZoom.
export const DARK_BASE_TILES = {
  url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
  options: { maxNativeZoom: 16, maxZoom: 19, attribution: 'Tiles &copy; Esri' },
};

export const DARK_LABEL_TILES = {
  url: `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
  options: { maxNativeZoom: 16, maxZoom: 19 },
};

// Street-level detail (engineer navigation)
export const STREET_TILES = {
  url: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`,
  options: { maxNativeZoom: 19, maxZoom: 19, attribution: 'Tiles &copy; Esri' },
};

export const SATELLITE_TILES = {
  url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
  options: { maxNativeZoom: 19, maxZoom: 19, attribution: 'Tiles &copy; Esri' },
};
