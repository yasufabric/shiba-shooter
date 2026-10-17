import { describe, expect, it } from "vitest";
import { makeStars } from "./sky";

describe("makeStars", () => {
  it("keeps every star inside the unit square", () => {
    const stars = makeStars(80, 29);
    expect(stars).toHaveLength(80);
    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThan(1);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThan(1);
      expect(star.size === 1 || star.size === 2).toBe(true);
    }
  });
});
