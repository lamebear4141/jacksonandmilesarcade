# Claude Code prompt — publish preflight: verify the whole stack, close the gaps

Paste everything below the line into Claude Code in the `jacksonandmilesarcade`
repo. Or just say: **"Run prompts/publish-preflight.md, phase by phase."**

---

The working tree holds a large uncommitted stack, built across several
sessions, that all ships together on the next push:

1. **Character system Phases 0–3** — `site/assets/catalog.js` (shared sprites,
   skins, pets, economy), the character layer in `site/firebase-config.js`,
   `site/assets/arcade.css` + `arcade-shell.js`, and Character Home
   (PLAY / LOCKER / SHOP / TRADE / 🏆) in `site/index.html`.
2. **The Playground reskin** — bright sky/white-panel identity on the hub,
   front door with mascot and XL buttons.
3. **Phase 4 wiring** — all seven games call `requireKid`/`mountBar`/award
   helpers from `arcade-shell.js`.
4. **Loot Drop's question-first rework (Aug 21, done by a Cowork session —
   already on disk, do NOT re-implement):** `site/loot-drop/index.html`,
   `src/ui.js`, `src/game.js`, `src/config.js`. The game now boots straight
   to CHOOSE YOUR DROP under the shared bar, plays 5 questions, shows
   earnings, and routes back to Character Home. Its old lobby / collection /
   item shop / brother-compare screens are deleted on purpose — the hub owns
   the meta now. It also restored the per-round `lootdrop-YYYY-MM-DD.json`
   auto-download (`CONFIG.autoSaveReport`) that the nightly parent email
   reads from Downloads, and fixed a float bug in the reboot-van gate
   (`0.8 - 0.2 !== 0.6` in JS; the gate subtracts `1e-9`).

Your job is NOT to build features. It is to **verify this stack end-to-end in
a real browser, fix forward what's broken with the smallest possible diffs,
and close three known gaps** — then stop before committing.

**Ground rules**

- Fix forward only. Never rewrite a working file wholesale; never revert
  another session's work. If something looks wrong by design, report it
  instead of "fixing" it.
- Vanilla HTML/CSS/JS, no build step, no new dependencies.
- Kid-facing copy celebrates, never scolds.
- Tunables stay in `catalog.js` / each game's config block.
- Follow `CLAUDE.md`: **everything stays uncommitted.** At the end you report;
  AJ says "publish this" himself.
- After each phase: stop, report what passed, what you fixed (what was wrong →
  what changed), what needs AJ's hands, and one thing that should FAIL if the
  phase is broken.

**How to test**

```
cd site && python3 -m http.server 8000
```

then `http://localhost:8000`. ES modules and Firebase Auth need http(s) —
double-clicking index.html will not work. If sign-in fails, add `localhost`
under Firebase Console → Authentication → Settings → Authorized domains.

---

## Phase V1 — Boot smoke, everywhere

With DevTools console open, load with **zero errors**:

- the hub front door (clouds drift, coins rise, ticker rotates, mascot bobs)
- guest flow: JUST PLAY FOR FUN → add a player → lands on Character Home
- every tab: PLAY, LOCKER, SHOP, TRADE, 🏆 (guest sees the friendly
  sign-in card on TRADE and 🏆, not an error)
- each of the seven games from the PLAY tab. Each mounts exactly ONE shared
  top bar and no leftover "← Arcade" link of its own.
- Harvest Night on this laptop loads three.js from its CDN and runs; its
  touch-device guard message still appears when you emulate a tablet.

## Phase V2 — Loot Drop deep pass (real Chrome, real mic)

The Cowork session tested everything except the microphone (headless browsers
have none). Verify in order:

1. Boots to CHOOSE YOUR DROP under the shared bar. No lobby, collection, or
   shop screens exist. Luck strip renders with a percentage and a hint.
2. **Reading Run with the mic:** a word read correctly is accepted; a wrong
   word is not; a passage requires the read-aloud AND the comprehension
   answer (read it but answer wrong → the item is a miss). Deny mic
   permission and confirm the "🎤 Mic not working? Tap instead" button
   appears after ~12s and the round continues in tap mode.
3. Math Run in tap mode: extraction meter moves, loot pops slide in, sounds
   play (tap/pop/coin/nope), the 80% line sits at 80%.
4. Finish a round ≥80%: EXTRACTED, sprites shown, "✓ Saved to your
   character" appears, and **the coin count in the top bar changes without a
   page refresh**. Level-up shows the full-screen overlay + confetti.
5. Finish a round at exactly **3 of 5**: the Reboot Van MUST appear (this is
   the float fix — if it goes straight to ELIMINATED, the fix regressed).
   Accept, get it right, confirm it extracts at 80%.
6. Finish a round below 60%: ELIMINATED, no sprites granted, consolation XP
   only, copy stays gentle.
7. After each finished round a `lootdrop-YYYY-MM-DD.json` lands in
   Downloads. Open one: it has a top-level `player` object with `name`,
   `today`, `history`, `squadCode`. **The nightly email depends on this
   file — do not remove the auto-download again** (`CONFIG.autoSaveReport`
   is the off switch, and the email must be repointed first).
8. Squad code screen: code + link render; pasting your own code shows the
   compare table; `?squad=CODE` deep link opens it.
9. If `lootdrop.v1` exists in localStorage from the old build: a fresh child
   is offered "Bring over your old loot?" with one card per unclaimed
   profile — claiming lands XP/coins/sprites AND the equipped skin/pet;
   each old profile can be claimed once; "Start fresh" never asks again.

## Phase V3 — Signed-in family pass (only AJ can do this — drive it, and tell him exactly where you need his sign-in)

1. Sign in with the real parent account. Ensure two child profiles exist
   with PINs and **birthdays**: Miles (1st grade age) and Jackson (3rd
   grade age).
2. PIN in as Miles → Loot Drop: content is the grade-1 band (+/− within 20,
   short-vowel words). PIN in as Jackson: grade-3 band (×/÷, fractions,
   harder words). If both boys get the same band, the birthday → band
   mapping is broken — find and fix.
3. As each child, finish a round, then verify in Firebase Console:
   `families/{uid}/children/{childId}` character doc incremented (xp, coins,
   `counts` map keys like `s12`), and a new doc in the `sessions`
   subcollection with `gameId:'loot-drop'`.
4. Buy a skin in the hub SHOP, equip it, reload — still equipped, and the
   Loot Drop drop-screen avatar shows it.
5. **Known gap, carried since Phase 3 — the trade wizard has only ever been
   verified at function level.** With both real children holding duplicates
   (count ≥ 2): send an offer → accept on the sibling's profile → both
   inventories correct, offered sprite decremented, received incremented.
   Send a second offer → decline → nothing changed. Confirm a child can
   never offer their last copy, and there is no text input anywhere in the
   flow.
6. 🏆 tab shows both children — nicknames only. Tapping a sibling shows a
   read-only loadout.
7. Mash the end-screen buttons after a round: the character must be awarded
   exactly once (the double-submit guard in `finishRun` — check the session
   count in Firestore, not just the UI).

## Phase V4 — Economy integrity, all seven games

For each game, finish one run and confirm the end screen shows the award,
the character doc increments, and `lifetime.byGame[gameId]` updates:

| Game | units | expect |
|---|---|---|
| Loot Drop | correct answers | rich award via its own sync (sprites, gifts) |
| Math Defender | correct answers | full practice rate |
| Coin Climb | correct answers | full practice rate |
| Critter Catchers | correct answers | full practice rate — **see check below** |
| Raining Cats and Dogs | coin bags + sprites + score | ~0.3×/0.25× fun rate |
| Block Stacker | blocks ÷ 10 | fun rate |
| Harvest Night | 10/key + 20 escape | fun rate |

- **Fun-game daily caps really clamp:** grind Block Stacker past
  `funDailyCoinCap` (80) / `funDailyXpCap` (250) in one day and confirm
  further fun-game awards clamp to zero coins with the friendly "practice
  games still pay full!" line — never a raw 0 with no explanation.
- **Critter Catchers farming hole:** the character-system doc gated its
  wiring on porting Loot Drop's `_readFailed` rule. Verify in the game: read
  a story passage aloud but answer the question WRONG → the item must NOT
  count as correct. If it still does, either port the gate (read-aloud
  failure after two tries blocks the pass exactly as Loot Drop's
  `item._readFailed` does) or disconnect its rewards and report — a
  passage-skim must never be the fastest coin farm on the site.
- Guest child: same runs award to `arcade.character.{guestId}` in
  localStorage, TRADE and 🏆 stay gated.

## Phase V5 — Look & feel consistency sweep

The complaint that started this pass was "Loot Drop doesn't match the rest."
Make sure nothing else is still off:

- `grep -rn "#241640\|#1a1a3e\|#0b0f2b\|#3d2b6e" site/ --include=*.html --include=*.css --include=*.js`
  — kid-facing chrome must use `--ac-` tokens. Deliberate exceptions, leave
  alone: `parent-report/` (plain document styling on purpose), night-sky
  canvases inside games (Harvest Night's world, Loot Drop's Storm Dodge
  mini-game field), and game-internal HUD/canvas art.
- Contrast sweep on every kid screen: no light-on-light or navy-on-navy text
  (the classic dark→light flip failure).
- Baloo 2 loads on hub + Loot Drop; fallback stack renders sanely offline.
- `prefers-reduced-motion` emulation: clouds/floaty/confetti stop; button
  presses still work; nothing waits on an animation to navigate.
- 375px width: hub, Loot Drop, Coin Climb, Critter Catchers — no horizontal
  scroll anywhere.
- No page still carries `maximum-scale=1.0, user-scalable=no` in its
  viewport meta.

## Phase V6 — Publish prep (STOP before committing)

1. `git status` + `git diff --stat` — summarize everything that would ship,
   grouped by feature. Flag anything unexpected; delete nothing.
2. `.git/_stale/` holds leftover lock files from an earlier session's git
   hiccups — list them as safe for AJ to delete by hand; do not touch them.
3. Draft one commit message covering the whole stack (character system,
   Playground reskin, Phase 4 wiring, Loot Drop question-first rework,
   preflight fixes), ready to use.
4. Remind: one push = one Netlify deploy (~15 credits), so this ships as ONE
   batched publish. Then **stop and wait for AJ to say "publish this."**

**Out of scope, do not build:** the `/grown-ups/` portal (Phase 5 is
superseded and unspecced), cross-family friends, any new game features.
