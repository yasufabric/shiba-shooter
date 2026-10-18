import { playClear, playTone, unlockAudio } from "./audio";
import { NIGHT, PAPER } from "./palette";
import { drawRun } from "./render";
import { readBest, writeBest } from "./score";
import { makeStars, type Star } from "./sky";
import { createRun, step, type Input } from "./sim";
import { WORLD_H, WORLD_W, clientToWorld, fitFrame, type Frame } from "./viewport";

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

function bootBest(): number {
  try {
    return readBest(localStorage);
  } catch {
    return 0;
  }
}

const run = createRun(bootBest());
let storedBest = run.best;
let lastBossTick = 0;
const heard = {
  bones: run.bones,
  time: run.time,
  flash: run.flash,
  bossDamage: run.bossDamage,
};

let frame: Frame = fitFrame(1, 1);
let last = performance.now();
let activePointer: number | null = null;
const input: Input = { pointerX: 0, pointerY: 0, down: false };

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

function aim(event: PointerEvent): void {
  const rect = canvas.getBoundingClientRect();
  const point = clientToWorld(event.clientX - rect.left, event.clientY - rect.top, frame);
  input.pointerX = point.x;
  input.pointerY = point.y;
  input.down = true;
}

function onDown(event: PointerEvent): void {
  unlockAudio();
  if (activePointer !== null) {
    return;
  }
  activePointer = event.pointerId;
  aim(event);
}

function onMove(event: PointerEvent): void {
  if (event.pointerId !== activePointer) {
    return;
  }
  aim(event);
}

function onUp(event: PointerEvent): void {
  if (event.pointerId !== activePointer) {
    return;
  }
  activePointer = null;
  input.down = false;
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
    const y = Math.round((star.y * height + time * speed) % height);
    const x = Math.round(star.x * width);
    target.fillStyle = star.tint > 0.7 ? PAPER : NIGHT[3];
    target.fillRect(x, y, star.size, star.size);
  }
}

function cues(now: number): void {
  if (run.bones > heard.bones) {
    playTone(740, 0.05, "square", 0.04);
  }
  if (run.time < heard.time && heard.flash === 0) {
    playTone(130, 0.12, "sawtooth", 0.05);
  }
  if (run.bossDamage > heard.bossDamage && now - lastBossTick > 90) {
    lastBossTick = now;
    playTone(880, 0.03, "square", 0.03);
  }
  if (run.flash > 0 && heard.flash === 0) {
    playClear();
  }
  if (run.best !== storedBest) {
    storedBest = run.best;
    try {
      writeBest(localStorage, run.best);
    } catch {
      storedBest = run.best;
    }
  }
  heard.bones = run.bones;
  heard.time = run.time;
  heard.flash = run.flash;
  heard.bossDamage = run.bossDamage;
}

function draw(now: number): void {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  step(run, dt, input);
  cues(now);

  screen.imageSmoothingEnabled = false;
  world.imageSmoothingEnabled = false;
  screen.fillStyle = NIGHT[0];
  screen.fillRect(0, 0, frame.viewW, frame.viewH);
  drawStars(screen, frameStars, frame.viewW, frame.viewH, run.time, 6);

  world.fillStyle = NIGHT[0];
  world.fillRect(0, 0, WORLD_W, WORLD_H);
  world.fillStyle = NIGHT[1];
  world.fillRect(0, WORLD_H - 48, WORLD_W, 28);
  world.fillStyle = NIGHT[2];
  world.fillRect(0, WORLD_H - 20, WORLD_W, 20);
  drawStars(world, fieldStars, WORLD_W, WORLD_H, run.time, 12);
  drawRun(world, run);

  const mag = Math.min(3, run.shake | 0);
  const flick = Math.floor(run.time * 60);
  const sx = mag === 0 ? 0 : (flick & 1) === 0 ? mag : -mag;
  const sy = mag === 0 ? 0 : (flick & 2) === 0 ? 0 : mag;
  screen.drawImage(
    buffer,
    frame.originX + sx,
    frame.originY + sy,
    WORLD_W * frame.scale,
    WORLD_H * frame.scale,
  );
  requestAnimationFrame(draw);
}

window.addEventListener("pointerdown", onDown);
window.addEventListener("pointermove", onMove);
window.addEventListener("pointerup", onUp);
window.addEventListener("pointercancel", onUp);
window.addEventListener("resize", resize);
resize();
requestAnimationFrame(draw);
