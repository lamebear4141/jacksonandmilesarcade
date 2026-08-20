/* =====================================================================
   Economy sanity check. No test framework, no dependencies — just:

       node site/assets/catalog.test.mjs

   The point of this file is the ratio: a learning game must pay roughly
   4x what a fun game pays for the same few minutes. If someone retunes
   ECONOMY or GAMES and that stops being true, this fails loudly.
   ===================================================================== */
import {
  computeAward, clampFunAward, ECONOMY, GAMES,
  spriteId, spriteIndex, spriteById, SPRITES,
  collectionScoreFromCounts, todayKey,
} from './catalog.js';

let failures = 0;
function check(label, actual, expected){
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok){ failures++; console.log(`  FAIL  ${label}\n        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
  else console.log(`  ok    ${label}`);
}
function checkThat(label, cond){
  if (!cond){ failures++; console.log(`  FAIL  ${label}`); }
  else console.log(`  ok    ${label}`);
}

/* ---------------- the headline ratio ---------------- */
const mathRun  = computeAward('math-defender', { asked:20, correct:17, seconds:240, units:20 });
const blockRun = computeAward('block-stacker', { units:20, seconds:240 });

console.log('\nTHE RATIO — same four minutes, two games\n');
console.log('| Run                                      |  XP | Coins |');
console.log('|------------------------------------------|-----|-------|');
console.log(`| Math Defender: 20 correct, 85%, 4 min    | ${String(mathRun.xp).padStart(3)} | ${String(mathRun.coins).padStart(5)} |`);
console.log(`| Block Stacker: 20 milestones, 4 min      | ${String(blockRun.xp).padStart(3)} | ${String(blockRun.coins).padStart(5)} |`);
console.log(`\n  => ${(mathRun.xp / blockRun.xp).toFixed(1)}x the XP, ${(mathRun.coins / blockRun.coins).toFixed(1)}x the coins for practising.\n`);

console.log('Award formula');
check('math defender xp',    mathRun.xp,    316);
check('math defender coins', mathRun.coins, 125);
check('block stacker xp',    blockRun.xp,   60);
check('block stacker coins', blockRun.coins, 15);
checkThat('learning pays at least 4x the xp',    mathRun.xp    >= blockRun.xp    * 4);
checkThat('learning pays at least 4x the coins', mathRun.coins >= blockRun.coins * 4);

/* ---------------- no zero-reward outcomes ---------------- */
console.log('\nNo punishing outcomes');
const bombed = computeAward('coin-climb', { asked:10, correct:1, seconds:60 });
checkThat('a failed learning run still pays consolation xp', bombed.xp >= ECONOMY.consolationXp);
checkThat('a failed learning run is not "cleared"', bombed.cleared === false);
const zeroLength = computeAward('loot-drop', { asked:0, correct:0, seconds:0 });
checkThat('an empty run never goes negative', zeroLength.xp >= 0 && zeroLength.coins >= 0);
const justCleared = computeAward('loot-drop', { asked:5, correct:4, seconds:60 });
checkThat('exactly 80% counts as cleared', justCleared.cleared === true);

/* ---------------- the grind caps ---------------- */
console.log('\nCaps');
const longRun = computeAward('math-defender', { asked:1, correct:1, seconds:60*90 });
const cappedRun = computeAward('math-defender', { asked:1, correct:1, seconds:60*ECONOMY.minutesCap });
check('90 minutes pays the same as the 20-minute cap', longRun.xp, cappedRun.xp);

const funBig = computeAward('multiverse-collector', { units:400, seconds:300 });
const first  = clampFunAward(funBig, null, '2026-08-20');
check('fun xp clamps to the daily cap',    first.xp,    ECONOMY.funDailyXpCap);
check('fun coins clamp to the daily cap',  first.coins, ECONOMY.funDailyCoinCap);
const second = clampFunAward(funBig, first.daily, '2026-08-20');
check('a second fun run the same day earns nothing more', [second.xp, second.coins], [0, 0]);
const tomorrow = clampFunAward(funBig, first.daily, '2026-08-21');
check('the fun budget resets the next day', [tomorrow.xp, tomorrow.coins], [ECONOMY.funDailyXpCap, ECONOMY.funDailyCoinCap]);
const learnUncapped = clampFunAward(mathRun, { date:'2026-08-20', xp:9999, coins:9999 }, '2026-08-20');
check('learning games are never capped', [learnUncapped.xp, learnUncapped.coins], [mathRun.xp, mathRun.coins]);

/* ---------------- sprite ids ---------------- */
console.log('\nSprite ids');
check('sprite ids are s0..s59', [spriteId(0), spriteId(59)], ['s0', 's59']);
checkThat('every id round-trips to its own index',
  SPRITES.every((_, i) => spriteIndex(spriteId(i)) === i));
checkThat('spriteById matches the array', spriteById('s44') === SPRITES[44]);
check('a bogus id resolves to nothing', [spriteIndex('s999'), spriteById('nope')], [-1, null]);
check('collection score adds up', collectionScoreFromCounts({ s0:2, s44:1 }), 2 * 1 + 8);

/* ---------------- misc ---------------- */
console.log('\nHousekeeping');
checkThat('every game has a name, kind and multipliers',
  Object.values(GAMES).every(g => g.name && (g.kind === 'learn' || g.kind === 'fun')
    && typeof g.xpMult === 'number' && typeof g.coinMult === 'number'));
check('todayKey formats as YYYY-MM-DD', todayKey(new Date(2026, 0, 5)), '2026-01-05');

console.log(failures ? `\n${failures} FAILED\n` : '\nAll good.\n');
process.exit(failures ? 1 : 0);
