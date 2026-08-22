# Claude Code prompt — R2A: run caps, the Home Run Derby, and no more tier labels

**v2 — Aug 22, 2026: the Derby now pays 🪙 coins** (it's the first bespoke
"bonus mini-game" of the economy in `claude/economy-r2-spec.md`). If you
already ran v1 of this prompt and the derby pays ⚡ sparks, the only change is
in Phase 1's payout: swap it per the Scoring section below.

Small and independent of `r2b-collection-economy-prompt.md`; safe to run
before or after it. Paste everything below the line into Claude Code in the
`jacksonandmilesarcade` repo. Phased — stop after each phase and report how to
test.

---

Three fixes, in order of size. Read these before writing anything:
`site/math-baseball/index.html`, `site/math-defender/index.html`,
`site/coin-climb/index.html`, `site/assets/catalog.js`,
`site/assets/arcade-shell.js`. Vanilla JS, no build step, no new dependencies,
all art on canvas, all sound Web Audio — same rules as every other game here.

---

## Phase 1 — Math Baseball: cap the inning at 10 runs, then play a Home Run Derby

Right now the only way a game ends is three outs, so a kid having a great day
plays forever and the run never resolves. Add an upper bound that reads as a
reward rather than a cut-off.

### The cap

- New `CONFIG.runCap: 10`. When the run counter **reaches** it, the inning ends
  immediately — mid-inning is fine, don't wait for the third out.
- The transition is a celebration, never "that's enough": the scoreboard flips,
  the crowd roars, and a full-screen card reads **"10 RUNS! The other team is
  calling it — but the crowd wants a HOME RUN DERBY! 🎉"** with one big
  **START THE DERBY** button. There is no way to lose here and no "skip"
  framing — a kid who reaches this has already had a great game.

### The Derby

A bonus round with **no math questions at all**. The kid just swings.

- Pitches arrive automatically on a timer with the existing windup → flight →
  contact-ring animation. Swing input is unchanged: the SWING button, spacebar,
  or Enter, live only while the ball is in flight, one swing per pitch,
  `event.repeat` ignored.
- **A home run continues the derby. Anything else ends it** — single, double,
  triple, foul, or a whiff. Every swing is a real moment.
- **It gets faster, deliberately, until it ends.** Per homer, multiply the
  pitch flight time and the perfect-contact window by a decay factor, each
  clamped to a floor:

```js
derby: {
  startFlightMs: 1100, minFlightMs: 380, flightDecay: 0.96,
  startWindowMs:  140, minWindowMs:   55, windowDecay: 0.97,
  mulligans: 1,
  maxHomers: 100,
  coinsPerHomer: 2,
}
```

At these numbers the window halves around homer 20 and bottoms out near homer
35 — reaching 100 should be functionally impossible, but the cap must still be
enforced so the round provably terminates. **Print the modelled window and
flight time at homers 1, 10, 25, 50 and 100 in your report** so we can see the
curve before a kid does.

- **One mulligan.** The first non-homer is forgiven once per derby:
  "OOOH! The crowd wants ONE more! 🙌" and the same pitch speed repeats. Ending
  a 10-run masterpiece on one bad swing is the exact punishing feeling this
  project avoids. After the mulligan is spent, the next non-homer ends it.
- **`maxHomers` (100) ends the derby as a win** — "PERFECT DERBY 💯", the
  biggest celebration in the game.
- Derby end screen: total homers, longest flight, "⭐ NEW DERBY RECORD! ⭐" when
  beaten. Never any variant of "you failed" — the ending line is
  "DERBY OVER — {n} home runs! 🔥".

### Scoring and records

- Derby homers **do not count as correct answers** and must not change `asked`,
  `correct`, or `accuracy` — resources stay welded to math, and no amount of
  swinging can earn the learning currency.
- **Derby homers pay 🪙 coins**: `coinsPerHomer × homers`, added through the
  existing coin award path (coins still work exactly as they do today — the
  wider coin-faucet change happens later, in R2B, and this derby is already
  the model for it: coins come from bonus play, not from answering questions).
- New record `bestDerby` in `progress['math-baseball'].records`, guest fallback
  `mathbaseball.v1.records.bestDerby`. Show it beside best runs.
- The `finishRun` payload gains `derbyHomers` and keeps `score: runs` as-is.
- **If v1 of this prompt already ran:** replace `sparksPerHomer` with
  `coinsPerHomer: 2`, remove the derby's spark payout entirely, and route the
  payout through the coin path as above. Nothing else changes.

*Stop and report. Test: set `CONFIG.runCap` to 2 via the console, score two
runs, confirm the inning ends immediately and the derby card appears; swing
through a derby and confirm the mulligan fires exactly once; confirm a derby
never changes the accuracy shown on the end screen and that coins tick up by
2 per homer. The thing that should fail if this is broken: setting
`maxHomers: 3` should end the derby at 3 with the PERFECT DERBY celebration.*

---

## Phase 2 — Prove every game ends

A kid who never misses must still reach an end screen. Audit **every** game in
`GAMES` and report a table:

| game | mode | what ends the run | max theoretical length | bounded? |

Check both the intended terminator and the one nobody thinks about — a Blitz
timer that pauses, a wave counter with no ceiling, a question loop that only
exits on a miss. **Report first; don't fix anything unbounded without telling
me what you found.**

Then add one backstop regardless of what the audit finds:

- `SAFETY = { maxRunMinutes: 45 }` in `catalog.js`.
- In `arcade-shell.js`, any run exceeding it ends warmly through the normal
  `finishRun` path — full credit for everything earned, with the message
  "What a session! Time for a break — your stuff is saved. 🎉". Never a
  freeze, never a lost run, no scolding about screen time.

*Stop and report with the table. Test: set `maxRunMinutes` to 0.2, start any
game, wait, confirm it ends and the earned XP still lands on Character Home.*

---

## Phase 3 — Remove difficulty labels from Math Baseball

Difficulty comes from the child's profile, so the words EASY / MEDIUM / HARD
tell a kid nothing useful and read like a verdict on them. Remove **all** tier
language from anything a kid sees in `site/math-baseball/`: the start screen,
the HUD, the end screen, and the records display.

- Records stay stored per tier — just show only the current profile's record,
  unlabelled ("BEST: 7 runs").
- Keep the `?tier=` query param working for tuning, and keep `tierForAge`
  driving the math. This is a display change only; no generator behaviour
  changes.
- Then `grep -rn` the rest of `site/` for kid-facing "easy/medium/hard" strings
  and **report what you find without changing it** — other games may use the
  words legitimately (a mode picker the kid actually chooses is fine; a label
  describing the kid is not).

*Stop and report. Test: load `/math-baseball/` as each boy and confirm the tier
word appears nowhere on screen, while `?tier=hard` still visibly changes the
math.*

---

## Ground rules

- Don't modify other games' behaviour; Phase 2 touches `arcade-shell.js` and
  `catalog.js` only, additively.
- Every new number lives in the existing plain-language `CONFIG` /
  `catalog.js` blocks.
- No punishing language anywhere in new copy. Read every string you write back
  as if a 1st grader just had his best game ever.
- Follow `CLAUDE.md`: edits stay local and uncommitted until I say "publish
  this".
