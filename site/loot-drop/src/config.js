/* =====================================================================
   LOOT DROP — config
   Every number worth tweaking lives here, in plain language.
   Original battle-royale-flavored characters (not from any real game).
   ===================================================================== */

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
  minutesForTimeBonus: [3, 8, 15],  // 3/8/15 minutes today -> +luck at each tier
  timeBonusLuck: [8, 18, 30],
  timeBonusCapMinutes: 20,          // deliberately capped: no reward for grinding all day
  streakBonusLuck: 4,               // per consecutive day...
  streakBonusMaxLuck: 30,           // ...up to this
  accuracyBonusLuck: 40,            // full marks adds this much luck

  // --- Streak milestone gifts ---
  streakGifts: { 3:'coins:100', 5:'pet', 7:'coins:250', 14:'skin', 30:'mythic' },
};

/* ---------------- rarity ---------------- */
export const RARITY = {
  common:    { name:'Common',    color:'#b6c2d6', glow:'#7a8699', weight:55, xp:5,  coins:3  },
  rare:      { name:'Rare',      color:'#4fa3ff', glow:'#1b6fd0', weight:27, xp:12, coins:8  },
  epic:      { name:'Epic',      color:'#b56bff', glow:'#7a2fd0', weight:12, xp:25, coins:18 },
  legendary: { name:'Legendary', color:'#ffb547', glow:'#c97a00', weight:5,  xp:50, coins:40 },
  mythic:    { name:'Mythic',    color:'#ff5f4d', glow:'#c62d1c', weight:1,  xp:120,coins:100},
};
export const RARITY_ORDER = ['common','rare','epic','legendary','mythic'];

/* ---------------- the collectible sprites (60) ----------------
   These are the things the boys collect and compare. Each has a fixed
   index — the squad code is a bitmask over this list, so NEVER reorder
   or remove entries. Only ever append to the end.                     */
export const SPRITES = [
  // --- common (24) ---
  { g:'🐺', n:'Ridgehowl',    r:'common' }, { g:'🦝', n:'Bandit Bo',    r:'common' },
  { g:'🐸', n:'Hopper Jax',   r:'common' }, { g:'🐢', n:'Tank Shell',   r:'common' },
  { g:'🐷', n:'Porkchop',     r:'common' }, { g:'🐮', n:'Moo Merc',     r:'common' },
  { g:'🐔', n:'Cluck Norris', r:'common' }, { g:'🐰', n:'Thumper',      r:'common' },
  { g:'🦔', n:'Spike Lee',    r:'common' }, { g:'🐹', n:'Pocket Rocket',r:'common' },
  { g:'🐭', n:'Squeak',       r:'common' }, { g:'🐨', n:'Snoozle',      r:'common' },
  { g:'🦥', n:'Slow Clap',    r:'common' }, { g:'🐿️', n:'Nutcase',      r:'common' },
  { g:'🦡', n:'Diggs',        r:'common' }, { g:'🐗', n:'Tusker',       r:'common' },
  { g:'🦫', n:'Chomps',       r:'common' }, { g:'🐒', n:'Banana Split', r:'common' },
  { g:'🦆', n:'Quackshot',    r:'common' }, { g:'🐧', n:'Chill Pip',    r:'common' },
  { g:'🐌', n:'Slow Mo',      r:'common' }, { g:'🦎', n:'Gecko Zap',    r:'common' },
  { g:'🐜', n:'Tiny Titan',   r:'common' }, { g:'🕷️', n:'Web Slinger',   r:'common' },
  // --- rare (16) ---
  { g:'🦊', n:'Ember Fox',    r:'rare' },   { g:'🐯', n:'Stripe Storm',  r:'rare' },
  { g:'🦁', n:'Mane Event',   r:'rare' },   { g:'🐻', n:'Grizzly Grip',  r:'rare' },
  { g:'🐼', n:'Bamboo Blast', r:'rare' },   { g:'🦅', n:'Sky Talon',     r:'rare' },
  { g:'🦉', n:'Night Watch',  r:'rare' },   { g:'🦇', n:'Echo',          r:'rare' },
  { g:'🐬', n:'Splash Dart',  r:'rare' },   { g:'🦈', n:'Chomp Zone',    r:'rare' },
  { g:'🐙', n:'Ink Ops',      r:'rare' },   { g:'🦂', n:'Sting Ray',     r:'rare' },
  { g:'🦀', n:'Pinch Perfect',r:'rare' },   { g:'🐊', n:'Snapjaw',       r:'rare' },
  { g:'🦩', n:'Pink Stilt',   r:'rare' },   { g:'🦚', n:'Fan Feather',   r:'rare' },
  // --- epic (10) ---
  { g:'🥷', n:'Shadow Step',  r:'epic' },   { g:'🤖', n:'Bolt Unit',     r:'epic' },
  { g:'👽', n:'Zeta Ray',     r:'epic' },   { g:'🧟', n:'Groan Zone',    r:'epic' },
  { g:'🧙', n:'Runecaster',   r:'epic' },   { g:'🦸', n:'Captain Cosmo', r:'epic' },
  { g:'🧛', n:'Midnight',     r:'epic' },   { g:'👻', n:'Boo Radley',    r:'epic' },
  { g:'🤠', n:'Dust Devil',   r:'epic' },   { g:'🧑‍🚀', n:'Orbit',          r:'epic' },
  // --- legendary (7) ---
  { g:'🐉', n:'Scaldrake',    r:'legendary' }, { g:'🦖', n:'Rex Prime',   r:'legendary' },
  { g:'🦄', n:'Prism Hoof',   r:'legendary' }, { g:'🔥', n:'Blaze Core',  r:'legendary' },
  { g:'⚡', n:'Volt',          r:'legendary' }, { g:'❄️', n:'Frostbyte',   r:'legendary' },
  { g:'🌪️', n:'Cyclone',       r:'legendary' },
  // --- mythic (3) ---
  { g:'👑', n:'The Champion', r:'mythic' }, { g:'🌈', n:'Spectrum',     r:'mythic' },
  { g:'💎', n:'Diamond Hand', r:'mythic' },
];

/* ---------------- skins (your own character) ---------------- */
export const SKINS = [
  { id:'rookie',  g:'🙂', n:'Rookie',       cost:0,    level:1  },
  { id:'ninja',   g:'🥷', n:'Night Ninja',  cost:150,  level:1  },
  { id:'astro',   g:'🧑‍🚀', n:'Astro',        cost:250,  level:3  },
  { id:'knight',  g:'🛡️', n:'Iron Guard',   cost:300,  level:4  },
  { id:'wizard',  g:'🧙', n:'Spellslinger', cost:400,  level:5  },
  { id:'robot',   g:'🤖', n:'Mech Pilot',   cost:500,  level:7  },
  { id:'hero',    g:'🦸', n:'Star Hero',    cost:650,  level:9  },
  { id:'alien',   g:'👽', n:'Visitor',      cost:800,  level:11 },
  { id:'pirate',  g:'🏴‍☠️', n:'Captain',      cost:900,  level:13 },
  { id:'dino',    g:'🦖', n:'Rex Suit',     cost:1200, level:15 },
  { id:'dragon',  g:'🐲', n:'Dragonborn',   cost:1600, level:18 },
  { id:'crown',   g:'👑', n:'Royalty',      cost:2200, level:22 },
  { id:'ghost',   g:'👻', n:'Phantom',      cost:1000, level:12 },
  { id:'cowboy',  g:'🤠', n:'Ranger',       cost:450,  level:6  },
];

/* ---------------- pets (tag along on screen) ---------------- */
export const PETS = [
  { id:'none',    g:'',   n:'No pet',     cost:0,   level:1  },
  { id:'pup',     g:'🐕', n:'Scout',      cost:200, level:2  },
  { id:'cat',     g:'🐈', n:'Whiskers',   cost:200, level:2  },
  { id:'drone',   g:'🛸', n:'Buzz Drone', cost:350, level:4  },
  { id:'chick',   g:'🐤', n:'Nugget',     cost:250, level:3  },
  { id:'bat',     g:'🦇', n:'Radar',      cost:400, level:6  },
  { id:'frog',    g:'🐸', n:'Ribbit',     cost:300, level:5  },
  { id:'turtle',  g:'🐢', n:'Shellby',    cost:300, level:5  },
  { id:'dragonet',g:'🐉', n:'Sparky',     cost:900, level:10 },
  { id:'phoenix', g:'🔥', n:'Ash',        cost:1100,level:14 },
  { id:'ghostpet',g:'👻', n:'Boo',        cost:700, level:8  },
  { id:'star',    g:'⭐', n:'Twinkle',    cost:600, level:7  },
];

/* ---------------- levels ----------------
   Flat-ish early so a 1st grader levels fast, steeper later. */
export function xpForLevel(level){ return 120 + (level - 1) * 90; }
export function levelFromXp(totalXp){
  let lvl = 1, need = xpForLevel(1), left = totalXp;
  while (left >= need && lvl < 60){ left -= need; lvl++; need = xpForLevel(lvl); }
  return { level: lvl, into: left, need };
}

/* ---------------- loot luck ----------------
   luck 0..100 shifts probability mass toward better rarities. */
export function luckScore({ accuracy, dayStreak, minutesToday }){
  const acc = Math.max(0, (accuracy - 0.5) / 0.5) * CONFIG.accuracyBonusLuck;
  const streak = Math.min(dayStreak * CONFIG.streakBonusLuck, CONFIG.streakBonusMaxLuck);
  let time = 0;
  const capped = Math.min(minutesToday, CONFIG.timeBonusCapMinutes);
  CONFIG.minutesForTimeBonus.forEach((m, i) => { if (capped >= m) time = CONFIG.timeBonusLuck[i]; });
  return Math.max(0, Math.min(100, acc + streak + time));
}

export function rollRarity(luck, rand){
  const r = rand || Math.random;
  // luck moves weight from common toward the top tiers
  const t = luck / 100;
  const w = {
    common:    RARITY.common.weight    * (1 - 0.75 * t),
    rare:      RARITY.rare.weight      * (1 + 0.30 * t),
    epic:      RARITY.epic.weight      * (1 + 1.40 * t),
    legendary: RARITY.legendary.weight * (1 + 3.00 * t),
    mythic:    RARITY.mythic.weight    * (1 + 5.00 * t),
  };
  const total = RARITY_ORDER.reduce((s, k) => s + w[k], 0);
  let x = r() * total;
  for (const k of RARITY_ORDER){ x -= w[k]; if (x <= 0) return k; }
  return 'common';
}

export const GRADES = {
  miles:   { name:'Miles',   grade:1, color:'#4fa3ff', glyph:'🦊' },
  jackson: { name:'Jackson', grade:3, color:'#b56bff', glyph:'⛏️' },
};
