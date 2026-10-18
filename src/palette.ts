export const PALETTE = [
  "#6b2e12",
  "#a8521e",
  "#e08a3c",
  "#f6c27a",
  "#8a7f86",
  "#c9c0c4",
  "#fffaf0",
  "#2b1d3a",
  "#5a3f7a",
  "#9a7ccf",
  "#d8c8f0",
  "#7a4a00",
  "#e0a200",
  "#ffe066",
  "#fffbd1",
  "#8a0f3a",
  "#ff3d7f",
  "#ffb3cf",
  "#0b0f1e",
  "#18213d",
  "#2c3a63",
  "#4a5d8f",
  "#120b10",
] as const;

export type PaletteColor = (typeof PALETTE)[number];

export const INK = "#120b10" satisfies PaletteColor;
export const PAPER = "#fffaf0" satisfies PaletteColor;
export const NOSE = PAPER;

export const SHIBA = ["#6b2e12", "#a8521e", "#e08a3c", "#f6c27a"] as const satisfies readonly PaletteColor[];
export const WOOL = ["#8a7f86", "#c9c0c4", "#fffaf0"] as const satisfies readonly PaletteColor[];
export const CAT = ["#2b1d3a", "#5a3f7a", "#9a7ccf", "#d8c8f0"] as const satisfies readonly PaletteColor[];
export const GOLD = ["#7a4a00", "#e0a200", "#ffe066", "#fffbd1"] as const satisfies readonly PaletteColor[];
export const PINK = ["#8a0f3a", "#ff3d7f", "#ffb3cf"] as const satisfies readonly PaletteColor[];
export const NIGHT = ["#0b0f1e", "#18213d", "#2c3a63", "#4a5d8f"] as const satisfies readonly PaletteColor[];

export const BULLET_COLORS = {
  player: GOLD,
  enemy: PINK,
} as const;

export const PARTICLE_COLORS = [GOLD[0], GOLD[1], GOLD[2], GOLD[3], SHIBA[2], PAPER] as const satisfies readonly PaletteColor[];

export const FONT_COLORS = [GOLD[2], INK] as const satisfies readonly PaletteColor[];

export const BACKGROUND_COLORS = NIGHT;

export const GLYPH: Record<string, PaletteColor> = {
  d: SHIBA[0],
  s: SHIBA[1],
  m: SHIBA[2],
  l: SHIBA[3],
  a: WOOL[0],
  g: WOOL[1],
  W: WOOL[2],
  c: CAT[0],
  p: CAT[1],
  u: CAT[2],
  U: CAT[3],
  k: GOLD[0],
  y: GOLD[1],
  Y: GOLD[2],
  h: GOLD[3],
  r: PINK[0],
  R: PINK[1],
  P: PINK[2],
  o: INK,
};
