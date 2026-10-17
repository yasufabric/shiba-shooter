import { shotForBones, visitBullets, type Run } from "./sim";
import { PLANE_NOSE_X, PLANE_NOSE_Y, planeSprite } from "./sprites";

export function drawRun(ctx: CanvasRenderingContext2D, run: Run): void {
  const shot = shotForBones(run.bones);
  if (shot.kind === "laser") {
    const x = Math.round(run.playerX);
    const y = Math.round(run.playerY);
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = "#ffd76a";
    ctx.fillRect(x - 18, 0, 36, y);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#fff4c2";
    ctx.fillRect(x - 3, 0, 6, y);
    ctx.restore();
  }

ctx.fillStyle = "#ffd45a";
  visitBullets(run, (x, y, kind) => {
    if (kind === "gold") {
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 6);
    }
  });
  ctx.fillStyle = "#fff1a8";
  visitBullets(run, (x, y, kind) => {
    if (kind === "mote") {
      ctx.fillRect(Math.round(x), Math.round(y) - 2, 2, 4);
    }
  });
  ctx.fillStyle = "#ff6d9a";
  visitBullets(run, (x, y, kind) => {
    if (kind === "pink") {
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
    }
  });

  const blink = run.invuln > 0 && Math.floor(run.time * 16) % 2 === 0;
  if (!blink) {
    const sprite = planeSprite();
    ctx.drawImage(
      sprite,
      Math.round(run.playerX) - PLANE_NOSE_X,
      Math.round(run.playerY) - PLANE_NOSE_Y,
    );
  }
  const noseX = Math.round(run.playerX);
  const noseY = Math.round(run.playerY);
  ctx.fillStyle = "#fff4c4";
  ctx.fillRect(noseX - 1, noseY - 1, 3, 3);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(noseX, noseY, 1, 1);

  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < run.hp ? "#f4f0d8" : "#243056";
    ctx.fillRect(3 + i * 4, 3, 2, 2);
  }
}
