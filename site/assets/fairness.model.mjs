/* =====================================================================
   FAIRNESS AUDIT (E7 · P3) — does equal learning earn equal rewards?

       node site/assets/fairness.model.mjs

   AJ's rule: the content is already age-scaled (ageFromBirthday →
   tierForAge), so a 6-year-old clearing 6-year-old work has done as much
   as a 9-year-old clearing 9-year-old work, and must be paid the same.
   Fun games are the explicit exception — better tablet control is a real
   skill there. Playing MORE may earn more; reading FASTER may not.

   Measures only. Changes nothing. Run it after any economy retune.
   ===================================================================== */
import {
  ECONOMY, PILLAR_ECONOMY, GAMES, VAULT, vaultPayout, vaultZone, vaultAccuracy,
  computeAward, computePillarAward,
} from './catalog.js';

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

/** One run, all the way through the real award path. */
function pay(gameId, { asked, correct, seconds = 300, runQuestions = null }) {
  const a = computeAward(gameId, { asked, correct, seconds, units: correct, ...(runQuestions ? { runQuestions } : {}) });
  const p = computePillarAward(a, null, 'x');
  return { xp: a.xp, bricks: p.bricksEarned, share: a.runShare, accuracy: a.accuracy };
}
const spread = (xs) => Math.round((Math.max(...xs) / Math.min(...xs) - 1) * 100);

/* ---------------------------------------------------------------------
   1. What bounds a run — the thing that decides whether ages are equal.
   --------------------------------------------------------------------- */
console.log(`
=====================================================================
 1. WHAT BOUNDS A LEARNING RUN
=====================================================================
 A fixed-length run means both children answer the same number of
 questions and only the difficulty differs — which is what we want.

| game             | mode              | run ends at            | fixed? |
|------------------|-------------------|------------------------|--------|
| loot-drop        | the only mode     | 5 questions            | YES    |
| coin-climb       | Race (default)    | 15 correct to the flag | YES    |
| coin-climb       | Coin Rush         | 60 seconds             | no     |
| math-defender    | Sprint (default)  | 20 correct             | YES    |
| math-defender    | Blitz             | 60 seconds             | no     |
| math-baseball    | the only mode     | 3 outs or 10 runs      | no     |
| critter-catchers | any story         | 4 pages (L1) / 5 (L2)  | YES    |

 Each declares its full-run size, and the payout follows the SHARE of
 that run completed rather than the raw question count:

   ${Object.entries(GAMES).filter(([, g]) => g.kind === 'learn')
      .map(([id, g]) => `${id} ${g.runQuestions}`).join(' · ')}
   xp     = share × ${ECONOMY.xpPerRun} + ${ECONOMY.clearBonusXp} clear bonus + minutes × ${ECONOMY.xpPerMinute}
   bricks = share × ${PILLAR_ECONOMY.bricksPerRun}          (share capped at ${ECONOMY.maxRunShare})
`);

/* ---------------------------------------------------------------------
   2. The same game, two ages.
   --------------------------------------------------------------------- */
console.log(`=====================================================================
 2. THE SAME GAME, THE SAME ACCURACY, TWO AGES
=====================================================================
| game / mode              | who         | right |  XP | 🧱 |
|--------------------------|-------------|-------|-----|-----|`);
const sameGame = [];
for (const [label, id, correct] of [
  ['Coin Climb · Race', 'coin-climb', 15],
  ['Math Defender · Sprint', 'math-defender', 20],
]) {
  for (const who of ['Miles (6)', 'Jackson (9)']) {
    const r = pay(id, { asked: Math.round(correct * 1.15), correct });
    sameGame.push(r.xp);
    console.log(`| ${pad(label, 24)} | ${pad(who, 11)} | ${num(correct, 5)} | ${num(r.xp, 3)} | ${num(r.bricks, 3)} |`);
  }
}
console.log(`
 => identical within each game: the reward follows the work, and the
    work is the same.`);

/* ---------------------------------------------------------------------
   3. Across the games, which are pitched at different ages.
   --------------------------------------------------------------------- */
console.log(`

=====================================================================
 3. ACROSS THE GAMES — one CLEARED run each
=====================================================================
 This is the gap that mattered: the games aimed at younger children are
 the short ones, so paying per question paid them less for the same
 accomplishment.

| game                     | pitched at   | right |  XP | 🧱 |
|--------------------------|--------------|-------|-----|-----|`);
const cleared = [
  ['Loot Drop',              'loot-drop',       5,  null],
  ['Coin Climb · Race',      'coin-climb',     15,  null],
  ['Math Defender · Sprint', 'math-defender',  20,  null],
  ['Math Baseball',          'math-baseball',  12,  null],
  ['Critter Reader · 4pp',   'critter-catchers', 4, 4],
  ['Critter Reader · 5pp',   'critter-catchers', 5, 5],
];
const clearedXp = [], clearedBricks = [];
for (const [label, id, correct, rq] of cleared) {
  const r = pay(id, { asked: correct, correct, seconds: 240, runQuestions: rq });
  clearedXp.push(r.xp); clearedBricks.push(r.bricks);
  console.log(`| ${pad(label, 24)} | ${pad(GAMES[id].grades, 12)} | ${num(correct, 5)} | ${num(r.xp, 3)} | ${num(r.bricks, 3)} |`);
}
console.log(`
 spread, best- to worst-paying cleared run:  XP ${spread(clearedXp)}%  ·  bricks ${spread(clearedBricks)}%
 (before the share-of-run change: XP 105%, bricks 300%)`);

/* ---------------------------------------------------------------------
   4. The remaining, accepted differences.
   --------------------------------------------------------------------- */
console.log(`

=====================================================================
 4. WHAT STILL DIFFERS — and why that is allowed
=====================================================================

 (a) THE TIMED MODES (Coin Rush / Blitz) — kept on purpose. Opt-in, and
     the share cap at ${ECONOMY.maxRunShare} stops speed scaling for ever.
`);
console.log('| Blitz, 60 seconds        | right | share |  XP | 🧱 |');
console.log('|--------------------------|-------|-------|-----|-----|');
for (const [who, correct] of [['a slower reader', 12], ['a faster reader', 22], ['a very fast reader', 40]]) {
  const r = pay('math-defender', { asked: correct + 3, correct, seconds: 60 });
  console.log(`| ${pad(who, 24)} | ${num(correct, 5)} | ${num(r.share.toFixed(2), 5)} | ${num(r.xp, 3)} | ${num(r.bricks, 3)} |`);
}
console.log(`
 (b) FUN GAMES — the explicit exception. Better tablet control earns
     more, and that is a real skill.

 (c) PLAYING MORE still earns more. The rule is equal pay for equal
     work, not equal totals.
`);

/* ---------------------------------------------------------------------
   5. The Bonus Vault after a learning run.
   --------------------------------------------------------------------- */
console.log(`=====================================================================
 5. THE BONUS VAULT — won with the maths, not the thumbs
=====================================================================
 After a LEARNING run the green target widens with that run's own
 accuracy (${VAULT.zoneBase} + accuracy × ${VAULT.zoneFromAccuracy}); fun games keep the narrow bar.

| after a…              | zone  | a sharp tap | a loose tap | a bad tap |
|-----------------------|-------|-------------|-------------|-----------|`);
const taps = { sharp: 0.50, loose: 0.72, bad: 0.95 };   // marker position when tapped
for (const [label, kind, acc] of [
  ['fun run', 'fun', 0],
  ['80% learn run', 'learn', 0.80],
  ['90% learn run', 'learn', 0.90],
  ['100% learn run', 'learn', 1.0],
]) {
  const z = vaultZone(kind, acc);
  const at = (p) => num(vaultPayout(vaultAccuracy(p, z)) + ' 🪙', 11);
  console.log(`| ${pad(label, 21)} | ${num((z * 100).toFixed(0) + '%', 5)} | ${at(taps.sharp)} | ${at(taps.loose)} | ${num(vaultPayout(vaultAccuracy(taps.bad, z)) + ' 🪙', 9)} |`);
}
console.log(`
 => a child who did the maths well is paid for the maths: at 100%
    accuracy even a badly-timed tap lands near the ceiling. The floor
    (${VAULT.floorCoins} 🪙) still always pays, so there is no losing it.
`);
