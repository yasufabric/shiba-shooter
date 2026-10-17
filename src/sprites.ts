const PLANE = [
  ".......W.......",
  "......WWW......",
  "...D..WBW..D...",
  "..DDD.WBW.DDD..",
  "..DEDWWBWWDED..",
  ".GG.WWKKKWW.GG.",
  "GGGG.WCKCW.GGGG",
  ".GGG.CCCCC.GGG.",
  "..GG.CCCCC.GG..",
  ".....CCCCC.....",
  ".....CBBBC.....",
  "....CCBBBCC....",
  "....CBBBBBC....",
  ".....BBBBB.....",
  "......BBB......",
  ".......B.......",
];

const PALETTE: Record<string, string> = {
  W: "#fff8ea",
  C: "#f3d7b0",
  B: "#c4844a",
  D: "#5c3318",
  E: "#e7a0b4",
  G: "#f0c040",
  K: "#1c140e",
};

export const PLANE_NOSE_X = 7;
export const PLANE_NOSE_Y = 0;

function bake(rows: readonly string[]): HTMLCanvasElement {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("missing sprite context");
  }
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < height; y++) {
    const row = rows[y] ?? "";
    for (let x = 0; x < width; x++) {
      const pixel = row[x] ?? ".";
      const color = PALETTE[pixel];
      if (color === undefined) {
        continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

let plane: HTMLCanvasElement | null = null;

export function planeSprite(): HTMLCanvasElement {
  if (plane === null) {
    plane = bake(PLANE);
  }
  return plane;
}
