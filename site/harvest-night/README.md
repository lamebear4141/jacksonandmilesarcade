# Harvest Night

First-person 3D horror-escape game. Three.js, vanilla JS, no build step, zero downloaded assets — everything is generated at runtime (geometry from boxes, textures on canvas, sound with Web Audio).

## How to run

This game uses native ES module `import` statements, which most browsers block over a plain `file://` URL (CORS). So:

**Preferred — serve it locally:**

```bash
cd site/harvest-night
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

**Alternative:** some browsers (recent Chrome, with relaxed local-file settings) will run it by just double-clicking `index.html`. If you see a blank black screen and a console error mentioning CORS or "Failed to load module script," that means your browser blocked it — use the local server instead.

## Controls

- **Mouse** — look around (click the screen first to lock the pointer)
- **WASD** — move, strafe with A/D
- **← / →** — turn (use this if your browser/environment refuses to grant pointer lock — some do, silently, even with a real mouse plugged in; you'll know it's happening if the cursor never disappears after you click)
- **↑ / ↓** — same as W/S
- **Shift** — sprint (drains stamina)
- **C** — crouch
- **E** — interact (take a key, hold at the gate)
- **Esc** — release the mouse

## Tweaking the game

Every number that affects difficulty, speed, or feel lives in [`src/config.js`](src/config.js) — walk/sprint speed, stamina, fog density, scarecrow speeds (once it exists), catch distance, and so on. Change a value there and refresh; you shouldn't need to touch any other file.

## Build status

Being built phase by phase per `HARVEST_NIGHT_spec.md`, §10:

- [x] Phase 1 — The farm (world, lighting, fog, player movement, footsteps)
- [x] Phase 2 — The job (keys, ladders, gate hold-to-unlock, win screen)
- [x] Phase 3 — The scarecrow (model, dormant/awakened/stalking states, only-moves-when-unseen rule)
- [ ] Phase 4 — The scare (jump scare, GOTCHA screen)
- [ ] Phase 5 — The tension (flashlight, lanterns, hiding, heartbeat)
- [ ] Phase 6 — The juice (ambience, particles, polish)
