import { describe, expect, it } from "vitest";
import { beginPointer, createDrag, endPointer, movePointer } from "./pointer";
import { createRun, step } from "./sim";
import { clientToWorld, fitFrame } from "./viewport";

describe("drag", () => {
  it("sums coalesced samples as 1:1 world deltas", () => {
    let drag = createDrag();
    drag = beginPointer(drag, 1, 10, 10).drag;
    const moved = movePointer(drag, 1, [
      { x: 12, y: 11 },
      { x: 15, y: 9 },
      { x: 19, y: 14 },
    ]);
    expect(moved.deltas).toEqual([
      { dx: 2, dy: 1 },
      { dx: 3, dy: -2 },
      { dx: 4, dy: 5 },
    ]);
    const run = createRun();
    const startX = run.playerX;
    const startY = run.playerY;
    step(run, 1 / 60, { deltas: moved.deltas, down: true });
    expect(run.playerX).toBe(startX + 9);
    expect(run.playerY).toBe(startY + 4);
    expect(run.playerX).not.toBe(19);
  });

  it("maps one integer screen step through the letterbox to one world pixel", () => {
    const phone = fitFrame(390, 844);
    let drag = createDrag();
    const origin = clientToWorld(100, 200, phone);
    drag = beginPointer(drag, 7, origin.x, origin.y).drag;
    const phoneStep = clientToWorld(100 + phone.scale, 200 + phone.scale * 3, phone);
    expect(movePointer(drag, 7, [phoneStep]).deltas).toEqual([{ dx: 1, dy: 3 }]);

    const wide = fitFrame(800, 2000);
    drag = createDrag();
    const inset = clientToWorld(wide.originX + 30 * wide.scale, wide.originY + 80 * wide.scale, wide);
    drag = beginPointer(drag, 3, inset.x, inset.y).drag;
    const across = clientToWorld(
      wide.originX + 30 * wide.scale + wide.scale,
      wide.originY + 80 * wide.scale + wide.scale * 2,
      wide,
    );
    expect(movePointer(drag, 3, [across]).deltas).toEqual([{ dx: 1, dy: 2 }]);
  });

  it("keeps a second finger from jumping the plane when the first finger leaves", () => {
    let drag = createDrag();
    drag = beginPointer(drag, 1, 10, 10).drag;
    drag = beginPointer(drag, 2, 80, 90).drag;
    const waiting = movePointer(drag, 2, [{ x: 90, y: 90 }]);
    expect(waiting.deltas).toEqual([]);
    const steering = movePointer(waiting.drag, 1, [{ x: 14, y: 12 }]);
    expect(steering.deltas).toEqual([{ dx: 4, dy: 2 }]);
    const released = endPointer(steering.drag, 1);
    expect(released.deltas).toEqual([]);
    expect(released.drag.active).toBe(2);
    const follow = movePointer(released.drag, 2, [{ x: 92, y: 88 }]);
    expect(follow.deltas).toEqual([{ dx: 2, dy: -2 }]);
    const run = createRun();
    const startX = run.playerX;
    const startY = run.playerY;
    step(run, 1 / 60, { deltas: released.deltas, down: true });
    expect(run.playerX).toBe(startX);
    expect(run.playerY).toBe(startY);
    step(run, 1 / 60, { deltas: follow.deltas, down: true });
    expect(run.playerX).toBe(startX + 2);
    expect(run.playerY).toBe(startY - 2);
  });
});
