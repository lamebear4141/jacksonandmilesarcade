# Release 2 — The Game Economy (spec + bug log)

**v3, Aug 22, 2026** — the settled model, after AJ's three-currency proposal
and two decisions: the Box renders as an **isometric diorama first** (walking
later), and the 12 named bedtime critters **fold into the main collections**.
Supersedes v1/v2 of this file and the coin decisions in `decisions-log.md`.

Prompts: `claude/r2a-bugfix-prompt.md` (bugs + Home Run Derby),
`claude/r2b-collection-economy-prompt.md` (collections, drops, coins faucet,
trades), `claude/r2c-live-counter-prompt.md` (live counter). The Box gets its
own prompt (W1) after R2B lands.

Status: **W0 (wallet foundation) has been run** — resources and energy are
accruing. W0 never touched coins, so it stands as-is under this model.

---

## 1. The economy in one picture

```
🧠 LEARN games ──► XP + 🧱 RESOURCES ─┐
                                       ├──► spend BOTH ──► 📦 THE BOX
🎮 PLAY  games ──► XP + ⚡ ENERGY     ─┘

great run ──► 🎰 BONUS MINI-GAME ──► 🪙 COINS ──► avatar skins · pets
box visits ──► 👍 COMPLIMENTS ──────► 🪙 COINS ─┘

any game, played well ──► 🐾 CRITTER ──► LOCKER ──► trade with family
                                            └──► complete a COLLECTION
                                                    └──► badge + statue (no price)

XP ──► LEVEL ──► unlocks shop items + new critters into the wild
```

| Currency | Earned by | Spent on | Character |
|---|---|---|---|
| 🧱 Resources | Learning games — "your job" | The Box (always with ⚡) | The steady wage |
| ⚡ Energy | Fun games — recharging | The Box (always with 🧱) | Daily-capped balance |
| 🪙 Coins | Bonus mini-games after a great run; compliments on your Box | Avatar skins, appearance, pets | The bonus check |
| ⭐ XP | Any game, any time | Nothing — it's the level ladder | Time in the system |
| 🐾 Critters | Encounters, rewards, reading, trades | Never bought, never spent | Luck + persistence |
| 🏆 Badges & statues | Completing a collection | — | Cannot be bought at any price |

**Every sink has exactly one lane.** Work builds your home. Play keeps you
balanced. Excellence funds your self-expression. Generosity gets rewarded.
Achievement gets a trophy that money can't touch.

### 1.1 Nothing crosses over

Resources and energy buy Box items only, always in combination. Coins buy
avatar items only. No currency converts to any other. Nothing buys a critter.
Nothing buys a badge or statue. Enforce in code, not by remembering: there must
be no function that turns one of these into another.

### 1.2 The coin faucet

Coins stop being a per-run payout and become a **bonus**:

- **The Bonus Vault** — a shared ~10-second mini-game that appears after any
  qualifying run in any game (same thresholds as critter drops, §3.3). Three
  vaults shimmer; a timing tap cracks one open for 5–15🪙 by accuracy. It
  always pays at least the floor — there is no losing the bonus round.
- **Bespoke bonus rounds** replace the Vault in games that earn one over time
  and pay more. The **Home Run Derby is the first** (2🪙 per homer).
- **Compliments** on your Box (§5.2), capped and bonus-sized.
- Daily coin cap, same reset pattern as energy.

Shop prices for skins and pets are **unchanged** — the existing coin prices and
level gates stand. Calibration rule for the transition: Vault payouts are tuned
so a typical day's coin income lands within ~±30% of what the boys earn today,
measured before changing anything (R2B / E4 reports it first).

---

## 2. Critters: 80, in 8 collections

### 2.1 The collections

Eight collections of exactly 10, each with the rarity shape
**5 common / 3 rare / 1 epic / 1 legendary** — so there are eight legendaries
in the world, each the named crown of its collection.

| Collection | Icon | Badge (the brag) | Statue for the Box |
|---|---|---|---|
| Dinosaurs | 🦖 | Dino Ranger | Fossil Skeleton |
| Farm Animals | 🚜 | Ranch Boss | Big Red Barn |
| Bugs | 🐞 | Master Bug Catcher | Giant Ladybug |
| Sea Creatures | 🌊 | Marine Biologist | Whale Fountain |
| Fantasy | 🦄 | Legend Keeper | Crystal Castle |
| Space Invasion | 🛸 | Galaxy Defender | Crashed UFO |
| Jungle | 🌴 | Jungle Explorer | Ancient Temple |
| Safari | 🦁 | Safari Guide | Watering Hole |

Future seasonal collections (Halloween, Christmas) append later — the
architecture already supports a `season` field.

**Rarities collapse from five to four.** Mythic folds into legendary — a
display-and-roll change; stored rarity values on existing sprites are not
edited.

### 2.2 The migration rule

`SPRITES` is index-locked and the boys already own critters, so the
restructure works by **membership, not by rewriting the array**: collections
are lists of sprite ids. Existing sprites map into the new collections by theme
(🦖🦕 → Dinosaurs, 🐬🦈🐙 → Sea Creatures, 👽🤖🧑‍🚀 → Space Invasion…); new
sprites are appended only to fill each collection to 10. Nobody loses anything
caught, and a kid who already owns the shark gets Sea Creatures credit on day
one. Existing oddball sprites that fit no theme stay unaffiliated flavor —
still catchable, still tradeable, just not in a collection.

**The 12 named bedtime critters fold in** (decision, Aug 22): Pip, Mo, Wren,
Sprout, Luna, Bram, Puddle, Ziggy, Nova, Willow, Sir Biscuit, and Twinkle are
appended as ordinary sprites, keep their names, and are assigned to whichever
collection fits (Ziggy the Dragon and Nova the Unicorn → Fantasy, Sir Biscuit →
Farm Animals, …). No exclusivity — same pool as everything else.

### 2.3 Level gates the wild

| Rarity | Findable from |
|---|---|
| common | Level 1 |
| rare | Level 3 |
| epic | Level 7 |
| legendary | Level 11 |

A roll above the kid's unlocked band **clamps down** to the highest band they
have — luck is never wasted, and "you weren't high enough" is never shown.
Crossing a threshold makes level-up the biggest moment in the game:
**"🎉 NEW CRITTERS ARE OUT THERE!"** with silhouettes of what's now findable.

Tuning target (verified in the balance pass): rare within the first week, epic
within a month, legendary a real but *visible* horizon — if legendary means
"next school year" for a 1st grader, the curve is wrong, not the kid.

### 2.4 The three states

Everywhere critters render — Locker, Collections, trade builder, reveals:

| State | When | Renders as |
|---|---|---|
| **Hidden** | level hasn't unlocked its rarity | empty slot — no shape, no name |
| **Silhouette** | findable, not yet caught | dark shape on a light tile, name `???`, rarity ring shown |
| **Full colour** | caught | critter, name, rarity ring, duplicate count |

Hidden slots still count toward totals ("3 / 10") so the kid knows how many
remain, not what they are.

### 2.5 Four ways to get a critter

1. **Encounters** (spatial games — Multiverse Collector, Harvest Night, future
   runners): the critter appears *in* the gameplay. Touching it puts it in a
   bubble on the HUD — a **pending capture** that confirms only when the run
   ends successfully through the normal award path. Quitting mid-run releases
   it: "It scampered off — it's still out there! 🌿" Never punishing, and it
   kills farming the first ten seconds of a course.
2. **Reward rolls** (question games — Loot Drop, Math Defender, Math Baseball,
   Coin Climb): a qualifying run (§3.3 thresholds) rolls a random critter at
   the end.
3. **Reading** (Critter Reader): pick any *unlocked* critter and read it
   bedtime stories — common 1 night, rare 3, epic 6, legendary 10, one star
   per calendar day. The slow, guaranteed road next to play's fast, random
   road. The only place in the arcade where you choose your critter.
4. **Trading** (siblings now, approved friends later): structured, tap-only,
   never your last copy. Trading legitimately bypasses level gates — a
   received legendary renders in full colour at any level. That's the reward
   for having a generous brother.

Each game declares exactly one acquisition mode in the catalog. Encounters and
reward rolls share the same daily cap (4/kid) and the same level-gated pool, so
neither is a strictly better farm.

### 2.6 Completion — the things with no price

Completing a collection grants the **badge** (displayed on the profile and
visible to visitors — the brag), an avatar accessory, and the **statue**: 2×2,
animated, `buyable:false`, never listed in any shop. Completing **all eight**
grants the Grand Prize: 🎢 Sky Coaster Island, 3×3, the only one in existence.

---

## 3. Drops machinery (shared by modes 1 and 2)

- **Qualifying:** learn games ≥ 80% accuracy; fun games at a per-game
  milestone (`GAMES[id].dropUnits`). +1 bonus roll at 100% or 2× milestone.
- **Daily cap 4** per kid. Loot Drop's in-round chests are unchanged and
  exempt — it stays the daily habit game — but its pool respects level gates.
- **Pity:** 8 qualifying runs without epic+ (once epic is unlocked) guarantees
  rare+ next roll.
- **Collection Focus:** the kid's chosen collection pulls a share of rolls
  toward its missing, unlocked members — after the rarity roll, never
  inflating it.
- Cap language is always tomorrow-flavored: "Tomorrow's critters are already
  waking up 🌙" — never "limit reached."

---

## 4. Bug / polish log (unchanged from v2 except derby payout)

| # | Game | Issue | Fix | Where |
|---|---|---|---|---|
| 1 | Math Baseball | No upper bound on a great inning | 10-run cap → **Home Run Derby**, paying 🪙 **coins** (2/homer) — the first bespoke bonus mini-game | R2A |
| 2 | All games | Unverified that perfect runs terminate | Audit + `SAFETY.maxRunMinutes: 45` backstop | R2A |
| 3 | Math Baseball | Shows EASY/MEDIUM/HARD though difficulty comes from the profile | Remove all tier language from kid-facing UI | R2A |
| 4 | Critter Catchers | Private dex, disconnected from the Locker | Becomes **Critter Reader**, feeding the main collection | R2B |
| 5 | All games | Doing well pays nothing collectible | Encounters + reward rolls | R2B |

---

## 5. The Box

Each kid starts with an empty **isometric diorama** — a 3D-looking room/yard
with a fixed camera and a placement grid (decision, Aug 22: diorama first,
walkable avatar later, free camera maybe never). The economy is identical
regardless of renderer, so the renderer never blocks the economy.

### 5.1 Building

Everything costs 🧱 + ⚡ in combination. Tiers: small 15🧱+8⚡ · medium
60🧱+30⚡ · large 200🧱+100⚡ · dream 500🧱+250⚡ (houses, furniture, cars,
sports gear, pools, rides). Placement, moving, and re-arranging are always
free — buying is the spend, creativity is not. Statues and the Grand Prize
place like any item but can never be bought.

### 5.2 Visiting and compliments

Siblings (later: parent-approved friends) can visit each other's Boxes and
compliment them — **structured reaction buttons only** ("🔥 SO COOL!",
"🏗️ GREAT BUILD!", "😂 THAT'S FUNNY!"), never free text, per the standing
privacy rules.

The anti-money-printer bounds, all of them load-bearing:

- Only the **first compliment per visitor per day** pays the owner (10🪙,
  minted by the system — the visitor spends nothing).
- The **visitor** earns a small capped "good friend" XP bonus, so visiting is
  rewarded without complimenting becoming a job.
- Repeat compliments on an **unchanged** Box pay nothing new — "Come back when
  they've built something new!" — which quietly rewards kids for iterating.
- Compliment income counts against the daily coin cap. Coins from play are the
  wage; compliments are the tip jar. With two kids, one brother's income can
  never depend on the other's mood.

---

## 6. Sequencing

1. ~~W0 — wallet foundation~~ **done.**
2. **R2A** — bugs + Derby (paying coins). Independent; next.
3. **R2C** — live counter. Independent; any time.
4. **R2B** — collections restructure, drops + encounters, Critter Reader, the
   coin faucet, trades. Phase E1 stops for AJ's approval of the full
   80-critter roster before anything is written.
5. **W1 — the Box** (isometric diorama, build/buy/place, visiting +
   compliments). Own prompt after R2B lands.

---

## 7. Open questions

1. Rename "Critter Catchers" → "Critter Reader" in kid-facing copy? (Folder
   and game id stay regardless.)
2. Exact XP curve to Level 11 at the boys' real play rates — R2B's balance
   phase reports it; adjust `RARITY_UNLOCK` rather than XP rates if legendary
   is too far.
3. Vault payout calibration — set after E4 reports current real coin
   income/day.
4. Which existing unaffiliated sprites join collections vs stay flavor — AJ
   approves the roster table in E1 before it's written.
5. Seasonal collections (Halloween first?) — architecture ready, content
   later.
