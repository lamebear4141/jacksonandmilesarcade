# Claude Code prompt — R2B: the collection economy

**v3 — rewritten Aug 22, 2026** for the settled three-currency model in
`claude/economy-r2-spec.md`. Coins stay, earned only from bonus play; critters
reorganize into 8 themed collections of 10; the old Critter Catchers dex merges
into the main collection.

**Prerequisite: W0 has been run** (resources ⚡/🧱 accruing). Design sources —
read both before writing anything: `claude/economy-r2-spec.md`
(authoritative), `claude/collections-spec.md` (trade rules §6–7, Collections
tab layout §8 — its *set data* in §2 is superseded by the spec above).

Paste everything below the line into Claude Code in the `jacksonandmilesarcade`
repo. Six phases; **stop after each and report how to test, including one thing
that should fail if the phase is broken.** E1 and E4 also stop mid-phase for my
approval.

---

We're building the collection half of the arcade economy. Read first:
`claude/economy-r2-spec.md`, `site/assets/catalog.js`,
`site/assets/arcade-shell.js`, `site/firebase-config.js`,
`site/assets/locker.js`, `site/assets/shop.js`, `site/assets/trade.js`,
`site/assets/home.js`, `site/critter-catchers/index.html`,
`site/loot-drop/src/state.js`, and every game's `finishRun` call.

**Every phase is idempotent-by-inspection** — check what already exists before
adding. **`SPRITES` is index-locked**: the squad code is a bitmask over the
array, so entries are appended only — never inserted, reordered, or removed.
Re-read the file immediately before editing it.

---

## Phase E1 — Eight collections of ten

### E1.1 — Propose the roster, then STOP

Read the current `SPRITES` array. Build a proposal for the eight collections —
each **exactly 10 members: 5 common, 3 rare, 1 epic, 1 legendary**:

| Collection | Icon | Badge | Statue |
|---|---|---|---|
| Dinosaurs | 🦖 | Dino Ranger | Fossil Skeleton |
| Farm Animals | 🚜 | Ranch Boss | Big Red Barn |
| Bugs | 🐞 | Master Bug Catcher | Giant Ladybug |
| Sea Creatures | 🌊 | Marine Biologist | Whale Fountain |
| Fantasy | 🦄 | Legend Keeper | Crystal Castle |
| Space Invasion | 🛸 | Galaxy Defender | Crashed UFO |
| Jungle | 🌴 | Jungle Explorer | Ancient Temple |
| Safari | 🦁 | Safari Guide | Watering Hole |

Rules for the proposal:

- **Map existing sprites in wherever theme fits** (🦖🦕 → Dinosaurs, 🐬🦈🐙 →
  Sea Creatures, 👽🤖 → Space Invasion, 🦄🐉🧙 → Fantasy, 🐒🐯 → Jungle…).
  Keep their existing names and rarities where the rarity fits the slot;
  where a mapped sprite's rarity doesn't fit the 5/3/1/1 shape, prefer moving
  it to a different collection over changing its stored rarity — flag any case
  where neither works.
- **Append new sprites only to fill gaps.** Every new critter gets a real name
  in the existing style (fun, kid-friendly, no brands).
- **The 12 bedtime critters are appended and assigned** to fitting collections,
  keeping their names: Ziggy the Dragon and Nova the Unicorn → Fantasy, Sir
  Biscuit the Pup → Farm Animals, and your best judgment for Pip, Mo, Wren,
  Sprout, Luna, Bram, Puddle, Willow, Twinkle. All 12 must land somewhere.
- **Mythic folds into legendary** — a display/roll change only; do not edit
  stored rarity values. Twinkle (mythic) fills a legendary slot.
- Existing sprites that fit no theme stay **unaffiliated** — catchable and
  tradeable, just not in a collection. List them.
- Avoid two visually identical emoji inside the *same* collection.

**Print the full proposed table — every collection, every member, id, emoji,
name, rarity, existing-vs-new — plus the unaffiliated list and the final
`SPRITES` length. Then STOP and wait for my approval. Write nothing until I
approve.**

### E1.2 — Write it

After approval: append the new sprites, add `COLLECTIONS` with the eight
membership lists, badges, statues, and avatar unlocks. Statues:
`size:[2,2]`, `animated:true`, `buyable:false` — and the shop's filter must
structurally exclude anything `buyable:false`, not rely on omission. Grand
Prize for all eight complete:
`{ id:'sky-coaster', emoji:'🎢', name:'Sky Coaster Island', size:[3,3], buyable:false }`.
Completion is **derived** (every member's `counts[id] > 0`), never stored as a
flag; only grants are written, inside the same `runTransaction` as
`awardRun`/`respondToTrade`, guarded by `arrayUnion`. Statues earned before the
Box exists queue in `character.worldItems` ("Saved for your Box! 🏆").

### E1.3 — The three-state display

One helper, `spriteState(spriteId, character)` →
`'hidden' | 'silhouette' | 'owned'`, used by **every** renderer (Locker,
Collections, trade builder, reveals, sibling peek):

- **hidden** (rarity band above the kid's level): empty slot, no shape, no
  name, no ring — but it still counts in totals ("3 / 10").
- **silhouette** (findable, uncaught): the emoji at `filter: brightness(0)`,
  ~0.55 opacity, on a light tile; name `???`; rarity ring visible. Check
  contrast in both themes and screenshot it — it must never read as a broken
  image.
- **owned**: full colour, name, ring, duplicate count.

### E1.4 — The Collections tab

Per `collections-spec.md` §8 layout (header count, badge banner, collection
cards with progress + reward preview, expandable three-state grid, sibling
"JAX HAS ONE" hints on silhouettes, completion celebration) — with the eight
collections above. Mockup: `design/mockups/collections.html`.

### E1.5 — Squad code

Before the array grows: switch to **1 bit per sprite** with a version prefix so
old `?squad=` links still parse (collections-spec §10). Round-trip both schemes
in a test.

*Stop and report. Test: nine→eight collection cards render with correct
counts; at Level 1 every rare+ slot is blank; a console character at Level 20
shows every uncaught slot as a silhouette; an old squad code still decodes.
Should fail if broken: no shop surface may render any statue.*

---## Phase E2 — Finding critters: rolls, encounters, and the level gate

### Config, in `catalog.js`

```js
export const DROPS = {
  qualifyAccuracy: 0.80,
  qualifyUnits: { 'multiverse-collector': 12, 'block-stacker': 10, 'harvest-night': 1 },
  bonusAtAccuracy: 1.0,
  bonusAtUnitsMult: 2,
  dailyCap: 4,             // shared by reward rolls AND confirmed encounters
  pityRuns: 8,
  focusRerollChance: 0.25,
};
export const RARITY_UNLOCK = { common: 1, rare: 3, epic: 7, legendary: 11 };
```

### Shared machinery

- Drops compute inside `awardRun`'s transaction; `increment()` counts; run the
  collection-completion check in the same transaction.
- **Clamp, never waste:** a roll above the kid's band lands at their highest
  unlocked band. Never discard a roll; never show "not high enough."
- Rarity from the existing `rollRarity(luckScore)`; **mythic results map to
  legendary** at the roll boundary.
- `character.drops = { date, count, sinceEpic }`; pity forces rare+ after
  `pityRuns` without epic+ (skip below Level 7); Collection Focus re-rolls
  `focusRerollChance` of drops into the active collection's missing unlocked
  members, after the rarity roll.
- **Loot Drop's in-round chests are unchanged and exempt from `dailyCap`**, but
  its pool must respect `RARITY_UNLOCK` and the mythic fold.

### Mode A — reward rolls (question games)

Loot Drop, Math Defender, Math Baseball, Coin Climb: qualifying run → roll at
the end, revealed by the shared `revealDrops(drops)` in `arcade-shell.js` — a
chest pops, the critter scales in with its rarity ring, **NEW CRITTER!** or
**+1 SPARE** (spares always framed as luck, with a one-tap **Trade** button
deep-linking the trade builder with that sprite pre-loaded). `finishRun` gains
`drops: [{spriteId, isNew, rarity}]`.

### Mode B — encounters (spatial games)

Multiverse Collector, Harvest Night (and any future runner): the critter
appears **in the gameplay** as a collectible, rolled from the same level-gated
pool at spawn time. Touching it shows it in a bubble on the HUD — a **pending
capture**. It confirms **only** through `awardRun` when the run ends
successfully (each game's existing success condition; declare it per game in
the catalog as `captureCondition`). Quit or fail mid-run: "It scampered off —
it's still out there! 🌿" — warm, never punishing, and the pending critter is
simply not granted. Confirmed encounters consume `dailyCap`; once the cap is
reached, encounters stop *spawning* (never spawn something that can't be
kept).

Each game declares exactly one mode in `GAMES[id].critterMode: 'roll'|'encounter'`.

### The level-up beat

When a level-up crosses a `RARITY_UNLOCK` threshold, `celebrateLevelUp` gains a
second beat: **"🎉 NEW CRITTERS ARE OUT THERE!"** with silhouettes of the
newly findable (cap 6, "+n more"). Full confetti — this is now the biggest
reason to level up.

*Stop and report. Print the modelled distribution over 200 qualifying runs at
Levels 2, 6, and 12 (by rarity; clamp and pity counts). Test: 100% learn run →
two chests; 60% → none, no sad copy; grab an encounter critter in Multiverse
Collector then quit → not granted, warm message; finish → granted. Should fail
if broken: a Level 2 character must never receive anything above common.*

---

## Phase E3 — Critter Reader

The game formerly focused on its own 12 critters now serves the whole
collection: **the one place a kid can aim at a specific critter.** Do not
change any reading mechanics — mic scoring, thresholds, homophones, question
fallback, sleep/awake antics all stay.

- **Kid-facing name becomes "Critter Reader"** (folder, game id, and URLs stay
  `critter-catchers`). Change display strings only; report every string you
  changed.
- The den shelf now lists **every sprite**, three-state: owned in colour,
  findable as silhouettes ("Read me to meet me! 🌙" — silhouettes ARE
  selectable; that's the point), hidden rarities as locked shelf slots showing
  "Unlocks at Level 7" — here the level is shown, because the kid is choosing
  and deserves to know why.
- **Star cost by rarity: common 1 · rare 3 · epic 6 · legendary 10 nights**,
  one star per calendar day, unchanged mechanics otherwise. Extra stories
  still pay XP.
- Progress moves to the character doc — `character.critterStars: {s12: 4}`,
  `character.starDay` — so a 10-night quest survives switching iPads.
- Completing a quest grants the sprite through `awardRun`'s override (Loot
  Drop's path), landing in the Locker with the full reveal; a star quest on an
  already-owned critter grants **+1 spare**.
- **Migration, once, guarded by `character.ccMigrated`:** the old local dex's
  critters grant `counts[spriteId] = max(existing, 1)` using E1's id
  assignments for the 12; star progress copies over. Never double-grant,
  never remove. Report exactly what migrated per profile.

*Stop and report. Test: quest a common, see it land in Locker + Collections;
re-quest it, see the spare + Trade button; second browser shows the same star
progress. Should fail if broken: running the migration twice changes nothing.*

---

## Phase E4 — The coin faucet

Coins become a **bonus**, not a wage. Shop prices and level gates are
**unchanged**.

### E4.1 — Measure, then STOP

Report how coins are earned today: every code path, the per-run average for a
typical learn and fun run, and each boy's current balance. **Propose Vault
payouts calibrated so a typical day's coin income lands within ±30% of
today's, and a `dailyCoinCap`. STOP for my approval.**

### E4.2 — The Bonus Vault

After approval: a shared ~10-second mini-game in `arcade-shell.js`, triggered
after any **qualifying** run (same thresholds as `DROPS`) in any game without
its own bespoke bonus round:

- Three vaults shimmer; one timing-bar tap cracks one open. Payout scales with
  timing accuracy between the approved floor and ceiling (spec suggests
  5–15🪙) — **the floor always pays; there is no losing the bonus round.**
- Skippable with one tap ("COLLECT ⚡ later" — actually collects the floor);
  never blocks getting back to playing.
- Respects `dailyCoinCap` with tomorrow-flavored copy, like every other cap.
- `GAMES[id].bonusRound: 'vault' | 'custom' | null` — Math Baseball declares
  `'custom'` (the Home Run Derby from R2A is its bespoke bonus and pays coins;
  if R2A ran before this phase and the derby still pays sparks, fix it here:
  `coinsPerHomer: 2`, remove the spark payout).

### E4.3 — Stop paying coins per-run

Remove the flat coin award from `finishRun`/`awardRun` and end screens. Keep
the wallet field and all shop code. Grep the site for coin copy ("coins",
"purse", 🪙) and report every kid-facing string before changing any.

**Enforce no-crossover in code and name the enforcing function for each:** no
path converts 🧱/⚡/🪙 into each other, none of them into a critter, and
nothing `buyable:false` renders in any shop.

*Stop and report at E4.1 and again here. Test: an 85% run shows the Vault; a
60% run doesn't and shows no sad copy; a deliberately terrible Vault tap still
pays the floor; buy a pet with coins exactly as before.*

---

## Phase E5 — Open trades

Build `collections-spec.md` §6–7 in full: multi-item offers (max 6 per side),
the two-tray tap-only builder, legacy single-sprite doc migration, the
plain-words deal-shape line ("That's 5 for 1 — you'd still have one of each.
Your call! 🙂"), the notification dot from `listTrades().incoming.length` on
mount, and the parent-portal trade log.

Re-validated inside `runTransaction`, all of it: never your last copy (both
sides); 1–6 items per side; on accept, atomically move every sprite then run
the completion check for **both** kids — a trade that completes a collection
fires the full celebration for the receiver, which is the entire point of
trading. **A kid may receive a critter above their unlock level** — trading
legitimately bypasses the gate, and it renders in full colour. Zero text
inputs anywhere. Never poll; refresh on mount and after actions.

*Stop and report. Test with both real profiles: 3-for-1 built, accepted, both
collections correct. Should fail if broken: offering your last copy is
impossible in the UI and rejected by the transaction if forced.*

---

## Phase E6 — Balance pass, honest numbers

No new features. Model and report:

1. A week of realistic play (Miles: 1 learn + 1 fun run/day; Jackson: 2 + 1) →
   🧱, ⚡, 🪙, XP, levels, critters. Check the spec's Box tiers (medium ≈ a
   day, dream ≈ two weeks) and coin income vs skin/pet prices.
2. **Days to reach Levels 3, 7, and 11** at those rates. If legendary is
   functionally "next school year" for Miles, say so — we adjust
   `RARITY_UNLOCK`, not the XP rates.
3. Days to complete each collection solo, with and without Collection Focus
   and Critter Reader. Flag any collection unfinishable without trading —
   fine for some, broken if it's all eight.
4. Re-verify no-crossover, naming the enforcing code path for each rule.

*Report the numbers. Change nothing based on them without telling me first.*

---

## Ground rules

- Vanilla HTML/CSS/JS, ES modules, no build step, no new dependencies.
- Kids never type an email, password, or real personal info; nicknames only on
  shared surfaces; zero free-text fields in trading or anywhere social.
- No punishing states: sub-threshold runs still pay consolation XP, escaped
  encounters are "still out there," spares are trade goods, caps are
  tomorrow's luck, locked slots are goals. Read every string as if a 1st
  grader just had his best day.
- Every tunable number lives in `catalog.js` in plain language.
- Follow `CLAUDE.md`: edits stay local and uncommitted until I say "publish
  this".
