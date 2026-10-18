import { FONT_COLORS, GLYPH, type PaletteColor } from "./palette";

const DIGITS = [
  [
    ".oooooo.",
    "oYYYYYYo",
    "oYYooYYo",
    "oYYooYYo",
    "oYYooYYo",
    "oYYooYYo",
    "oYYooYYo",
    "oYYooYYo",
    "oYYYYYYo",
    ".oooooo.",
  ],
  [
    "..oYYo..",
    ".oYYYo..",
    "oYYYYo..",
    "..oYYo..",
    "..oYYo..",
    "..oYYo..",
    "..oYYo..",
    "..oYYo..",
    "oYYYYYYo",
    "oooooooo",
  ],
  [
    ".oooooo.",
    "oYYYYYYo",
    "oYYooYYo",
    "....oYYo",
    "...oYYo.",
    "..oYYo..",
    ".oYYo...",
    "oYYo....",
    "oYYYYYYo",
    "oooooooo",
  ],
  [
    ".oooooo.",
    "oYYYYYYo",
    "....oYYo",
    "...oYYo.",
    "..oYYYo.",
    "...oYYo.",
    "....oYYo",
    "oYYooYYo",
    "oYYYYYYo",
    ".oooooo.",
  ],
  [
    "...oYYo.",
    "..oYYYo.",
    ".oYoYYo.",
    "oYYoYYo.",
    "oYYYYYYo",
    "ooooYYoo",
    "....oYo.",
    "....oYo.",
    "....oYo.",
    "....oo..",
  ],
  [
    "oooooooo",
    "oYYYYYYY",
    "oYYo....",
    "oYYYYo..",
    "oYYYYYo.",
    "....oYYo",
    "....oYYo",
    "oYYooYYo",
    ".oYYYYo.",
    "..oooo..",
  ],
  [
    "..oooo..",
    ".oYYYYo.",
    "oYYo....",
    "oYYo....",
    "oYYYYo..",
    "oYYYYYo.",
    "oYYooYYo",
    "oYYooYYo",
    ".oYYYYo.",
    "..oooo..",
  ],
  [
    "oooooooo",
    "oYYYYYYo",
    "....oYYo",
    "...oYYo.",
    "...oYo..",
    "..oYYo..",
    "..oYo...",
    "..oYo...",
    "..oYo...",
    "..oo....",
  ],
  [
    "..oooo..",
    ".oYYYYo.",
    "oYYooYYo",
    "oYYooYYo",
    ".oYYYYo.",
    "oYYooYYo",
    "oYYooYYo",
    "oYYooYYo",
    ".oYYYYo.",
    "..oooo..",
  ],
  [
    "..oooo..",
    ".oYYYYo.",
    "oYYooYYo",
    "oYYooYYo",
    ".oYYYYYo",
    "..oYYYo.",
    "....oYYo",
    "....oYYo",
    ".oYYYYo.",
    "..oooo..",
  ],
] as const;

export const FONT_W = 8;
export const FONT_H = 10;

export function digitRows(digit: number): readonly string[] {
  return DIGITS[digit] ?? DIGITS[0];
}

export function fontColors(): readonly PaletteColor[] {
  return FONT_COLORS;
}

function cell(numer: number, denom: number, index: number): number {
  return Math.floor((index * numer) / denom);
}

export function drawDigits(
  ctx: CanvasRenderingContext2D,
  value: number,
  x: number,
  y: number,
  numer: number,
  denom: number,
): void {
  const text = String(Math.max(0, Math.floor(value)));
  const advance = cell(numer, denom, FONT_W) + numer;
  let cursor = x;
  for (const char of text) {
    const rows = digitRows(Number(char));
    for (let py = 0; py < rows.length; py++) {
      const row = rows[py] ?? "";
      const y0 = y + cell(numer, denom, py);
      const y1 = y + cell(numer, denom, py + 1);
      for (let px = 0; px < row.length; px++) {
        const pixel = row[px] ?? ".";
        const color = GLYPH[pixel];
        if (color === undefined) {
          continue;
        }
        const x0 = cursor + cell(numer, denom, px);
        const x1 = cursor + cell(numer, denom, px + 1);
        ctx.fillStyle = color;
        ctx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
      }
    }
    cursor += advance;
  }
}

export function digitSpan(count: number, numer: number, denom: number): number {
  if (count <= 0) {
    return 0;
  }
  const advance = cell(numer, denom, FONT_W) + numer;
  return count * advance - numer;
}
