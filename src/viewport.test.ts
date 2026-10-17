import { describe, expect, it } from "vitest";
import { WORLD_H, WORLD_W, fitFrame } from "./viewport";

describe("fitFrame", () => {
  it("integer-scales the world inside a 390 by 844 phone", () => {
    const frame = fitFrame(390, 844);
    expect(frame.scale).toBe(3);
    expect(Number.isInteger(frame.scale)).toBe(true);
    expect(WORLD_W * frame.scale).toBeLessThanOrEqual(390);
    expect(WORLD_H * frame.scale).toBeLessThanOrEqual(844);
    expect(frame.originX).toBe(15);
    expect(frame.originY).toBe(32);
    expect(frame.originX + WORLD_W * frame.scale + frame.originX).toBe(390);
    expect(frame.originY + WORLD_H * frame.scale).toBeLessThanOrEqual(844);
  });

  it("keeps a margin when the viewport is taller than the world", () => {
    const frame = fitFrame(200, 800);
    expect(frame.scale).toBe(1);
    expect(frame.originY).toBeGreaterThan(0);
  });
});
