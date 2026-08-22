/* =====================================================================
   Economy sanity check. No test framework, no dependencies — just:

       node site/assets/catalog.test.mjs

   The point of this file is the ratio: a learning game must pay roughly
   4x what a fun game pays for the same few minutes. If someone retunes
   ECONOMY or GAMES and that stops being true, this fails loudly.
   ===================================================================== */
import {
  computeAward, clampFunAward, computePillarAward, ECONOMY, PILLAR_ECONOMY, GAMES,
  spriteId, spriteIndex, spriteById, SPRITES, SPRITE_IDS, SKINS, PETS,
  collectionScoreFromCounts, todayKey,
  COLLECTIONS, GRAND_PRIZE, STATUES, LIVE_SPRITE_IDS, SPRITE_LORE,
  RARITY_UNLOCK, displayRarity, spriteState, inCollection, collectionOf,
  newlyCompletedCollections, isCollectionComplete, uniqueLiveCount,
  isBuyable, shopListing, VAULT, vaultPayout, clampDailyCoins, runQualifies, vaultOpens,
  describeTradeShape, tradeSideProblem, tradeTally,
  LUCK, PRACTICE_POWER, luckScore, practicePowerNow, practicePowerAfterRun, rollRarity,
  vaultZone, vaultAccuracy,
  practicePowerRested, daysBetweenKeys,
  DROPS, dropRolls, clampRarity, unlockedBand, newlyUnlockedRarities, rollCritter, rollDrops,
  confirmCaptures, encounterSpawn, dropsLeftToday, freshDrops,
  CRITTER_STARS, starsNeededFor, BEDTIME_SPRITE_IDS,
} from './catalog.js';
import { encodeSquad, encodeSquadV1, decodeSquad } from './squad-code.js';
import { storiesFor, SHARED_STORY_IDS, STORIES } from '../critter-catchers/stories.js';

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
console.log(`\n  => ${(mathRun.xp / blockRun.xp).toFixed(1)}x the XP for practising. Coins come from the\n     bonus round now, so a run's own coin line is 0 in both.\n`);

console.log('Award formula');
check('math defender xp',    mathRun.xp,    316);
check('block stacker xp',    blockRun.xp,   60);
checkThat('learning pays at least 4x the xp', mathRun.xp >= blockRun.xp * 4);
/* E4: the per-run coin wage is GONE. Answering questions, however well,
   pays no coin by itself — coins come from bonus rounds only. */
check('a run pays no coins by itself', [mathRun.coins, blockRun.coins], [0, 0]);
check('even a perfect run pays no coins',
  computeAward('math-defender', { asked:20, correct:20, seconds:240, units:20 }).coins, 0);
check('the retired wage numbers are gone from ECONOMY',
  [ECONOMY.coinsPerUnit, ECONOMY.clearBonusCoins], [undefined, undefined]);

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
check('fun xp clamps to the daily cap', first.xp, ECONOMY.funDailyXpCap);
const second = clampFunAward(funBig, first.daily, '2026-08-20');
check('a second fun run the same day earns no more xp', second.xp, 0);
const tomorrow = clampFunAward(funBig, first.daily, '2026-08-21');
check('the fun xp budget resets the next day', tomorrow.xp, ECONOMY.funDailyXpCap);
const learnUncapped = clampFunAward(mathRun, { date:'2026-08-20', xp:9999, coins:9999 }, '2026-08-20');
check('learning games are never capped', learnUncapped.xp, mathRun.xp);

/* ---------------- the pillar wallet ----------------
   Bricks and sparks are paid ALONGSIDE xp/coins, never instead of them:
   a learn game must pay bricks and zero sparks, a fun game the reverse.
   If that ever flips, the wrong pillar is being fed. */
console.log('\nPillar wallet');
const learnPillars = computePillarAward(mathRun, null, '2026-08-20');
check('a learn game pays bricks for the share of the run completed',
  learnPillars.bricksEarned, PILLAR_ECONOMY.bricksPerRun);
check('a learn game pays no sparks', learnPillars.sparksEarned, 0);

const funPillars = computePillarAward(blockRun, null, '2026-08-20');
check('a fun game pays sparks per unit',
  funPillars.sparksEarned, 20 * PILLAR_ECONOMY.sparksPerUnit);
check('a fun game pays no bricks', funPillars.bricksEarned, 0);

const sparkBig   = computePillarAward(funBig, null, '2026-08-20');
check('sparks clamp to the daily cap', sparkBig.sparksEarned, PILLAR_ECONOMY.dailySparkCap);
const sparkAgain = computePillarAward(funBig, sparkBig.dailySparks, '2026-08-20');
check('a second fun run the same day earns no more sparks', sparkAgain.sparksEarned, 0);
const sparkTomorrow = computePillarAward(funBig, sparkBig.dailySparks, '2026-08-21');
check('the spark budget resets the next day',
  sparkTomorrow.sparksEarned, PILLAR_ECONOMY.dailySparkCap);
check('bricks are never capped by the spark budget',
  computePillarAward(mathRun, sparkBig.dailySparks, '2026-08-20').bricksEarned,
  PILLAR_ECONOMY.bricksPerRun);

/* a learn game's bonus round (the Home Run Derby) pays coins */
const derbyRun = computeAward('math-baseball', { asked:20, correct:17, seconds:240, units:20, bonusCoins:88 });
const derbyPillars = computePillarAward(derbyRun, null, '2026-08-20');
check('the bonus round IS the run\'s coin line', derbyRun.coins, 88);
check('the derby bonus is reported on its own', derbyRun.bonusCoins, 88);
check('a derby bonus never pays sparks', derbyPillars.sparksEarned, 0);
check('the derby bonus does not touch bricks',
  derbyPillars.bricksEarned, computePillarAward(computeAward('math-baseball', { asked:20, correct:17, seconds:240, units:20 }), null, 'x').bricksEarned);
const derbyPlain = computeAward('math-baseball', { asked:20, correct:17, seconds:240, units:20 });
check('a bonus never leaks into xp, units, share or accuracy',
  [derbyRun.xp, derbyRun.units, derbyRun.runShare, derbyRun.accuracy],
  [derbyPlain.xp, derbyPlain.units, derbyPlain.runShare, derbyPlain.accuracy]);
check('a spent spark budget cannot eat the derby coins',
  computeAward('math-baseball', { asked:20, correct:17, seconds:240, units:20, bonusCoins:88 }).coins, 88);

/* the whole point of W0: the old numbers must not have moved */
check('the XP award is untouched by every change since W0',
  [mathRun.xp, blockRun.xp], [316, 60]);

/* ---------------- sprite ids ---------------- */
console.log('\nSprite ids');
check('sprite ids are s0..s125', [spriteId(0), spriteId(59), spriteId(125)], ['s0', 's59', 's125']);
checkThat('every id round-trips to its own index',
  SPRITES.every((_, i) => spriteIndex(spriteId(i)) === i));
checkThat('spriteById matches the array', spriteById('s44') === SPRITES[44]);
check('a bogus id resolves to nothing', [spriteIndex('s999'), spriteById('nope')], [-1, null]);
check('collection score adds up (live sprites)', collectionScoreFromCounts({ s4:2, s42:1 }), 2 * 1 + 8);
check('parked sprites never move the score', collectionScoreFromCounts({ s0:5, s59:1 }), 0);

/* ---------------- collections (R2B · E1) ---------------- */
console.log('\nCollections');
check('SPRITES grew by appending only', SPRITES.length, 126);
check('the first sixty never moved',
  [SPRITES[0].n, SPRITES[24].n, SPRITES[51].n, SPRITES[59].n],
  ['Ridgehowl', 'Ember Fox', 'Rex Prime', 'Diamond Hand']);
check('the bedtime twelve sit at s60..s71 in Critter Catchers order',
  [SPRITES[60].n, SPRITES[67].n, SPRITES[70].n, SPRITES[71].n],
  ['Pip the Fox', 'Ziggy the Dragon', 'Sir Biscuit the Pup', 'Twinkle the Star Sprite']);
check('eight collections', COLLECTIONS.length, 8);
check('eighty live sprites', LIVE_SPRITE_IDS.length, 80);
checkThat('every collection has exactly ten members', COLLECTIONS.every(c => c.members.length === 10));
checkThat('every collection is 5 common / 3 rare / 1 epic / 1 legendary',
  COLLECTIONS.every(c => {
    const t = { common:0, rare:0, epic:0, legendary:0 };
    c.members.forEach(id => { t[displayRarity(spriteById(id).r)]++; });
    return t.common === 5 && t.rare === 3 && t.epic === 1 && t.legendary === 1;
  }));
checkThat('no sprite is in two collections',
  new Set(COLLECTIONS.flatMap(c => c.members)).size === 80);
checkThat('no two identical emoji inside one collection',
  COLLECTIONS.every(c => new Set(c.members.map(id => spriteById(id).g)).size === 10));
checkThat('every member id resolves', COLLECTIONS.every(c => c.members.every(id => spriteById(id))));
check('collectionOf finds the set', collectionOf('s51')?.id, 'dinosaurs');
check('a parked sprite has no collection', [collectionOf('s0'), inCollection('s60')], [null, false]);
checkThat('mythic displays as legendary', displayRarity('mythic') === 'legendary' && displayRarity('rare') === 'rare');
checkThat('every statue is unbuyable, 2×2 and animated',
  STATUES.every(s => s.buyable === false && s.size[0] === 2 && s.size[1] === 2 && s.animated === true));
check('the Grand Prize', [GRAND_PRIZE.id, GRAND_PRIZE.size, GRAND_PRIZE.buyable], ['sky-coaster', [3, 3], false]);

/* lore: every live sprite has a complete card, copied from the spec */
console.log('\nLore cards');
check('eighty lore cards', Object.keys(SPRITE_LORE).length, 80);
checkThat('every live sprite carries its lore', LIVE_SPRITE_IDS.every(id => spriteById(id).lore === SPRITE_LORE[id]));
checkThat('no parked sprite has lore', SPRITE_IDS.filter(id => !inCollection(id)).every(id => !spriteById(id).lore));
const pip = (n) => Number.isInteger(n) && n >= 1 && n <= 6;
checkThat('every card has real, tag, 6-pip scales, two likes and a story',
  LIVE_SPRITE_IDS.every(id => {
    const l = SPRITE_LORE[id];
    return l && l.real && l.tag && pip(l.size) && pip(l.speed) && pip(l.weight)
      && Array.isArray(l.likes) && l.likes.length === 2 && l.story;
  }));
checkThat('every card has exactly one footer (fact | legend | log)',
  LIVE_SPRITE_IDS.every(id => ['fact', 'legend', 'log'].filter(k => SPRITE_LORE[id][k]).length === 1));
checkThat('every epic and legendary carries a title; nothing below does',
  LIVE_SPRITE_IDS.every(id => {
    const r = displayRarity(spriteById(id).r);
    return (r === 'epic' || r === 'legendary') ? !!SPRITE_LORE[id].title : !SPRITE_LORE[id].title;
  }));
checkThat('every legendary tells a legend', LIVE_SPRITE_IDS.filter(id => displayRarity(spriteById(id).r) === 'legendary').every(id => !!SPRITE_LORE[id].legend));
checkThat('fantasy is all legend, no facts', COLLECTIONS.find(c => c.id === 'fantasy').members.every(id => SPRITE_LORE[id].legend && !SPRITE_LORE[id].fact));

/* the three states */
console.log('\nThree states');
const lvl = (level, counts = {}) => ({ level, counts });
check('level 1: commons are silhouettes, everything above is hidden',
  [spriteState('s4', lvl(1)), spriteState('s77', lvl(1)), spriteState('s80', lvl(1)), spriteState('s51', lvl(1))],
  ['silhouette', 'hidden', 'hidden', 'hidden']);
check('the bands open at 3, 7 and 11',
  [spriteState('s77', lvl(3)), spriteState('s80', lvl(6)), spriteState('s80', lvl(7)), spriteState('s51', lvl(10)), spriteState('s51', lvl(11))],
  ['silhouette', 'hidden', 'silhouette', 'hidden', 'silhouette']);
check('a caught sprite is owned at any level (trading bypasses the gate)', spriteState('s51', lvl(1, { s51: 1 })), 'owned');
check('a mythic sprite is gated as legendary', [spriteState('s71', lvl(10)), spriteState('s71', lvl(11))], ['hidden', 'silhouette']);
check('level can come from xp', spriteState('s77', { xp: 0, counts: {} }), 'hidden');
check('RARITY_UNLOCK is the table from the spec', RARITY_UNLOCK, { common: 1, rare: 3, epic: 7, legendary: 11 });

/* completion: derived, never stored */
console.log('\nCompletion');
const dino = COLLECTIONS.find(c => c.id === 'dinosaurs');
const allDino = Object.fromEntries(dino.members.map(id => [id, 1]));
check('ten of ten completes', isCollectionComplete(dino, allDino), true);
check('nine of ten does not', isCollectionComplete(dino, { ...allDino, s51: 0 }), false);
check('a fresh completion is reported once', newlyCompletedCollections(allDino, []), ['dinosaurs']);
check('an already-granted badge is not reported again', newlyCompletedCollections(allDino, ['dinosaurs']), []);
check('unique count ignores parked sprites', uniqueLiveCount({ s4: 1, s0: 9, s60: 1, s51: 3 }), 2);

/* the shop's structural filter */
console.log('\nShop exclusion');
checkThat('every skin and pet is buyable', [...SKINS, ...PETS].every(isBuyable));
checkThat('no statue is buyable', STATUES.every(s => !isBuyable(s)));
check('the Grand Prize is not buyable', isBuyable(GRAND_PRIZE), false);
check('shopListing strips statues even when handed them',
  shopListing([...SKINS, ...STATUES, GRAND_PRIZE, ...PETS]).length, SKINS.length + PETS.length);

/* squad code: both schemes round-trip */
console.log('\nSquad code');
const counts = new Array(SPRITES.length).fill(0);
counts[0] = 3; counts[51] = 1; counts[59] = 17; counts[77] = 2; counts[125] = 1;
const v2 = decodeSquad(encodeSquad({ whoBit: 1, level: 12, streak: 4, rounds: 300, counts }));
check('v2 header round-trips', [v2.scheme, v2.whoBit, v2.level, v2.streak, v2.rounds], [2, 1, 12, 4, 300]);
check('v2 keeps owned / not owned for every index',
  v2.counts.map(Boolean), counts.map(n => n > 0));
checkThat('v2 is one bit per sprite (16 bytes for 126 sprites)', encodeSquad({ counts }).length <= 30);
const v1 = decodeSquad(encodeSquadV1({ whoBit: 0, level: 3, streak: 1, rounds: 7, counts }));
check('v1 header round-trips', [v1.scheme, v1.whoBit, v1.level, v1.streak, v1.rounds], [1, 0, 3, 1, 7]);
check('v1 keeps exact counts, capped at 15', [v1.counts[0], v1.counts[51], v1.counts[59], v1.counts[125]], [3, 1, 15, 1]);
/* an old link shared when the array was 60 long: 6 header bytes + 30 count bytes */
const old60 = new Array(60).fill(0); old60[2] = 1; old60[44] = 2;
const oldCode = encodeSquadV1({ whoBit: 1, level: 5, streak: 2, rounds: 40, counts: old60 });
const oldRead = decodeSquad(oldCode);
check('an old 60-sprite v1 link still decodes', [oldRead.scheme, oldRead.level, oldRead.counts[2], oldRead.counts[44]], [1, 5, 1, 2]);
check('…and reads zero for every sprite it predates', oldRead.counts.length === SPRITES.length && oldRead.counts.slice(60).every(n => n === 0), true);
check('junk is rejected', [decodeSquad(''), decodeSquad('zzz'), decodeSquad('!!!')], [null, null, null]);

/* ---------------- finding critters (R2B · E2) ---------------- */
console.log('\nDrops');
const seeded = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
const rarityOf = (id) => displayRarity(spriteById(id).r);

check('every game declares exactly one critter mode',
  Object.entries(GAMES).map(([id, g]) => `${id}:${g.critterMode}`),
  ['loot-drop:roll', 'math-defender:roll', 'coin-climb:roll', 'math-baseball:roll', 'critter-catchers:null',
   'multiverse-collector:encounter', 'block-stacker:roll', 'escape-jungle:roll', 'harvest-night:encounter']);
checkThat('encounter games declare a capture condition with a test',
  ['multiverse-collector', 'harvest-night'].every((id) => typeof GAMES[id].captureCondition?.test === 'function' && GAMES[id].captureCondition.text));
check('Multiverse confirms on a completed run only',
  [GAMES['multiverse-collector'].captureCondition.test({ completed: true }), GAMES['multiverse-collector'].captureCondition.test({})], [true, false]);
check('Harvest Night confirms on an escape only',
  [GAMES['harvest-night'].captureCondition.test({ escaped: true }), GAMES['harvest-night'].captureCondition.test({ escaped: false })], [true, false]);

const learn = (correct, asked) => computeAward('math-defender', { asked, correct, seconds: 120 });
check('learn: 80% earns one roll, 100% earns two, 60% earns none',
  [dropRolls('math-defender', learn(8, 10)), dropRolls('math-defender', learn(10, 10)), dropRolls('math-defender', learn(6, 10))], [1, 2, 0]);
check('learn: an empty run earns nothing', dropRolls('math-defender', learn(0, 0)), 0);
const fun = (units) => computeAward('block-stacker', { units, seconds: 120 });
check('fun: the milestone earns one roll, double earns two, under earns none',
  [dropRolls('block-stacker', fun(10)), dropRolls('block-stacker', fun(20)), dropRolls('block-stacker', fun(9))], [1, 2, 0]);
check('an encounter game never rolls at the end', dropRolls('multiverse-collector', computeAward('multiverse-collector', { units: 50, seconds: 60 })), 0);

check('bands: 1→common, 3→rare, 7→epic, 11→legendary',
  [unlockedBand(1), unlockedBand(3), unlockedBand(6), unlockedBand(7), unlockedBand(11)], ['common', 'rare', 'rare', 'epic', 'legendary']);
check('clamp lands at the top of the band, never discards',
  [clampRarity('legendary', 2), clampRarity('mythic', 5), clampRarity('rare', 11)],
  [{ rarity: 'common', clamped: true }, { rarity: 'rare', clamped: true }, { rarity: 'rare', clamped: false }]);
check('the level-up beat knows which bands opened',
  [newlyUnlockedRarities(2, 3), newlyUnlockedRarities(6, 7), newlyUnlockedRarities(3, 4), newlyUnlockedRarities(1, 11)],
  [['rare'], ['epic'], [], ['rare', 'epic', 'legendary']]);

/* a Level 2 character must never receive anything above common — the
   thing that should fail if the gate is broken */
{
  const rand = seeded(3);
  let above = 0;
  for (let i = 0; i < 1000; i++) if (rollCritter({ level: 2, luck: 100, rand }).rarity !== 'common') above++;
  check('1000 rolls at Level 2 with max luck: nothing above common', above, 0);
  const r12 = seeded(5);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(rollCritter({ level: 12, luck: 100, rand: r12 }).rarity);
  checkThat('at Level 12 every band can land', ['common', 'rare', 'epic', 'legendary'].every((r) => seen.has(r)));
  checkThat('a roll only ever lands on a live sprite', Array.from({ length: 300 }, () => rollCritter({ level: 12, luck: 60, rand: seeded(11) }).spriteId).every(inCollection));
}

/* the daily cap, shared by rolls and encounters */
{
  const day = '2026-08-22';
  const c = { level: 5, counts: {}, drops: { date: day, count: 3, sinceEpic: 0 } };
  const r = rollDrops({ rolls: 2, character: c, luck: 0, dayStr: day, rand: seeded(9) });
  check('two earned rolls against one slot left: one drop, capped flagged', [r.drops.length, r.capped, r.dropsState.count], [1, true, 4]);
  const r2 = rollDrops({ rolls: 1, character: { ...c, drops: r.dropsState }, luck: 0, dayStr: day, rand: seeded(9) });
  check('at the cap nothing more drops today', [r2.drops.length, r2.capped], [0, true]);
  const r3 = rollDrops({ rolls: 1, character: { ...c, drops: r.dropsState }, luck: 0, dayStr: '2026-08-23', rand: seeded(9) });
  check('the count resets tomorrow', [r3.drops.length, r3.dropsState.count], [1, 1]);
  check('dropsLeftToday reads the same state', [dropsLeftToday(r.dropsState, day), dropsLeftToday(r.dropsState, '2026-08-23')], [0, 4]);
  const e = confirmCaptures({ captures: ['s4', 's5', 's6'], character: { level: 1, counts: {}, drops: { date: day, count: 2 } }, dayStr: day });
  check('encounters consume the same cap; extras are simply not granted', [e.drops.map((d) => d.spriteId), e.overflow, e.dropsState.count], [['s4', 's5'], ['s6'], 4]);
  check('a parked sprite can never be confirmed', confirmCaptures({ captures: ['s0', 's4'], character: { level: 1, counts: {}, drops: null }, dayStr: day }).drops.map((d) => d.spriteId), ['s4']);
  check('encounterSpawn stops at the cap (including pending ones this run)',
    [encounterSpawn({ level: 1, counts: {}, drops: { date: day, count: 4 } }, { dayStr: day }),
     encounterSpawn({ level: 1, counts: {}, drops: { date: day, count: 2 } }, { dayStr: day, pending: 2 })], [null, null]);
  const sp = encounterSpawn({ level: 1, counts: {}, drops: null }, { dayStr: day, rand: seeded(2) });
  checkThat('encounterSpawn hands a game a live common at Level 1', sp && sp.rarity === 'common' && inCollection(sp.spriteId) && sp.sprite && sp.index >= 0);
  check('a drop for a kid who owns nothing is new',
    rollDrops({ rolls: 2, character: { level: 1, counts: {}, drops: null }, luck: 0, dayStr: day, rand: seeded(4) }).drops.map((d) => d.isNew), [true, true]);
  check('a drop for a kid who owns everything is a spare',
    rollDrops({ rolls: 2, character: { level: 12, counts: Object.fromEntries(LIVE_SPRITE_IDS.map((id) => [id, 1])), drops: null }, luck: 0, dayStr: day, rand: seeded(4) }).drops.map((d) => d.isNew), [false, false]);
  checkThat('two drops in one run never collide on the same missing critter',
    (() => { const d = rollDrops({ rolls: 2, character: { level: 1, counts: {}, drops: null }, luck: 0, dayStr: day, rand: () => 0.01 }).drops;
             return d[0].spriteId !== d[1].spriteId; })());
}

/* pity: 8 qualifying runs without an epic+ (once epic is unlocked) force rare+ */
{
  const day = '2026-08-22';
  const low = () => 0.01;   // rollRarity(luck 0) → common every time; no focus reroll
  let st = { date: day, count: 0, sinceEpic: 0 };
  for (let i = 0; i < DROPS.pityRuns; i++) {
    const r = rollDrops({ rolls: 1, character: { level: 7, counts: {}, drops: { ...st, count: 0 } }, luck: 0, dayStr: day, rand: low });
    st = r.dropsState;
  }
  check('pity counter climbs one per qualifying run', st.sinceEpic, DROPS.pityRuns);
  const forced = rollDrops({ rolls: 1, character: { level: 7, counts: {}, drops: { ...st, count: 0 } }, luck: 0, dayStr: day, rand: low });
  check('…then the next roll is forced to rare', [forced.drops[0].rarity, forced.drops[0].pity], ['rare', true]);
  const below = rollDrops({ rolls: 1, character: { level: 6, counts: {}, drops: { date: day, count: 0, sinceEpic: 99 }, }, luck: 0, dayStr: day, rand: low });
  check('pity is skipped below Level 7', [below.drops[0].rarity, below.drops[0].pity, below.dropsState.sinceEpic], ['common', false, 99]);
  const epicRun = rollDrops({ rolls: 1, character: { level: 7, counts: {}, drops: { date: day, count: 0, sinceEpic: 5 } }, luck: 100, dayStr: day, rand: () => 0.999 });
  checkThat('an epic+ resets the pity counter', epicRun.drops[0].rarity !== 'common' && (epicRun.dropsState.sinceEpic === 0 || epicRun.drops[0].rarity === 'rare'));
}

/* ---- the odds TILT with practice; they must never invert (E7 · P2) ---- */
{
  const share = (luck) => {
    const rand = seeded(99);
    const t = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (let i = 0; i < 20000; i++) t[displayRarity(rollRarity(luck, rand))]++;
    return { common: t.common / 200, rare: t.rare / 200, epic: t.epic / 200, legendary: t.legendary / 200 };
  };
  const cold = share(0), hot = share(100);
  const near = (a, b, tol = 2.5) => Math.abs(a - b) <= tol;
  checkThat('at zero power the base weights hold (55/27/12/6)',
    near(cold.common, 55) && near(cold.rare, 27) && near(cold.epic, 12) && near(cold.legendary, 6));
  checkThat('at full power: 40/32/16/12 — a tilt, not an inversion',
    near(hot.common, 40) && near(hot.rare, 32) && near(hot.epic, 16) && near(hot.legendary, 12));
  checkThat('a full meter roughly DOUBLES legendary', hot.legendary > cold.legendary * 1.7 && hot.legendary < cold.legendary * 2.3);
  /* THE regression this phase exists to prevent: a collection needs five
     specific commons and one crown, so commons must stay the bulk of what
     arrives however well the child is doing. */
  checkThat('commons are still the biggest slice at full power',
    hot.common > hot.rare && hot.common > hot.epic && hot.common > hot.legendary);
  checkThat('practising well never starves a kid of commons', hot.common > cold.common * 0.6);
}

/* ---- drops aim at what you are missing ---- */
{
  const everything = Object.fromEntries(LIVE_SPRITE_IDS.map((id) => [id, 1]));
  const missingTwo = { ...everything };
  delete missingTwo.s4; delete missingTwo.s5;          // two commons

  const rand = seeded(7);
  const drops = Array.from({ length: 1000 }, () => rollCritter({ level: 12, luck: 100, counts: missingTwo, rand }));
  const needed = drops.filter((d) => d.spriteId === 's4' || d.spriteId === 's5').length;
  checkThat('a kid two commons short gets them in a handful of drops, not a month', needed > 150);
  const rAll = seeded(7);
  const wideOpen = Array.from({ length: 1000 }, () => rollCritter({ level: 12, luck: 100, counts: {}, rand: rAll }));
  checkThat('roughly the configured share of drops is aimed, when there is anything to aim at',
    Math.abs(wideOpen.filter((d) => d.aimed).length / 1000 - DROPS.aimAtMissingChance) < 0.06);
  checkThat('a rarity with nothing left to find quietly stops aiming and pays a spare',
    drops.filter((d) => d.rarity !== 'common').every((d) => !d.aimed));
  checkThat('an aimed drop is ALWAYS something they do not have',
    drops.filter((d) => d.aimed).every((d) => !(missingTwo[d.spriteId] > 0)));

  /* spares are trade fuel — aiming must never take them to zero */
  const r2 = seeded(3);
  const owned = Array.from({ length: 300 }, () => rollCritter({ level: 12, luck: 100, counts: everything, rand: r2 }));
  checkThat('a kid who owns everything still receives spares, never nothing',
    owned.every((d) => d.spriteId && !d.aimed));
  const r3 = seeded(5);
  const fresh = Array.from({ length: 500 }, () => rollCritter({ level: 12, luck: 100, counts: {}, rand: r3 }));
  checkThat('some drops are still unaimed, so duplicates keep flowing', fresh.some((d) => !d.aimed));

  /* Focus is a priority, not a bonus */
  const dino = COLLECTIONS.find((c) => c.id === 'dinosaurs');
  const r4 = seeded(21);
  const focused = Array.from({ length: 600 }, () => rollCritter({ level: 12, luck: 60, counts: {}, focusCollection: 'dinosaurs', rand: r4 }));
  checkThat('a focused drop always lands in the focused collection',
    focused.filter((d) => d.focus).every((d) => dino.members.includes(d.spriteId)));
  checkThat('focus claims most of the aimed drops',
    focused.filter((d) => d.focus).length > focused.filter((d) => d.aimed).length * 0.5);
  checkThat('focus never changes the rarity that was rolled',
    Array.from({ length: 300 }, () => rollCritter({ level: 1, luck: 100, counts: {}, focusCollection: 'fantasy', rand: r4 })).every((d) => d.rarity === 'common'));
  const allDino = Object.fromEntries(dino.members.map((id) => [id, 1]));
  checkThat('a finished focus quietly stops claiming drops',
    Array.from({ length: 200 }, () => rollCritter({ level: 12, luck: 60, counts: allDino, focusCollection: 'dinosaurs', rand: r4 })).every((d) => !d.focus));
}

/* ---------------- Critter Reader (R2B · E3) ---------------- */
console.log('\nCritter Reader');
check('the kid-facing name is Critter Reader, the game id is not', [GAMES['critter-catchers'].name, GAMES['critter-catchers'].href],
  ['Critter Reader', 'critter-catchers/index.html']);
check('star costs: common 1 · rare 3 · epic 6 · legendary 10', CRITTER_STARS, { common: 1, rare: 3, epic: 6, legendary: 10 });
check('a mythic critter costs the same as a legendary', [starsNeededFor('s71'), starsNeededFor('s51')], [10, 10]);
check('costs by rarity', [starsNeededFor('s4'), starsNeededFor('s77'), starsNeededFor('s80')], [1, 3, 6]);
check('the twelve bedtime critters map to s60..s71',
  Object.entries(BEDTIME_SPRITE_IDS).map(([k, v]) => `${k}=${v}`).join(' '),
  'pip=s60 mo=s61 wren=s62 sprout=s63 luna=s64 bram=s65 puddle=s66 ziggy=s67 nova=s68 willow=s69 biscuit=s70 twinkle=s71');
checkThat('every mapped id resolves to the critter of that name',
  Object.entries(BEDTIME_SPRITE_IDS).every(([legacy, id]) => spriteById(id).n.toLowerCase().includes(legacy === 'biscuit' ? 'biscuit' : legacy)));

/* every critter has a bookshelf: the twelve keep their own, everyone else
   reads the shared fairy tales */
{
  const shelfOf = (critter, level) => storiesFor(critter, level);
  const twinkle = { id: 's71', legacyId: 'twinkle', fav: 'night' };
  const zebra   = { id: 's119', legacyId: null, fav: 'silly' };
  checkThat('a bedtime critter still reads its own books',
    shelfOf(twinkle, 1).length > 0 && shelfOf(twinkle, 1).every((b) => b.id.startsWith('twinkle')));
  checkThat('every other critter gets the shared shelf, and it is not empty',
    shelfOf(zebra, 1).length === SHARED_STORY_IDS[1].length && shelfOf(zebra, 2).length === SHARED_STORY_IDS[2].length);
  checkThat('the shared shelf is real books that exist at that level',
    [1, 2].every((lvl) => SHARED_STORY_IDS[lvl].every((id) => Object.values(STORIES[lvl]).flat().some((b) => b.id === id))));
  checkThat('no shared book names one of the twelve',
    [1, 2].every((lvl) => shelfOf(zebra, lvl).every((b) =>
      !/\b(Pip|Wren|Sprout|Luna|Bram|Puddle|Ziggy|Nova|Willow|Biscuit)\b/.test(b.pages.map((p) => p.text).join(' ')))));
  checkThat('a shelf always puts the critter\'s favourite genre first',
    shelfOf({ id: 's119', fav: 'night' }, 1)[0].genre === 'night');
  checkThat('every live critter has at least two books at both levels',
    LIVE_SPRITE_IDS.every((id) => shelfOf({ id, legacyId: null, fav: 'silly' }, 1).length >= 2
                               && shelfOf({ id, legacyId: null, fav: 'silly' }, 2).length >= 2));
}

/* ---------------- the coin faucet (R2B · E4) ---------------- */
console.log('\nThe coin faucet');
check('every game declares one bonus round',
  Object.entries(GAMES).map(([id, g]) => `${id}:${g.bonusRound}`),
  ['loot-drop:custom', 'math-defender:vault', 'coin-climb:vault', 'math-baseball:custom',
   'critter-catchers:vault', 'multiverse-collector:vault', 'block-stacker:vault',
   'escape-jungle:vault', 'harvest-night:vault']);
check('the approved payout band', [VAULT.floorCoins, VAULT.ceilingCoins], [40, 90]);
check('the floor always pays, a perfect tap pays the ceiling',
  [vaultPayout(0), vaultPayout(0.5), vaultPayout(1)], [40, 65, 90]);
check('a wild tap can never pay less than the floor or more than the ceiling',
  [vaultPayout(-5), vaultPayout(99), vaultPayout(NaN)], [40, 90, 40]);
checkThat('there is no losing the bonus round',
  [0, 0.1, 0.25, 0.5, 0.75, 1].every((a) => vaultPayout(a) >= VAULT.floorCoins));

/* one definition of "a good run", shared by drops and the Vault */
const learn80 = computeAward('math-defender', { asked:10, correct:8, seconds:120 });
const learn60 = computeAward('math-defender', { asked:10, correct:6, seconds:120 });
check('the Vault opens on a qualifying run and stays shut otherwise',
  [vaultOpens('math-defender', learn80), vaultOpens('math-defender', learn60)], [true, false]);
check('a game with its own bonus round never opens the Vault',
  [vaultOpens('math-baseball', learn80), vaultOpens('loot-drop', learn80)], [false, false]);
check('drops and the Vault agree on what a good run is',
  [runQualifies('math-defender', learn80), runQualifies('math-defender', learn60)], [true, false]);
checkThat('a fun game qualifies on its milestone, not on accuracy',
  runQualifies('block-stacker', computeAward('block-stacker', { units:10, seconds:60 }))
  && !runQualifies('block-stacker', computeAward('block-stacker', { units:9, seconds:60 })));

/* the one cap every coin passes through */
console.log('\nThe daily coin cap');
check('the approved cap', ECONOMY.dailyCoinCap, 300);
const c1 = clampDailyCoins(90, null, '2026-08-22');
check('the first payout of the day lands in full', [c1.granted, c1.capped, c1.dailyCoins.total], [90, false, 90]);
const nearly = clampDailyCoins(90, { date:'2026-08-22', total:260 }, '2026-08-22');
check('a payout that would cross the cap is trimmed, not refused',
  [nearly.granted, nearly.capped, nearly.dailyCoins.total], [40, true, 300]);
const full = clampDailyCoins(90, { date:'2026-08-22', total:300 }, '2026-08-22');
check('at the cap nothing more lands today', [full.granted, full.capped], [0, true]);
check('the cap resets tomorrow', clampDailyCoins(90, full.dailyCoins, '2026-08-23').granted, 90);
check('a negative or junk payout can never mint coins',
  [clampDailyCoins(-50, null, '2026-08-22').granted, clampDailyCoins(NaN, null, '2026-08-22').granted], [0, 0]);

/* no bespoke bonus round may undercut the shared one */
const DERBY = { coinsFloor: 40, coinsPerHomer: 8 };      // math-baseball CONFIG.derby
const LOOT_MINIGAME_FLOOR = 40;                          // loot-drop CONFIG.minigameFloorCoins
checkThat('a bespoke bonus round never pays less than the Vault floor',
  DERBY.coinsFloor >= VAULT.floorCoins && LOOT_MINIGAME_FLOOR >= VAULT.floorCoins);
/* the derby's upside is unbounded; it passes a perfect Vault tap at 7 homers */
check('a homerless derby still clears the Vault floor', DERBY.coinsFloor >= VAULT.floorCoins, true);
check('a seven-homer derby beats a perfect Vault tap',
  DERBY.coinsFloor + DERBY.coinsPerHomer * 7 > VAULT.ceilingCoins, true);

/* ---------------- nothing crosses over ---------------- */
console.log('\nNo crossover');
check('answering questions can never pay a coin',
  computeAward('coin-climb', { asked:20, correct:20, seconds:600, units:20 }).coins, 0);
check('a bonus round can never pay sparks, and never changes the bricks',
  [computePillarAward(derbyRun, null, '2026-08-20').sparksEarned,
   computePillarAward(derbyRun, null, '2026-08-20').bricksEarned
     === computePillarAward(computeAward('math-baseball', { asked:20, correct:17, seconds:240, units:20 }), null, 'x').bricksEarned],
  [0, true]);
check('a fun run pays sparks and no bricks; a learn run the reverse',
  [computePillarAward(blockRun, null, '2026-08-20').bricksEarned,
   computePillarAward(mathRun, null, '2026-08-20').sparksEarned], [0, 0]);
checkThat('no critter has a price, and nothing priceless is for sale',
  STATUES.every((s) => !isBuyable(s)) && !isBuyable(GRAND_PRIZE)
  && shopListing([...STATUES, GRAND_PRIZE]).length === 0);
checkThat('a sprite cannot be bought: the shop only ever lists skins and pets',
  shopListing([...SKINS, ...PETS]).length === SKINS.length + PETS.length);

/* ---------------- open trades (R2B · E5) ---------------- */
console.log('\nOpen trades');
check('six per side', ECONOMY.maxTradeItems, 6);
check('repeats in an array mean quantity', tradeTally(['s4', 's4', 's5']), { s4: 2, s5: 1 });

/* the hard guardrail: never your last copy */
const two   = { s4: 2, s5: 1, s51: 3 };
check('offering a spare is fine', tradeSideProblem(two, ['s4']), null);
check('offering your LAST copy is refused', tradeSideProblem(two, ['s5']), 'last copy');
check('offering both copies is refused — you always keep one', tradeSideProblem(two, ['s4', 's4']), 'last copy');
check('two of three is fine', tradeSideProblem(two, ['s51', 's51']), null);
check('all three of three is refused', tradeSideProblem(two, ['s51', 's51', 's51']), 'last copy');
check('a sprite you do not own at all is refused', tradeSideProblem(two, ['s77']), 'last copy');
check('an empty side is refused', tradeSideProblem(two, []), 'empty');
check('seven items is refused', tradeSideProblem({ s4: 99 }, Array(7).fill('s4')), 'too many');
check('exactly six is allowed', tradeSideProblem({ s4: 99 }, Array(6).fill('s4')), null);
check('a parked sprite can never be traded', tradeSideProblem({ s0: 9 }, ['s0']), 'missing');
checkThat('junk input is refused rather than throwing',
  tradeSideProblem({}, null) === 'empty' && tradeSideProblem({}, 's4') === 'empty');

/* the deal, in plain words — information, never judgement */
check('the lopsided line reads exactly as specified',
  describeTradeShape(['s4','s4','s5','s5','s6'], ['s51']),
  "That's 5 for 1 — you'd still have one of each. Your call! 🙂");
check('a straight swap', describeTradeShape(['s4'], ['s51']), "That's 1 for 1 — a straight swap. Your call! 🙂");
check('an even swap', describeTradeShape(['s4','s5'], ['s51','s52']), "That's 2 for 2 — an even swap. Your call! 🙂");
check('getting more than you give',
  describeTradeShape(['s4'], ['s51','s52','s53']),
  "That's 1 for 3 — you'd be getting more than you give. Your call! 🙂");
check('an empty side says nothing at all', [describeTradeShape([], ['s4']), describeTradeShape(['s4'], [])], ['', '']);
checkThat('the line never scores or scolds the deal',
  !/bad|unfair|too much|should|careful|warning|rip|lose/i.test(
    describeTradeShape(['s4','s4','s5','s5','s6','s6'], ['s51'])));

/* ---------------- Practice Power (E7 · P1) ---------------- */
console.log('\nPractice Power');
check('the approved curve', PRACTICE_POWER, { gainPerDay: 8, decayPerDay: 5, graceDays: 1, max: 100 });

/* the whole reason this exists: nothing pays for time on the device */
checkThat('the screen-time bonus is DELETED, not zeroed',
  LUCK.minutesForTimeBonus === undefined && LUCK.timeBonusLuck === undefined
  && LUCK.timeBonusCapMinutes === undefined);
checkThat('the day-streak term no longer moves the odds either',
  LUCK.streakBonusLuck === undefined && LUCK.streakBonusMaxLuck === undefined);
check('luck is made of exactly two things', Object.keys(LUCK).sort(), ['accuracyBonusLuck', 'practicePowerLuck']);
check('a perfect run alone is worth 40', luckScore({ accuracy: 1, practicePower: 0 }), 40);
check('a full meter alone is worth 60', luckScore({ accuracy: 0.5, practicePower: 100 }), 60);
check('both together cap at 100', luckScore({ accuracy: 1, practicePower: 100 }), 100);
check('minutes played can never raise the odds again',
  luckScore({ accuracy: 0.5, practicePower: 0, minutesToday: 999, dayStreak: 99 }), 0);
check('junk input never throws or goes negative',
  [luckScore(), luckScore({ accuracy: NaN, practicePower: -50 })], [0, 0]);

/* the decay curve: gentle, graced, and recoverable */
const pw = (power, day) => ({ practicePower: power, powerDay: day });
check('practising today reads full', practicePowerNow(pw(40, '2026-08-20'), '2026-08-20'), 40);
check('the day after, still full — today is not over', practicePowerNow(pw(40, '2026-08-20'), '2026-08-21'), 40);
check('the FIRST missed day is free', practicePowerNow(pw(40, '2026-08-20'), '2026-08-22'), 40);
check('the second missed day costs 5', practicePowerNow(pw(40, '2026-08-20'), '2026-08-23'), 35);
check('a week away costs 25 of 100, not everything', practicePowerNow(pw(100, '2026-08-20'), '2026-08-27'), 75);
check('it can never go below zero', practicePowerNow(pw(10, '2026-01-01'), '2026-08-27'), 0);
check('a brand-new character reads zero and is not decayed',
  [practicePowerNow({}, '2026-08-22'), practicePowerRested({}, '2026-08-22')], [0, 0]);

check('a qualifying learn run adds 8',
  practicePowerAfterRun(pw(40, '2026-08-21'), '2026-08-22'),
  { power: 48, powerDay: '2026-08-22', gained: 8, alreadyToday: false });
check('a SECOND run the same day adds nothing — it is per day, not per run',
  practicePowerAfterRun(pw(48, '2026-08-22'), '2026-08-22'),
  { power: 48, powerDay: '2026-08-22', gained: 0, alreadyToday: true });
check('coming back after a week: decay lands first, then the gain',
  practicePowerAfterRun(pw(100, '2026-08-20'), '2026-08-27'),
  { power: 83, powerDay: '2026-08-27', gained: 8, alreadyToday: false });
check('the meter tops out at 100', practicePowerAfterRun(pw(96, '2026-08-21'), '2026-08-22').power, 100);
checkThat('13 days of practice fills it from empty',
  Math.ceil(PRACTICE_POWER.max / PRACTICE_POWER.gainPerDay) === 13);
check('the day counter is honest across a month boundary',
  [daysBetweenKeys('2026-08-30', '2026-09-02'), daysBetweenKeys('2026-08-22', '2026-08-22')], [3, 0]);

/* ---------------- equal pay for equal learning (E7 · P3) ---------------- */
console.log('\nEqual pay');
const learnGames = Object.entries(GAMES).filter(([, g]) => g.kind === 'learn');
checkThat('every learning game declares how long a full run is',
  learnGames.every(([, g]) => Number.isFinite(g.runQuestions) && g.runQuestions > 0));
check('the approved rates', [ECONOMY.xpPerRun, PILLAR_ECONOMY.bricksPerRun, ECONOMY.maxRunShare], [200, 30, 1.5]);

/* THE rule: one cleared run pays the same wherever it was earned. */
const clearedRun = (id, extra = {}) => {
  const n = GAMES[id].runQuestions;
  const a = computeAward(id, { asked: n, correct: n, seconds: 240, units: n, ...extra });
  return { xp: a.xp, bricks: computePillarAward(a, null, 'x').bricksEarned, share: a.runShare };
};
const allCleared = learnGames.map(([id]) => clearedRun(id));
check('a cleared run pays the same XP in every learning game',
  new Set(allCleared.map((r) => r.xp)).size, 1);
check('…and the same bricks', new Set(allCleared.map((r) => r.bricks)).size, 1);
check('a full run is a share of exactly 1', new Set(allCleared.map((r) => r.share)).size, 1);
check('the five-question game and the twenty-question game now pay alike',
  [clearedRun('loot-drop').xp, clearedRun('math-defender').xp],
  [clearedRun('coin-climb').xp, clearedRun('coin-climb').xp]);

/* a game may declare its own target when it knows better — Critter
   Reader does, because a level-2 story is five pages and a level-1
   story is four, and both are one whole story */
check('a 4-page story and a 5-page story pay identically',
  [computeAward('critter-catchers', { asked: 4, correct: 4, seconds: 240, units: 4, runQuestions: 4 }).xp,
   computeAward('critter-catchers', { asked: 5, correct: 5, seconds: 240, units: 5, runQuestions: 5 }).xp]
    .reduce((a, b) => a === b), true);
check('half a run pays about half', computeAward('coin-climb', { asked: 8, correct: 8, seconds: 240, units: 8 }).runShare, 8 / 15);
check('going long still pays, but not for ever',
  computeAward('math-defender', { asked: 99, correct: 99, seconds: 240, units: 99 }).runShare, ECONOMY.maxRunShare);
checkThat('fun games are untouched — still paid per unit',
  computeAward('block-stacker', { units: 20, seconds: 240 }).xp === 60
  && computeAward('block-stacker', { units: 20, seconds: 240 }).runShare === 0);
checkThat('a fun run still pays no bricks however long it is',
  computePillarAward(computeAward('block-stacker', { units: 200, seconds: 240 }), null, 'x').bricksEarned === 0);
check('a failed learning run still pays consolation XP and some bricks',
  (() => { const a = computeAward('coin-climb', { asked: 15, correct: 5, seconds: 240, units: 5 });
           return [a.cleared, a.xp >= ECONOMY.consolationXp, computePillarAward(a, null, 'x').bricksEarned > 0]; })(),
  [false, true, true]);

/* the Vault is won with the subject, not the thumbs */
console.log('\nThe Vault target');
check('a fun run keeps the narrow bar', vaultZone('fun', 1), VAULT.zoneBase);
check('a learning run widens it with accuracy',
  [vaultZone('learn', 0), vaultZone('learn', 0.5), vaultZone('learn', 1)].map((z) => Math.round(z * 100)),
  [24, 44, 64]);
checkThat('anywhere inside the green pays in full',
  vaultAccuracy(0.5, 0.6) === 1 && vaultAccuracy(0.65, 0.6) === 1);
checkThat('outside the green it falls away, never below the floor',
  vaultAccuracy(1, 0.24) === 0 && vaultPayout(vaultAccuracy(1, 0.24)) === VAULT.floorCoins);
checkThat('a perfect learner out-earns a sharp-thumbed poor learner',
  vaultPayout(vaultAccuracy(0.72, vaultZone('learn', 1.0)))
  > vaultPayout(vaultAccuracy(0.72, vaultZone('learn', 0.0))));
check('junk never throws, and the worst reading still pays the floor',
  [vaultZone('learn', NaN), vaultAccuracy(NaN, NaN), vaultPayout(vaultAccuracy(NaN, NaN))],
  [VAULT.zoneBase, 0, VAULT.floorCoins]);

/* ---------------- misc ---------------- */
console.log('\nHousekeeping');
checkThat('every game has a name, kind and multipliers',
  Object.values(GAMES).every(g => g.name && (g.kind === 'learn' || g.kind === 'fun')
    && typeof g.xpMult === 'number' && typeof g.coinMult === 'number'));
check('todayKey formats as YYYY-MM-DD', todayKey(new Date(2026, 0, 5)), '2026-01-05');

console.log(failures ? `\n${failures} FAILED\n` : '\nAll good.\n');
process.exit(failures ? 1 : 0);
