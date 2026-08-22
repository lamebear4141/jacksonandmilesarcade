/* =====================================================================
   Drop model — what the critter roll actually hands out.

       node site/assets/drops.model.mjs

   200 qualifying runs (one roll each) at Levels 2, 6 and 12, twice: a
   typical learn run (85% accuracy, 3-day streak → luck ≈ 40) and a
   perfect one (100%, 7-day streak, luck ≈ 70). Counts by rarity, how
   often the clamp fired (a roll above the band landed at the band) and
   how often pity fired (8 runs without an epic+, Level 7+ only).
   Deterministic — same numbers every run.
   ===================================================================== */
import { DROPS, RARITY_UNLOCK, rollDrops, luckScore, unlockedBand, PRACTICE_POWER } from './catalog.js';

const seeded = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

function model(level, luck, runs = 200, seed = 42) {
  const rand = seeded(seed + level);
  const tally = { common: 0, rare: 0, epic: 0, legendary: 0 };
  let clamped = 0, pity = 0, focus = 0;
  let drops = { date: '2026-08-22', count: 0, sinceEpic: 0 };
  const counts = {};
  for (let i = 0; i < runs; i++) {
    // one run per "day" so the daily cap never interferes with the model
    const day = `day-${i}`;
    const r = rollDrops({ rolls: 1, character: { level, counts, drops: { ...drops, date: day, count: 0 } }, luck, dayStr: day, rand });
    drops = r.dropsState;
    for (const d of r.drops) {
      tally[d.rarity]++;
      if (d.clamped) clamped++;
      if (d.pity) pity++;
      if (d.focus) focus++;
      counts[d.spriteId] = (counts[d.spriteId] || 0) + 1;
    }
  }
  return { tally, clamped, pity, unique: Object.keys(counts).length };
}

const typical = Math.round(luckScore({ accuracy: 0.85, practicePower: 40 }));
const perfect = Math.round(luckScore({ accuracy: 1.0,  practicePower: PRACTICE_POWER.max }));

console.log(`\nDROP MODEL — ${200} qualifying runs, one roll each (dailyCap ${DROPS.dailyCap}, pity after ${DROPS.pityRuns})`);
console.log(`unlocks: ${Object.entries(RARITY_UNLOCK).map(([r, l]) => `${r} L${l}`).join(' · ')}\n`);
for (const [label, luck] of [['typical run · luck ' + typical, typical], ['perfect run · luck ' + perfect, perfect]]) {
  console.log(label);
  console.log('| Level | band      | common | rare | epic | legendary | clamped | pity | unique |');
  console.log('|-------|-----------|--------|------|------|-----------|---------|------|--------|');
  for (const level of [2, 6, 12]) {
    const m = model(level, luck);
    const t = m.tally;
    console.log(`| ${String(level).padStart(5)} | ${unlockedBand(level).padEnd(9)} | ${String(t.common).padStart(6)} | ${String(t.rare).padStart(4)} | ${String(t.epic).padStart(4)} | ${String(t.legendary).padStart(9)} | ${String(m.clamped).padStart(7)} | ${String(m.pity).padStart(4)} | ${String(m.unique).padStart(6)} |`);
  }
  console.log('');
}
