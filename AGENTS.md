# Agents

## Commands

Run `npm test` to execute vitest.

Run `npm run dev` to start the Vite dev server.

Run `npm run build` to typecheck and write `dist`.

The Vite base path is `/shiba-shooter/`.

## Where things live

`src/viewport.ts` maps a phone viewport onto the integer-scaled world.

`src/sky.ts` builds the night-sky stars.

`src/main.ts` owns the canvas, the frame, and the draw loop.

Simulation and pointer input are not in this tree yet.
