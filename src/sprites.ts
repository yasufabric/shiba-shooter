import { GLYPH, PALETTE, PAPER, type PaletteColor } from "./palette";

export const NOSE_COL = 15;
export const NOSE_ROW = 1;

export type PoseName = "idle" | "move" | "attack";

type Grid = string[][];
type Frame = string[];

type Actor = Record<PoseName, Frame[]>;

const POSES: readonly PoseName[] = ["idle", "move", "attack"];

function blank(width: number, height: number): Grid {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => "."));
}

function fill(grid: Grid, x: number, y: number, width: number, height: number, pixel: string): void {
  for (let row = y; row < y + height; row++) {
    const line = grid[row];
    if (line === undefined) {
      continue;
    }
    for (let col = x; col < x + width; col++) {
      if (col < 0 || col >= line.length) {
        continue;
      }
      line[col] = pixel;
    }
  }
}

function outline(grid: Grid): Frame {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const copy = grid.map((row) => row.slice());
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((copy[y]?.[x] ?? ".") !== ".") {
        continue;
      }
      let touch = false;
      for (const [dy, dx] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        const near = grid[y + dy]?.[x + dx];
        if (near !== undefined && near !== ".") {
          touch = true;
        }
      }
      if (touch) {
        const line = copy[y];
        if (line !== undefined) {
          line[x] = "o";
        }
      }
    }
  }
  return copy.map((row) => row.join(""));
}

function stampNose(grid: Grid): void {
  fill(grid, NOSE_COL, NOSE_ROW, 2, 2, "W");
}

function plane(wingX: number, wingY: number, blink: boolean, muzzle: number): Frame {
  const grid = blank(32, 32);
  fill(grid, 13, 3, 6, 4, "l");
  fill(grid, 14, 5, 4, 2, "m");
  fill(grid, 8, 8, 16, 10, "m");
  fill(grid, 10, 6, 12, 3, "m");
  fill(grid, 9, 8, 7, 5, "l");
  fill(grid, 17, 12, 6, 5, "s");
  fill(grid, 6, 9, 4, 6, "d");
  fill(grid, 22, 9, 4, 6, "d");
  fill(grid, 7, 7, 3, 3, "s");
  fill(grid, 22, 7, 3, 3, "s");
  fill(grid, 7, 10, 2, 3, "m");
  fill(grid, 23, 10, 2, 3, "m");
  fill(grid, 12, 17, 8, 8, "m");
  fill(grid, 12, 17, 4, 4, "l");
  fill(grid, 16, 21, 4, 4, "s");
  fill(grid, 2 + wingX, 18 + wingY, 10, 4, "y");
  fill(grid, 2 + wingX, 18 + wingY, 10, 2, "Y");
  fill(grid, 2 + wingX, 20 + wingY, 10, 2, "k");
  fill(grid, 20 - wingX, 18 + wingY, 10, 4, "y");
  fill(grid, 20 - wingX, 18 + wingY, 10, 2, "Y");
  fill(grid, 20 - wingX, 20 + wingY, 10, 2, "k");
  fill(grid, 14, 25, 4, 5, "d");
  fill(grid, 15, 27, 2, 3, "s");
  if (blink) {
    fill(grid, 11, 12, 4, 2, "d");
    fill(grid, 17, 12, 4, 2, "d");
  } else {
    fill(grid, 11, 11, 4, 4, "d");
    fill(grid, 17, 11, 4, 4, "d");
    fill(grid, 11, 11, 2, 2, "W");
    fill(grid, 17, 11, 2, 2, "W");
  }
  fill(grid, 14, 15, 4, 2, "l");
  stampNose(grid);
  if (muzzle === 1) {
    fill(grid, 13, 0, 6, 1, "Y");
    fill(grid, 14, 3, 4, 2, "h");
  } else if (muzzle === 2) {
    fill(grid, 14, 0, 4, 1, "y");
    fill(grid, 15, 3, 2, 2, "Y");
  } else if (muzzle === 3) {
    fill(grid, 15, 0, 2, 1, "k");
  } else if (muzzle === 0) {
    fill(grid, 15, 3, 2, 1, "k");
  }
  stampNose(grid);
  return outline(grid);
}

function makePlane(): Actor {
  return {
    idle: [plane(0, 0, false, -1), plane(0, 0, true, -1)],
    move: [plane(-1, 0, false, -1), plane(0, 0, false, -1), plane(1, 0, false, -1), plane(0, 1, false, -1)],
    attack: [plane(0, 0, false, 0), plane(0, 0, false, 1), plane(0, 0, false, 2), plane(0, 0, false, 3)],
  };
}

function cat(kind: "fry" | "medium", blink: boolean, bob: number, mouth: number): Frame {
  const grid = blank(24, 24);
  const dark = kind === "fry" ? "c" : "c";
  const mid = kind === "fry" ? "p" : "p";
  const lit = kind === "fry" ? "u" : "u";
  const pale = kind === "fry" ? "U" : "h";
  fill(grid, 4, 6 + bob, 16, 12, mid);
  fill(grid, 5, 7 + bob, 7, 6, lit);
  fill(grid, 13, 12 + bob, 6, 5, dark);
  fill(grid, 4, 3 + bob, 5, 6, dark);
  fill(grid, 15, 3 + bob, 5, 6, dark);
  fill(grid, 6, 4 + bob, 2, 3, pale);
  fill(grid, 16, 4 + bob, 2, 3, pale);
  fill(grid, 7, 16 + bob, 10, 5, mid);
  fill(grid, 8, 17 + bob, 4, 2, lit);
  fill(grid, 5, 20 + bob, 4, 2, dark);
  fill(grid, 15, 20 + bob, 4, 2, dark);
  if (kind === "medium") {
    fill(grid, 10, 18 + bob, 4, 3, "y");
    fill(grid, 11, 19 + bob, 2, 1, "h");
  }
  if (blink) {
    fill(grid, 7, 11 + bob, 4, 2, dark);
    fill(grid, 13, 11 + bob, 4, 2, dark);
  } else {
    fill(grid, 7, 10 + bob, 4, 4, dark);
    fill(grid, 13, 10 + bob, 4, 4, dark);
    fill(grid, 7, 10 + bob, 2, 2, "W");
    fill(grid, 13, 10 + bob, 2, 2, "W");
  }
  if (mouth === 1) {
    fill(grid, 10, 15 + bob, 4, 2, dark);
    fill(grid, 11, 15 + bob, 2, 1, pale);
  } else if (mouth === 2) {
    fill(grid, 10, 15 + bob, 4, 1, dark);
  } else if (mouth === 0 || mouth === 3) {
    fill(grid, 11, 15 + bob, 2, 1, dark);
  }
  return outline(grid);
}

function makeCat(kind: "fry" | "medium"): Actor {
  return {
    idle: [cat(kind, false, 0, -1), cat(kind, true, 0, -1)],
    move: [cat(kind, false, 0, -1), cat(kind, false, 1, -1), cat(kind, false, 0, -1), cat(kind, false, -1, -1)],
    attack: [cat(kind, false, 0, 0), cat(kind, false, 0, 1), cat(kind, false, 0, 2), cat(kind, false, 0, 3)],
  };
}

function scale2(rows: readonly string[]): string[] {
  const scaled: string[] = [];
  for (const row of rows) {
    let wide = "";
    for (const pixel of row) {
      wide += pixel + pixel;
    }
    scaled.push(wide, wide);
  }
  return scaled;
}

function boss(blink: boolean, mouth: number): Frame {
  const grid = blank(32, 32);
  const put = (x: number, y: number, w: number, h: number, pixel: string) => {
    fill(grid, x, y - 4, w, h, pixel);
  };
  put(6, 8, 20, 16, "p");
  put(8, 6, 16, 4, "p");
  put(7, 9, 9, 8, "u");
  put(17, 16, 8, 7, "c");
  put(5, 6, 6, 8, "c");
  put(21, 6, 6, 8, "c");
  put(7, 7, 3, 4, "U");
  put(22, 7, 3, 4, "U");
  put(8, 22, 16, 6, "p");
  put(9, 23, 6, 3, "u");
  put(6, 26, 5, 3, "c");
  put(21, 26, 5, 3, "c");
  put(10, 24, 12, 3, "y");
  put(14, 23, 4, 2, "h");
  put(12, 27, 8, 3, "k");
  if (blink) {
    put(9, 14, 5, 2, "c");
    put(18, 14, 5, 2, "c");
  } else {
    put(9, 13, 5, 5, "c");
    put(18, 13, 5, 5, "c");
    put(9, 13, 2, 2, "W");
    put(18, 13, 2, 2, "W");
    put(12, 16, 2, 2, "c");
    put(18, 16, 2, 2, "c");
  }
  if (mouth === 1) {
    put(12, 19, 8, 3, "c");
    put(14, 20, 4, 1, "R");
  } else if (mouth === 2) {
    put(13, 19, 6, 2, "c");
  } else {
    put(14, 19, 4, 1, "c");
  }
  return grid.map((row) => row.join(""));
}

function scroll(rows: readonly string[], dy: number): string[] {
  if (dy === 0) {
    return rows.slice();
  }
  const width = rows[0]?.length ?? 0;
  const blankRow = ".".repeat(width);
  return rows.map((_, y) => rows[y - dy] ?? blankRow);
}

function finishBoss(blink: boolean, mouth: number, bob: number): Frame {
  const scaled = scale2(scroll(boss(blink, mouth), bob));
  return outline(scaled.map((row) => row.split("")));
}

function makeBoss(): Actor {
  return {
    idle: [finishBoss(false, -1, 0), finishBoss(true, -1, 0)],
    move: [finishBoss(false, -1, 0), finishBoss(false, -1, 1), finishBoss(false, -1, 0), finishBoss(false, -1, -1)],
    attack: [finishBoss(false, 0, 0), finishBoss(false, 1, 0), finishBoss(false, 2, 0), finishBoss(false, 3, 0)],
  };
}

function bone(): Frame {
  const grid = blank(12, 8);
  fill(grid, 1, 1, 3, 6, "l");
  fill(grid, 8, 1, 3, 6, "l");
  fill(grid, 3, 3, 6, 2, "W");
  fill(grid, 2, 2, 2, 2, "W");
  fill(grid, 8, 2, 2, 2, "W");
  fill(grid, 2, 4, 2, 2, "g");
  fill(grid, 8, 4, 2, 2, "g");
  return outline(grid);
}

function paw(): Frame {
  const grid = blank(16, 20);
  fill(grid, 4, 7, 8, 10, "m");
  fill(grid, 5, 8, 4, 4, "l");
  fill(grid, 6, 2, 3, 6, "l");
  fill(grid, 2, 4, 3, 5, "l");
  fill(grid, 11, 4, 3, 5, "l");
  fill(grid, 6, 3, 2, 2, "W");
  fill(grid, 2, 5, 2, 2, "W");
  fill(grid, 12, 5, 2, 2, "W");
  fill(grid, 6, 13, 4, 2, "s");
  return outline(grid);
}

function still(frame: Frame): Actor {
  return {
    idle: [frame, frame],
    move: [frame, frame, frame, frame],
    attack: [frame, frame, frame, frame],
  };
}

const ACTORS = {
  plane: makePlane(),
  fry: makeCat("fry"),
  medium: makeCat("medium"),
  boss: makeBoss(),
  bone: still(bone()),
  finger: still(paw()),
};

export type SpriteName = keyof typeof ACTORS;

export function poseNames(): readonly PoseName[] {
  return POSES;
}

export function poseLength(name: SpriteName, pose: PoseName): number {
  return ACTORS[name][pose].length;
}

export function actorFrame(name: SpriteName, pose: PoseName, index: number): Frame {
  const frames = ACTORS[name][pose];
  return frames[index] ?? frames[0] ?? [];
}

export function spriteColors(rows: readonly string[]): PaletteColor[] {
  const found = new Set<PaletteColor>();
  for (const row of rows) {
    for (const pixel of row) {
      const color = GLYPH[pixel];
      if (color !== undefined) {
        found.add(color);
      }
    }
  }
  return [...found];
}

type Baked = {
  color: HTMLCanvasElement;
  white: HTMLCanvasElement;
  mask: Uint8Array;
  index: Uint8Array;
  width: number;
  height: number;
};

const baked = new Map<string, Baked>();
const colorIndex = new Map<string, number>(PALETTE.map((color, index) => [color, index + 1]));

function bake(rows: readonly string[]): Baked {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const color = document.createElement("canvas");
  const white = document.createElement("canvas");
  color.width = width;
  color.height = height;
  white.width = width;
  white.height = height;
  const ctx = color.getContext("2d");
  const whiteCtx = white.getContext("2d");
  if (ctx === null || whiteCtx === null) {
    throw new Error("missing sprite context");
  }
  ctx.imageSmoothingEnabled = false;
  whiteCtx.imageSmoothingEnabled = false;
  const mask = new Uint8Array(width * height);
  const index = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const row = rows[y] ?? "";
    for (let x = 0; x < width; x++) {
      const pixel = row[x] ?? ".";
      const paint = GLYPH[pixel];
      if (paint === undefined) {
        continue;
      }
      ctx.fillStyle = paint;
      ctx.fillRect(x, y, 1, 1);
      whiteCtx.fillStyle = PAPER;
      whiteCtx.fillRect(x, y, 1, 1);
      const offset = y * width + x;
      mask[offset] = 1;
      index[offset] = colorIndex.get(paint) ?? 0;
    }
  }
  return { color, white, mask, index, width, height };
}

function bakedFrame(name: SpriteName, pose: PoseName, index: number): Baked {
  const key = `${name}:${pose}:${index}`;
  const cached = baked.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const sheet = bake(actorFrame(name, pose, index));
  baked.set(key, sheet);
  return sheet;
}

export function drawActor(
  ctx: CanvasRenderingContext2D,
  name: SpriteName,
  pose: PoseName,
  index: number,
  x: number,
  y: number,
  quarter: number,
  tint: PaletteColor | null,
): void {
  const sheet = bakedFrame(name, pose, index);
  const turn = ((quarter % 4) + 4) % 4;
  if (turn === 0 && tint === null) {
    ctx.drawImage(sheet.color, x, y);
    return;
  }
  if (turn === 0 && tint === PAPER) {
    ctx.drawImage(sheet.white, x, y);
    return;
  }
  for (let py = 0; py < sheet.height; py++) {
    for (let px = 0; px < sheet.width; px++) {
      const offset = py * sheet.width + px;
      if (sheet.mask[offset] !== 1) {
        continue;
      }
      let ox = px;
      let oy = py;
      if (turn === 1) {
        ox = sheet.height - 1 - py;
        oy = px;
      } else if (turn === 2) {
        ox = sheet.width - 1 - px;
        oy = sheet.height - 1 - py;
      } else if (turn === 3) {
        ox = py;
        oy = sheet.width - 1 - px;
      }
      const indexed = sheet.index[offset] ?? 0;
      const paint = tint ?? PALETTE[indexed - 1] ?? PAPER;
      ctx.fillStyle = paint;
      ctx.fillRect(x + ox, y + oy, 1, 1);
    }
  }
}

export function actorSize(name: SpriteName, pose: PoseName = "idle"): { width: number; height: number } {
  const frame = actorFrame(name, pose, 0);
  return { width: frame[0]?.length ?? 0, height: frame.length };
}
