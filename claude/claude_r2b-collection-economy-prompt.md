# Claude Code prompt — R2B: the collection economy

**v2 — rewritten Aug 21, 2026** for the two-currency model in
`claude/economy-r2-spec.md`. Coins are retired; critters are found by playing
either kind of game and gated by level; everything is bought with resources AND
energy.

**Run `claude/wallet-foundation-w0-prompt.md` first.** This prompt assumes
🧱 resources and ⚡ energy are being earned.

Design sources: `claude/economy-r2-spec.md` (authoritative — read it first),
`claude/collections-spec.md` (set data, trade rules),
`claude/my-world-spec.md` (the later spend surface).

Paste everything below the line into Claude Code in the `jacksonandmilesarcade`
repo. Six phases; **stop after each and report how to test, including one thing
that should fail if the phase is broken.**

---

We're building the collection half of the arcade economy, and retiring coins.
Read before writing anything: `claude/economy-r2-spec.md`,
`claude/collections-spec.md`, `site/assets/catalog.js`,
`site/assets/arcade-shell.js`, `site/firebase-config.js`,
`site/assets/locker.js`, `site/assets/shop.js`, `site/assets/trade.js`,
`site/assets/home.js`, `site/critter-catchers/index.html`,
`site/loot-drop/src/state.js`.

**Every phase is idempotent-by-inspection.** Parts of this may already exist
from another session. Before adding anything, check whether it's already there
and add only what's missing. Never duplicate a `SPRITES` entry or a config block.

**The one rule that breaks everything if ignored: `SPRITES` is index-locked.**
The squad code is a bitmask over the array. New entries are **appended only** —
never inserted, never reordered, never removed. Re-read the file immediately
before editing it.

---

## Phase E1 — The roster, the sets, and the three-state Collections tab

### E1.1 — Append the 21 set sprites (60 → 81)

Exactly as specified in `claude/collections-spec.md` §2 — the eight launch sets,
their member lists and rarities, followed literally. Skip if already done.

### E1.2 — Append the 12 Critter Catchers critters (81 → 93)

These are ordinary critters in the main collection. **No exclusivity flag** —
same pool, same rarities, findable in any game like everything else.

| id | Emoji | Name | Rarity |
|---|---|---|---|
| s81 | 🦊 | Pip the Fox | common |
| s82 | 🐭 | Mo the Mouse | common |
| s83 | 🐰 | Wren the Bunny | common |
| s84 | 🦔 | Sprout the Hedgehog | common |
| s85 | 🦉 | Luna the Owl | rare |
| s86 | 🐻 | Bram the Bear | rare |
| s87 | 🐸 | Puddle the Frog | rare |
| s88 | 🐲 | Ziggy the Dragon | epic |
| s89 | 🦄 | Nova the Unicorn | epic |
| s90 | 🐺 | Willow the Dream Wolf | legendary |
| s91 | 🐶 | Sir Biscuit the Pup | legendary |
| s92 | 🌟 | Twinkle the Star Sprite | mythic |

Add the ninth set:

```js
{ id:'bedtime', icon:'🌙', name:'Bedtime Buddies',
  blurb:'Read them all to sleep, one night at a time',
  members:['s81','s82','s83','s84','s85','s86','s87','s88','s89','s90','s91','s92'],
  badge:  { emoji:'🌙', name:'Dream Keeper' },
  statue: { id:'dream-castle', emoji:'🏰', name:'Dream Castle' },
  avatar: { id:'nightcap', emoji:'🌙', name:'Nightcap', slot:'acc' },
  season: null }
```

Emoji collide with existing sprites (🦊 Pip vs 🦊 Ember Fox, 🐺 Willow vs 🐺
Ridgehowl). Names disambiguate, but add a small **🌙 corner badge** on Bedtime
Buddies cards wherever sprites render, so the two never read as a bug.

### E1.3 — The three-state display

This is the phase's real work. Every critter renders in exactly one of three
states, everywhere sprites appear (Locker, Collections, trade builder, drop
reveal, sibling peek):

| State | When | Renders as |
|---|---|---|
| **Hidden** | the kid's level hasn't unlocked its rarity band | an empty slot — no shape, no name, no rarity ring |
| **Silhouette** | unlocked and findable, not yet caught | the shape in solid dark on a lighter tile, name `???`, rarity ring visible |
| **Full colour** | caught | critter, name, rarity ring, duplicate count |

- **Hidden slots still count toward totals.** A set card reads "3 / 7" with the
  unknown ones as plain tiles — the kid knows how many are left, not what they
  are.
- Sprites are emoji, so silhouette = `filter: brightness(0)` at ~0.55 opacity on
  a light tile. **Check contrast in both themes** and make sure it never reads
  as a broken image. Screenshot it.
- One helper, `spriteState(spriteId, character)` → `'hidden'|'silhouette'|'owned'`,
  used by every renderer. Do not let three files each decide this.

### E1.4 — Build the Collections tab

Per `collections-spec.md` §8: header count, badge banner, set cards with
progress and reward preview, expand to the creature grid (three-state), sibling
"JAX HAS ONE" hints, completion celebration. Mockup at
`design/mockups/collections.html`.

Set completion is **derived, never stored as a flag** — complete iff every
member has `counts[id] > 0`. Only the *grant* is written, inside the same
`runTransaction` as `awardRun` / `respondToTrade`, guarded by `arrayUnion`.

### E1.5 — Statues have no price, and the Grand Prize

- Every set's `statue` gains `size:[2,2]`, `animated:true`, `buyable:false`.
  **Nothing with `buyable:false` may ever appear in any shop** — enforce it in
  the shop's filter, not by remembering to leave it out.
- Grand Prize when **all** sets complete:
  `{ id:'sky-coaster', emoji:'🎢', name:'Sky Coaster Island', size:[3,3], buyable:false }`.
- Statues granted before My World exists queue as `character.worldItems`; the
  celebration says "Saved for your world! 🏰".

### E1.6 — Squad code, before it breaks

At 93 sprites the 4-bit code hits ~74 characters. Take the fix from
`collections-spec.md` §10 now: **1 bit per sprite** (owned/not — the compare UI
never shows counts) with a **version prefix** so existing `?squad=` links keep
parsing. Round-trip both schemes in a test.

*Stop and report. Test: the Collections tab lists nine sets; the Locker shows 93
slots; at Level 1 every rare-and-above slot is blank, not a silhouette; an old
squad code still decodes. Should fail if broken: setting a test character to
Level 20 in the console must turn every uncaught slot into a silhouette.*

---

## Phase E2 — Level gates the wild, and every good run finds a critter

### The config, in `catalog.js`

```js
export const DROPS = {
  qualifyAccuracy: 0.80,     // learn games: same line as the clear bonus
  qualifyUnits: {            // fun games: a real milestone, not just showing up
    'multiverse-collector': 12, 'block-stacker': 10, 'harvest-night': 1 },
  bonusAtAccuracy: 1.0,      // perfect run → one extra roll
  bonusAtUnitsMult: 2,       // 2x the milestone → one extra roll
  dailyCap: 4,               // per kid per day; Loot Drop chests don't count
  pityRuns: 8,               // runs with no epic+ (once unlocked) → next roll rare+
  focusRerollChance: 0.25,   // Collection Focus, per collections-spec §9
};

export const RARITY_UNLOCK = {   // minimum character level to find each band
  common: 1, rare: 4, epic: 8, legendary: 12, mythic: 16,
};
```

### Behaviour

- **Clamp, never waste.** A roll above the kid's unlocked band drops to the
  highest band they *have* — a legendary roll at Level 5 becomes a rare. Never
  discard a roll, never show "you weren't high enough."
- Per-sprite `unlockLevel` overrides the band default where a specific critter
  should arrive earlier or later. Default to the band.
- Compute drops inside `awardRun`'s existing transaction alongside XP and
  currency; `increment()` each `counts.<spriteId>`; run the set-completion check
  afterwards in the same transaction.
- Rarity from the existing `rollRarity(luckScore)` — don't invent a second
  rarity system.
- `character.drops = { date, count, sinceEpic }`, resetting `count` when `date`
  isn't today, same pattern as the existing daily cap.
- **Pity** applies within unlocked bands only: `sinceEpic >= pityRuns` forces
  rare-or-better next roll, then resets. Skip entirely below Level 8.
- **Collection Focus:** `focusRerollChance` of rolls re-roll within the kid's
  active set's missing *and unlocked* members, **after** the rarity roll — it
  aims the same luck, never inflates rarity.
- **Loot Drop unchanged**, and its chests don't consume `dailyCap`. It must
  respect `RARITY_UNLOCK` like everything else.

### Two moments to build

**The drop reveal** — `revealDrops(drops)` in `arcade-shell.js`, so every game
shows the identical thing: a chest popping open, the critter scaling in with its
rarity-ring colour, and either **NEW CRITTER!** or **+1 SPARE**. A spare is
always framed as good luck, with a one-tap **Trade** button deep-linking into
the trade builder with that sprite pre-loaded. `finishRun` gains
`drops: [{spriteId, isNew, rarity}]`.

**The level-up unlock** — when a level-up crosses a `RARITY_UNLOCK` threshold,
the existing `celebrateLevelUp` overlay gains a second beat: **"🎉 NEW CRITTERS
ARE OUT THERE!"** showing the silhouettes of newly-findable critters (cap the
display at 6 with "+n more"). This is now the biggest reason to level up — give
it the full confetti treatment.

*Stop and report. Print the modelled drop distribution over 200 qualifying runs
at Level 3, Level 10 and Level 18 — count by rarity, and how often clamping and
pity fired. Test: finish a learn game at 100% and see two chests; at 60%, none,
with no sad messaging; level a test character from 3 to 4 and see the unlock
beat. Should fail if broken: a Level 2 character must never receive anything
above common, no matter how lucky the roll.*

---

## Phase E3 — Critter Catchers feeds the Locker

Its critters are now ordinary sprites (E1.2), so wire the game into the shared
collection. **Do not change any reading mechanics** — mic scoring, thresholds,
homophones, question fallback, sleep/awake logic and antics all stay exactly as
they are.

The star quest keeps a new and important job: **it's the one place in the arcade
where a kid can aim at a specific critter.** Everywhere else is luck. Say so in
the den copy — "Pick a friend and read them to sleep. Keep reading and they'll
be yours." That's what makes it worth playing when you're one critter short of a
set.

- **Star progress moves to the character doc:** `character.critterStars: { s81: 2 }`
  and `character.starDay: 'YYYY-MM-DD'`. Today a kid loses a 15-night Twinkle
  quest by picking up the other iPad — that's the bug worth fixing here.
- **A critter can only be quested for once its rarity is unlocked** by level.
  Locked ones appear on the den shelf as silhouettes with "Unlocks at Level 8" —
  here the level *is* shown, because the kid is choosing and needs to know why.
- **Completing a quest grants the sprite** through `awardRun`'s override (the
  path Loot Drop uses for chest sprites), so it lands in the Locker, becomes
  tradeable, and can complete a set — with the full celebration if it does.
- **A star for an already-owned critter grants +1 spare.**
- Unchanged: one star per calendar day, common 1 / rare 3 / epic 8 / legendary
  12 / mythic 15, extra stories still pay XP as "just for fun".
- **Migration, once per kid, guarded by `character.ccMigrated`:** every critter
  in the old local dex grants `counts[spriteId] = max(existing, 1)`; local star
  progress copies over. Never guess, never double-grant, never take a critter
  away. Report exactly what it migrated per profile.

*Stop and report. Test: finish a common critter's quest, see it in the Locker
and Collections; finish it again, see a spare with the Trade button; sign in on a
second browser and confirm star progress followed the profile. Should fail if
broken: running the migration twice must not change any count.*

---

## Phase E4 — Retire coins

Coins are removed from the game. Every price becomes resources + energy.

1. **Convert the catalog.** `SKINS` and `PETS` lose `cost` and gain
   `costBricks` / `costSparks`. Derive from the existing coin price and the
   tiers in `economy-r2-spec.md` §2 — pets land near medium (60🧱 + 30⚡), skins
   near large (200🧱 + 100⚡), scaled by their current relative prices. **Print
   the full before/after table in your report and stop for my approval before
   moving to step 3.**
2. **`buyItem` spends both**, inside the existing `runTransaction`: re-read both
   balances inside the transaction, require `bricks >= costBricks && sparks >=
   costSparks`, plus the existing level gate and not-already-owned checks.
   Partial payment is impossible — both or neither.
3. **The Shop UI** shows both costs on every card, and greys the card when
   *either* balance is short, naming which: "Need 40 more 🧱" / "Need 15 more ⚡"
   — with a nudge button deep-linking to a game that pays that currency. Locked
   items stay visible with "Reach Level 9", as they do today.
4. **Stop paying coins.** Remove coin awards from `finishRun` / `awardRun` and
   every game's end screen. Keep the field on the character doc — don't delete
   data.
5. **One-time conversion**, guarded by `character.coinsConverted`: **first report
   each child's current coin balance and propose a rate; do not convert until I
   confirm it.** Then grant the converted resources/energy with a warm one-time
   card on next login: "Your coins turned into 🧱 and ⚡!"
6. **Grep the whole site for coin language** — `🪙`, "coins", "purse" — and
   report every hit before changing copy. Some are in Loot Drop's own screens
   and in the parent report.

**Enforce the no-crossover rule in code:** there must be no path that converts
resources to energy or either into a critter, and nothing with `buyable:false`
may appear in any shop. Name the function that enforces each, in your report.

*Stop and report at step 1 and again at the end. Test: buy a pet with enough of
both; try with enough resources but not enough energy and confirm it's refused
by the transaction, not just hidden by the UI; confirm no game's end screen
mentions coins.*

---

## Phase E5 — Open trades

Build `collections-spec.md` §6 and §7 in full: multi-item offers (any count
either side, max 6 per side), the two-tray tap-only builder, legacy
single-sprite doc migration, the plain-words deal-shape line ("That's 5 for 1 —
you'd still have one of each. Your call! 🙂"), the trade notification dot fed by
`listTrades().incoming.length` on mount, and the parent-portal trade log.

Non-negotiable, all re-validated inside `runTransaction`:

- **Never your last copy**, on both sides.
- At least one item per side, at most `ECONOMY.maxTradeItems` (6).
- On accept, decrement and increment every sprite atomically, then run the
  set-completion check for **both** kids. A trade that completes a set fires the
  celebration for the receiving kid — that moment is the entire point of the
  trading system, don't skip it.
- A kid may trade *for* a critter above their unlock level. Trading is the
  legitimate way around the gate — it's the reward for having a generous
  brother, and the received critter renders in full colour like any other.
- **Zero text inputs anywhere.** The whole offer is built by tapping.
- Never poll; refresh on mount and after trade actions.

*Stop and report. Test with two real child profiles: build a 3-for-1, accept it,
confirm both collections and both set-completion states. Should fail if broken:
offering a sprite you own exactly one of must be impossible in the UI **and**
rejected by the transaction if forced.*

---

## Phase E6 — Balance pass and the honest report

No new features. Model and report:

1. A week of realistic play for each boy (Miles: one learn run + one fun run a
   day; Jackson: two learn + one fun) → resources, energy, XP, levels, drops.
   Compare against the §2 price tiers: is a medium item really about a day, a
   large about four, a dream about two weeks — **now that the Shop and My World
   share one pot?**
2. Time to reach each `RARITY_UNLOCK` level at those XP rates. If mythic is a
   year away, say so — that number decides whether Twinkle is a goal or a myth.
3. Time to complete each set at these drop rates, solo, with and without
   Collection Focus. Flag any set unfinishable without trading (fine for most —
   but if it's *every* set, the trading loop has nothing to work with).
4. Confirm the no-crossover rule holds, naming the enforcing code path for each.

*Report the numbers. Change nothing based on them without telling me first.*

---

## Ground rules

- Vanilla HTML/CSS/JS, ES modules, no build step, no new dependencies.
- Kids never type an email, password, or real personal info. Nicknames only on
  shared surfaces. No open text fields in trading.
- No punishing states: below the drop threshold still pays consolation XP,
  duplicates are trade goods, caps are tomorrow's luck, locked slots are goals.
  Read every string you write as if a 1st grader just had his best day.
- Every tunable number lives in `catalog.js` in plain language.
- Follow `CLAUDE.md`: edits stay local and uncommitted until I say "publish
  this".
