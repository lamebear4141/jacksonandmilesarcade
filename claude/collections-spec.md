# Collections, Badges & Trade Alerts — spec

Themed creature sets layered onto the existing 60-sprite collection, each
completing into a **badge** (social flex), a **statue** for My World, and an
**avatar unlock**. Plus open multi-item trading and trade notifications.
Written Aug 21, 2026 from AJ's notes + the mockups, designed against the
**real** `SPRITES` array in `site/assets/catalog.js`.

Mockups: `design/mockups/collections.html` (album + sets),
`design/mockups/badges-trades.html` (banner + trade builder).
Related: `claude/character-system-prompt.md`, `claude/my-world-spec.md`,
`claude/loot-drop-spec.md`.

**AJ's decisions, locked (Aug 21):** badges display as a **banner** visible to
self, siblings and approved friends — all at once, no "featured" pick · trades
are **open** (any count either side, 1-for-1 through 6-for-6; the receiver
simply accepts or rejects) · **sets are permanent**, with seasonal sets
(Halloween, Christmas) added over time.

---

## 1. Why sets, mechanically

The 60 sprites are currently a flat list — a kid collects, sees a number go up,
and nothing ever *completes*. Sets give the collection **shape**: finite goals,
a visible gap, and a reason to care about a specific creature rather than "more."

Every set deliberately mixes **easy commons with one or two genuinely rare
capstones**. That's the trading engine: at the existing drop weights (55%
common / 27% rare / 12% epic / 5% legendary / 1% mythic) no kid finishes a set
by grinding alone — they finish it by finding out their brother has the spare.

## 2. The eight launch sets

Composed from existing sprites (index noted) plus 21 appended new ones.
**`SPRITES` is index-locked — the squad code is a bitmask over it — so new
entries are APPENDED ONLY, never inserted or reordered.**

### 🦴 Dino Dig — badge "Dino Expert"
Bones, eggs, and the biggest teeth ever.

| Creature | Rarity | Source |
|---|---|---|
| 🥚 Nest Egg | common | NEW |
| 🦴 Rattlebones | common | NEW |
| 🐾 Trackway | common | NEW |
| 🪶 First Feather | common | NEW |
| 🦕 Longneck Lou | rare | NEW |
| 🦖 Rex Prime | legendary | #51 |

Rewards: 🦴 **T-Rex Skeleton** statue · 🎩 Dig Crew Hat (avatar)
*(First Feather is a deliberate teaching moment — birds ARE dinosaurs. Say so
in the in-app blurb.)*

### 🐍 Scales & Slither — badge "Snake Charmer"
🐍 Noodle common NEW · 🪱 Wiggle common NEW · 🦎 Gecko Zap common #21 ·
🐢 Tank Shell common #3 · 🐊 Snapjaw rare #37 · 🐉 Scaldrake legendary #50

Rewards: 🪨 **Basking Rock** statue (snakes coil on it) · 🧣 Serpent Hood

### 🌴 Jungle Canopy — badge "Jungle Guide"
🐒 Banana Split common #17 · 🦥 Slow Clap common #12 · 🐸 Hopper Jax common #2 ·
🦜 Skwak common NEW · 🦧 Copper Kong rare NEW · 🐯 Stripe Storm rare #25 ·
🐆 Spot Rush epic NEW

Rewards: 🛖 **Treehouse Lookout** · 🪢 Vine Swing

### 🐝 Bug Brigade — badge "Bug Whisperer"
🐜 Tiny Titan common #22 · 🐌 Slow Mo common #20 · 🕷️ Web Slinger common #23 ·
🐝 Buzz Cut common NEW · 🐞 Dot Matrix common NEW · 🦋 Flutter Byte rare NEW ·
🦂 Sting Ray rare #35

Rewards: 🦋 **Butterfly Garden** (animated) · 🥽 Antenna Band

### 🌊 Deep Blue — badge "Ocean Explorer"
🐟 Finn common NEW · 🦐 Pop Shrimp common NEW · 🐧 Chill Pip common #19 ·
🦀 Pinch Perfect rare #36 · 🐙 Ink Ops rare #34 · 🐬 Splash Dart rare #32 ·
🦈 Chomp Zone rare #33

Rewards: 🐠 **Coral Reef Pool** · 🤿 Snorkel Set

### 🐕 Good Dogs — badge "Top Dog"
🐕 Biscuit common NEW · 🐩 Fluffernutter common NEW · 🐕‍🦺 Ranger common NEW ·
🐺 Ridgehowl common #0 · 🦊 Ember Fox rare #24 · 🦮 Sunny epic NEW

Rewards: 🏠 **Dog House & Yard** (placed dogs run to it) · 👂 Puppy Ears

### 🧸 Cuddle Crew — badge "Heart of Gold"
🐰 Thumper common #7 · 🦔 Spike Lee common #8 · 🐹 Pocket Rocket common #9 ·
🐭 Squeak common #10 · 🐨 Snoozle common #11 · 🐼 Bamboo Blast rare #28 ·
🐻 Grizzly Grip rare #27

Rewards: 🧺 **Cuddle Corner** · 🧥 Fuzzy Hoodie
*The gentlest set — all common except two rares. Deliberately the one a 1st
grader finishes first.*

### ✨ Make-Believe — badge "Dreamweaver"
🧚 Pixie common NEW · 🍄 Toadstool common NEW · 👻 Boo Radley epic #47 ·
🧙 Runecaster epic #44 · 👽 Zeta Ray epic #42 · 🦄 Prism Hoof legendary #52 ·
🌈 Spectrum mythic #58

Rewards: 🌈 **Rainbow Portal** · 🧿 Starlight Cape
*The endgame set — the only mythic in any set. Expect months, and expect it
finished by trade, not by drop.*

### New sprites to append (21)
🥚 🦴 🐾 🪶 🦕 · 🐍 🪱 · 🦜 🦧 🐆 · 🐝 🐞 🦋 · 🐟 🦐 · 🐕 🐩 🐕‍🦺 🦮 · 🧚 🍄
→ `SPRITES.length` 60 → 81.

### Left unaffiliated on purpose (28)
🦝 🐷 🐮 🐔 🐿️ 🦡 🐗 🦫 🦆 🦁 🦅 🦉 🦇 🦩 🦚 🥷 🤖 🧟 🦸 🧛 🤠 🧑‍🚀 🔥 ⚡ ❄️ 🌪️ 👑 💎

Room for future sets with no migration: **Barnyard** (🐷🐮🐔🦆),
**Night Shift** (🦝🦇🦉🐿️), **Sky Kings** (🦅🦩🦚), **Hero Squad**
(🥷🤖🦸🧑‍🚀🤠), **Elementals** (🔥⚡❄️🌪️), **Treasure** (👑💎).

## 3. Seasonal sets — permanent, but time-stamped

Sets never expire and a badge is kept forever. Seasonal sets (🎃 Halloween,
🎄 Christmas, 🐣 Spring…) are **added**, never rotated out, and follow three
rules that keep them from becoming a punishing failure state:

1. **Seasonal creatures drop at a boosted rate during their window and a low
   rate forever after — never zero.** A kid who joins in November can still
   finish Halloween 2026 slowly, or by trading. Cutting the supply would strand
   a half-finished set permanently, which is exactly the kind of dead end the
   project's no-punishing rule exists to prevent.
2. **The badge carries the year** — "🎃 Halloween 2026". That's what makes it a
   real brag: you can still complete it later, but the pennant says when you
   started, and next year's is a different pennant.
3. **Seasonal sets append sprites like any other**, so adding one is pure data
   — a `season:'halloween-2026'` field on the collection plus a
   `dropBoost` window in `catalog.js`.

## 4. Data model

```js
// catalog.js — append after SPRITES
export const COLLECTIONS = [
  { id:'dino', icon:'🦴', name:'Dino Dig',
    blurb:'Bones, eggs, and the biggest teeth ever',
    members:['s60','s61','s62','s63','s64','s51'],   // spriteIds, any order
    badge:  { emoji:'🦴', name:'Dino Expert' },
    statue: { id:'trex-skeleton', emoji:'🦴', name:'T-Rex Skeleton' },
    avatar: { id:'dig-hat', emoji:'🎩', name:'Dig Crew Hat', slot:'acc' },
    season: null },        // or 'halloween-2026'
  // …7 more
];
```

```
families/{uid}/children/{childId}
  character.badges: ['dino','cuddle']            ← completed set ids
  character.worldItems: { 'trex-skeleton': 1 }   ← statue granted on completion
  character.avatarUnlocks: ['dig-hat']           ← studio items granted
```

**Completion is derived, never stored as a flag.** A set is complete iff every
member has `counts[id] > 0`. Only the *grant* is written, once, transactionally:

- Check for newly-completed sets inside the same `runTransaction` that already
  handles `awardRun` and `respondToTrade` — the only two paths that add a sprite.
- Guard with `arrayUnion` on `badges` so a double-fire can't double-grant.
- Return `newlyCompleted: [setId]` so the UI fires the celebration.

**A trade that completes a set fires the celebration for the receiving kid.**
That's the emotional payoff of the entire trading system — do not skip it.

## 5. The badge banner

One component, `renderBadgeBanner(badges, { owner })`, used in **three** places:
the character header (My Character), the Collections tab, and any read-only view
of another kid — sibling loadout peek, friend's world visit. Mockup:
`badges-trades.html`.

- Bunting: a navy line with pennant flags hanging from it, each sway-animated on
  a staggered delay so the row feels alive. Pennant shape is
  `clip-path: polygon(0 0,100% 0,100% 74%,50% 100%,0 74%)`.
- **All earned badges show at once** — no featured pick. Up to three remaining
  slots hang as faded hatched pennants, so the goal count is always visible
  (same principle as the visible-but-locked shop items).
- Caption line: `3 of 8 badges · 5 still to win`, becoming `ALL BADGES! 🏆` at
  completion.
- Nicknames only, no real names — the banner is safe on any shared surface.

The gap between two kids' banners is the motivation engine, and it's visible at
a glance **without a leaderboard** — nothing here is rankable beyond who holds
which badges, which keeps it a brag rather than a competition a younger brother
always loses.

## 6. Open trades (multi-item)

**This replaces the current 1-for-1 trade.** `trade.js` today does single
`offerSprite` → `wantSprite`; AJ's call is that any count goes on either side
and the receiver decides.

### Firestore

```
families/{uid}/trades/{tradeId}
  { fromChildId, fromNickname, toChildId,
    offer: ['s12','s12','s34'],     ← arrays; repeats = quantity
    want:  ['s52'],
    status:'pending'|'accepted'|'declined', createdAt, resolvedAt }
```

Migration: read either shape — treat a legacy `offerSprite`/`wantSprite` doc as
a one-element array. Cheap, and there may be pending offers in flight.

### Rules (all re-validated inside `runTransaction`)

- **Never your last copy.** For each distinct sprite, `count >= (offered N) + 1`
  on the giving side. This is the one hard guardrail and it applies to both
  sides — the receiver must also keep one of everything they're giving up.
- **Max 6 per side** (`ECONOMY.maxTradeItems`) so the offer card stays readable.
- At least one item on each side.
- On accept: decrement/increment every sprite on both sides atomically, then run
  the set-completion check for **both** kids.
- On decline or a failed re-validation: nothing moves, status flips, and the
  proposer sees a friendly "Jackson's collection changed — build a new offer."

### The builder UI

Two trays (You give / You get) above two shelves (your spares / their spares).
Tap a shelf chip to add one copy; the chip's count decrements and greys out when
you've offered all your spares. Tap a tray chip to remove it. **Zero text
inputs** — the entire offer is built by tapping, which keeps the no-open-text
rule intact even with open-ended quantities.

### The one thing "anything goes" needs

A 3rd grader can talk a 1st grader into 5-for-1. Do **not** block it — AJ's call
is that kids negotiate. Instead:

1. **State the shape of the deal in plain words** on both the builder and the
   incoming-offer card: *"That's 5 for 1 — you'd still have one of each. Your
   call! 🙂"* Information, not judgment, and never a scold.
2. **Log every trade for the parent portal** — who, what, when, accepted or
   declined. That's the real safety valve: it lets AJ notice a pattern and have
   a conversation, which is a parenting moment rather than a code rule.

Rarity dots on each side of the tally give a second, wordless read on the trade
shape without ever printing a "value" number — deliberately no price tag, since
scoring a trade would teach the wrong lesson about generosity.

## 7. Trade notifications

`listTrades(childId).incoming.length` renders a red count badge on the TRADE
tab — `.dot`, top-right, pulsing.

- Add `listTrades` to Character Home's mount `Promise.all` so the dot is correct
  on first paint. One cheap extra read.
- **Never poll.** Refresh on mount and after any trade action.
- Also dot the character header avatar, so a kid sitting on the PLAY tab
  notices.
- Notifications wait on the hub and **never interrupt a game in progress.**

Same `pendingCount(kind)` helper and dot style will later serve friend requests
and world high-fives (W4 in my-world-spec).

## 8. Collections tab

New tab between LOCKER and SHOP (mockup: `collections.html`).

- Header: total unique `n/81`.
- **Badge banner** at the top (§5).
- **Set cards** — icon, name, blurb, progress bar, reward preview. Tap to expand
  into the creature grid: owned show emoji + rarity ring + duplicate count;
  missing show `?` on dashed borders with the name hidden as `???`.
- **The sibling hint:** the album reads the sibling's `counts` via the existing
  `getSiblingLoadout` and tags any missing creature they hold a *spare* of
  (`count >= 2`) with a small **"JAX HAS ONE"** chip, plus a summary row with a
  Trade button that deep-links into the builder pre-loaded with that sprite in
  the "You get" tray. Converts "I need Longneck Lou" into two taps.
- Completion → full-screen celebration showing all three rewards.

Locker keeps the flat 60→81 grid; Collections is the *curated* view. Same
`counts` behind both.

## 9. Anti-frustration mechanics

Sets create real stuck states. Both tunable in `catalog.js`; ship at least the
first.

**Collection Focus.** A kid picks one active set. A tunable share of sprite
rolls (start `focusRerollChance: 0.25`) re-roll *within* that set's missing
members, **after** the normal rarity roll — so it never inflates rarity, it aims
the same luck. Most of the frustration fix.

**Duplicate trade-in.** Three duplicates of a rarity → one random unowned sprite
of that rarity. Gives a kid with no available trade partner (a guest, or a
sibling who's offline for a week) a path forward and gives dead duplicates a
purpose. Transactional, same rules as `buyItem`. Open trading makes this less
critical than it was under 1-for-1, so it can slip to C3.

## 10. Squad-code impact ⚠️

`loot-drop-spec.md`: the squad code is a **4-bit-per-sprite bitmask**, ~48 chars
at 60 sprites. At 81 it grows to roughly 65 characters — viable in a `?squad=`
URL but trending long, and **seasonal sets will keep pushing it**.

The fix is cheap and should be taken the first time it's uncomfortable: **the
compare screen only needs owned/not-owned, not exact counts.** Dropping to 1 bit
per sprite cuts the code by 75% and loses nothing the cousin-compare UI
displays. Version the code (prefix a scheme byte) so old links keep parsing.

## 11. Build order

1. **C1 — Data + Collections tab.** Append 21 sprites, add `COLLECTIONS`, build
   the tab with banner + set cards + sibling hints. Grant badges and avatar
   unlocks on completion; queue statues as owned `worldItems` (they appear once
   My World exists — say so in the celebration: "Saved for your world!").
2. **C2 — Open trades + trade dot.** Multi-item schema and migration, the
   builder UI, the deal-shape line, the notification badge, the album deep link.
3. **C3 — Collection Focus** + duplicate trade-in + the parent-portal trade log.
4. **C4 — Banner everywhere:** leaderboard rows, world visits, character header.
5. **S1 — First seasonal set** (🎃 Halloween 2026), as the test that adding a
   set really is pure data.

C1 and C2 are buildable **today** — they depend only on `catalog.js`,
`locker.js` / a new `collections.js`, `trade.js`, `firebase-config.js` and
`home.js`, all of which exist. Only the statues wait on My World.
