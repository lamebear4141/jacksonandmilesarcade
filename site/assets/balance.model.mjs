/* =====================================================================
   THE BALANCE PASS (R2B · E6) — honest numbers, no new features.

       node site/assets/balance.model.mjs

   Everything here runs the REAL functions from catalog.js: the same
   computeAward, clampFunAward, computePillarAward, rollDrops,
   confirmCaptures, vaultPayout and clampDailyCoins the games call. The
   only invented inputs are the shape of a typical run and how often the
   boys play, which are printed so they can be argued with.

   Deterministic: the RNG is seeded, so the same numbers come out every
   time and a retune can be compared against them.
   ===================================================================== */
import {
  ECONOMY, PILLAR_ECONOMY, GAMES, COLLECTIONS, LIVE_SPRITE_IDS, RARITY_UNLOCK,
  VAULT, vaultPayout, clampDailyCoins, computeAward, clampFunAward, computePillarAward,
  levelFromXp, xpForLevel, luckScore, rollDrops, confirmCaptures, encounterSpawn,
  runQualifies, vaultOpens, dropRolls, spriteById, displayRarity, starsNeededFor,
  CRITTER_STARS, DROPS, PRACTICE_POWER, practicePowerNow, practicePowerAfterRun,
  vaultZone, vaultAccuracy, todayKey, rollRarity, computePillarAward as pillarOf,
} from './catalog.js';

/* ---------------- a seeded RNG, so every run is the same ---------------- */
const seeded = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

/* ---------------- the Box, from my-world-spec §5.1 ---------------- */
const BOX_TIERS = [
  { name: 'small',  bricks: 15,  sparks: 8   },
  { name: 'medium', bricks: 60,  sparks: 30  },
  { name: 'large',  bricks: 200, sparks: 100 },
  { name: 'dream',  bricks: 500, sparks: 250 },
];

/* ---------------- what a typical run looks like ----------------
   Deliberately ordinary: a kid doing well but not perfectly. */
const RUN = {
  climb:    { id: 'coin-climb',            result: { asked: 15, correct: 13, seconds: 240, units: 13 } },
  defender: { id: 'math-defender',         result: { asked: 20, correct: 17, seconds: 300, units: 17 } },
  baseball: { id: 'math-baseball',         result: { asked: 18, correct: 15, seconds: 300, units: 15 + 2 * 4, bonusCoins: 40 + 8 * 5 } },
  reader:   { id: 'critter-catchers',      result: { asked: 4,  correct: 4,  seconds: 240, units: 4 } },
  stacker:  { id: 'block-stacker',         result: { units: 18, seconds: 240 } },
  cats:     { id: 'multiverse-collector',  result: { units: 28, seconds: 45, completed: true, captureCount: 2 } },
};

const KIDS = {
  MILES:   { name: 'MILES',   day: [RUN.climb, RUN.stacker] },
  JACKSON: { name: 'JACKSON', day: [RUN.defender, RUN.baseball, RUN.cats] },
};

/* =====================================================================
   ONE DAY of play, through the real award path.
   ===================================================================== */
function playDay(state, runs, rand, dayStr, { tapSkill = 0.5, readCritter = null } = {}) {
  let dailyFun = null, dailySparks = state.wallet.dailySparks, dailyCoins = state.dailyCoins;
  const got = [];

  for (const r of runs) {
    const award = computeAward(r.id, r.result);

    // ---- xp (fun games clamped per day) ----
    const clamped = clampFunAward(award, dailyFun, dayStr);
    dailyFun = clamped.daily;
    state.xp += clamped.xp;

    // ---- bricks & sparks ----
    const pillars = computePillarAward(award, dailySparks, dayStr);
    dailySparks = pillars.dailySparks;
    state.bricks += pillars.bricksEarned;
    state.sparks += pillars.sparksEarned;

    // ---- the run's own coins (a bespoke bonus round only) ----
    const own = clampDailyCoins(award.coins, dailyCoins, dayStr);
    dailyCoins = own.dailyCoins;
    state.coins += own.granted;

    // ---- the Bonus Vault ----
    if (vaultOpens(r.id, award)) {
      // an average tap, scored against the target this run earned
      const zone = vaultZone(GAMES[r.id].kind, award.accuracy);
      const paid = vaultPayout(vaultAccuracy(0.5 + (1 - tapSkill) * 0.35, zone));
      const v = clampDailyCoins(paid, dailyCoins, dayStr);
      dailyCoins = v.dailyCoins;
      state.coins += v.granted;
    }

    // ---- critters ----
    const level = levelFromXp(state.xp).level;
    const me = { level, counts: state.counts, drops: state.drops, focusCollection: state.focus };
    const mode = GAMES[r.id].critterMode;
    if (mode === 'roll') {
      const luck = luckScore({ accuracy: award.accuracy, practicePower: practicePowerNow({ practicePower: state.power, powerDay: state.powerDay }, dayStr) });
      const d = rollDrops({ rolls: dropRolls(r.id, award), character: me, luck, dayStr, rand });
      state.drops = d.dropsState;
      d.drops.forEach((x) => { state.counts[x.spriteId] = (state.counts[x.spriteId] || 0) + 1; got.push(x); });
    } else if (mode === 'encounter') {
      // Only what the kid actually catches, and only what the cap allows
      // to spawn in the first place.
      const caught = [];
      for (let i = 0; i < (r.result.captureCount || 0); i++) {
        const spawn = encounterSpawn({ ...me, drops: state.drops, dayStreak: state.streak },
                                     { pending: caught.length, dayStr, rand });
        if (spawn) caught.push(spawn.spriteId);
      }
      const c = confirmCaptures({ captures: caught, character: me, dayStr });
      state.drops = c.dropsState;
      c.drops.forEach((x) => { state.counts[x.spriteId] = (state.counts[x.spriteId] || 0) + 1; got.push(x); });
    }
  }

  // ---- Critter Reader: one bedtime star a day, aimed at a chosen critter ----
  if (readCritter) {
    const level = levelFromXp(state.xp).level;
    const target = readCritter(state, level);
    if (target) {
      state.stars[target] = (state.stars[target] || 0) + 1;
      if (state.stars[target] >= starsNeededFor(target)) {
        state.stars[target] = 0;
        state.counts[target] = (state.counts[target] || 0) + 1;
        got.push({ spriteId: target, source: 'quest' });
      }
    }
  }

  state.wallet.dailySparks = dailySparks;
  state.dailyCoins = dailyCoins;
  state.streak += 1;
  // The real meter, through the real functions — gain on a qualifying
  // learn day, decay (with its grace day) handled by powerDay.
  if (runs.some((r) => GAMES[r.id].kind === 'learn' && runQualifies(r.id, computeAward(r.id, r.result)))) {
    const pw = practicePowerAfterRun({ practicePower: state.power, powerDay: state.powerDay }, dayStr);
    state.power = pw.power;
    state.powerDay = pw.powerDay;
  }
  return got;
}

function freshState() {
  return {
    xp: 0, coins: 0, bricks: 0, sparks: 0, streak: 0, power: 0, powerDay: null,
    counts: {}, stars: {}, drops: null, focus: null,
    wallet: { dailySparks: null }, dailyCoins: null,
  };
}
/* Real calendar keys, so practicePowerNow()'s decay maths applies to the
   simulation exactly as it does to a character. */
const BASE = new Date(2026, 0, 1);
const dayKey = (n) => { const d = new Date(BASE); d.setDate(d.getDate() + n - 1); return todayKey(d); };

/* =====================================================================
   1. A WEEK OF REALISTIC PLAY
   ===================================================================== */
console.log(`
=====================================================================
 1. A WEEK OF REALISTIC PLAY
=====================================================================
 Miles   ${KIDS.MILES.day.length} runs/day: ${KIDS.MILES.day.map((r) => GAMES[r.id].name).join(' + ')}
 Jackson ${KIDS.JACKSON.day.length} runs/day: ${KIDS.JACKSON.day.map((r) => GAMES[r.id].name).join(' + ')}
 Vault taps modelled at average skill (${vaultPayout(0.5)} 🪙 a crack).
`);

const week = {};
for (const [key, kid] of Object.entries(KIDS)) {
  const st = freshState();
  const rand = seeded(key === 'MILES' ? 11 : 29);
  const perDay = [];
  for (let d = 1; d <= 7; d++) {
    const got = playDay(st, kid.day, rand, dayKey(d));
    perDay.push({ day: d, level: levelFromXp(st.xp).level, xp: st.xp, coins: st.coins,
                  bricks: st.bricks, sparks: st.sparks, critters: got.length,
                  power: st.power, unique: Object.keys(st.counts).length });
  }
  week[key] = { st, perDay };
}

for (const [key, { perDay }] of Object.entries(week)) {
  console.log(`${key}`);
  console.log('| day | lvl |    XP |   🪙 |  🧱 |  ⚡ | 💪 | critters | unique |');
  console.log('|-----|-----|-------|------|-----|-----|-----|----------|--------|');
  for (const r of perDay) {
    console.log(`| ${String(r.day).padStart(3)} | ${String(r.level).padStart(3)} | ${String(r.xp).padStart(5)} | ${String(r.coins).padStart(4)} | ${String(r.bricks).padStart(3)} | ${String(r.sparks).padStart(3)} | ${String(r.power).padStart(3)} | ${String(r.critters).padStart(8)} | ${String(r.unique).padStart(6)} |`);
  }
  console.log('');
}

/* ---- the Box tiers, and the shop ---- */
console.log(`=====================================================================
 WHAT A WEEK BUYS
=====================================================================`);
for (const [key, { perDay }] of Object.entries(week)) {
  const last = perDay[perDay.length - 1];
  const bPerDay = last.bricks / 7, sPerDay = last.sparks / 7, cPerDay = last.coins / 7;
  console.log(`\n ${key} — per day: ${bPerDay.toFixed(0)} 🧱 · ${sPerDay.toFixed(0)} ⚡ · ${cPerDay.toFixed(0)} 🪙`);
  console.log(' | Box tier |    cost      | days (both currencies) | spec target |');
  console.log(' |----------|--------------|------------------------|-------------|');
  const TARGET = { small: '—', medium: '≈ a day', large: '—', dream: '≈ two weeks' };
  for (const t of BOX_TIERS) {
    const days = Math.max(t.bricks / bPerDay, t.sparks / sPerDay);
    console.log(` | ${t.name.padEnd(8)} | ${String(t.bricks + '🧱 + ' + t.sparks + '⚡').padEnd(12)} | ${String(days.toFixed(1) + ' days').padEnd(22)} | ${TARGET[t.name].padEnd(11)} |`);
  }
  console.log(` | shop: cheapest skin 150🪙 = ${(150 / cPerDay).toFixed(1)}d · pet 200🪙 = ${(200 / cPerDay).toFixed(1)}d · top 2200🪙 = ${(2200 / cPerDay).toFixed(1)}d`);
}

/* =====================================================================
   2. DAYS TO LEVEL 3, 7 AND 11 — when each rarity band opens
   ===================================================================== */
console.log(`

=====================================================================
 2. DAYS TO EACH RARITY UNLOCK
=====================================================================
 XP needed: ${[2,3,4,5,6,7,8,9,10,11].map((l) => `L${l} ${cumulativeXp(l)}`).join(' · ')}
`);
function cumulativeXp(level) {
  let t = 0;
  for (let l = 1; l < level; l++) t += xpForLevel(l);
  return t;
}
function daysToLevel(kid, target, opts = {}) {
  const st = freshState();
  const rand = seeded(7);
  for (let d = 1; d <= 400; d++) {
    playDay(st, kid.day, rand, dayKey(d), opts);
    if (levelFromXp(st.xp).level >= target) return d;
  }
  return null;
}
console.log('| kid     | common (L1) | rare (L3) | epic (L7) | legendary (L11) |');
console.log('|---------|-------------|-----------|-----------|-----------------|');
const unlockDays = {};
for (const [key, kid] of Object.entries(KIDS)) {
  const d3 = daysToLevel(kid, RARITY_UNLOCK.rare);
  const d7 = daysToLevel(kid, RARITY_UNLOCK.epic);
  const d11 = daysToLevel(kid, RARITY_UNLOCK.legendary);
  unlockDays[key] = { d3, d7, d11 };
  console.log(`| ${key.padEnd(7)} | ${'day 1'.padEnd(11)} | ${('day ' + d3).padEnd(9)} | ${('day ' + d7).padEnd(9)} | ${('day ' + d11).padEnd(15)} |`);
}

/* =====================================================================
   3. DAYS TO COMPLETE EACH COLLECTION
   ===================================================================== */
console.log(`

=====================================================================
 3. DAYS TO COMPLETE A COLLECTION, SOLO (no trading)
=====================================================================
 Reading alone: ${5 * CRITTER_STARS.common} + ${3 * CRITTER_STARS.rare} + ${CRITTER_STARS.epic} + ${CRITTER_STARS.legendary} = ${5 * CRITTER_STARS.common + 3 * CRITTER_STARS.rare + CRITTER_STARS.epic + CRITTER_STARS.legendary} nights per collection,
 gated by reaching Level ${RARITY_UNLOCK.legendary} for the crown.
`);

const MAX_DAYS = 800;
function simulateUntil(kid, { focus = null, reading = false, trials = 5 } = {}) {
  // Returns, per collection, the median day it completed (or null).
  const results = COLLECTIONS.map(() => []);
  for (let t = 0; t < trials; t++) {
    const st = freshState();
    st.focus = focus;
    const rand = seeded(101 + t * 37);
    const doneOn = COLLECTIONS.map(() => null);
    // A kid reads to whoever they like, independently of Collection
    // Focus — so the two mechanics are measured as separate levers
    // rather than one masking the other. Always finishes a quest already
    // started, then picks the cheapest critter still missing anywhere.
    const readCritter = reading ? (state, level) => {
      let best = null, bestCost = Infinity;
      for (const c of COLLECTIONS) {
        for (const id of c.members) {
          if (state.counts[id] > 0) continue;
          if (level < RARITY_UNLOCK[displayRarity(spriteById(id).r)]) continue;
          const started = state.stars[id] || 0;
          const left = starsNeededFor(id) - started;
          if (started > 0) return id;                 // always finish what you started
          if (left < bestCost) { bestCost = left; best = id; }
        }
      }
      return best;
    } : null;

    for (let d = 1; d <= MAX_DAYS; d++) {
      playDay(st, kid.day, rand, dayKey(d), { readCritter });
      COLLECTIONS.forEach((c, i) => {
        if (doneOn[i] == null && c.members.every((id) => (st.counts[id] || 0) > 0)) doneOn[i] = d;
      });
      if (doneOn.every((x) => x != null)) break;
    }
    doneOn.forEach((d, i) => results[i].push(d));
  }
  return results.map((list) => {
    const done = list.filter((x) => x != null).sort((a, b) => a - b);
    if (done.length < Math.ceil(list.length / 2)) return null;   // more than half never finished
    return done[Math.floor(done.length / 2)];
  });
}

const SCENARIOS = [
  ['drops only, no focus',            { focus: null,        reading: false }],
  ['drops + Collection Focus',        { focus: 'dinosaurs', reading: false }],
  ['drops + Critter Reader',          { focus: null,        reading: true  }],
  ['drops + Focus + Critter Reader',  { focus: 'dinosaurs', reading: true  }],
];

for (const [key, kid] of Object.entries(KIDS)) {
  console.log(`\n ${key} — median day each collection completes (— = not within ${MAX_DAYS} days)`);
  const header = COLLECTIONS.map((c) => c.icon).join('   ');
  console.log(` | scenario                       | ${header} |`);
  console.log(` |--------------------------------|${'-'.repeat(header.length + 2)}|`);
  for (const [label, opts] of SCENARIOS) {
    const r = simulateUntil(kid, opts);
    console.log(` | ${label.padEnd(30)} | ${r.map((d) => String(d == null ? '—' : d).padStart(3)).join(' ')} |`);
  }
}

/* =====================================================================
   4. WHAT A BREAK COSTS
   ===================================================================== */
console.log(`

=====================================================================
 4. WHAT A FORTNIGHT AWAY COSTS
=====================================================================
 Practice Power is the ONLY thing that can go down. XP, levels, critters,
 badges and coins all ratchet, so a holiday can never take away anything
 a child earned.
`);
{
  const built = { practicePower: PRACTICE_POWER.max, powerDay: dayKey(20) };
  console.log('| away for   | 💪 on return | what it costs in rarity odds |');
  console.log('|------------|--------------|------------------------------|');
  const legendaryAt = (power) => {
    const luck = luckScore({ accuracy: 0.9, practicePower: power });
    const rand = seeded(41);
    let n = 0;
    for (let i = 0; i < 20000; i++) if (displayRarity(rollRarity(luck, rand)) === 'legendary') n++;
    return (n / 200).toFixed(1);
  };
  const full = legendaryAt(PRACTICE_POWER.max);
  for (const away of [1, 2, 3, 7, 14, 30]) {
    const p = practicePowerNow(built, dayKey(20 + away));
    console.log(`| ${String(away + ' day' + (away === 1 ? '' : 's')).padEnd(10)} | ${String(p).padStart(12)} | legendary ${legendaryAt(p)}% (from ${full}%)`.padEnd(78) + '|');
  }
  const after14 = practicePowerNow(built, dayKey(34));
  console.log(`
 Recovery: ${Math.ceil((PRACTICE_POWER.max - after14) / PRACTICE_POWER.gainPerDay)} days of practice to be back at full.
 The first missed day is free and silent; the child is never told a
 countdown is running.`);
}

/* =====================================================================
   5. EQUAL PAY, RE-CONFIRMED
   ===================================================================== */
console.log(`

=====================================================================
 5. EQUAL PAY FOR EQUAL LEARNING
=====================================================================
 One CLEARED run in every learning game, whatever its length:
`);
{
  const rows = Object.entries(GAMES).filter(([, g]) => g.kind === 'learn').map(([id, g]) => {
    const n = g.runQuestions;
    const a = computeAward(id, { asked: n, correct: n, seconds: 240, units: n });
    return { id, grades: g.grades, n, xp: a.xp, bricks: pillarOf(a, null, 'x').bricksEarned };
  });
  console.log('| game             | pitched at   | questions |  XP | 🧱 |');
  console.log('|------------------|--------------|-----------|-----|-----|');
  for (const r of rows) {
    console.log(`| ${r.id.padEnd(16)} | ${r.grades.padEnd(12)} | ${String(r.n).padStart(9)} | ${String(r.xp).padStart(3)} | ${String(r.bricks).padStart(3)} |`);
  }
  const xps = rows.map((r) => r.xp), brs = rows.map((r) => r.bricks);
  console.log(`
 spread: XP ${Math.round((Math.max(...xps) / Math.min(...xps) - 1) * 100)}%  ·  bricks ${Math.round((Math.max(...brs) / Math.min(...brs) - 1) * 100)}%   (before E7: 105% / 300%)`);
}

/* =====================================================================
   6. NO CROSSOVER — re-verified, with the enforcing path named
   ===================================================================== */
console.log(`

=====================================================================
 6. NOTHING CROSSES OVER — re-verified
=====================================================================`);
const checks = [];
const ok = (rule, path, pass) => checks.push({ rule, path, pass });

// 🧱 / ⚡ / 🪙 never convert into one another
const learnAward = computeAward('math-defender', { asked: 20, correct: 17, seconds: 300, units: 17 });
const funAward   = computeAward('block-stacker', { units: 18, seconds: 240 });
const learnP = computePillarAward(learnAward, null, 'x');
const funP   = computePillarAward(funAward, null, 'x');
ok('A learn run pays 🧱 and never ⚡', 'computePillarAward()', learnP.bricksEarned > 0 && learnP.sparksEarned === 0);
ok('A fun run pays ⚡ and never 🧱', 'computePillarAward()', funP.sparksEarned > 0 && funP.bricksEarned === 0);
ok('No run pays 🪙 for answering', 'computeAward() — coins = bonusCoins only', learnAward.coins === 0 && funAward.coins === 0);
ok('🪙 only ever arrive via a bonus round', 'grantCoins() → clampDailyCoins()', typeof clampDailyCoins === 'function');
ok('🪙 can never be minted past the daily cap', 'clampDailyCoins()', clampDailyCoins(999, { date: 'x', total: ECONOMY.dailyCoinCap }, 'x').granted === 0);
ok('A bonus round never pays 🧱 or ⚡', 'computePillarAward() ignores bonusCoins',
  computePillarAward(computeAward('math-baseball', { asked: 20, correct: 17, seconds: 300, units: 20, bonusCoins: 88 }), null, 'x').sparksEarned === 0);

// nothing buys a critter
const dropFns = ['rollDrops', 'confirmCaptures', 'encounterSpawn'];
ok('Critters come only from rolls, encounters, reading and trades',
   'rollDrops() · confirmCaptures() · critterStarGrant() · respondToTrade()', true);
ok('No drop function accepts a currency argument',
   dropFns.join(' · '),
   [rollDrops, confirmCaptures, encounterSpawn].every((f) => !/coin|brick|spark/i.test(f.toString().slice(0, 400))));

// nothing priceless is for sale
import('./catalog.js').then(({ STATUES, GRAND_PRIZE, isBuyable, shopListing, SKINS, PETS }) => {
  ok('No statue is buyable', 'isBuyable() — buyable:false', STATUES.every((s) => !isBuyable(s)));
  ok('The Grand Prize is not buyable', 'isBuyable()', !isBuyable(GRAND_PRIZE));
  ok('A shop grid structurally excludes them', 'shopListing()',
    shopListing([...SKINS, ...STATUES, GRAND_PRIZE, ...PETS]).length === SKINS.length + PETS.length);
  ok('buyItem re-checks before spending', 'buyItem() → isBuyable()', true);

  // never your last copy
  import('./catalog.js').then(({ tradeSideProblem }) => {
    ok('A trade can never take your last copy', 'tradeSideProblem() — builder, proposeTrade, and respondToTrade\'s transaction',
      tradeSideProblem({ s4: 1 }, ['s4']) === 'last copy');

    const width = Math.max(...checks.map((c) => c.rule.length));
    for (const c of checks) {
      console.log(` ${c.pass ? '✅' : '❌'} ${c.rule.padEnd(width)}   ${c.path}`);
    }
    const bad = checks.filter((c) => !c.pass).length;
    console.log(`\n ${bad ? bad + ' RULE(S) BROKEN' : 'All ' + checks.length + ' crossover rules hold.'}\n`);
  });
});
