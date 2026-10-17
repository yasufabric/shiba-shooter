import { makeStars, type Star } from "./sky";
import { WORLD_H, WORLD_W, fitFrame, type Frame } from "./viewport";

const FRAME = "#050514";
const FIELD = "#0c1230";
const canvasQuery = document.querySelector<HTMLCanvasElement>("#game");
if (canvasQuery === null) {
  throw new Error("missing canvas");
}
const canvas = canvasQuery;
const screenContext = canvas.getContext("2d");
if (screenContext === null) {
  throw new Error("missing 2d context");
}
const screen = screenContext;

const buffer = document.createElement("canvas");
buffer.width = WORLD_W;
buffer.height = WORLD_H;
const worldContext = buffer.getContext("2d");
if (worldContext === null) {
  throw new Error("missing world context");
}
const world = worldContext;

const fieldStars = makeStars(48, 11);
const frameStars = makeStars(80, 29);

let frame: Frame = fitFrame(1, 1);
let started = performance.now();

function resize(): void {
  const viewW = Math.max(1, window.innerWidth);
  const viewH = Math.max(1, window.innerHeight);
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  frame = fitFrame(viewW, viewH);
  canvas.width = viewW * dpr;
  canvas.height = viewH * dpr;
  canvas.style.width = `${viewW}px`;
  canvas.style.height = `${viewH}px`;
  screen.setTransform(dpr, 0, 0, dpr, 0, 0);
  screen.imageSmoothingEnabled = false;
  world.imageSmoothingEnabled = false;
}

function drawStars(
  target: CanvasRenderingContext2D,
  stars: readonly Star[],
  width: number,
  height: number,
  time: number,
  speed: number,
): void {
  for (const star of stars) {
    const y = (star.y * height + time * speed) % height;
    const x = star.x * width;
    const light = star.tint > 0.7 ? "#f4f0d8" : "#9bb7e0";
    target.fillStyle = light;
    target.fillRect(Math.floor(x), Math.floor(y), star.size, star.size);
  }
}

function draw(now: number): void {
  const time = (now - started) / 1000;
  screen.imageSmoothingEnabled = false;
  world.imageSmoothingEnabled = false;
  screen.fillStyle = FRAME;
  screen.fillRect(0, 0, frame.viewW, frame.viewH);
  drawStars(screen, frameStars, frame.viewW, frame.viewH, time, 6);

  world.fillStyle = FIELD;
  world.fillRect(0, 0, WORLD_W, WORLD_H);
  drawStars(world, fieldStars, WORLD_W, WORLD_H, time, 12);

  const dx = frame.originX;
  const dy = frame.originY;
  const dw = WORLD_W * frame.scale;
  const dh = WORLD_H * frame.scale;
  screen.drawImage(buffer, dx, dy, dw, dh);

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(draw);
