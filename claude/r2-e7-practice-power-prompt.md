# Claude Code prompt — E7: Practice Power, fair drops, equal pay

**Written Aug 22, 2026**, after the R2B balance pass (E6) turned up three
things worth fixing. Follows `claude/r2b-collection-economy-prompt.md`;
E1–E6 are built and uncommitted.

Design sources: `claude/economy-r2-spec.md` (the three-currency model),
`claude/collections-spec.md`, and the E6 numbers in
`site/assets/balance.model.mjs`.

Four phases; **stop after each and report how to test, including one
thing that should fail if the phase is broken.** P3 also stops
mid-phase: it measures first and waits for approval before changing a
single payout.

---

## Why this exists — three measured findings

**1. The arcade currently pays children for screen time.**
`luckScore()` grants up to **30 of its 100 points for "minutes on the
tablet today"** (15 minutes = +30). That is a time-on-device incentive,
and it is the exact opposite of what this project is for.

**2. The drop odds are inverted against the collection.**

| | how many exist | share of drops at high luck |
|---|---|---|
| common | **40** (50%) | **13%** |
| rare | 24 (30%) | 34% |
| epic | 8 (10%) | 28% |
| legendary | **8** (10%) | **25%** |

A collection needs five specific commons. For a child playing well, any
one specific common is **~10× harder to obtain than any one specific
legendary** — so kids drown in duplicate crowns while the last two
ordinary critters never arrive. Playing *better* makes finishing a set
*slower*.

**3. Equal learning does not earn equal rewards.**
Difficulty is already age-scaled (`ageFromBirthday` → `tierForAge`), so
a 6-year-old clearing 6-year-old work has done as much as a 9-year-old
clearing 9-year-old work. Measured, for one cleared run each at the same
accuracy:

- Miles (13 of 15, 87%): **246 XP, 26 🧱**
- Jackson (17 of 20, 85%): **290 XP, 34 🧱**
- Jackson earns **18% more XP and 31% more bricks** for the same
  accomplishment, purely because he reads faster and answers more
  questions in the same sitting.

And the Bonus Vault that follows a *learning* run is a reflex test: a
good tap pays 85🪙, a loose one 53🪙. The older child out-earns the
younger for identical maths.

---

## The naming decision

The meter is not luck. It is the skill and commitment the child is
building, and the vocabulary has to say so — AJ, Aug 22: *"it really is
skill they are developing, better skill better rewards. Train kids to
commit to what they want to achieve is the goal."*

**Kid-facing name: PRACTICE POWER 💪.** It names the behaviour being
rewarded, and it rhymes with the PLAY tab's existing "PRACTICE · EARNS
4× XP" shelf. The word "luck" (and any chance/gambling framing) comes
out of every kid-facing string; the internal function may keep its name
where renaming would churn unrelated files, but nothing a child reads
says "luck" any more.

---

## Phase P1 — Practice Power

### The meter

`character.practicePower` (0–100) and `character.powerDay`, on the
character doc so it survives switching iPads.

```js
export const PRACTICE_POWER = {
  gainPerDay:   8,    // a day with at least one qualifying LEARN run
  decayPerDay:  5,    // each missed day, AFTER the grace day
  graceDays:    1,    // the first missed day costs nothing
  max:        100,
};
```

- Rises **+8 on any day the child completes a qualifying learn run**
  (`runQualifies()`, the same bar as drops and the Vault). Not for
  minutes, not for logging in, not for fun games — for practising.
- Falls **−5 per missed day after one free day.** Gradual, never a
  cliff. A week away costs 30 and is recovered in four days.
- **Never touches XP, levels, critters, badges or coins.** Progress
  ratchets; only form decays. A child must never come back from a
  holiday to find something they earned has been taken away.

### It replaces the two decaying terms in `luckScore`

Same 0–100 scale, same `rollRarity`, recomposed:

| term | was | becomes |
|---|---|---|
| accuracy this run | 40 | **40** (unchanged) |
| day streak | 30 | — |
| **minutes on the tablet today** | **30** | **— (deleted)** |
| **Practice Power** | — | **60** |

`LUCK.minutesForTimeBonus`, `timeBonusLuck` and `timeBonusCapMinutes`
are **removed**, not zeroed, so nothing can start paying for screen time
again. `rollStreak`'s cliff (miss a day → back to 1) is replaced by the
gradual decay above; the day-streak number itself stays as a display
stat, because kids like it.

### Showing it

A meter in the Clubhouse header, beside the wallet:

> 💪 **PRACTICE POWER** ▮▮▮▮▮▮▮░░░ **72**
> *"Practise today to keep it strong!"*

- Rising: a small "+8 💪" beat on the end-of-run screen.
- Falling: mentioned **once**, gently, on the Clubhouse only —
  *"Your Practice Power rested while you were away. A practice game
  today brings it right back! 💪"* Never on a game screen, never twice,
  never with a number the child has to feel bad about.
- The grace day is silent. The child should never learn there is a
  countdown running.

*Stop and report. Test: a fresh profile shows 💪 0; finish one learn run
→ 💪 8 and the end screen says +8; finish a second run the same day →
still 8 (it is per day, not per run); set the clock back three days and
play → 💪 climbs by 8, not 24. Should fail if broken: nothing anywhere
may pay a reward for minutes played — grep the site for
`minutesToday`/`timeBonus` and find only the removal.*

---

## Phase P2 — Drops that aim at what you are missing

### The tamed curve

`rollRarity`'s luck multipliers currently quadruple legendary at full
luck. Retune so high Practice Power *tilts* the odds instead of
inverting them:

| at max | now | target |
|---|---|---|
| common | 13% | ~40% |
| rare | 34% | ~32% |
| epic | 28% | ~16% |
| legendary | 25% | ~12% |

Practising well must still visibly pay — a legendary roughly twice as
likely as at zero — without starving the commons a set needs.

### Needs-aware drops

Today a drop picks a **random** sprite of the rolled rarity, so most
drops are duplicates. Invert the default:

- Roll the rarity as now (level-clamped, mythic folded).
- **70%** (`DROPS.aimAtMissingChance`) — pick from critters the child is
  **missing**, within their unlocked bands.
- **30%** — pick any, which will often be a spare. Spares are trade
  goods and trading needs fuel; **this ratio is the dial**, do not take
  it to 100%.
- If nothing in that rarity is missing, fall through to any.

**Collection Focus stops being a luck bonus and becomes a priority
setting**: when the aimed 70% fires, the focused collection's missing
members are chosen first. Copy changes accordingly —

> **⭐ Focus** — *"Pick the set you're chasing. Your critters come from
> here first. Change it any time!"*

and the chosen card reads **⭐ CHASING THIS**.

### Consistency pays out crowns

With aiming in place, high Practice Power meaning "more legendaries" is
finally safe and self-limiting — there are only eight, and once they are
caught the aim moves on. This is the intended payoff for showing up:
**the child who practises every day is the one who meets the legendary
critters.**

*Stop and report. Re-run `node site/assets/balance.model.mjs` and print
before/after for days-to-complete each collection. Test: a character
missing two commons in a set receives them within a handful of drops
rather than a month; a character who owns every common still receives
spares to trade. Should fail if broken: a child at max Practice Power
must not receive a lower share of commons than one at zero.*

---

## Phase P3 — Equal pay for equal learning

**AJ's rule:** the content is already age-adjusted, so a cleared
learning run must pay the same to every child. Fun games may differ —
better tablet control is a real skill. Playing *more* may earn more.
Reading *faster* may not.

### P3.1 — Measure, then STOP

Report, from the real formulas:

1. XP, 🧱 and 🪙 for one cleared learn run at each age tier
   (easy / medium / hard), holding accuracy equal.
2. How much of the gap comes from question COUNT versus anything else.
3. The Vault spread after a learn run for a strong vs weak tapper.
4. A proposal that closes both gaps, with the numbers it would produce.

**Propose, then stop for approval before changing any payout.**

Two candidate mechanisms, to be argued in the report:

- **Learn rewards driven by the run, not the question count** — a
  cleared run pays a flat XP/brick amount plus a small per-question
  component, so finishing your work is what pays.
- **The Vault's target zone widens with the run's accuracy** — so after
  a learning game the reward is won with maths rather than reflexes,
  while still being a fun tap. Fun games keep the plain timing bar.

### P3.2 — Apply the approved change

Then re-verify that two children of different ages clearing
age-appropriate work at the same accuracy walk away with the same XP,
bricks and coins.

*Stop and report. Should fail if broken: two profiles with different
birthdays, each clearing their own age's work at 85%, must receive
identical XP, 🧱 and 🪙 from a learn run.*

---

## Phase P4 — Balance re-pass

No new features. Re-run E6's model with everything above in place and
report:

1. A week of play for both boys → 💪, 🧱, ⚡, 🪙, XP, levels, critters.
2. Days to complete each collection, before vs after P2.
3. What a fortnight away costs, and how long recovery takes.
4. Re-verify the no-crossover rules, naming the enforcing path for each.
5. Confirm equal pay per learn run across age tiers.

*Report the numbers. Change nothing based on them without saying so
first.*

---

## Ground rules

- Vanilla HTML/CSS/JS, ES modules, no build step, no new dependencies.
- **Never reward time on the device.** Reward showing up and practising.
- **Progress ratchets, form decays.** XP, levels, critters, badges and
  coins can never go down. Only Practice Power can.
- **Setbacks are gentle and recoverable**, and never phrased so that a
  child worries a family holiday cost them something.
- No "luck", "chance" or gambling language in anything a child reads.
- Every tunable number lives in `catalog.js` in plain language.
- Follow `CLAUDE.md`: edits stay local and uncommitted until AJ says
  "publish this".
