import { describe, expect, it } from "vitest";
import { readBest, writeBest, type ScoreStore } from "./score";

function memoryStore(): ScoreStore {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("best boss damage", () => {
  it("reads a missing or junk value as zero and round-trips a score", () => {
    const store = memoryStore();
    expect(readBest(store)).toBe(0);
    writeBest(store, 42.8);
    expect(readBest(store)).toBe(42);
    store.setItem("shiba-shooter-best", "nope");
    expect(readBest(store)).toBe(0);
  });
});
