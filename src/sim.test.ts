import { describe, expect, it } from "vitest";
import {
  BULLET_CAP,
  NOSE_SIZE,
  bullets,
  collectBone,
  createRun,
  damageNumbers,
  enemies,
  mulberry32,
  phaseAt,
  pickups,
  releaseBulletAt,
  shotForBones,
  showFinger,
  spawnBullet,
  spawnPickup,
  step,
  type Input,
} from "./sim";
import { WORLD_H, WORLD_W } from "./viewport";

const idle: Input = { deltas: [], down: false };

describe("pointer", () => {
  it("moves the plane by the finger delta and keeps it on the screen", () => {
    const run = createRun();
    const startX = run.playerX;
    const startY = run.playerY;
    step(run, 1 / 60, { deltas: [{ dx: 10, dy: -4 }], down: true });
    expect(run.playerX).toBe(startX + 10);
    expect(run.playerY).toBe(startY - 4);
    expect(run.playerX).not.toBe(10);
    expect(run.playerY).not.toBe(200);

    step(run, 1 / 60, { deltas: [{ dx: 3, dy: 0 }, { dx: -1, dy: 1 }], down: true });
    expect(run.playerX).toBe(startX + 12);
    expect(run.playerY).toBe(startY - 3);

    step(run, 1 / 60, { deltas: [{ dx: -1000, dy: -1000 }], down: true });
    expect(run.playerX).toBe(8);
    expect(run.playerY).toBe(8);
    step(run, 1 / 60, { deltas: [{ dx: 1000, dy: 1000 }], down: true });
    expect(run.playerX).toBe(WORLD_W - 8);
    expect(run.playerY).toBe(WORLD_H - 18);
    step(run, 1 / 60, {
      deltas: [
        { dx: 4, dy: 0 },
        { dx: -1, dy: 0 },
      ],
      down: true,
    });
    expect(run.playerX).toBe(WORLD_W - 8 - 1);
    expect(run.playerY).toBe(WORLD_H - 18);
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
  it("treats the nose as a 2 by 2 block", () => {
    const run = createRun();
    expect(NOSE_SIZE).toBe(2);
    const left = Math.round(run.playerX) - 1;
    const top = Math.round(run.playerY) - 1;
    spawnBullet(run, {
      x: left + NOSE_SIZE,
      y: top + NOSE_SIZE,
      vx: 0,
      vy: 0,
      r: 0.1,
      kind: "pink",
    });
    step(run, 1 / 60, idle);
    expect(run.hp).toBe(4);

    const miss = createRun();
    spawnBullet(miss, {
      x: miss.playerX - 8,
      y: miss.playerY,
      vx: 0,
      vy: 0,
      r: 0.1,
      kind: "pink",
    });
    step(miss, 1 / 60, idle);
    expect(miss.hp).toBe(5);
  });

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
    step(run, 0.35, idle);
    expect(run.hp).toBe(5);
    expect(run.bones).toBe(0);
    expect(bullets(run).some((bullet) => bullet.kind === "pink")).toBe(false);
  });
});

describe("sortie", () => {
  it("opens every run with 10 fry and refills that phase", () => {
    const run = createRun(0, () => 0.4);
    expect(phaseAt(0)).toBe("fry");
    expect(enemies(run).filter((enemy) => enemy.kind === "fry")).toHaveLength(10);

    for (const fry of enemies(run)) {
      spawnBullet(run, {
        x: fry.x,
        y: fry.y,
        vx: 0,
        vy: 0,
        r: 8,
        kind: "gold",
      });
    }
    step(run, 1 / 60, idle);
    expect(enemies(run).filter((enemy) => enemy.kind === "fry").length).toBeLessThan(10);
    expect(pickups(run).length).toBeGreaterThan(0);

    for (let i = 0; i < 6; i++) {
      step(run, 0.6, idle);
    }
    expect(run.time).toBeLessThan(60);
    expect(run.phase).toBe("fry");
    expect(enemies(run).filter((enemy) => enemy.kind === "fry").length).toBeGreaterThan(0);
  });

  it("changes phase at 60s and 150s and fields one boss", () => {
    const run = createRun(0, () => 0.4);
    step(run, 59, idle);
    expect(run.phase).toBe("fry");
    step(run, 1.2, idle);
    expect(run.phase).toBe("medium");
    expect(enemies(run).some((enemy) => enemy.kind === "boss")).toBe(false);
    step(run, 90, idle);
    expect(run.time).toBeGreaterThanOrEqual(150);
    expect(run.phase).toBe("boss");
    expect(enemies(run).filter((enemy) => enemy.kind === "boss")).toHaveLength(1);
  });

  it("picks up a bone near the body and ignores one that only crowds the nose", () => {
    const run = createRun(0, () => 0.5);
    spawnPickup(run, run.playerX, run.playerY - 40);
    step(run, 1 / 60, idle);
    expect(run.bones).toBe(0);
    spawnPickup(run, run.playerX + 18, run.playerY + 10);
    step(run, 1 / 60, idle);
    expect(run.bones).toBe(1);
  });

  it("stores boss damage as the best score, including after a death", () => {
    const run = createRun(0, mulberry32(4));
    step(run, 149.9, idle);
    step(run, 0.2, idle);
    const boss = enemies(run).find((enemy) => enemy.kind === "boss");
    expect(boss).toBeDefined();
    spawnBullet(run, {
      x: boss?.x ?? 0,
      y: boss?.y ?? 0,
      vx: 0,
      vy: 0,
      r: 6,
      kind: "gold",
    });
    step(run, 1 / 60, idle);
    expect(run.bossDamage).toBeGreaterThan(0);
    expect(run.best).toBe(run.bossDamage);
    expect(damageNumbers(run).length).toBeGreaterThan(0);
    const best = run.best;

    for (let hit = 0; hit < 12; hit++) {
      if (run.down > 0) {
        step(run, 0.3, idle);
      } else {
        spawnBullet(run, {
          x: run.playerX,
          y: run.playerY,
          vx: 0,
          vy: 0,
          r: 3,
          kind: "pink",
        });
        step(run, 1 / 60, idle);
      }
      if (run.bossDamage === 0 && run.hp === 5 && run.time < 1) {
        break;
      }
      if (run.down === 0) {
        step(run, 2, idle);
      }
    }
    expect(run.hp).toBe(5);
    expect(run.bossDamage).toBe(0);
    expect(run.best).toBeGreaterThanOrEqual(best);
  });

  it("ends a cleared clock with a flash and the same best score", () => {
    const run = createRun(15, () => 0.2);
    step(run, 179, idle);
    expect(run.flash).toBe(0);
    step(run, 1.2, idle);
    expect(run.time).toBeGreaterThanOrEqual(180);
    expect(run.flash).toBeGreaterThan(0);
    step(run, 0.6, idle);
    expect(run.time).toBeLessThan(2);
    expect(run.best).toBe(15);
    expect(enemies(run).filter((enemy) => enemy.kind === "fry")).toHaveLength(10);
  });

  it("hides the finger hint after the first drag", () => {
    const run = createRun();
    expect(showFinger(run)).toBe(true);
    step(run, 1 / 60, { deltas: [], down: true });
    expect(showFinger(run)).toBe(false);
    step(run, 1 / 60, idle);
    expect(showFinger(run)).toBe(false);
  });

  it("lets a swaying first run reach the boss with the laser", () => {
    const run = createRun(0, mulberry32(2));
    let deaths = 0;
    let previous = 0;
    for (let i = 0; i < 150 * 60; i++) {
      const x = 98 + Math.sin(run.time * 1.4) * 34;
      step(run, 1 / 60, {
        deltas: [{ dx: x - run.playerX, dy: 214 - run.playerY }],
        down: true,
      });
      if (run.time + 0.001 < previous) {
        deaths += 1;
        break;
      }
      previous = run.time;
    }
    expect(deaths, `hp ${run.hp} bones ${run.bones} time ${run.time}`).toBe(0);
    expect(run.time).toBeGreaterThanOrEqual(150);
    expect(run.bones).toBeGreaterThanOrEqual(3);
    expect(enemies(run).some((enemy) => enemy.kind === "boss")).toBe(true);
    expect(run.hp).toBeGreaterThan(0);
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
