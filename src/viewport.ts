export const WORLD_W = 120;
export const WORLD_H = 260;

export type Frame = {
  scale: number;
  originX: number;
  originY: number;
  viewW: number;
  viewH: number;
};

export function fitFrame(viewW: number, viewH: number): Frame {
  const width = Math.max(1, viewW);
  const height = Math.max(1, viewH);
  const scale = Math.max(
    1,
    Math.floor(Math.min(width / WORLD_W, height / WORLD_H)),
  );
  const drawnW = WORLD_W * scale;
  const drawnH = WORLD_H * scale;
  return {
    scale,
    originX: Math.floor((width - drawnW) / 2),
    originY: Math.floor((height - drawnH) / 2),
    viewW: width,
    viewH: height,
  };
}

export function clientToWorld(
  clientX: number,
  clientY: number,
  frame: Frame,
): { x: number; y: number } {
  return {
    x: (clientX - frame.originX) / frame.scale,
    y: (clientY - frame.originY) / frame.scale,
  };
}
