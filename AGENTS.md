# Agents

## Commands

Run `npm test` to execute vitest.

Run `npm run dev` to start the Vite dev server.

Run `npm run build` to typecheck and write `dist`.

The Vite base path is `/shiba-shooter/`.

## Where things live

`src/viewport.ts` maps a phone viewport onto the integer-scaled world.

`src/sky.ts` builds the night-sky stars.

`src/main.ts` owns the canvas, pointer events, audio cues, the best-score store, and the draw loop.

`src/sim.ts` owns the run. `step` is the only writer. Pointer placement, shot level, HP, phases, enemies, and bullet pools live there.

`src/render.ts` draws the run. `src/palette.ts` is the only color list. `src/font.ts` draws the damage digits. `src/sprites.ts` bakes the pixel sprites. `src/score.ts` parses the saved best score. `src/audio.ts` plays the original tones.
