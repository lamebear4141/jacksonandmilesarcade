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
  autoSaveReport: true,      // drop a progress file in Downloads after each round —
                             // AJ's nightly report email reads that file. Turn off
                             // only if the email stops depending on it.

  // --- Rewards ---
  // A 5-question round earns less from xpPerCorrect alone than the old 15-question
  // one did, so the flat completion bonuses are bumped up to compensate — a full
  // extract should still feel like a real haul, not a third of one.
  xpPerCorrect: 10,
  xpExtractBonus: 100,
  xpPerMinutePlayed: 4,
  xpEliminatedConsolation: 25,   // you still learn something losing
  /* Coins are no longer a per-run wage (R2B · E4): extracting, sprite
     rarity and levelling up all pay XP, and Loot Drop's COIN income is
     its between-round mini-game, which is its bespoke bonus round.
     Retired: coinsPerExtract 65, coinsPerLevel 75. */
  minigameFloorCoins: 40,   // matches VAULT.floorCoins — a bespoke round
                            // must never pay less than the shared one
  bonusRoundMultiplier: 2,       // story rounds need read AND answer, so pay double

  // --- What makes a critter rarer ---
  // Spread in from the shared catalog. Since E7 this is just accuracy
  // and Practice Power: the minutes-played bonus is gone, and with it
  // the "play 3 more minutes for better loot" prompt that used to live
  // on the drop screen.
  ...LUCK,

  // --- Streak milestone gifts ---
  streakGifts: { 3:'coins:100', 5:'pet', 7:'coins:250', 14:'skin', 30:'mythic' },
  // (streak gifts still pay coins — they are a milestone bonus, not a
  //  per-run wage, and they go through grantCoins' daily cap.)
};

export const GRADES = {
  miles:   { name:'Miles',   grade:1, color:'#4fa3ff', glyph:'🦊' },
  jackson: { name:'Jackson', grade:3, color:'#b56bff', glyph:'⛏️' },
};

/* The shared catalog, re-exported so Loot Drop's own modules don't have
   to care that these live at the site level now. */
export { SPRITES, RARITY, RARITY_ORDER, SKINS, PETS, xpForLevel, levelFromXp,
         luckScore, rollRarity, spriteId } from '../../assets/catalog.js';
