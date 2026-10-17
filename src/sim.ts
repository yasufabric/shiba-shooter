import { createSlots, freeSlot, takeSlot, type Slots } from "./pool";
import { WORLD_H, WORLD_W } from "./viewport";

export const FINGER_LIFT = 36;
export const BULLET_CAP = 1024;

const MAX_HP = 5;
const INVULN_SECONDS = 2;
const PELLET_INTERVAL = 0.08;
const LASER_INTERVAL = 1 / 30;
const PELLET_VY = -210;

export type BulletKind = "gold" | "mote" | "pink";

export type Input = {
  pointerX: number;
  pointerY: number;
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

export type Run = {
  time: number;
  hp: number;
  invuln: number;
  bones: number;
  playerX: number;
  playerY: number;
  dragged: boolean;
  fire: number;
  bullets: BulletPool;
};

export type BulletView = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: BulletKind;
};

const KIND_CODE: Record<BulletKind, number> = {
  gold: 1,
  mote: 2,
  pink: 3,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createBulletPool(): BulletPool {
  return {
    slots: createSlots(BULLET_CAP),
    x: new Float32Array(BULLET_CAP),
    y: new Float32Array(BULLET_CAP),
    vx: new Float32Array(BULLET_CAP),
    vy: new Float32Array(BULLET_CAP),
    r: new Float32Array(BULLET_CAP),
    kind: new Uint8Array(BULLET_CAP),
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

export function placePlane(
  pointerX: number,
  pointerY: number,
): { x: number; y: number } {
  return {
    x: clamp(pointerX, 8, WORLD_W - 8),
    y: clamp(pointerY - FINGER_LIFT, 8, WORLD_H - 18),
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

export function createRun(): Run {
  const run: Run = {
    time: 0,
    hp: MAX_HP,
    invuln: 0,
    bones: 0,
    playerX: WORLD_W / 2,
    playerY: 214,
    dragged: false,
    fire: 0,
    bullets: createBulletPool(),
  };
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
  const index = takeSlot(run.bullets.slots);
  if (index < 0) {
    return false;
  }
  run.bullets.x[index] = bullet.x;
  run.bullets.y[index] = bullet.y;
  run.bullets.vx[index] = bullet.vx;
  run.bullets.vy[index] = bullet.vy;
  run.bullets.r[index] = bullet.r;
  run.bullets.kind[index] = KIND_CODE[bullet.kind];
  return true;
}

export function releaseBulletAt(run: Run, x: number, y: number): void {
  const pool = run.bullets;
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

export function bullets(run: Run): BulletView[] {
  const views: BulletView[] = [];
  const pool = run.bullets;
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

function applyPointer(run: Run, input: Input): void {
  if (!input.down) {
    return;
  }
  const placed = placePlane(input.pointerX, input.pointerY);
  run.playerX = placed.x;
  run.playerY = placed.y;
  run.dragged = true;
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
      const span = 11;
      for (let i = 0; i < span; i++) {
        const t = i / (span - 1);
        spawnBullet(run, {
          x: run.playerX + (t - 0.5) * 64,
          y: run.playerY - 4,
          vx: (t - 0.5) * 24,
          vy: -200,
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

function moveBullets(run: Run, dt: number): void {
  const pool = run.bullets;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    pool.x[i] = (pool.x[i] ?? 0) + (pool.vx[i] ?? 0) * dt;
    pool.y[i] = (pool.y[i] ?? 0) + (pool.vy[i] ?? 0) * dt;
    const x = pool.x[i] ?? 0;
    const y = pool.y[i] ?? 0;
    if (x < -12 || x > WORLD_W + 12 || y < -12 || y > WORLD_H + 12) {
      clearBullet(pool, i);
    }
  }
}

function hitNose(run: Run): void {
  const pool = run.bullets;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0 || pool.kind[i] !== KIND_CODE.pink) {
      continue;
    }
    const dx = (pool.x[i] ?? 0) - run.playerX;
    const dy = (pool.y[i] ?? 0) - run.playerY;
    const radius = pool.r[i] ?? 0;
    if (dx * dx + dy * dy > radius * radius) {
      continue;
    }
    clearBullet(pool, i);
    if (run.invuln > 0) {
      continue;
    }
    run.hp -= 1;
    run.invuln = INVULN_SECONDS;
    if (run.hp <= 0) {
      resetRun(run);
      return;
    }
  }
}

function resetRun(run: Run): void {
  run.time = 0;
  run.hp = MAX_HP;
  run.invuln = 0;
  run.bones = 0;
  run.fire = 0;
  run.playerX = WORLD_W / 2;
  run.playerY = 214;
  const pool = run.bullets;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] !== 0) {
      clearBullet(pool, i);
    }
  }
}

export function visitBullets(
  run: Run,
  visit: (x: number, y: number, kind: BulletKind) => void,
): void {
  const pool = run.bullets;
  for (let i = 0; i < pool.slots.cap; i++) {
    if (pool.slots.live[i] === 0) {
      continue;
    }
    visit(pool.x[i] ?? 0, pool.y[i] ?? 0, kindName(pool.kind[i] ?? 0));
  }
}

export function step(run: Run, dt: number, input: Input): void {
  const bounded = dt > 0 ? dt : 0;
  run.time += bounded;
  applyPointer(run, input);
  run.invuln = Math.max(0, run.invuln - bounded);
  moveBullets(run, bounded);
  hitNose(run);
  applyPointer(run, input);
  const shot = shotForBones(run.bones);
  const interval = shot.kind === "laser" ? LASER_INTERVAL : PELLET_INTERVAL;
  run.fire -= bounded;
  let guard = 0;
  while (run.fire <= 0 && guard < 8) {
    shoot(run);
    run.fire += interval;
    guard += 1;
  }
}
