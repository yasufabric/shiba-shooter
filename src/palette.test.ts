import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { digitRows, FONT_H, FONT_W, fontColors } from "./font";
import {
  BACKGROUND_COLORS,
  BULLET_COLORS,
  FONT_COLORS,
  GLYPH,
  NOSE,
  PALETTE,
  PARTICLE_COLORS,
  type PaletteColor,
} from "./palette";
import {
  NOSE_COL,
  NOSE_ROW,
  actorFrame,
  actorSize,
  poseNames,
  spriteColors,
  type PoseName,
  type SpriteName,
} from "./sprites";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function sourceFiles(): string[] {
  const files = readdirSync(join(ROOT, "src"))
    .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
    .map((name) => join(ROOT, "src", name));
  files.push(join(ROOT, "index.html"));
  return files;
}

function hexes(source: string): string[] {
  const found = new Set<string>();
  for (const match of source.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    found.add(`#${(match[1] ?? "").toLowerCase()}`);
  }
  for (const match of source.matchAll(/%23([0-9a-fA-F]{6})/g)) {
    found.add(`#${(match[1] ?? "").toLowerCase()}`);
  }
  return [...found];
}

function isolated(rows: readonly string[]): string[] {
  const height = rows.length;
  const problems: string[] = [];
  for (let y = 0; y < height; y++) {
    const row = rows[y] ?? "";
    for (let x = 0; x < row.length; x++) {
      if ((row[x] ?? ".") === ".") {
        continue;
      }
      let neighbors = 0;
      for (const [dy, dx] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        if ((rows[y + dy]?.[x + dx] ?? ".") !== ".") {
          neighbors += 1;
        }
      }
      if (neighbors === 0) {
        problems.push(`${x},${y}`);
      }
    }
  }
  return problems;
}

const ACTORS: readonly SpriteName[] = ["plane", "fry", "medium", "boss", "bone", "finger"];

function everyFrame(visit: (name: SpriteName, pose: PoseName, index: number, rows: readonly string[]) => void): void {
  for (const name of ACTORS) {
    for (const pose of poseNames()) {
      const count = pose === "idle" ? 2 : 4;
      for (let index = 0; index < count; index++) {
        visit(name, pose, index, actorFrame(name, pose, index));
      }
    }
  }
}

describe("palette", () => {
  it("keeps every drawn color inside the 23-color list", () => {
    expect(new Set(PALETTE).size).toBe(23);
    const allowed = new Set<string>(PALETTE);
    const groups: readonly PaletteColor[][] = [
      [...BACKGROUND_COLORS],
      [...BULLET_COLORS.player],
      [...BULLET_COLORS.enemy],
      [...PARTICLE_COLORS],
      [...FONT_COLORS],
      [NOSE],
    ];
    for (const group of groups) {
      expect(group.length).toBeGreaterThan(0);
      for (const color of group) {
        expect(allowed.has(color)).toBe(true);
      }
    }
    expect(NOSE).toBe("#fffaf0");
    for (const file of sourceFiles()) {
      const source = readFileSync(file, "utf8");
      expect(source.includes("rgba"), file).toBe(false);
      expect(source.includes("globalAlpha"), file).toBe(false);
      for (const color of hexes(source)) {
        expect(allowed.has(color), `${file} ${color}`).toBe(true);
      }
    }
    everyFrame((name, pose, index, rows) => {
      for (const color of spriteColors(rows)) {
        expect(allowed.has(color), `${name} ${pose} ${index}`).toBe(true);
      }
      for (const row of rows) {
        for (const pixel of row) {
          if (pixel !== ".") {
            expect(GLYPH[pixel], `${name} ${pixel}`).toBeTypeOf("string");
          }
        }
      }
    });
    for (const color of fontColors()) {
      expect(allowed.has(color)).toBe(true);
    }
  });

  it("builds the sprites, the nose, and the damage font on the pixel grid", () => {
    expect(actorSize("plane")).toEqual({ width: 32, height: 32 });
    expect(actorSize("fry")).toEqual({ width: 24, height: 24 });
    expect(actorSize("medium")).toEqual({ width: 24, height: 24 });
    expect(actorSize("boss").width).toBeGreaterThanOrEqual(64);
    expect(actorSize("boss").height).toBeGreaterThanOrEqual(64);
    everyFrame((name, pose, index, rows) => {
      const width = rows[0]?.length ?? 0;
      expect(rows.length, `${name} ${pose} ${index}`).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.length).toBe(width);
      }
      expect(isolated(rows), `${name} ${pose} ${index}`).toEqual([]);
      if (name === "plane") {
        expect(rows[NOSE_ROW]?.[NOSE_COL]).toBe("W");
        expect(rows[NOSE_ROW]?.[NOSE_COL + 1]).toBe("W");
        expect(rows[NOSE_ROW + 1]?.[NOSE_COL]).toBe("W");
        expect(rows[NOSE_ROW + 1]?.[NOSE_COL + 1]).toBe("W");
      }
    });
    for (let digit = 0; digit <= 9; digit++) {
      const rows = digitRows(digit);
      expect(rows).toHaveLength(FONT_H);
      for (const row of rows) {
        expect(row.length).toBe(FONT_W);
      }
      expect(isolated(rows), `digit ${digit}`).toEqual([]);
    }
  });
});
