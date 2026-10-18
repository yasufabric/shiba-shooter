import { playClear, playTone, unlockAudio } from "./audio";
import { NIGHT, PAPER } from "./palette";
import { beginPointer, createDrag, endPointer, movePointer, type Drag } from "./pointer";
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
let drag: Drag = createDrag();
let sawDown = false;
let down = false;
const deltas: { dx: number; dy: number }[] = [];

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

function canvasPoint(event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return clientToWorld(event.clientX - rect.left, event.clientY - rect.top, frame);
}

function holdPointer(event: PointerEvent): void {
  if (!canvas.hasPointerCapture(event.pointerId)) {
    canvas.setPointerCapture(event.pointerId);
  }
}

function onDown(event: PointerEvent): void {
  event.preventDefault();
  unlockAudio();
  const point = canvasPoint(event);
  const next = beginPointer(drag, event.pointerId, point.x, point.y);
  drag = next.drag;
  sawDown = true;
  down = true;
  holdPointer(event);
}

function onMove(event: PointerEvent): void {
  event.preventDefault();
  const coalesced = event.getCoalescedEvents();
  const samples = (coalesced.length > 0 ? coalesced : [event]).map(canvasPoint);
  const next = movePointer(drag, event.pointerId, samples);
  drag = next.drag;
  for (const delta of next.deltas) {
    deltas.push(delta);
  }
  if (drag.points.some((point) => point.id === event.pointerId)) {
    holdPointer(event);
  }
}

function onUp(event: PointerEvent): void {
  event.preventDefault();
  const next = endPointer(drag, event.pointerId);
  drag = next.drag;
  down = drag.points.length > 0;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function onLost(event: PointerEvent): void {
  if (drag.points.some((point) => point.id === event.pointerId)) {
    holdPointer(event);
  }
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
  const frameInput: Input = { deltas, down: down || sawDown };
  step(run, dt, frameInput);
  deltas.length = 0;
  sawDown = false;
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

const pointerOpts: AddEventListenerOptions = { passive: false };
window.addEventListener("pointerdown", onDown, pointerOpts);
window.addEventListener("pointermove", onMove, pointerOpts);
window.addEventListener("pointerup", onUp, pointerOpts);
window.addEventListener("pointercancel", onUp, pointerOpts);
window.addEventListener("lostpointercapture", onLost);
window.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
window.addEventListener("selectstart", (event) => {
  event.preventDefault();
});
window.addEventListener("touchstart", (event) => {
  event.preventDefault();
}, pointerOpts);
window.addEventListener("touchmove", (event) => {
  event.preventDefault();
}, pointerOpts);
window.addEventListener("resize", resize);
resize();
requestAnimationFrame(draw);
