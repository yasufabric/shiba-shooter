const BEST_KEY = "shiba-shooter-best";

export type ScoreStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function readBest(store: ScoreStore): number {
  const raw = store.getItem(BEST_KEY);
  if (raw === null) {
    return 0;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.floor(value);
}

export function writeBest(store: ScoreStore, value: number): void {
  store.setItem(BEST_KEY, String(Math.floor(value)));
}
