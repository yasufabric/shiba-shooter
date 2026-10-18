import { digitSpan, drawDigits } from "./font";
import {
  GOLD,
  INK,
  NIGHT,
  NOSE,
  PAPER,
  PARTICLE_COLORS,
  PINK,
  SHIBA,
  type PaletteColor,
} from "./palette";
import {
  ATTACK_TIME,
  BEAM_HALF,
  DEATH_TIME,
  NOSE_SIZE,
  damageNumbers,
  showFinger,
  shotForBones,
  visitBullets,
  visitEnemies,
  visitFx,
  visitPickups,
  type BulletKind,
  type EnemyKind,
  type Run,
} from "./sim";
import {
  NOSE_COL,
  NOSE_ROW,
  actorSize,
  drawActor,
  type PoseName,
  type SpriteName,
} from "./sprites";
import { WORLD_H, WORLD_W } from "./viewport";

const ENEMY_SPRITE: Record<EnemyKind, SpriteName> = {
  fry: "fry",
  medium: "medium",
  boss: "boss",
};

function snap(value: number): number {
  return Math.round(value);
}

function goldAt(time: number, salt: number): PaletteColor {
  const index = Math.abs(Math.floor(time * 12) + salt) % GOLD.length;
  return GOLD[index] ?? GOLD[0];
}

function playerPose(run: Run): PoseName {
  if (run.moving) {
    return "move";
  }
  if (Math.floor(run.time * 12) % 8 < 4) {
    return "attack";
  }
  return "idle";
}

function frameOf(pose: PoseName, time: number, poseTimer: number): number {
  switch (pose) {
    case "idle":
      return Math.floor(time / 0.5) % 2;
    case "move":
      return Math.floor(time * 12) % 4;
    case "attack": {
      if (poseTimer > 0) {
        const elapsed = ATTACK_TIME - poseTimer;
        return Math.max(0, Math.min(3, Math.floor(elapsed / (ATTACK_TIME / 4))));
      }
      return Math.floor(time * 12) % 4;
    }
    default: {
      const unexpected: never = pose;
      return unexpected;
    }
  }
}

function enemyPose(kind: EnemyKind, pose: number, vx: number): PoseName {
  if (pose > 0) {
    return "attack";
  }
  if (kind === "boss" || Math.abs(vx) > 0.5) {
    return "move";
  }
  return "idle";
}

function deathQuadrant(remaining: number): number {
  const elapsed = DEATH_TIME - Math.max(0, remaining);
  return Math.max(0, Math.min(3, Math.floor(elapsed / (DEATH_TIME / 4))));
}

function spriteFromCode(code: number): SpriteName {
  if (code === 2) {
    return "medium";
  }
  if (code === 3) {
    return "boss";
  }
  return "fry";
}

function drawBeam(ctx: CanvasRenderingContext2D, run: Run): void {
  if (shotForBones(run.bones).kind !== "laser") {
    return;
  }
  const left = snap(run.playerX) - BEAM_HALF;
  const bottom = snap(run.playerY);
  for (let i = 0; i < BEAM_HALF * 2; i += 3) {
    ctx.fillStyle = goldAt(run.time, i);
    ctx.fillRect(left + i, 0, 1, Math.max(0, bottom));
  }
}

function drawBullet(ctx: CanvasRenderingContext2D, run: Run, x: number, y: number, kind: BulletKind): void {
  const sx = snap(x);
  const sy = snap(y);
  switch (kind) {
    case "gold":
      ctx.fillStyle = GOLD[1];
      ctx.fillRect(sx - 1, sy - 3, 3, 6);
      ctx.fillStyle = GOLD[2];
      ctx.fillRect(sx, sy - 2, 1, 4);
      break;
    case "mote":
      ctx.fillStyle = goldAt(run.time, sx + sy);
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
      break;
    case "pink":
      ctx.fillStyle = PINK[1];
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
      ctx.fillStyle = PINK[2];
      ctx.fillRect(sx - 2, sy - 2, 2, 2);
      ctx.fillStyle = PINK[0];
      ctx.fillRect(sx, sy, 2, 2);
      break;
    default: {
      const unexpected: never = kind;
      throw new Error(`unexpected bullet ${String(unexpected)}`);
    }
  }
}

function drawBoom(ctx: CanvasRenderingContext2D, x: number, y: number, life: number): void {
  const elapsed = DEATH_TIME - life;
  const frame = Math.max(0, Math.min(3, Math.floor(elapsed / (DEATH_TIME / 4))));
  if (frame >= 3) {
    return;
  }
  const color = frame === 0 ? PAPER : frame === 1 ? GOLD[2] : SHIBA[2];
  const span = frame === 0 ? 10 : frame === 1 ? 8 : 6;
  ctx.fillStyle = color;
  ctx.fillRect(snap(x) - (span >> 1), snap(y) - (span >> 1), span, span);
}

function drawFx(ctx: CanvasRenderingContext2D, run: Run): void {
  visitFx(run, (fx) => {
    switch (fx.kind) {
      case "particle": {
        const size = fx.size === 2 || fx.size === 3 ? fx.size : 1;
        const color = PARTICLE_COLORS[Math.abs(Math.floor(fx.life * 12) + fx.sprite) % PARTICLE_COLORS.length] ?? PAPER;
        ctx.fillStyle = color;
        ctx.fillRect(snap(fx.x), snap(fx.y), size, size);
        break;
      }
      case "boom":
        drawBoom(ctx, fx.x, fx.y, fx.life);
        break;
      case "spin": {
        const name = spriteFromCode(fx.sprite);
        const quarter = deathQuadrant(fx.life);
        const size = actorSize(name);
        drawActor(
          ctx,
          name,
          "idle",
          0,
          snap(fx.x) - (size.width >> 1),
          snap(fx.y) - (size.height >> 1) + quarter * 2,
          quarter,
          null,
        );
        break;
      }
      default: {
        const unexpected: never = fx.kind;
        throw new Error(`unexpected fx ${String(unexpected)}`);
      }
    }
  });
}

function drawPlayer(ctx: CanvasRenderingContext2D, run: Run): void {
  const pose = playerPose(run);
  const frame = frameOf(pose, run.time, 0);
  const noseX = snap(run.playerX) - 1;
  const noseY = snap(run.playerY) - 1;
  const dx = noseX - NOSE_COL;
  const dy = noseY - NOSE_ROW;
  if (run.down > 0) {
    const quarter = deathQuadrant(run.down);
    drawActor(ctx, "plane", "idle", 0, dx, dy + quarter * 2, quarter, null);
    return;
  }
  if (run.hitFlash > 0) {
    drawActor(ctx, "plane", pose, frame, dx, dy, 0, PAPER);
    return;
  }
  drawActor(ctx, "plane", pose, frame, dx, dy, 0, null);
  ctx.fillStyle = NOSE;
  ctx.fillRect(noseX, noseY, NOSE_SIZE, NOSE_SIZE);
}

function drawNumbers(ctx: CanvasRenderingContext2D, run: Run): void {
  for (const pop of damageNumbers(run)) {
    const big = pop.life > 0.35;
    const numer = big ? 3 : 1;
    const denom = big ? 2 : 1;
    const text = String(Math.max(0, Math.floor(pop.value)));
    const width = digitSpan(text.length, numer, denom);
    drawDigits(ctx, pop.value, snap(pop.x) - (width >> 1), snap(pop.y), numer, denom);
  }
}

function drawHud(ctx: CanvasRenderingContext2D, run: Run): void {
  for (let i = 0; i < 5; i++) {
    const x = 4 + i * 6;
    ctx.fillStyle = INK;
    ctx.fillRect(x, 4, 4, 4);
    ctx.fillStyle = i < run.hp ? PAPER : NIGHT[2];
    ctx.fillRect(x + 1, 5, 2, 2);
  }
  const text = String(Math.max(0, Math.floor(run.best)));
  drawDigits(ctx, run.best, WORLD_W - 4 - digitSpan(text.length, 1, 1), 4, 1, 1);
}

export function drawRun(ctx: CanvasRenderingContext2D, run: Run): void {
  visitPickups(run, (x, y) => {
    const bone = actorSize("bone");
    drawActor(
      ctx,
      "bone",
      "idle",
      Math.floor(run.time / 0.5) % 2,
      snap(x) - (bone.width >> 1),
      snap(y) - (bone.height >> 1),
      0,
      null,
    );
  });

  visitEnemies(run, (x, y, kind, pose, flash, vx) => {
    const name = ENEMY_SPRITE[kind];
    const poseName = enemyPose(kind, pose, vx);
    const size = actorSize(name, poseName);
    drawActor(
      ctx,
      name,
      poseName,
      frameOf(poseName, run.time, pose),
      snap(x) - (size.width >> 1),
      snap(y) - (size.height >> 1),
      0,
      flash > 0 ? PAPER : null,
    );
  });

  drawBeam(ctx, run);
  visitBullets(run, (x, y, kind) => {
    drawBullet(ctx, run, x, y, kind);
  });
  drawFx(ctx, run);
  drawPlayer(ctx, run);
  drawNumbers(ctx, run);
  drawHud(ctx, run);

  if (showFinger(run)) {
    const travel = 22 + (Math.sin(run.time * 2.6) * 0.5 + 0.5) * 120;
    const paw = actorSize("finger");
    drawActor(ctx, "finger", "idle", 0, snap(travel), WORLD_H - paw.height - 4, 0, null);
  }

  if (run.flash > 0) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
}
