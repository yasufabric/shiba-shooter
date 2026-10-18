import { describe, expect, it } from "vitest";
import { WORLD_H, WORLD_W, fitFrame } from "./viewport";

describe("fitFrame", () => {
  it("fills a 390 by 844 phone at scale 2", () => {
    const frame = fitFrame(390, 844);
    expect(frame.scale).toBe(2);
    expect(Number.isInteger(frame.scale)).toBe(true);
    expect(frame.originX).toBe(0);
    expect(frame.originY).toBe(0);
    expect(WORLD_W * frame.scale).toBe(390);
    expect(WORLD_H * frame.scale).toBe(844);
  });

  it("keeps an integer scale of at least 2", () => {
    const frame = fitFrame(800, 2000);
    expect(frame.scale).toBeGreaterThanOrEqual(2);
    expect(Number.isInteger(frame.scale)).toBe(true);
    expect(frame.originY).toBeGreaterThan(0);
    expect(WORLD_W * frame.scale).toBeLessThanOrEqual(800);
    expect(WORLD_H * frame.scale).toBeLessThanOrEqual(2000);
  });
});
