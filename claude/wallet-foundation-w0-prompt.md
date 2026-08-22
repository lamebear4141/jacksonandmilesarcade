# Claude Code prompt — W0: Wallet Foundation (Bricks & Sparks)

> **STATUS — Aug 21, 2026:** Not yet run. Deliberately small and purely
> additive — safe to run before, between, or after any other in-flight game
> build, in any order. **Run this first**, before `r2a`, `r2b`, or `r2c`:
> R2B's drop economy is independent of it, but R2A's Home Run Derby pays ⚡
> sparks and will skip its payout entirely if `PILLAR_ECONOMY` doesn't exist.

Paste everything below the line into Claude Code, in the `jacksonandmilesarcade`
repo. Single phase, small, additive. Stop and report at the end.

---

We're laying the foundation for the three-pillar reward economy (🧠 Learn →
Bricks, 🎮 Play → Sparks, 🎨 Create → Coins) described in `decisions-log.md`
and `claude/my-world-spec.md`, without breaking anything that works today.

**This step only ADDS two new currencies, tracked and paid out alongside the
existing ones. It does not remove or change how XP or coins are earned.**
Coins transitioning to come from the Create pillar (friends visiting a kid's
world) instead of from games directly is real, but it's a *later* step that
depends on My World existing — doing it now would leave the Shop with no way
to earn anything to spend, which breaks a feature that already works. Flag
that follow-up in your report; don't build it here.

**Read first — re-read immediately before editing, since other Claude Code
sessions may have added `GAMES` entries and `finishRun` calls from
`math-baseball` and `multiverse-collector` since this prompt was written:**
`site/assets/catalog.js`, `site/assets/arcade-shell.js`, and whichever module
Phase 3 built for the Character Home wallet display (likely `home.js` or
`widgets.js` — check both).

## What to build

**1. In `catalog.js`, add (do not remove or rename anything existing):**

```js
export const PILLAR_ECONOMY = {
  bricksPerCorrect: 2,   // Learn games: bricks = correct answers × this
  sparksPerUnit:     1,  // Play games: sparks = whatever `units` that game
                          // already passes to finishRun × this
  dailySparkCap:    60,  // per kid per day, across all fun games combined —
                          // same spirit as the existing daily fun cap
};
```

**2. In `arcade-shell.js`'s `finishRun`, compute bricks/sparks ADDITIVELY**
alongside the existing xp/coins calculation:

- Look up `GAMES[gameId].kind`.
- If `'learn'`: `bricksEarned = round(correct * PILLAR_ECONOMY.bricksPerCorrect)`.
- If `'fun'`: `sparksEarned = round(units * PILLAR_ECONOMY.sparksPerUnit)`,
  clamped so today's running total doesn't exceed `dailySparkCap` (reset-by-
  date, same pattern as the existing `dailyFun` cap — track it as
  `character.wallet.dailySparks: {date, total}`).
- Write `character.wallet.bricks` / `character.wallet.sparks` via
  `increment()`, same pattern as xp/coins. Guest path: identical logic
  against the existing localStorage character object.
- `finishRun`'s return value gains `{ bricksEarned, sparksEarned }` alongside
  the existing `{ xp, coins, leveledUp, newLevel }`.
- **Do not touch the existing coin or XP math at all.**

**3. Character Home:** add two small pills next to the existing coin purse —
🧱 `<bricks>` and ⚡ `<sparks>` — using whatever pill/badge component Phase 3
already built (don't invent a new one). Display only; no spending UI yet
(that's My World, a later build — these will just accumulate for now, which
is fine and expected).

**4. End-of-run screens:** wherever a game currently shows "+N coins" from
`finishRun`'s return value, add "+N 🧱 bricks" or "+N ⚡ sparks" (whichever
that game's `kind` pays) in the same style, right next to it. If a shared
results-screen component renders this for every game, it's a one-place
change.

## Ground rules

- Purely additive. Every game that works today must work **identically**
  after this, plus show one new number. Do not remove, rename, or change the
  behavior of `xp`, `coins`, `ECONOMY`, or any existing `GAMES` field.
- Re-read `catalog.js` and `arcade-shell.js` immediately before editing —
  don't assume they look like this prompt's excerpts by the time you get to
  them.
- Vanilla JS, no build step, no new dependencies.
- Follow `CLAUDE.md`: edits stay local and uncommitted until I say "publish
  this" or "ship it".

## Test

Play any one existing game to completion. Confirm coins and XP behave
exactly as they did before this change, **and** the correct new currency
(bricks for a learn game, sparks for a fun game) ticks up on that game's end
screen and on Character Home. If Math Baseball's or Multiverse Collector's
`GAMES` entries already exist by the time you run this, confirm they're
untouched. Report the one thing that should fail if this is broken: a fun
game paying bricks, a learn game paying sparks, or any change at all to the
coin/XP numbers a kid already sees today.
