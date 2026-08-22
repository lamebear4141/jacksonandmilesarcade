# Release 2 — The Game Economy (spec + bug log)

**v2, Aug 21, 2026** — rewritten after AJ's economy proposal. Replaces the
three-pillar/coins model. Supersedes the coin decisions in `decisions-log.md`
§"Design — the three-pillar economy" and `claude/my-world-spec.md` §1.

Related: `claude/my-world-spec.md` (the spend surface),
`claude/collections-spec.md` (sets, badges, trades),
`claude/wallet-foundation-w0-prompt.md` (earning — run first),
`claude/critter-catchers-v2-prompt.md`, `claude/math-baseball-prompt.md`.

Prompts: `claude/r2a-bugfix-prompt.md`, `claude/r2b-collection-economy-prompt.md`,
`claude/r2c-live-counter-prompt.md`.

---

## 1. The economy in one picture

```
🧠 LEARN games ──► XP + 🧱 RESOURCES ─┐
                                      ├──► spend BOTH ──► skins · pets · My World
🎮 PLAY  games ──► XP + ⚡ ENERGY     ─┘

either type, played well ──► 🎲 CRITTER ──► LOCKER ──► trade with family
                                               └──► complete a SET ──► 🏆 STATUE

XP ──► LEVEL ──► unlocks more to buy AND more critters to find
```

**Two currencies, one ladder, and luck.** That's the whole system.

- **🧱 Resources** come only from learning games. **⚡ Energy** comes only from
  fun games. **Every purchase costs both** — skins, pets, and everything in My
  World. Grind only math and you run out of energy to build with; play only fun
  games and you run out of materials. Nobody has to enforce "do both."
- **Critters cannot be purchased at any price, in any currency, ever.** They're
  found by playing either kind of game and succeeding. This is the one thing
  money can't touch, which is what makes trading matter.
- **XP is the single ladder.** Both game types pay it. Leveling up unlocks more
  items in the shop *and* more critters into the wild.

### 1.1 Coins are retired

**Decision (AJ, Aug 21): coins are removed entirely.** Every price becomes
resources + energy. Existing balances convert once, at a rate set after Claude
Code reports what the boys actually hold.

This also **deletes the sequencing constraint** that was blocking work: the old
model needed coins to move from games to the social loop, which couldn't happen
until My World's friend-visiting existed, or the Shop would be stranded with no
way to earn. With one earn path feeding every sink, that ordering problem is
gone. High-fives and world visits will pay XP (and later, small resource/energy
bonuses) rather than a third currency.

### 1.2 Nothing crosses over

Resources can't buy energy. Energy can't buy resources. Neither buys a critter.
Nothing buys a statue. The moment any of these becomes purchasable with
another, the balance mechanic dies and it all collapses into one currency with
several names. Enforce this in code, not by remembering.

---

## 2. Prices, and the thing that changed

The Shop and My World now draw from the **same pot**, where the old price tiers
assumed the world was the only sink. Left alone, a "dream" item goes from ~2
weeks to 3–4, which is past what a 1st grader will hold in his head. **Fix it by
lowering prices, not raising earn rates** — inflating income makes resources
stop feeling scarce, which is the whole motivation.

| Tier | Example | Cost |
|---|---|---|
| Small | bush, fence, path tile | 15🧱 + 8⚡ |
| Medium | tent, dog house, small pond, a **pet** | 60🧱 + 30⚡ |
| Large | house, treehouse, barn, a **skin** | 200🧱 + 100⚡ |
| Dream | roller coaster, castle | 500🧱 + 250⚡ |

Reference earn rate: a good learn run (20 correct) ≈ 40🧱; daily energy cap is
60⚡. So medium ≈ a day, large ≈ 4 days, dream ≈ 2 weeks of balanced play.

Skins and pets slot into the same ladder as world items deliberately — a kid
choosing between a new pet and a treehouse is a real decision, and real
decisions are the point.

---

## 3. Critters

### 3.1 Found, never bought

One shared drop roll in the award path, firing for **every** game:

- **Qualifying run:** learn games ≥ 80% accuracy (the existing clear-bonus
  line); fun games at a per-game milestone (`GAMES[id].dropUnits`).
- 1 roll per qualifying run, +1 at 100% accuracy or 2× the milestone.
- **Daily cap 4** per kid, so a rainy Saturday can't devalue the collection.
  Loot Drop's chests are unchanged and don't consume the cap — it's the daily
  habit game and stays the biggest source by design.
- Hitting the cap is never a wall: "Tomorrow's critters are already waking up
  🌙" — never "limit reached", never a lock icon.

**Both game types drop at the same rate.** The learn/play balance rests entirely
on resources vs energy. If reading and math should feel luckier, the lever is
`dropUnits` and per-game roll counts — not exclusivity.

### 3.2 Level gates the wild

**Rarity is unlocked by level**, not just rolled:

| Rarity | Available from |
|---|---|
| common | Level 1 |
| rare | Level 4 |
| epic | Level 8 |
| legendary | Level 12 |
| mythic | Level 16 |

A roll above your unlocked band **clamps down** to the highest band you have —
you never "waste" luck, you just can't exceed your level yet. Per-sprite
`unlockLevel` overrides the band default when a specific critter should arrive
earlier or later.

This fixes a real problem in the old design: a Level 2 kid rolling a mythic made
the whole ladder meaningless, and the pity timer was a bandage over it. Now
**every level-up is a reward moment** — "🎉 3 NEW CRITTERS ARE OUT THERE!" with
their silhouettes — which beats any number going up.

Pity timer still applies *within* the unlocked bands: 8 qualifying runs with no
epic-or-better (once epic is unlocked) guarantees rare+ on the next roll.

### 3.3 The three states

Every critter in the Locker and the Collections tab renders in exactly one of
three states. This is the whole progression, visible at a glance:

| State | When | Renders as |
|---|---|---|
| **Hidden** | your level hasn't unlocked its rarity | an empty slot — no shape, no name, no rarity |
| **Silhouette** | unlocked and findable, not yet caught | the shape in solid dark on a lighter tile, name `???`, rarity ring visible |
| **Full colour** | caught | the critter, its name, rarity ring, duplicate count |

Hidden slots still **count toward the totals** — a set card reads "3 / 7" and
the four unknown slots sit there as plain tiles. The kid knows how many are
left, not what they are. Sprites are emoji, so the silhouette is
`filter: brightness(0)` at ~0.55 opacity on a light tile; check contrast in both
themes, and never let a silhouette read as a rendering bug.

### 3.4 Critter Catchers joins the main collection

Its twelve named critters (Pip, Luna, Ziggy, Twinkle…) are **appended to
`SPRITES` as ordinary critters** — same pool, same rarities, same level gates,
findable in any game like everything else. No exclusivity flag.

The bedtime star quest survives with a **new and better job**: it's the one
place in the arcade where you can **aim at a specific critter.** Everywhere else
is luck; here you pick Twinkle and read to her over fifteen nights. That's a
genuinely distinct role, it keeps the game's characters meaningful, and it gives
a kid stuck one critter short of a set something to actually *do* about it.

- Star progress moves to the character doc so it survives switching iPads.
- Completing a quest grants the sprite through the normal award path.
- A star for an already-owned critter grants **+1 spare** — trade goods.

### 3.5 Sets, and the thing with no price

Per `collections-spec.md`: every completed set grants a badge, an avatar unlock,
and a **statue** — 2×2, animated, `buyable: false`, never listed in any shop at
any price. Completing **all** sets grants the Grand Prize: 🎢 Sky Coaster
Island, 3×3, the only one of its kind.

---

## 4. Bug / polish log

| # | Game | Issue | Fix | Where |
|---|---|---|---|---|
| 1 | Math Baseball | No upper bound on a great inning | Cap at 10 runs → **Home Run Derby** | R2A |
| 2 | Math Defender | Unverified that a perfect run terminates | Audit all games + global safety cap | R2A |
| 3 | Math Baseball | Shows EASY/MEDIUM/HARD though difficulty comes from the profile | Remove all tier language from kid-facing UI | R2A |
| 4 | Critter Catchers | Private dex, disconnected from the Locker | Merge into the main collection | R2B / E3 |
| 5 | All games | Doing well pays nothing collectible | Universal critter drop | R2B / E2 |

### 4.1 Home Run Derby

Three outs still ends a normal game. Reaching `runCap` (10) ends the inning
early and opens the Derby, framed as the crowd demanding it.

- No questions — the only input is the swing.
- **A home run continues. Anything else ends it.** Faster every homer, both the
  flight time and the contact window shrinking to a floor, so it provably ends.
- **One mulligan** — the first non-homer is forgiven once. Ending a 10-run
  masterpiece on a single bad swing is exactly the feeling this project avoids.
- Cap at 100 homers → "PERFECT DERBY 💯".
- **Derby homers pay ⚡ energy, not 🧱 resources**, and never touch `correct` or
  `accuracy`. Resources stay welded to right answers so no amount of swinging
  can farm the learning currency.

### 4.2 Terminating-condition audit

Every game must end for a kid who never misses. Expected: Math Defender (20
questions / 60s), Coin Climb (15 correct / 60s), Loot Drop (5 questions),
Critter Catchers (pages), Math Baseball (3 outs, now + run cap) all bounded;
Multiverse Collector and Block Stacker endless by design and needing a graceful
cap. Ship a `SAFETY.maxRunMinutes: 45` backstop regardless — full credit, warm
message, never a freeze.

---

## 5. The live counter

Public aggregate count of who's playing now. Prompt:
`claude/r2c-live-counter-prompt.md`.

- **"3 KIDS IN THE ARCADE"** plus a detail line from what they're doing
  ("1 catching critters · 1 out in the corn").
- **Never renders a zero** — at zero it shows all-time totals instead.
- Aggregate only: no uid, childId, nickname, or location on a public surface.
- Guests need `signInAnonymously` to pass the presence write rules, or it
  silently undercounts every cousin.
- Structurally decoration: every failure mode degrades and never blocks a game.

---

## 6. Sequencing

1. **W0 — wallet foundation.** Resources and energy start accruing.
   (Its note about coins moving to the Create pillar is superseded by §1.1 —
   the code it asks for is still exactly right.)
2. **R2A — bug fixes.** Independent; any time.
3. **R2C — live counter.** Independent; any time.
4. **R2B — the collection economy**, E1–E6, including retiring coins.
5. **My World W1 — Build Mode.** The spend surface. Its own prompt, bigger than
   everything above combined.

---

## 7. Open questions

1. **Coin conversion rate** — set it after Claude Code reports the boys' actual
   balances. A generous rate makes them instantly rich and skips the first week
   of the new economy.
2. **Level gates vs. sets.** With rarity gated by level, low-level kids can't
   complete sets containing legendaries. Intended — but watch whether Miles
   reads it as unfair rather than as a goal.
3. **Do learn and fun games really drop at the same rate**, or should reading
   and math be luckier? (Lever: `dropUnits` and rolls per run.)
4. **What the social loop pays** once My World lands — XP only, or small
   resource/energy bonuses? No third currency either way.
5. **Squad code width.** At 93 sprites the 4-bit code hits ~74 chars; R2B takes
   the 1-bit fix with a version prefix.
