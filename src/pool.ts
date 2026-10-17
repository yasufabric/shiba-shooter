export type Slots = {
  cap: number;
  live: Uint8Array;
  free: Uint16Array;
  top: number;
  count: number;
};

export function createSlots(cap: number): Slots {
  const free = new Uint16Array(cap);
  for (let i = 0; i < cap; i++) {
    free[i] = cap - 1 - i;
  }
  return {
    cap,
    live: new Uint8Array(cap),
    free,
    top: cap,
    count: 0,
  };
}

export function takeSlot(slots: Slots): number {
  if (slots.top === 0) {
    return -1;
  }
  slots.top -= 1;
  const index = slots.free[slots.top] ?? 0;
  slots.live[index] = 1;
  slots.count += 1;
  return index;
}

export function freeSlot(slots: Slots, index: number): void {
  if (slots.live[index] === 0) {
    return;
  }
  slots.live[index] = 0;
  slots.free[slots.top] = index;
  slots.top += 1;
  slots.count -= 1;
}
