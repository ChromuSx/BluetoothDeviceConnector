// Shared design tokens for the promo video.
export const COLORS = {
  // Light, premium background (matches the Elgato marketplace promo style)
  bgTop: "#eef1f8",
  bgBottom: "#f8fafc",

  // Stream Deck device body
  deviceTop: "#2a2d34",
  deviceBottom: "#141619",
  deviceEdge: "#3a3e47",
  keyEmpty: "#202329",
  keyEmptyEdge: "#2c3038",

  // Brand / text
  navy: "#284763",
  navySoft: "#52708c",
  ink: "#1f2733",
  inkSoft: "#6b7686",
  white: "#ffffff",
  blue: "#0a84ff",
  blueBright: "#1e9bff",

  // Connection states
  connecting: "#ffab00",
  connected: "#23c552",
  error: "#e0394b",

  // Panel (property inspector)
  panel: "#1c1f26",
  panelEdge: "#2c313b",
  panelText: "#c9d2df",
  panelMuted: "#7f8a9b",
  panelRow: "#252a33",
  panelRowHi: "#0a84ff",
} as const;

export const FONT =
  '"Segoe UI Variable", "Segoe UI", -apple-system, system-ui, Roboto, sans-serif';

export const FPS = 60;
