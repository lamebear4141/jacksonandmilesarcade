/* =====================================================================
   LOOT DROP — config
   Every number worth tweaking lives here, in plain language.
   Original battle-royale-flavored characters (not from any real game).

   The collectibles, skins, pets, level curve and luck/rarity maths moved
   to ../../assets/catalog.js when the character became site-wide — every
   game in the arcade shares them now. They are re-exported at the bottom
   of this file, so anything in Loot Drop that imported them from here
   keeps working unchanged.
   ===================================================================== */

import { LUCK } from '../../assets/catalog.js';

export const CONFIG = {
  // --- The round ---
  questionsPerRound: 5,      // how many challenges in one drop (was 15 — shorter, snappier rounds)
  extractThreshold: 0.80,    // accuracy needed to bring your loot home
  rebootQuestions: 1,        // Reboot Van: second-chance questions if you just miss (scaled with the round: was 3 of 15)
  rebootAllowedIfWithin: 0.20, // offer the van if you're within 20 points of the line
  escapeHatchMs: 12000,      // after this long waiting on the mic, offer tap mode instead

  // --- Rewards ---
  // A 5-question round earns less from xpPerCorrect alone than the old 15-question
  // one did, so the flat completion bonuses are bumped up to compensate — a full
  // extract should still feel like a real haul, not a third of one.
  xpPerCorrect: 10,
  xpExtractBonus: 100,
  xpPerMinutePlayed: 4,
  xpEliminatedConsolation: 25,   // you still learn something losing
  coinsPerExtract: 65,
  coinsPerLevel: 75,
  bonusRoundMultiplier: 2,       // story rounds need read AND answer, so pay double

  // --- Daily habit bonuses (these raise your loot luck) ---
  // Spread in from the shared catalog under their original key names, so
  // ui.js and game.js keep reading CONFIG.streakBonusLuck & friends as
  // they always have. Change the values in catalog.js's LUCK block.
  ...LUCK,

  // --- Streak milestone gifts ---
  streakGifts: { 3:'coins:100', 5:'pet', 7:'coins:250', 14:'skin', 30:'mythic' },
};

export const GRADES = {
  miles:   { name:'Miles',   grade:1, color:'#4fa3ff', glyph:'🦊' },
  jackson: { name:'Jackson', grade:3, color:'#b56bff', glyph:'⛏️' },
};

/* The shared catalog, re-exported so Loot Drop's own modules don't have
   to care that these live at the site level now. */
export { SPRITES, RARITY, RARITY_ORDER, SKINS, PETS, xpForLevel, levelFromXp,
         luckScore, rollRarity, spriteId } from '../../assets/catalog.js';
