import { describe, expect, it } from "vitest";
import {
  BULLET_CAP,
  bullets,
  collectBone,
  createRun,
  placePlane,
  releaseBulletAt,
  shotForBones,
  spawnBullet,
  step,
  type Input,
} from "./sim";
import { WORLD_H, WORLD_W, clientToWorld, fitFrame } from "./viewport";

const idle: Input = { pointerX: 0, pointerY: 0, down: false };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

describe("pointer", () => {
  it("places the plane 36 pixels above the finger with no smoothing", () => {
    const run = createRun();
    step(run, 1 / 60, { pointerX: 60, pointerY: 200, down: true });
    expect(run.playerX).toBe(60);
    expect(run.playerY).toBe(200 - 36);

    step(run, 1 / 60, { pointerX: 12, pointerY: 40, down: true });
    expect(run.playerX).toBe(clamp(12, 8, WORLD_W - 8));
    expect(run.playerY).toBe(clamp(40 - 36, 8, WORLD_H - 18));
    expect(run.playerX).not.toBeCloseTo((60 + 12) / 2, 0);
    expect(run.playerY).toBe(placePlane(12, 40).y);
  });

  it("maps a phone pixel through the frame into world space", () => {
    const frame = fitFrame(390, 844);
    const origin = clientToWorld(frame.originX, frame.originY, frame);
    expect(origin).toEqual({ x: 0, y: 0 });
    const aimed = clientToWorld(
      frame.originX + 60 * frame.scale,
      frame.originY + 200 * frame.scale,
      frame,
    );
    expect(aimed.x).toBeCloseTo(60);
    expect(aimed.y).toBeCloseTo(200);
  });
});

describe("shot growth", () => {
  it("fires 1, then 3, then 5, then a wide laser", () => {
    const counts = [1, 3, 5];
    for (let bones = 0; bones < counts.length; bones++) {
      const run = createRun();
      for (let i = 0; i < bones; i++) {
        collectBone(run);
      }
      step(run, 1 / 60, idle);
      const gold = bullets(run).filter((bullet) => bullet.kind === "gold");
      expect(gold).toHaveLength(counts[bones] ?? 0);
      expect(new Set(gold.map((bullet) => bullet.vx)).size).toBe(
        counts[bones] ?? 0,
      );
      expect(gold.every((bullet) => bullet.vy < 0)).toBe(true);
    }

    const laser = createRun();
    collectBone(laser);
    collectBone(laser);
    collectBone(laser);
    expect(shotForBones(laser.bones).kind).toBe("laser");
    step(laser, 1 / 60, idle);
    const motes = bullets(laser).filter((bullet) => bullet.kind === "mote");
    const xs = motes.map((bullet) => bullet.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(30);
  });
});

describe("damage", () => {
  it("removes one HP and ignores hits during 2 seconds of invincibility", () => {
    const run = createRun();
    spawnBullet(run, {
      x: run.playerX,
      y: run.playerY,
      vx: 0,
      vy: 0,
      r: 2,
      kind: "pink",
    });
    step(run, 1 / 60, idle);
    expect(run.hp).toBe(4);
    expect(run.invuln).toBeGreaterThan(1.9);

    spawnBullet(run, {
      x: run.playerX,
      y: run.playerY,
      vx: 0,
      vy: 0,
      r: 2,
      kind: "pink",
    });
    step(run, 0.5, idle);
    expect(run.hp).toBe(4);

    step(run, 1.6, idle);
    spawnBullet(run, {
      x: run.playerX,
      y: run.playerY,
      vx: 0,
      vy: 0,
      r: 2,
      kind: "pink",
    });
    step(run, 1 / 60, idle);
    expect(run.hp).toBe(3);
  });

  it("retries at full HP with the shot reset when HP reaches 0", () => {
    const run = createRun();
    collectBone(run);
    collectBone(run);
    collectBone(run);
    for (let hit = 0; hit < 5; hit++) {
      spawnBullet(run, {
        x: run.playerX,
        y: run.playerY,
        vx: 0,
        vy: 0,
        r: 2,
        kind: "pink",
      });
      step(run, 1 / 60, idle);
      if (hit < 4) {
        step(run, 2, idle);
      }
    }
    expect(run.hp).toBe(5);
    expect(run.bones).toBe(0);
    expect(bullets(run).some((bullet) => bullet.kind === "pink")).toBe(false);
  });
});

describe("pools", () => {
  it("does not leave a ghost when a slot is reused", () => {
    const run = createRun();
    let spawned = 0;
    while (
      spawnBullet(run, {
        x: spawned + 1,
        y: 10,
        vx: 1,
        vy: 2,
        r: 1,
        kind: "gold",
      })
    ) {
      spawned += 1;
    }
    expect(spawned).toBe(BULLET_CAP);
    releaseBulletAt(run, 1, 10);
    expect(bullets(run).some((bullet) => bullet.x === 1 && bullet.y === 10)).toBe(
      false,
    );
    expect(
      spawnBullet(run, {
        x: 70,
        y: 80,
        vx: 12,
        vy: -5,
        r: 1,
        kind: "gold",
      }),
    ).toBe(true);
    const born = bullets(run).find((bullet) => bullet.x === 70 && bullet.y === 80);
    expect(born).toMatchObject({ vx: 12, vy: -5, kind: "gold" });
    expect(bullets(run).some((bullet) => bullet.x === 1 && bullet.y === 10)).toBe(
      false,
    );
  });
});
