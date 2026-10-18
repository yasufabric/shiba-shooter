import { createSlots, freeSlot, takeSlot, type Slots } from "./pool";
import { WORLD_H, WORLD_W } from "./viewport";

export const BULLET_CAP = 1024;
export const BEAM_HALF = 22;
export const PICKUP_RADIUS = 24;

const MAX_HP = 5;
const INVULN_SECONDS = 2;
const FX_CAP = 128;
const HIT_FLASH = 0.06;
const HITSTOP = 0.05;
export const DEATH_TIME = 0.24;
export const ATTACK_TIME = 4 / 12;
export const NOSE_SIZE = 2;
export const PLAYER_Y = 360;
const PELLET_INTERVAL = 0.08;
const LASER_INTERVAL = 1 / 30;
const PELLET_VY = -210;
const HAZARD_CAP = 400;
const ENEMY_CAP = 32;
const PICKUP_CAP = 40;
const NUMBER_CAP = 48;
const BODY_OFFSET = 10;
const BOSS_HP = 2200;

export type BulletKind = "gold" | "mote" | "pink";
export type Phase = "fry" | "medium" | "boss";
export type EnemyKind = "fry" | "medium" | "boss";

export type Input = {
  deltas: readonly { dx: number; dy: number }[];
  down: boolean;
};

export type Shot =
  | { kind: "pellet"; ways: 1 | 3 | 5 }
  | { kind: "laser" };

type BulletPool = {
  slots: Slots;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  r: Float32Array;
  kind: Uint8Array;
};

type EnemyPool = {
  slots: Slots;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  hp: Float32Array;
  r: Float32Array;
  cooldown: Float32Array;
  kind: Uint8Array;
  pose: Float32Array;
  flash: Float32Array;
};

type PickupPool = {
  slots: Slots;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
};

type NumberPool = {
  slots: Slots;
  x: Float32Array;
  y: Float32Array;
  value: Float32Array;
  life: Float32Array;
};

type FxPool = {
  slots: Slots;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  life: Float32Array;
  kind: Uint8Array;
  size: Uint8Array;
  sprite: Uint8Array;
};

export type FxKind = "particle" | "boom" | "spin";

export type FxView = {
  x: number;
  y: number;
  life: number;
  kind: FxKind;
  size: number;
  sprite: number;
};

export type Run = {
  time: number;
  phase: Phase;
  hp: number;
  invuln: number;
  bones: number;
  bossDamage: number;
  best: number;
  flash: number;
  playerX: number;
  playerY: number;
  dragged: boolean;
  fire: number;
  beamClock: number;
  moving: boolean;
  hitFlash: number;
  hitstop: number;
  shake: number;
  shakeClock: number;
  down: number;
  fryTimer: number;
  waveTimer: number;
  rng: () => number;
  bullets: BulletPool;
  hazards: BulletPool;
  enemies: EnemyPool;
  pickups: PickupPool;
  numbers: NumberPool;
  fx: FxPool;
};

export type BulletView = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: BulletKind;
};

export type EnemyView = {
  x: number;
  y: number;
  hp: number;
  r: number;
  kind: EnemyKind;
};

export type PickupView = { x: number; y: number };
export type NumberView = { x: number; y: number; value: number; life: number };

const KIND_CODE: Record<BulletKind, number> = {
  gold: 1,
  mote: 2,
  pink: 3,
};

const ENEMY_CODE: Record<EnemyKind, number> = {
  fry: 1,
  medium: 2,
  boss: 3,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createBulletPool(cap: number): BulletPool {
  return {
    slots: createSlots(cap),
    x: new Float32Array(cap),
    y: new Float32Array(cap),
    vx: new Float32Array(cap),
    vy: new Float32Array(cap),
    r: new Float32Array(cap),
    kind: new Uint8Array(cap),
  };
}

function createEnemyPool(): EnemyPool {
  return {
    slots: createSlots(ENEMY_CAP),
    x: new Float32Array(ENEMY_CAP),
    y: new Float32Array(ENEMY_CAP),
    vx: new Float32Array(ENEMY_CAP),
    vy: new Float32Array(ENEMY_CAP),
    hp: new Float32Array(ENEMY_CAP),
    r: new Float32Array(ENEMY_CAP),
    cooldown: new Float32Array(ENEMY_CAP),
    kind: new Uint8Array(ENEMY_CAP),
    pose: new Float32Array(ENEMY_CAP),
    flash: new Float32Array(ENEMY_CAP),
  };
}

function createFxPool(): FxPool {
  return {
    slots: createSlots(FX_CAP),
    x: new Float32Array(FX_CAP),
    y: new Float32Array(FX_CAP),
    vx: new Float32Array(FX_CAP),
    vy: new Float32Array(FX_CAP),
    life: new Float32Array(FX_CAP),
    kind: new Uint8Array(FX_CAP),
    size: new Uint8Array(FX_CAP),
    sprite: new Uint8Array(FX_CAP),
  };
}

function createPickupPool(): PickupPool {
  return {
    slots: createSlots(PICKUP_CAP),
    x: new Float32Array(PICKUP_CAP),
    y: new Float32Array(PICKUP_CAP),
    vx: new Float32Array(PICKUP_CAP),
    vy: new Float32Array(PICKUP_CAP),
  };
}

function createNumberPool(): NumberPool {
  return {
    slots: createSlots(NUMBER_CAP),
    x: new Float32Array(NUMBER_CAP),
    y: new Float32Array(NUMBER_CAP),
    value: new Float32Array(NUMBER_CAP),
    life: new Float32Array(NUMBER_CAP),
  };
}

function clearBullet(pool: BulletPool, index: number): void {
  pool.x[index] = 0;
  pool.y[index] = 0;
  pool.vx[index] = 0;
  pool.vy[index] = 0;
  pool.r[index] = 0;
  pool.kind[index] = 0;
  freeSlot(pool.slots, index);
}

function clearPool(pool: BulletPool): void {
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] !== 0) {
      clearBullet(pool, i);
    }
  }
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function phaseAt(time: number): Phase {
  if (time < 60) {
    return "fry";
  }
  if (time < 150) {
    return "medium";
  }
  return "boss";
}

function movePlane(x: number, y: number, dx: number, dy: number): { x: number; y: number } {
  return {
    x: clamp(Math.round(x + dx), 8, WORLD_W - 8),
    y: clamp(Math.round(y + dy), 8, WORLD_H - 18),
  };
}

export function shotForBones(bones: number): Shot {
  if (bones <= 0) {
    return { kind: "pellet", ways: 1 };
  }
  if (bones === 1) {
    return { kind: "pellet", ways: 3 };
  }
  if (bones === 2) {
    return { kind: "pellet", ways: 5 };
  }
  return { kind: "laser" };
}

export function showFinger(run: Run): boolean {
  return !run.dragged;
}

export function createRun(best = 0, rng: () => number = Math.random): Run {
  const run: Run = {
    time: 0,
    phase: "fry",
    hp: MAX_HP,
    invuln: 0,
    bones: 0,
    bossDamage: 0,
    best,
    flash: 0,
    playerX: Math.round(WORLD_W / 2),
    playerY: PLAYER_Y,
    dragged: false,
    fire: 0,
    beamClock: 0,
    moving: false,
    hitFlash: 0,
    hitstop: 0,
    shake: 0,
    shakeClock: 0,
    down: 0,
    fryTimer: 0.4,
    waveTimer: 1.2,
    rng,
    bullets: createBulletPool(BULLET_CAP),
    hazards: createBulletPool(HAZARD_CAP),
    enemies: createEnemyPool(),
    pickups: createPickupPool(),
    numbers: createNumberPool(),
    fx: createFxPool(),
  };
  openFry(run);
  return run;
}

export function collectBone(run: Run): void {
  run.bones += 1;
}

export function spawnBullet(
  run: Run,
  bullet: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    kind: BulletKind;
  },
): boolean {
  const pool = bullet.kind === "pink" ? run.hazards : run.bullets;
  const index = takeSlot(pool.slots);
  if (index < 0) {
    return false;
  }
  pool.x[index] = bullet.x;
  pool.y[index] = bullet.y;
  pool.vx[index] = bullet.vx;
  pool.vy[index] = bullet.vy;
  pool.r[index] = bullet.r;
  pool.kind[index] = KIND_CODE[bullet.kind];
  return true;
}

export function spawnPickup(run: Run, x: number, y: number): boolean {
  const index = takeSlot(run.pickups.slots);
  if (index < 0) {
    return false;
  }
  run.pickups.x[index] = x;
  run.pickups.y[index] = y;
  run.pickups.vx[index] = 0;
  run.pickups.vy[index] = 40;
  return true;
}

export function releaseBulletAt(run: Run, x: number, y: number): void {
  for (const pool of [run.bullets, run.hazards]) {
    for (let i = 0; i < pool.slots.cap; i++) {
      if (pool.slots.live[i] === 0) {
        continue;
      }
      if (pool.x[i] === x && pool.y[i] === y) {
        clearBullet(pool, i);
        return;
      }
    }
  }
}

function pushViews(pool: BulletPool, views: BulletView[]): void {
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    views.push({
      x: pool.x[i] ?? 0,
      y: pool.y[i] ?? 0,
      vx: pool.vx[i] ?? 0,
      vy: pool.vy[i] ?? 0,
      kind: kindName(pool.kind[i] ?? 0),
    });
  }
}

export function bullets(run: Run): BulletView[] {
  const views: BulletView[] = [];
  pushViews(run.bullets, views);
  pushViews(run.hazards, views);
  return views;
}

export function enemies(run: Run): EnemyView[] {
  const views: EnemyView[] = [];
  const pool = run.enemies;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    views.push({
      x: pool.x[i] ?? 0,
      y: pool.y[i] ?? 0,
      hp: pool.hp[i] ?? 0,
      r: pool.r[i] ?? 0,
      kind: enemyName(pool.kind[i] ?? 0),
    });
  }
  return views;
}

export function pickups(run: Run): PickupView[] {
  const views: PickupView[] = [];
  const pool = run.pickups;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    views.push({ x: pool.x[i] ?? 0, y: pool.y[i] ?? 0 });
  }
  return views;
}

export function damageNumbers(run: Run): NumberView[] {
  const views: NumberView[] = [];
  const pool = run.numbers;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    views.push({
      x: pool.x[i] ?? 0,
      y: pool.y[i] ?? 0,
      value: pool.value[i] ?? 0,
      life: pool.life[i] ?? 0,
    });
  }
  return views;
}

function kindName(code: number): BulletKind {
  if (code === 2) {
    return "mote";
  }
  if (code === 3) {
    return "pink";
  }
  return "gold";
}

function enemyName(code: number): EnemyKind {
  if (code === 2) {
    return "medium";
  }
  if (code === 3) {
    return "boss";
  }
  return "fry";
}

function applyPointer(run: Run, input: Input): void {
  if (input.down || input.deltas.length > 0) {
    run.dragged = true;
  }
  for (const delta of input.deltas) {
    const next = movePlane(run.playerX, run.playerY, delta.dx, delta.dy);
    if (next.x !== run.playerX || next.y !== run.playerY) {
      run.moving = true;
    }
    run.playerX = next.x;
    run.playerY = next.y;
  }
}

function spreads(ways: 1 | 3 | 5): readonly number[] {
  switch (ways) {
    case 1:
      return [0];
    case 3:
      return [-32, 0, 32];
    case 5:
      return [-56, -28, 0, 28, 56];
    default: {
      const unexpected: never = ways;
      return unexpected;
    }
  }
}

function shoot(run: Run): void {
  const shot = shotForBones(run.bones);
  switch (shot.kind) {
    case "pellet": {
      for (const vx of spreads(shot.ways)) {
        spawnBullet(run, {
          x: run.playerX,
          y: run.playerY,
          vx,
          vy: PELLET_VY,
          r: 2,
          kind: "gold",
        });
      }
      break;
    }
    case "laser": {
      const span = 15;
      for (let i = 0; i < span; i++) {
        const t = i / (span - 1);
        spawnBullet(run, {
          x: run.playerX + (t - 0.5) * 76,
          y: run.playerY - 4,
          vx: (t - 0.5) * 18,
          vy: -150,
          r: 1,
          kind: "mote",
        });
      }
      break;
    }
    default: {
      const unexpected: never = shot;
      throw new Error(`unexpected shot ${JSON.stringify(unexpected)}`);
    }
  }
}

function spawnEnemy(
  run: Run,
  enemy: {
    kind: EnemyKind;
    x: number;
    y: number;
    hp: number;
    r: number;
    vx: number;
    vy: number;
    cooldown: number;
  },
): void {
  const index = takeSlot(run.enemies.slots);
  if (index < 0) {
    return;
  }
  const pool = run.enemies;
  pool.x[index] = enemy.x;
  pool.y[index] = enemy.y;
  pool.vx[index] = enemy.vx;
  pool.vy[index] = enemy.vy;
  pool.hp[index] = enemy.hp;
  pool.r[index] = enemy.r;
  pool.cooldown[index] = enemy.cooldown;
  pool.kind[index] = ENEMY_CODE[enemy.kind];
}

function openFry(run: Run): void {
  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    spawnEnemy(run, {
      kind: "fry",
      x: 54 + col * 22,
      y: 30 + Math.floor(i / 5) * 24,
      hp: 1,
      r: 6,
      vx: col % 2 === 0 ? -10 : 10,
      vy: 18,
      cooldown: 1.1 + i * 0.18,
    });
  }
}

function spawnBoss(run: Run): void {
  spawnEnemy(run, {
    kind: "boss",
    x: 98,
    y: 42,
    hp: BOSS_HP,
    r: 16,
    vx: 0,
    vy: 0,
    cooldown: 0.6,
  });
}

function countKind(run: Run, kind: EnemyKind): number {
  const code = ENEMY_CODE[kind];
  let count = 0;
  const pool = run.enemies;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] !== 0 && pool.kind[i] === code) {
      count += 1;
    }
  }
  return count;
}

function clearKind(run: Run, kind: EnemyKind): void {
  const code = ENEMY_CODE[kind];
  const pool = run.enemies;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] !== 0 && pool.kind[i] === code) {
      freeEnemy(run, i);
    }
  }
}

function freeEnemy(run: Run, index: number): void {
  const pool = run.enemies;
  pool.x[index] = 0;
  pool.y[index] = 0;
  pool.vx[index] = 0;
  pool.vy[index] = 0;
  pool.hp[index] = 0;
  pool.r[index] = 0;
  pool.cooldown[index] = 0;
  pool.kind[index] = 0;
  pool.pose[index] = 0;
  pool.flash[index] = 0;
  freeSlot(pool.slots, index);
}

function clearPickups(run: Run): void {
  const pool = run.pickups;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    pool.x[i] = 0;
    pool.y[i] = 0;
    pool.vx[i] = 0;
    pool.vy[i] = 0;
    freeSlot(pool.slots, i);
  }
}

function clearNumbers(run: Run): void {
  const pool = run.numbers;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    pool.x[i] = 0;
    pool.y[i] = 0;
    pool.value[i] = 0;
    pool.life[i] = 0;
    freeSlot(pool.slots, i);
  }
}

function enterPhase(run: Run): void {
  const next = phaseAt(run.time);
  if (next === run.phase) {
    return;
  }
  run.phase = next;
  if (next === "boss") {
    clearKind(run, "fry");
    clearKind(run, "medium");
    spawnBoss(run);
  }
}

function moveBullets(pool: BulletPool, dt: number): void {
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    pool.x[i] = (pool.x[i] ?? 0) + (pool.vx[i] ?? 0) * dt;
    pool.y[i] = (pool.y[i] ?? 0) + (pool.vy[i] ?? 0) * dt;
    const x = pool.x[i] ?? 0;
    const y = pool.y[i] ?? 0;
    if (x < -16 || x > WORLD_W + 16 || y < -16 || y > WORLD_H + 16) {
      clearBullet(pool, i);
    }
  }
}

function moveEnemies(run: Run, dt: number): void {
  const pool = run.enemies;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    pool.pose[i] = Math.max(0, (pool.pose[i] ?? 0) - dt);
    pool.flash[i] = Math.max(0, (pool.flash[i] ?? 0) - dt);
    if (pool.kind[i] === ENEMY_CODE.boss) {
      pool.x[i] = 98 + Math.sin(run.time * 0.7) * 22;
      pool.y[i] = 42;
      continue;
    }
    pool.x[i] = (pool.x[i] ?? 0) + (pool.vx[i] ?? 0) * dt;
    pool.y[i] = (pool.y[i] ?? 0) + (pool.vy[i] ?? 0) * dt;
    const x = pool.x[i] ?? 0;
    if (x < 10 || x > WORLD_W - 10) {
      pool.vx[i] = -(pool.vx[i] ?? 0);
    }
    if ((pool.y[i] ?? 0) > WORLD_H + 8) {
      freeEnemy(run, i);
    }
  }
}

function movePickups(run: Run, dt: number): void {
  const pool = run.pickups;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    const dx = run.playerX - (pool.x[i] ?? 0);
    pool.vx[i] = clamp(dx * 1.6, -30, 30);
    pool.x[i] = (pool.x[i] ?? 0) + (pool.vx[i] ?? 0) * dt;
    pool.y[i] = (pool.y[i] ?? 0) + (pool.vy[i] ?? 0) * dt;
    if ((pool.y[i] ?? 0) > WORLD_H + 6) {
      pool.x[i] = 0;
      pool.y[i] = 0;
      pool.vx[i] = 0;
      pool.vy[i] = 0;
      freeSlot(pool.slots, i);
    }
  }
}

function moveNumbers(run: Run, dt: number): void {
  const pool = run.numbers;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    pool.y[i] = (pool.y[i] ?? 0) - 14 * dt;
    pool.life[i] = (pool.life[i] ?? 0) - dt;
    if ((pool.life[i] ?? 0) <= 0) {
      pool.x[i] = 0;
      pool.y[i] = 0;
      pool.value[i] = 0;
      pool.life[i] = 0;
      freeSlot(pool.slots, i);
    }
  }
}

function decayShake(run: Run, dt: number): void {
  let left = dt;
  while (run.shake > 0 && left > 0) {
    if (run.shakeClock > left) {
      run.shakeClock -= left;
      return;
    }
    left -= run.shakeClock;
    run.shake -= 1;
    run.shakeClock = 0.04;
  }
}

function clearFx(run: Run): void {
  const pool = run.fx;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] !== 0) {
      freeFx(run, i);
    }
  }
}

function freeFx(run: Run, index: number): void {
  const pool = run.fx;
  pool.x[index] = 0;
  pool.y[index] = 0;
  pool.vx[index] = 0;
  pool.vy[index] = 0;
  pool.life[index] = 0;
  pool.kind[index] = 0;
  pool.size[index] = 0;
  pool.sprite[index] = 0;
  freeSlot(pool.slots, index);
}

function spawnFx(
  run: Run,
  fx: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    kind: number;
    size: number;
    sprite: number;
  },
): void {
  const index = takeSlot(run.fx.slots);
  if (index < 0) {
    return;
  }
  const pool = run.fx;
  pool.x[index] = fx.x;
  pool.y[index] = fx.y;
  pool.vx[index] = fx.vx;
  pool.vy[index] = fx.vy;
  pool.life[index] = fx.life;
  pool.kind[index] = fx.kind;
  pool.size[index] = fx.size;
  pool.sprite[index] = fx.sprite;
}

function spawnBoom(run: Run, x: number, y: number): void {
  spawnFx(run, { x, y, vx: 0, vy: 0, life: DEATH_TIME, kind: 2, size: 0, sprite: 0 });
}

function spawnSpin(run: Run, x: number, y: number, sprite: number): void {
  spawnFx(run, { x, y, vx: 0, vy: 28, life: DEATH_TIME, kind: 3, size: 0, sprite });
}

function burst(run: Run, x: number, y: number): void {
  const sizes = [1, 2, 3, 2, 1, 3, 2, 1];
  for (let i = 0; i < sizes.length; i++) {
    const angle = (i / sizes.length) * Math.PI * 2;
    spawnFx(run, {
      x,
      y,
      vx: Math.cos(angle) * 24,
      vy: Math.sin(angle) * 24,
      life: 0.4,
      kind: 1,
      size: sizes[i] ?? 1,
      sprite: i,
    });
  }
}

function boomFrame(life: number): number {
  const elapsed = DEATH_TIME - life;
  return Math.max(0, Math.min(3, Math.floor(elapsed / (DEATH_TIME / 4))));
}

function updateFx(run: Run, dt: number): void {
  const pool = run.fx;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    const before = pool.life[i] ?? 0;
    pool.life[i] = before - dt;
    pool.x[i] = (pool.x[i] ?? 0) + (pool.vx[i] ?? 0) * dt;
    pool.y[i] = (pool.y[i] ?? 0) + (pool.vy[i] ?? 0) * dt;
    if ((pool.kind[i] ?? 0) === 2 && (pool.sprite[i] ?? 0) === 0) {
      const next = boomFrame(pool.life[i] ?? 0);
      if (boomFrame(before) < 3 && next >= 3) {
        pool.sprite[i] = 1;
        burst(run, pool.x[i] ?? 0, pool.y[i] ?? 0);
      }
    }
    if ((pool.life[i] ?? 0) <= 0) {
      freeFx(run, i);
    }
  }
}

function fxKind(code: number): FxKind {
  if (code === 2) {
    return "boom";
  }
  if (code === 3) {
    return "spin";
  }
  return "particle";
}

function spawnNumber(run: Run, x: number, y: number, value: number): void {
  const index = takeSlot(run.numbers.slots);
  if (index < 0) {
    return;
  }
  run.numbers.x[index] = x + (run.rng() - 0.5) * 10;
  run.numbers.y[index] = y;
  run.numbers.value[index] = value;
  run.numbers.life[index] = 0.7;
}

function firePink(
  run: Run,
  x: number,
  y: number,
  vx: number,
  vy: number,
): void {
  spawnBullet(run, { x, y, vx, vy, r: 2.4, kind: "pink" });
}

function attackEnemies(run: Run, dt: number): void {
  const pool = run.enemies;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    pool.cooldown[i] = (pool.cooldown[i] ?? 0) - dt;
    if ((pool.cooldown[i] ?? 0) > 0) {
      continue;
    }
    const kind = enemyName(pool.kind[i] ?? 0);
    const x = pool.x[i] ?? 0;
    const y = pool.y[i] ?? 0;
    switch (kind) {
      case "fry":
        pool.cooldown[i] = 3.2;
        pool.pose[i] = ATTACK_TIME;
        aimPink(run, x, y, 22, 36);
        break;
      case "medium":
        pool.cooldown[i] = 2;
        pool.pose[i] = ATTACK_TIME;
        aimPink(run, x, y - 4, 30, 14);
        aimPink(run, x, y - 4, 30, 14);
        break;
      case "boss":
        bossPattern(run, x, y);
        break;
      default: {
        const unexpected: never = kind;
        throw new Error(`unexpected enemy ${String(unexpected)}`);
      }
    }
  }
}

function aimPink(
  run: Run,
  x: number,
  y: number,
  speed: number,
  error: number,
): void {
  const dx = run.playerX - x;
  const dy = run.playerY - y;
  const len = Math.hypot(dx, dy) || 1;
  const jx = (run.rng() - 0.5) * error;
  const jy = (run.rng() - 0.5) * error;
  firePink(run, x, y, (dx / len) * speed + jx, (dy / len) * speed + jy);
}

function bossPattern(run: Run, x: number, y: number): void {
  const pool = run.enemies;
  const cycle = run.time % 5;
  if (cycle < 1.6) {
    const toward = Math.atan2(run.playerY - y, run.playerX - x);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const delta = Math.atan2(Math.sin(angle - toward), Math.cos(angle - toward));
      if (Math.abs(delta) < 1.05) {
        continue;
      }
      firePink(run, x, y, Math.cos(angle) * 26, Math.sin(angle) * 26);
    }
    setBossCooldown(pool, 0.22);
    return;
  }
  if (cycle < 3.1) {
    setBossCooldown(pool, 0.4);
    return;
  }
  if (cycle < 4) {
    aimPink(run, x, y, 28, 8);
    aimPink(run, x - 8, y, 28, 8);
    setBossCooldown(pool, 0.45);
    return;
  }
  setBossCooldown(pool, 0.35);
}

function setBossCooldown(pool: EnemyPool, value: number): void {
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] !== 0 && pool.kind[i] === ENEMY_CODE.boss) {
      pool.cooldown[i] = value;
      pool.pose[i] = ATTACK_TIME;
    }
  }
}

function spawnWave(run: Run, dt: number): void {
  if (run.phase === "fry") {
    run.fryTimer -= dt;
    if (run.fryTimer <= 0 && countKind(run, "fry") < 8) {
      run.fryTimer = 0.55;
      spawnEnemy(run, {
        kind: "fry",
        x: 50 + run.rng() * 96,
        y: 16,
        hp: 1,
        r: 6,
        vx: run.rng() > 0.5 ? 12 : -12,
        vy: 18,
        cooldown: 1.4,
      });
    }
    return;
  }
  if (run.phase === "medium") {
    run.waveTimer -= dt;
    if (run.waveTimer <= 0) {
      run.waveTimer = 2.3;
      for (const lane of [0, 1]) {
        spawnEnemy(run, {
          kind: "medium",
          x: lane === 0 ? 66 : 130,
          y: 18,
          hp: 3,
          r: 9,
          vx: lane === 0 ? 14 : -14,
          vy: 12,
          cooldown: 0.8,
        });
      }
    }
  }
}

function overlaps(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const reach = ar + br;
  return dx * dx + dy * dy <= reach * reach;
}

function noteBest(run: Run): void {
  if (run.bossDamage > run.best) {
    run.best = run.bossDamage;
  }
}

function hurtEnemy(run: Run, index: number, amount: number): void {
  const pool = run.enemies;
  const kind = enemyName(pool.kind[index] ?? 0);
  pool.hp[index] = (pool.hp[index] ?? 0) - amount;
  if (kind === "boss") {
    run.bossDamage += amount;
    noteBest(run);
    spawnNumber(run, pool.x[index] ?? 0, (pool.y[index] ?? 0) + 8, amount);
  }
  pool.flash[index] = HIT_FLASH;
  run.shake = Math.min(3, Math.max(run.shake, kind === "boss" ? 3 : 2));
  run.shakeClock = 0.04;
  if ((pool.hp[index] ?? 0) > 0) {
    return;
  }
  const ex = pool.x[index] ?? 0;
  const ey = pool.y[index] ?? 0;
  spawnSpin(run, ex, ey, pool.kind[index] ?? 1);
  spawnBoom(run, ex, ey);
  if (kind !== "boss") {
    spawnPickup(run, ex, ey);
  } else {
    run.flash = 0.5;
  }
  freeEnemy(run, index);
}

function fight(run: Run, dt: number): void {
  const pool = run.enemies;
  const bullets = run.bullets;
  for (let b = 0; b < bullets.slots.cap; b++) {
    if (bullets.slots.live[b] === 0 || bullets.kind[b] !== KIND_CODE.gold) {
      continue;
    }
    for (let e = 0; e < pool.slots.cap; e++) {
      if (pool.slots.live[e] === 0) {
        continue;
      }
      if (
        !overlaps(
          bullets.x[b] ?? 0,
          bullets.y[b] ?? 0,
          bullets.r[b] ?? 0,
          pool.x[e] ?? 0,
          pool.y[e] ?? 0,
          pool.r[e] ?? 0,
        )
      ) {
        continue;
      }
      clearBullet(bullets, b);
      hurtEnemy(run, e, 1);
      break;
    }
  }

  if (shotForBones(run.bones).kind !== "laser") {
    return;
  }
  run.beamClock += dt;
  const tick = run.beamClock >= 0.1;
  if (tick) {
    run.beamClock -= 0.1;
  }
  for (let e = 0; e < pool.slots.cap; e++) {
    if (pool.slots.live[e] === 0) {
      continue;
    }
    const x = pool.x[e] ?? 0;
    const y = pool.y[e] ?? 0;
    const inBeam =
      Math.abs(x - run.playerX) <= BEAM_HALF + (pool.r[e] ?? 0) && y < run.playerY;
    if (!inBeam) {
      continue;
    }
    if ((pool.kind[e] ?? 0) === ENEMY_CODE.boss) {
      if (tick) {
        hurtEnemy(run, e, 8);
      }
      continue;
    }
    hurtEnemy(run, e, pool.hp[e] ?? 1);
  }
}

function collectPickups(run: Run): void {
  const bodyY = run.playerY + BODY_OFFSET;
  const pool = run.pickups;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    const dx = (pool.x[i] ?? 0) - run.playerX;
    const dy = (pool.y[i] ?? 0) - bodyY;
    if (dx * dx + dy * dy > PICKUP_RADIUS * PICKUP_RADIUS) {
      continue;
    }
    pool.x[i] = 0;
    pool.y[i] = 0;
    pool.vx[i] = 0;
    pool.vy[i] = 0;
    freeSlot(pool.slots, i);
    collectBone(run);
  }
}

function hitNose(run: Run): void {
  const pool = run.hazards;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    if (!hitsNose(pool.x[i] ?? 0, pool.y[i] ?? 0, pool.r[i] ?? 0, run.playerX, run.playerY)) {
      continue;
    }
    clearBullet(pool, i);
    if (run.invuln > 0) {
      continue;
    }
    run.hp -= 1;
    run.invuln = INVULN_SECONDS;
    run.hitFlash = HIT_FLASH;
    run.hitstop = Math.max(run.hitstop, HITSTOP);
    run.shake = 3;
    run.shakeClock = 0.04;
    if (run.hp <= 0) {
      run.hp = 0;
      run.down = DEATH_TIME;
      return;
    }
  }
}

function hitsNose(bx: number, by: number, br: number, px: number, py: number): boolean {
  const left = Math.round(px) - 1;
  const top = Math.round(py) - 1;
  const nearestX = clamp(bx, left, left + NOSE_SIZE);
  const nearestY = clamp(by, top, top + NOSE_SIZE);
  const dx = bx - nearestX;
  const dy = by - nearestY;
  return dx * dx + dy * dy <= br * br;
}

function resetRun(run: Run): void {
  const best = run.best;
  const dragged = run.dragged;
  const rng = run.rng;
  run.time = 0;
  run.phase = "fry";
  run.hp = MAX_HP;
  run.invuln = 0;
  run.bones = 0;
  run.bossDamage = 0;
  run.best = best;
  run.flash = 0;
  run.playerX = Math.round(WORLD_W / 2);
  run.playerY = PLAYER_Y;
  run.dragged = dragged;
  run.fire = 0;
  run.beamClock = 0;
  run.moving = false;
  run.hitFlash = 0;
  run.hitstop = 0;
  run.shake = 0;
  run.shakeClock = 0;
  run.down = 0;
  run.fryTimer = 0.4;
  run.waveTimer = 1.2;
  run.rng = rng;
  clearPool(run.bullets);
  clearPool(run.hazards);
  clearFx(run);
  for (let i = 0; i < run.enemies.slots.cap; i++) {
    if (run.enemies.slots.live[i] !== 0) {
      freeEnemy(run, i);
    }
  }
  clearPickups(run);
  clearNumbers(run);
  openFry(run);
}

function finishIfDue(run: Run): void {
  if (run.flash > 0) {
    return;
  }
  if (run.time >= 180) {
    noteBest(run);
    run.flash = 0.5;
  }
}

export function visitBullets(
  run: Run,
  visit: (x: number, y: number, kind: BulletKind) => void,
): void {
  for (const pool of [run.bullets, run.hazards]) {
    for (let i = 0; i < pool.slots.cap; i++) {
      if (pool.slots.live[i] === 0) {
        continue;
      }
      visit(pool.x[i] ?? 0, pool.y[i] ?? 0, kindName(pool.kind[i] ?? 0));
    }
  }
}

export function visitEnemies(
  run: Run,
  visit: (x: number, y: number, kind: EnemyKind, pose: number, flash: number, vx: number) => void,
): void {
  const pool = run.enemies;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    visit(
      pool.x[i] ?? 0,
      pool.y[i] ?? 0,
      enemyName(pool.kind[i] ?? 0),
      pool.pose[i] ?? 0,
      pool.flash[i] ?? 0,
      pool.vx[i] ?? 0,
    );
  }
}

export function visitPickups(
  run: Run,
  visit: (x: number, y: number) => void,
): void {
  const pool = run.pickups;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    visit(pool.x[i] ?? 0, pool.y[i] ?? 0);
  }
}

export function visitFx(run: Run, visit: (fx: FxView) => void): void {
  const pool = run.fx;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    visit({
      x: pool.x[i] ?? 0,
      y: pool.y[i] ?? 0,
      life: pool.life[i] ?? 0,
      kind: fxKind(pool.kind[i] ?? 0),
      size: pool.size[i] ?? 1,
      sprite: pool.sprite[i] ?? 0,
    });
  }
}

export function visitNumbers(
  run: Run,
  visit: (x: number, y: number, value: number) => void,
): void {
  const pool = run.numbers;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    visit(pool.x[i] ?? 0, pool.y[i] ?? 0, pool.value[i] ?? 0);
  }
}

export function step(run: Run, dt: number, input: Input): void {
  const bounded = dt > 0 ? dt : 0;
  if (run.flash > 0) {
    run.flash -= bounded;
    if (run.flash <= 0) {
      resetRun(run);
    }
    return;
  }
  if (run.down > 0) {
    run.down -= bounded;
    if (run.down <= 0) {
      resetRun(run);
    }
    return;
  }
  let motion = bounded;
  if (run.hitstop > 0) {
    const held = Math.min(run.hitstop, motion);
    run.hitstop -= held;
    motion -= held;
  }
  run.time += bounded;
  run.hitFlash = Math.max(0, run.hitFlash - bounded);
  run.invuln = Math.max(0, run.invuln - bounded);
  decayShake(run, bounded);
  run.moving = false;
  applyPointer(run, input);
  if (motion <= 0) {
    return;
  }
  enterPhase(run);
  moveBullets(run.bullets, motion);
  moveBullets(run.hazards, motion);
  moveEnemies(run, motion);
  movePickups(run, motion);
  moveNumbers(run, motion);
  updateFx(run, motion);
  spawnWave(run, motion);
  attackEnemies(run, motion);
  fight(run, motion);
  collectPickups(run);
  hitNose(run);
  if (run.down > 0 || run.flash > 0) {
    return;
  }
  const shot = shotForBones(run.bones);
  const interval = shot.kind === "laser" ? LASER_INTERVAL : PELLET_INTERVAL;
  run.fire -= motion;
  let guard = 0;
  while (run.fire <= 0 && guard < 8) {
    shoot(run);
    run.fire += interval;
    guard += 1;
  }
  finishIfDue(run);
}
