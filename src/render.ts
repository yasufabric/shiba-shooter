import {
  BEAM_HALF,
  damageNumbers,
  showFinger,
  shotForBones,
  visitBullets,
  visitEnemies,
  visitPickups,
  type EnemyKind,
  type Run,
} from "./sim";
import { PLANE_NOSE_X, PLANE_NOSE_Y, sprite, type SpriteName } from "./sprites";
import { WORLD_H, WORLD_W } from "./viewport";

const DIGITS = [
  ["###", "#.#", "#.#", "#.#", "###"],
  [".#.", "##.", ".#.", ".#.", "###"],
  ["###", "..#", "###", "#..", "###"],
  ["###", "..#", "###", "..#", "###"],
  ["#.#", "#.#", "###", "..#", "..#"],
  ["###", "#..", "###", "..#", "###"],
  ["###", "#..", "###", "#.#", "###"],
  ["###", "..#", "..#", "..#", "..#"],
  ["###", "#.#", "###", "#.#", "###"],
  ["###", "#.#", "###", "..#", "###"],
];

const ENEMY_SPRITE: Record<EnemyKind, SpriteName> = {
  fry: "fry",
  medium: "medium",
  boss: "boss",
};

function drawDigits(
  ctx: CanvasRenderingContext2D,
  value: number,
  right: number,
  top: number,
  color: string,
): void {
  const text = String(Math.max(0, Math.floor(value)));
  ctx.fillStyle = color;
  let cursor = right - text.length * 4;
  for (const char of text) {
    const rows = DIGITS[Number(char)] ?? DIGITS[0];
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y] ?? "";
      for (let x = 0; x < row.length; x++) {
        if (row[x] === "#") {
          ctx.fillRect(cursor + x, top + y, 1, 1);
        }
      }
    }
    cursor += 4;
  }
}

export function drawRun(ctx: CanvasRenderingContext2D, run: Run): void {
  visitPickups(run, (x, y) => {
    const bone = sprite("bone");
    ctx.drawImage(bone, Math.round(x) - 4, Math.round(y) - 1);
  });

  visitEnemies(run, (x, y, kind) => {
    const sheet = sprite(ENEMY_SPRITE[kind]);
    ctx.drawImage(sheet, Math.round(x) - (sheet.width >> 1), Math.round(y) - (sheet.height >> 1));
  });

  const shot = shotForBones(run.bones);
  if (shot.kind === "laser") {
    const x = Math.round(run.playerX);
    const y = Math.round(run.playerY);
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#ffd76a";
    ctx.fillRect(x - BEAM_HALF, 0, BEAM_HALF * 2, y);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#fff4c2";
    ctx.fillRect(x - 4, 0, 8, y);
    ctx.restore();
  }

  ctx.fillStyle = "#ffd45a";
  visitBullets(run, (x, y, kind) => {
    if (kind === "gold") {
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 6);
    }
  });
  ctx.fillStyle = "#fff1a8";
  visitBullets(run, (x, y, kind) => {
    if (kind === "mote") {
      ctx.fillRect(Math.round(x), Math.round(y) - 2, 2, 4);
    }
  });
  ctx.fillStyle = "#ff6d9a";
  visitBullets(run, (x, y, kind) => {
    if (kind === "pink") {
      ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
    }
  });

  const blink = run.invuln > 0 && Math.floor(run.time * 16) % 2 === 0;
  if (!blink) {
    ctx.drawImage(
      sprite("plane"),
      Math.round(run.playerX) - PLANE_NOSE_X,
      Math.round(run.playerY) - PLANE_NOSE_Y,
    );
  }
  const noseX = Math.round(run.playerX);
  const noseY = Math.round(run.playerY);
  ctx.fillStyle = "#fff4c4";
  ctx.fillRect(noseX - 1, noseY - 1, 3, 3);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(noseX, noseY, 1, 1);

  for (const pop of damageNumbers(run)) {
    drawDigits(ctx, pop.value, Math.round(pop.x) + 6, Math.round(pop.y), "#ffd45a");
  }

  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < run.hp ? "#f4f0d8" : "#243056";
    ctx.fillRect(3 + i * 4, 3, 2, 2);
  }
  drawDigits(ctx, run.best, WORLD_W - 3, 3, "#f4f0d8");

  if (showFinger(run)) {
    const x = 22 + (Math.sin(run.time * 2.6) * 0.5 + 0.5) * 76;
    ctx.drawImage(sprite("finger"), Math.round(x), WORLD_H - 12);
  }

  if (run.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, run.flash * 1.6)})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
}
