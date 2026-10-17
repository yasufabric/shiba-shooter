export type Star = {
  x: number;
  y: number;
  tint: number;
  size: number;
};

export function makeStars(count: number, seed: number): Star[] {
  let state = seed >>> 0;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: next(),
      y: next(),
      tint: next(),
      size: next() > 0.82 ? 2 : 1,
    });
  }
  return stars;
}
