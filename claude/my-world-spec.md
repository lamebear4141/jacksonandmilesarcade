# My World — the creative pillar (spec)

The third pillar of the arcade: a buildable world per kid, an avatar studio,
and a positive-only social loop. Written Aug 2026 from AJ's concept + the
`my-world.html` mockup. Builds ON TOP of the character system
(`claude/character-system-prompt.md`, Phases 0–3 built) and the Playground
identity (`claude/visual-identity-spec.md`).

**Sequencing: build this AFTER the reskin and Phase 4** (games wired to
`finishRun`) — the economy hooks land in `finishRun`, so it must exist first.

---

## 1. The three pillars

| Pillar | Games | Pays | Metaphor |
|---|---|---|---|
| 🧠 LEARN | Loot Drop, Math Defender, Coin Climb, Critter Catchers | 🧱 **Bricks** (materials) | "Your job" |
| 🎮 PLAY | Multiverse Collector, Block Stacker, Harvest Night | ⚡ **Sparks** (energy) | "Recreation" |
| 🎨 CREATE | My World, Avatar Studio | 🪙 **Coins** via friends' recognition | "Being seen" |

**The core mechanic: every placement in the world costs bricks AND sparks.**
That single rule is the whole balance system — grind only math and you run out
of energy; play only fun games and you run out of materials. No lectures, no
locks: the economy itself teaches "work + play, both."

**XP is unchanged and universal** — all three pillars award it, levels remain
the one ladder, and levels gate land expansions, costumes, and some items.

**This supersedes the 4× coin weighting** (decisions-log updated): steering now
comes from *which resource* a game pays, not from paying practice games more of
the same currency. Coins shift toward the social loop. Keep `awardRun`'s
structure; the payout table changes:

```js
// catalog.js — replaces the old xpMult/coinMult steering
export const PILLAR_ECONOMY = {
  learn: { bricksPerCorrect: 2, accuracyBonus: 20 },   // ~60 bricks per good run
  fun:   { sparksPerUnit: 1, dailySparkCap: 60 },      // ~15–25 sparks per run
  create:{ highFiveOwner: 5, highFiveVisitor: 2,       // per friend per day
           reactionOwner: 1 },
  xpPerUnit: 10, clearBonusXp: 100, consolationXp: 25, // unchanged, all pillars
};
```

Coins remain spendable everywhere (avatar gear, costumes, pets); bricks/sparks
are only earnable by playing — **never buyable with coins**, or the balance
mechanic dies. Tune numbers so a typical week of balanced play affords one
"medium" item (~a tent) per day and one "dream" item (~roller coaster) per
2–3 weeks — long enough to be a goal, short enough for a 1st grader.

## 2. The world

- **Tile grid, not freeform pixels.** AJ's "1000×1000 space" becomes a grid of
  36px tiles: starts **16×12**, expands with level (18×14 @ L8, 22×16 @ L12,
  … cap ~40×28 ≈ 1,120 cells ≈ the 1000-block spirit). Expansion is a level-up
  reward moment ("Your world grew! 🎉").
- **Terrain painting:** grass (default), path, water, sand, dirt — 1 brick per
  tile. **Items:** emoji-rendered at first (zero art cost, matches the arcade's
  aesthetic), footprint 1×1 with visual size varying; larger sets later.
- **Catalog categories:** Nature, Home, Animals, Rides, Farm, + two special:
  - **My Critters** — every sprite from the 60-collection and Multiverse
    captures is placeable FREE (already earned); they wander their world.
    This ties the existing collections into the world for nothing.
  - **Scholar** — items that can't be bought at any price: unlocked by
    **mastery badges** (×7 tables mastered → 🔭 Observatory; 50 passages →
    📚 Library; division mastery → 🤖 Robot Lab; 30-day streak → 🏆 statue).
    Visible-but-locked, like the shop. This is "some items only from education"
    done as trophies rather than a paywall.
- **"Put away", never "delete"** — removing an item refunds it to inventory
  (full refund; no destruction, no loss, per the no-punishing rule).
- **Inventory model:** owning N copies lets you place N. Buying adds a copy;
  putting away returns one; trading/selling moves copies between kids.

### Firestore

```
families/{uid}/children/{childId}
  character.wallet: { bricks, sparks, coins }       ← extends existing character
  character.avatar: { skin, hair, hairColor, top, acc, costume }  ← replaces bare `skin`
  character.worldItems: { oak: 3, house: 1, ... }   ← map, increment()-safe
  character.badges: ['x7-tables', 'streak-30', ...]

families/{uid}/children/{childId}/world/main        ← ONE doc, the whole world
  { name, cols, rows,
    terrain: "0000212000..."            ← run-length or char-per-cell string
    items: [ {id:'oak', x:3, y:5}, … ]  ← array is fine: single-writer,
    version, updatedAt }                   whole-doc save on the Save button;
                                           `version` guards two-device clobber
```

World doc stays comfortably under Firestore's 1MB (500 items ≈ 15KB). Save is
explicit (the 💾 button + autosave every ~60s), compare `version` on write and
prompt "This world was changed on another device — reload?" on mismatch.

### Award path changes (Phase 4's `finishRun`)

`finishRun` computes bricks (learn) or sparks (fun) alongside XP, writes them
with `increment()`, and the end screen shows the pillar currency earned with
its icon — "You earned 🧱 46 bricks!" — so the supply chain is visible in the
game itself. Build-mode's "low on X" nudge buttons deep-link to the games.

## 3. Avatar Studio

Paper-doll **parameterized SVG** (one `<svg>`, fills + path variants swapped by
JS) — no sprite art needed, every combination works:

- Skin: 5 tones · Hair: 5 styles × 6 colors · Outfit: 6 colors (later: 
  patterns, pants) · Accessories: glasses/cap free; crown 🪙300, cape @ L8, etc.
- **No gender field stored** — hair + outfit choices cover expression without
  asking or recording the question.
- **Costumes** = the existing SKINS catalog (Ninja, Robo, …) as full-look
  overrides on top of the doll. Existing `character.skin` migrates to
  `avatar.costume`.
- The doll renders everywhere the avatar emoji does today (bar chip, hero,
  leaderboard) via a small `renderAvatar(avatar, size)` helper that returns the
  SVG — with an emoji fallback at tiny sizes.
- Gear is bought with 🪙 coins → the creative pillar funds self-expression.

## 4. The social loop (friends, visits, high-fives)

Surface is **five buttons, zero text inputs**: 🖐️ High Five + 👍🔥😍🏆.

- **Visits:** read-only render of a friend's world doc. Family always;
  non-family requires the friend flow (family code + BOTH parents approve —
  see playground-v2 mockup + project privacy rules).
- **High five:** once per friend per day. Owner +5🪙, visitor +2🪙 —
  generosity pays both ways, making visits a daily ritual. Idempotent by
  construction: doc id = `{YYYY-MM-DD}_{fromKid}_{toKid}`, rules allow
  create-only (no update/delete), so double-taps and clock games can't farm it.
- **Reactions:** fixed positive set, one each per day, +1🪙 owner. No
  downvotes, no rankings, no "most liked" charts — worlds are never compared,
  only visited. A kid sees "3 friends visited this week 🖐️×2 🔥×1", never a
  leaderboard of worlds.
- **Selling/trading items:** reuse the trade wizard pattern (structured
  pick-lists only). Sell = offer item for coins; trade = item for item. Same
  transaction rules as sprite trades (atomic, both sides re-validated).

### Cross-family Firestore design (the real work)

The family-wildcard rules don't cover cross-family reads. New top-level
collections:

```
friendships/{pairId}         pairId = sorted "famA:kidA__famB:kidB"
  { a:{uid,childId,nickname}, b:{...}, status:'pending'|'active',
    approvedByA, approvedByB, createdAt }

shared_worlds/{shareId}      shareId = "{uid}_{childId}"
  { nickname, avatar, world:{...}, level, updatedAt }   ← sanitized copy,
                                                           written on Save
highfives/{date_from_to}     create-only, see above
reactions/{date_from_to_emoji}  same pattern
```

Rules sketch: `shared_worlds` readable iff an `active` friendship doc exists
for the pair (`exists()` on the deterministic pairId — one doc-read in rules,
supported); high-five/reaction creates validated the same way + date check
against `request.time`. Publishing to `shared_worlds` only happens for kids
whose parent enabled sharing (the portal toggle); family-only kids' worlds
never leave the family doc. **Honest limitation** (same as PINs): within one
family, siblings share auth — client-side discipline, not security. Across
families, rules genuinely enforce.

## 5. Kid-facing framing

Names used in UI: **My World** (the space), **Build Mode**, **Avatar Studio**,
**Bricks** 🧱, **Sparks** ⚡. Each kid names their world (from a structured
word-picker — adjective + noun lists + emoji, e.g. "Frogtopia 🐸" — no free
text, consistent with the no-open-text rule).

Empty-world cold start: the first visit plants a starter kit (a tree, a tent,
a path, their favorite critter) via a 60-second guided build — never a blank
stare. Misses/mistakes: "put away" and rearrange freely; nothing is ever lost
or wrong.

## 6. Build phases (each one ships)

- **W0 — Wallet + payout switch.** Add bricks/sparks to the character,
  `finishRun` pays by pillar, end screens show it. No world yet — kids just
  start accruing. (Small; do with Phase 4 or right after.)
- **W1 — Build Mode, family-only.** World doc, grid renderer, terrain, catalog
  (Nature/Home/Animals/Rides/Farm), place/put-away, save/version, starter kit,
  My Critters free placement. Sibling visits (same family doc) + high-five
  between siblings.
- **W2 — Avatar Studio.** Doll SVG, options, coin-gated gear, costume
  migration, `renderAvatar` everywhere.
- **W3 — Scholar items + mastery badges.** Badge computation from existing
  per-fact/session data; badge-gated catalog entries; badge case on the
  character page.
- **W4 — Cross-family.** `friendships`/`shared_worlds`/`highfives` +
  rules deploy + parent approval queue in the portal + reactions.
- **W5 — Item selling/trading** between friends, on the trade-wizard pattern.

## 7. Open questions for AJ

1. World names from word-picker lists — good enough, or do you want to
   parent-approve free-text names? (Recommend the picker; zero moderation.)
2. Should sparks decay or cap weekly to prevent hoarding a summer of energy?
   (Recommend: daily earn cap only, no decay — decay reads as punishment.)
3. Multiple worlds per kid later (seasonal/holiday plots), or one forever?
4. Does Harvest Night count as fun-pillar sparks source given it's
   desktop-only? (Recommend yes — scarcity makes laptop time special.)
