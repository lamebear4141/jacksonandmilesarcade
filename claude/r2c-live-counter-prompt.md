# Claude Code prompt — R2C: the live "kids in the arcade" counter

A live count of who's playing right now, on the public front door and inside
Character Home. Small, self-contained, independent of R2A and R2B — run it any
time. Paste everything below the line into Claude Code in the
`jacksonandmilesarcade` repo. Three phases; stop after each and report.

---

## The wording

Headline: **`🎮 3 KIDS IN THE ARCADE`** (singular "1 KID IN THE ARCADE").

Under it, a detail line built from what those kids are actually doing:

> 1 catching critters · 1 doing math · 1 reading a bedtime story

That detail line is where the personality lives — a fixed slogan gets stale on
the third read, but "1 out in the corn 👻" at 8pm doesn't. Map every game to a
phrase in `catalog.js` so it's one-file tunable:

```js
export const PRESENCE_VERBS = {
  'multiverse-collector':'catching critters',
  'loot-drop':'out on a loot run',
  'math-defender':'blasting creepers',
  'math-baseball':'up at bat',
  'coin-climb':'climbing the tower',
  'critter-catchers':'reading a bedtime story',
  'block-stacker':'stacking blocks',
  'harvest-night':'out in the corn',
  'my-world':'building a world',
  'home':'in the lobby',
};
```

**The zero state matters more than the number.** With a two-kid family the
count will often be 0, and "0 KIDS IN THE ARCADE" on your own front door is a
sad thing to build. When the live count is zero, show all-time totals instead:

> 🌙 4,182 critters caught here so far

Never render a zero. Never render an empty space where a number was.

---

## Phase 1 — Presence

### Data

Two new top-level Firestore collections. **Neither may ever contain a uid,
childId, nickname, age, or anything else identifying** — this is a
publicly-readable surface, and the only thing the world gets to know is *how
many*, never *who*.

```
presence/{sessionId}          sessionId = crypto.randomUUID(), per tab, not per kid
  { lastSeen: serverTimestamp(),
    expireAt: Timestamp,      ← now + 5 min, for the TTL policy
    game: 'math-baseball' }   ← id only, from PRESENCE_VERBS' keys

stats/public                  ← one doc, aggregate counters only
  { runs, critters, problemsSolved, updatedAt }
```

### Client

Add `site/assets/presence.js`:

```js
startPresence(gameId)   // heartbeat while the tab is visible
setPresenceGame(gameId) // called on navigation between games
stopPresence()          // best-effort delete
liveCount()             // { total, byGame } via getCountFromServer
```

- Heartbeat every `PRESENCE.heartbeatMs` (60s), **only while the tab is
  visible** — pause on `visibilitychange`, resume and beat immediately on
  return. A tablet left face-up on the couch must not count as a kid playing.
- A session counts as live if `lastSeen` is within `PRESENCE.staleMs` (120s).
- Best-effort delete on `pagehide`; the TTL and the staleness window are the
  real cleanup, so never depend on the delete firing.
- `startPresence` is called from `mountBar()` so every game gets it for free
  with no per-game code.

### Cleanup

Enable a **Firestore TTL policy on `presence.expireAt`** in the Firebase
console (Firestore → Time-to-live). It's free and it's the only thing standing
between this feature and an ever-growing collection of dead session docs.
**Put this in your report as a step I have to do by hand** — nothing in the repo
deploys it.

### Rules

Add to the rules block at the bottom of `firebase-config.js` **and** tell me to
paste it into the Firebase console, since nothing in the repo deploys rules:

```
match /presence/{sessionId} {
  allow read: if true;
  allow create, update: if request.auth != null
    && request.resource.data.keys().hasOnly(['lastSeen','expireAt','game']);
  allow delete: if request.auth != null;
}
match /stats/public {
  allow read: if true;
  allow write: if request.auth != null;
}
```

Read is public because the front door renders before anyone signs in. Write
requires auth, which is what keeps a stranger from inflating the number.

*Stop and report. Test: open the site in two tabs, confirm two presence docs
with no identifying fields in either; close one tab, confirm the count drops
within the staleness window; background a tab and confirm the heartbeat stops.*

---

## Phase 2 — Counting guests

Guest play is a real mode here — cousins and friends use it — so a counter that
only sees signed-in profiles will read 0 while three kids are actually playing,
which makes the whole feature lie.

Two options. **Build option A behind a flag; report before doing anything
else:**

- **A (recommended): `signInAnonymously` for guests**, purely so their presence
  write passes the rules. No profile, no data, no change to the guest
  experience — and when a parent later signs in with email, Firebase simply
  replaces the anonymous session. Requires enabling **Anonymous** under Firebase
  Console → Authentication → Sign-in method (another by-hand step for my
  report). Tradeoff, state it plainly: anonymous auth means anyone could in
  principle script presence writes. The blast radius is a wrong number on a
  family arcade's front page.
- **B: count signed-in sessions only.** Nothing new to enable, but it
  undercounts, and the undercount is invisible and permanent.

Gate it: `PRESENCE.countGuests: true`. If anonymous sign-in isn't enabled, catch
the failure, skip presence entirely, and let the counter fall back to the
all-time line — **a broken counter must never block a kid from playing a game.**

*Stop and report which option you built and what I need to click in the console.*

---

## Phase 3 — The display

One component, `renderLiveCount(el)`, used in two places:

- **The public front door**, near the existing nickname-only high-score ticker.
- **Character Home's header**, under the level bar.

Behaviour:

- Poll `liveCount()` every `PRESENCE.pollMs` (45s), **only while visible**.
- Animate the number when it changes — count up/down by one, with the chunky
  navy-outlined pill styling from `visual-identity-spec.md`. Use the existing
  `.ac-badge` / pill component; don't invent a new one.
- Never show a spinner or a flash of "0" on first paint — render the all-time
  line first and swap in the count once it resolves.
- The detail line lists at most three activities, then "+2 more".
- **Zero state:** the all-time line, sourced from `stats/public`. Increment
  those counters in `awardRun` (one `increment()` per finished run, alongside
  the writes already happening there — no extra round trip): `runs` +1,
  `critters` + drops granted, `problemsSolved` + `correct`.

Cost check for the report: with the poll and heartbeat above, model the daily
reads and writes for four kids playing an hour each plus ten idle front-door
visitors, against Firestore's free 50K reads / 20K writes per day. If it's
anywhere near either ceiling, say so and propose a longer poll rather than
shipping it.

*Stop and report. Test: play in one browser while watching the front door in
another and see the number and the activity phrase change within a poll cycle;
sign out everywhere and confirm the all-time line appears instead of a zero;
throttle to offline and confirm the front door still loads and PLAY still
works.*

---

## Ground rules

- **Aggregate only.** A number and a verb. No names, no avatars, no "Jackson is
  playing", no location, not even a count broken down by family.
- The counter is decoration: every failure mode — rules, offline, anonymous auth
  disabled, TTL not configured — degrades to the all-time line or to nothing,
  and never blocks the front door or a game.
- `PRESENCE` config block in `catalog.js`, plain language, with a
  `PRESENCE.enabled` master switch so I can turn the whole thing off in one
  edit.
- Vanilla JS, ES modules, no build step, no new dependencies.
- Follow `CLAUDE.md`: edits stay local and uncommitted until I say "publish
  this".
