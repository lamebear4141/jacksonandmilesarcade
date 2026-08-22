/* =====================================================================
   Coin income model — before and after the coin faucet moved (R2B · E4).

       node site/assets/coins.model.mjs

   BEFORE (measured in E4.1, from the formulas as they stood on
   2026-08-22): coins were a per-run wage — units × 3, plus a 65 clear
   bonus on any learn run at ≥80%, plus Loot Drop's own 65/extract +
   sprite value + 75/level.

   AFTER: no run pays a coin. Coins come from bonus rounds only — the
   shared Bonus Vault (40–90 by timing), Math Baseball's Home Run Derby
   (40 + 8/homer), Loot Drop's between-round mini-games (floored at 40),
   and later Box compliments. Everything passes one daily cap.

   The BEFORE column is frozen history, kept so the calibration can be
   re-checked whenever a payout is retuned. The AFTER column is computed
   live from catalog.js.
   ===================================================================== */
import { ECONOMY, GAMES, VAULT, vaultPayout, clampDailyCoins, computeAward, runQualifies } from './catalog.js';

/* ---- the measured baseline, E4.1 (do not recompute — the code is gone) ---- */
const BEFORE = {
  perRun: {
    'Math Baseball': 134, 'Math Defender': 116, 'Coin Climb': 104,
    'Critter Reader': 77, 'Loot Drop (extract)': 71,
    'Harvest Night': 38, 'Raining Cats and Dogs': 20, 'Block Stacker': 14,
  },
  day: { miles: 110, jackson: 250 },   // midpoints of the E4.1 ranges
};

const DERBY = { coinsFloor: 40, coinsPerHomer: 8 };
const LOOT_MINIGAME_FLOOR = 40;
const pad = (n, w = 5) => String(n).padStart(w);

console.log(`
=====================================================================
 WHERE COINS COME FROM NOW
=====================================================================
 Bonus Vault        ${VAULT.floorCoins}–${VAULT.ceilingCoins} 🪙, by how close the tap lands
                    fires after any QUALIFYING run in a game with no
                    bonus round of its own
 Home Run Derby     ${DERBY.coinsFloor} + ${DERBY.coinsPerHomer}/homer  (Math Baseball)
 Loot Drop mini-game floored at ${LOOT_MINIGAME_FLOOR} 🪙
 Streak gifts       day 3 = 100 🪙, day 7 = 250 🪙
 Daily cap          ${ECONOMY.dailyCoinCap} 🪙 across EVERY source, per kid

 Bonus round by game:
${Object.entries(GAMES).map(([id, g]) => `   ${id.padEnd(22)} ${g.bonusRound || 'none'}`).join('\n')}
`);

/* ---- what one bonus round pays ---- */
console.log(`=====================================================================
 ONE BONUS ROUND
=====================================================================
| Tap / result            | 🪙 |
|-------------------------|-------|
| ${'skipped (collects the floor)'.padEnd(23)} | ${pad(vaultPayout(0))} |
| ${'a wild tap'.padEnd(23)} | ${pad(vaultPayout(0.15))} |
| ${'a decent tap'.padEnd(23)} | ${pad(vaultPayout(0.5))} |
| ${'a good tap'.padEnd(23)} | ${pad(vaultPayout(0.8))} |
| ${'a perfect crack'.padEnd(23)} | ${pad(vaultPayout(1))} |
| ${'derby, 0 homers'.padEnd(23)} | ${pad(DERBY.coinsFloor)} |
| ${'derby, 6 homers'.padEnd(23)} | ${pad(DERBY.coinsFloor + DERBY.coinsPerHomer * 6)} |
| ${'derby, 12 homers'.padEnd(23)} | ${pad(DERBY.coinsFloor + DERBY.coinsPerHomer * 12)} |
`);

/* ---- a day, at the boys' real play rates ---- */
function modelDay(runs) {
  // runs: [{ id, result }] — a Vault fires on each qualifying run whose
  // game has no bespoke round; bespoke rounds pay their own way.
  let total = 0, daily = null, fired = [];
  for (const r of runs) {
    const award = computeAward(r.id, r.result);
    if (!runQualifies(r.id, award)) { fired.push(`${r.id}: no bonus (didn't qualify)`); continue; }
    const kind = GAMES[r.id].bonusRound;
    let want = 0;
    if (kind === 'vault') want = vaultPayout(0.5);                    // an average tap
    else if (r.id === 'math-baseball') want = DERBY.coinsFloor + DERBY.coinsPerHomer * 5;
    else if (r.id === 'loot-drop') want = LOOT_MINIGAME_FLOOR + 15;
    const c = clampDailyCoins(want, daily, '2026-08-22');
    daily = c.dailyCoins; total += c.granted;
    fired.push(`${r.id}: +${c.granted}${c.capped ? ' (capped)' : ''}`);
  }
  return { total, fired };
}

const RUN = {
  defender: { id: 'math-defender', result: { asked: 20, correct: 17, seconds: 300, units: 17 } },
  climb:    { id: 'coin-climb', result: { asked: 15, correct: 13, seconds: 240, units: 13 } },
  baseball: { id: 'math-baseball', result: { asked: 18, correct: 15, seconds: 300, units: 23 } },
  reader:   { id: 'critter-catchers', result: { asked: 4, correct: 4, seconds: 240, units: 4 } },
  loot:     { id: 'loot-drop', result: { asked: 5, correct: 5, seconds: 240, units: 5 } },
  stacker:  { id: 'block-stacker', result: { units: 18, seconds: 240 } },
  cats:     { id: 'multiverse-collector', result: { units: 28, seconds: 45 } },
};

const DAYS = [
  ['MILES · 1 learn + 1 fun',              [RUN.climb, RUN.stacker],               BEFORE.day.miles],
  ['MILES · Loot Drop + 1 fun',            [RUN.loot, RUN.stacker],                BEFORE.day.miles],
  ['JACKSON · 2 learn + 1 fun',            [RUN.defender, RUN.baseball, RUN.cats], BEFORE.day.jackson],
  ['JACKSON · Loot Drop + defender + fun', [RUN.loot, RUN.defender, RUN.cats],     BEFORE.day.jackson],
  ['a big reading night (4 stories)',      [RUN.reader, RUN.reader, RUN.reader, RUN.reader], null],
  ['an all-day marathon (7 runs)',         [RUN.defender, RUN.climb, RUN.baseball, RUN.reader, RUN.loot, RUN.stacker, RUN.cats], null],
];

console.log(`=====================================================================
 A DAY'S COIN INCOME — before vs after
=====================================================================
| Day                                | before | after | change |
|------------------------------------|--------|-------|--------|`);
for (const [label, runs, before] of DAYS) {
  const { total } = modelDay(runs);
  const change = before ? `${total >= before ? '+' : ''}${Math.round((total - before) / before * 100)}%` : '—';
  console.log(`| ${label.padEnd(34)} | ${before ? pad(before, 6) : '     —'} | ${pad(total)} | ${change.padStart(6)} |`);
}

console.log(`
 The calibration rule was ±30% of the old income. Both boys' normal days
 land inside it; the cap (${ECONOMY.dailyCoinCap}) only bites on a marathon.

 Saving up, at a normal day's income:
   cheapest skin  150 🪙  ~1 day
   cheapest pet   200 🪙  ~1–2 days
   mid-tier       400–650 🪙  ~3–5 days
   top item      2200 🪙  ~2 weeks
`);
