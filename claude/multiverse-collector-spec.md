# Raining Cats and Dogs — spec

> **Note for AJ:** the canonical copy of this doc lives in the Claude Project,
> not in this repo — there was no `multiverse-collector-spec.md` on disk to
> edit. This file is the rewritten v2.1 top section plus the history entries
> I know about. Paste history items 1–6 in from the project copy (they
> predate my work here), or replace the project copy with this file.

**File:** `site/multiverse-collector/index.html` — one self-contained file.
Vanilla HTML/CSS/JS, no build step, no dependencies. Shared code comes from
`site/assets/arcade.css`, `site/assets/arcade-shell.js` and
`site/assets/catalog.js`; rewards go through `finishRun()`.

## The game today (v2.1)

Renamed from "Multiverse Collector" in v2.1. The game **id** stays
`multiverse-collector` — it keys the leaderboard, lifetime stats and saved
bests, so it can never change. Only the name a kid sees did.

It's raining cats and dogs, and a kid with a trampoline is bouncing them to
safety. One 45-second run, then a results screen. **There are no lives, no
game over, and nothing a kid can lose.**

- **The hero** is a kid holding a round trampoline over their head. The
  trampoline — not the kid — is the catch hitbox. The kid wears the
  character's equipped skin; the equipped pet cheers from the grass.
- **Catching a pet** dips and snaps the trampoline, the kid hops, and the pet
  flies up into the **Safe Cloud** in the top corner. Its `🐾 N safe` counter
  is the run's headline stat.
- **Missing a pet** is not a failure and carries no penalty: the pet lands on
  a bouncy bush, pops up with a `!`, and scampers off the side on its feet.
  Float text "Got away! 🙂". No pet is ever shown injured, sad, or falling to
  the ground — this is a hard rule, not a preference.
- **Character select was removed** in v2.1. The game opens on one ready card
  with a single ▶ PLAY button, then a 3-2-1-GO countdown.

### What falls

| | What it does |
|---|---|
| **Pets** 🐶🐱🐰🐹🐢 | The dominant item. Soft round pastel tokens under wiggling umbrellas. ~20% carry a coin purse and count as a pet *and* a coin bag. |
| **Coin bags** 💰 | Plain tan sacks, no chute. These are what become real coins. |
| **Sprites** | "Special visitors" from `catalog.js` under a rainbow parachute, rarity ring, max 3 per run, mythic never drops here. |
| **Power-ups** | 🧲 Magnet, 🛝 Big Trampoline, ✨ Double Coins. One at a time, shown as a draining pill. |
| **🦙 67** | Ultra-rare easter egg under a golden parachute. +1000, confetti, screen shake. |
| **Bad items** 🪨⚓🌵⛈️ | Cost score and a brief floppy trampoline. Never a life. |

### Bad-item legibility

Bad items must be tellable from pets at a glance, from across the room. They
are a different visual family on every axis:

- **Shape** — angular spiked silhouette, vs. soft round tokens.
- **Colour** — dark slate `#3A3F55` with a thick red outline, vs. pastel with
  a navy outline. (The thundercloud is gray, and leans on the other tells.)
- **Motion** — fast 360°/0.8s spin and a dead-straight fall, vs. a gentle
  parachute flutter.
- **Warning** — a blinking red ▼ appears at the entry point 400ms before it
  enters, with a low descending whoosh.
- **Sound** — whoosh on entry, `nope` on catch, vs. `tap`/`coin`/`pop`.

A bad item also never spawns within 60px of a pet that is still high in the
sky, so the two families can't overlap mid-air.

### Where things come from

Rain clouds roll in across the top, **one at the start and three by the end** —
the visual cue that matches the intensity ramp. Two more clouds park at the
left and right edges and lob things in.

- **65% top drops** — a uniform random x across the full width, at least 40px
  from the edges, never within 90px of the previous drop.
- **35% side lobs** — enter just off-screen at 5–35% canvas height with a
  horizontal throw, then arc under `entry.gravity`. The horizontal speed is
  clamped against the time-to-ground so a lob can never sail off the far side.

### The intensity ramp

Only **count and frequency** change over a run: drops speed up from one every
850ms to one every 330ms, up to 9 items on screen, and clouds 1 → 3.

**Fall speeds never ramp.** Each type's speed is a constant used as-is from
second 0 to second 45. The only thing that ever changes an item's vertical
speed after spawn is `entry.gravity` on a lobbed item's own arc.

### Rewards

A `fun` game in `GAMES` (`xpMult 0.30`, `coinMult 0.25`, daily fun cap applies).

```
units = coinBags × 1  (Double Coins bags count 2)
      + sprites  × 2
      + floor(score / 150)
```

passed to `finishRun('multiverse-collector', { asked: 0, correct: 0, seconds,
score, units, sprites: ['s12', ...] })`. Roughly:

| run | bags | sprites | score | units | XP | coins |
|---|---|---|---|---|---|---|
| quiet | 3 | 0 | 450 | 6 | 18 | 5 |
| typical | 6 | 1 | 900 | 14 | 42 | 11 |
| great | 11 | 3 | 2,000 | 30 | 90 | 23 |

About 8 typical runs (~6 minutes) reach the 80-coin daily fun cap. Practice
games clearly out-earn this, which is the point.

### Results screen

Never a "game over" screen. Headline `🐾 N pets safe!` with a `NEW BEST!`
badge on a personal best, then score, best combo, coin bags, and a chip per
sprite marked `NEW!` or `×N — tradeable`. Below that the XP/coins from
`finishRun`, a level-up celebration if one happened, the top-5 leaderboard,
and two buttons: **▶ PLAY AGAIN** and **🏠 My Character** (which deep-links to
Character Home's LOCKER tab so the run's winnings are all on one screen).
Hitting the daily fun cap is phrased as an achievement, never a penalty.

### Copy rules

No "game over", "lost", "died", "hurt", "dropped", or "fell". Pets are
**safe**, **got away**, or **still falling**. The stun reads "Whoa! Floppy
trampoline!". A missed catch reads "Got away! 🙂".

### Every tunable

All of them live in one `CONFIG` object at the top of the script with a
plain-language comment each, so the game can be retuned without reading any
game code. A `?t=15` query parameter shortens a run for testing.

## History

1. _(from the project copy — please paste)_
2. _(from the project copy — please paste)_
3. _(from the project copy — please paste)_
4. _(from the project copy — please paste)_
5. _(from the project copy — please paste)_
6. _(from the project copy — please paste)_
7. v2 "Portal Rush" — removed lives/skull/speed-ups, timed 90s runs, intensity
   ramp, coin bags + catalog sprites, Playground look.
8. v2.1 — 45s runs, faster constant speeds, side-lob trajectories, bad-item
   redesign, single theme (kid + trampoline saving pets), character select
   removed.
