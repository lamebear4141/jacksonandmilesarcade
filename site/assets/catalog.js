/* =====================================================================
   ARCADE CATALOG — the single source of truth for the shared character.

   Everything a character can own, earn, or be measured by lives here:
   the 60 collectible sprites, rarities, skins, pets, the level curve,
   and the reward economy. Every game reads from this file; no game
   defines its own progression numbers any more.

   Loot Drop's config.js re-exports from here, so Loot Drop keeps working
   unchanged — its own file now holds only Loot-Drop-specific mechanics.
   ===================================================================== */

/* ---------------- loot luck tunables ----------------
   These belong to Loot Drop's luck mechanic but live here because
   luckScore() does. Loot Drop's CONFIG spreads them back in under the
   same key names, so its UI code reads them exactly as it always has. */
export const LUCK = {
  minutesForTimeBonus: [3, 8, 15],  // 3/8/15 minutes today -> +luck at each tier
  timeBonusLuck: [8, 18, 30],
  timeBonusCapMinutes: 20,          // deliberately capped: no reward for grinding all day
  streakBonusLuck: 4,               // per consecutive day...
  streakBonusMaxLuck: 30,           // ...up to this
  accuracyBonusLuck: 40,            // full marks adds this much luck
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
  const acc = Math.max(0, (accuracy - 0.5) / 0.5) * LUCK.accuracyBonusLuck;
  const streak = Math.min(dayStreak * LUCK.streakBonusLuck, LUCK.streakBonusMaxLuck);
  let time = 0;
  const capped = Math.min(minutesToday, LUCK.timeBonusCapMinutes);
  LUCK.minutesForTimeBonus.forEach((m, i) => { if (capped >= m) time = LUCK.timeBonusLuck[i]; });
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

/* ---------------- stable sprite ids ----------------
   SPRITES stays position-indexed forever (the squad code is a bitmask
   over the array, so the order can never change). But the character's
   inventory is a Firestore MAP, which needs string keys — so each sprite
   also has an id derived from its index: s0, s1 ... s59. Index and id are
   two views of the same thing; the squad code keeps using the index. */
export function spriteId(i){ return 's' + i; }
export function spriteIndex(id){
  // The 's' prefix is part of the id and has to be checked. Slicing the
  // first character off blindly used to accept '-1' or 'x5' as sprite 1,
  // which let a malformed id write a junk key into character.counts.
  const m = /^s([0-9]+)$/.exec(String(id));
  if (!m) return -1;
  const n = Number(m[1]);
  return n >= 0 && n < SPRITES.length ? n : -1;
}
export function spriteById(id){
  const i = spriteIndex(id);
  return i < 0 ? null : SPRITES[i];
}
/** All 60 ids in index order — handy for rendering the collection grid. */
export const SPRITE_IDS = SPRITES.map((_, i) => spriteId(i));

/* =====================================================================
   THE ECONOMY
   Every tunable reward number in the arcade, in plain language. Retune
   the game's whole feel from this block without reading any real code.
   ===================================================================== */
export const ECONOMY = {
  xpPerUnit:      10,   // a "unit" is one correct answer, or one fun-game milestone
  coinsPerUnit:    3,
  clearBonusXp:   100,  // learning games only, at >= 80% accuracy
  clearBonusCoins: 65,
  consolationXp:   25,  // learning games only, below 80% — you still learned something
  xpPerMinute:      4,  // capped by minutesCap
  minutesCap:      20,  // no reward for grinding all afternoon
  funDailyCoinCap: 80,  // per child per day, across all fun games combined
  funDailyXpCap:  250,
};

/* Accuracy needed to count a learning run as "cleared". */
export const CLEAR_ACCURACY = 0.80;

/* Every game in the arcade. `kind` decides which reward rules apply:
   'learn' games pay roughly 4x what 'fun' games pay — that ratio is the
   whole point of the design. Always describe it to a kid as a BONUS on
   practice games, never as a penalty on the fun ones.

   The display fields feed the PLAY tab on Character Home:
     section   which shelf the tile sits on (practice / fun / bigkid)
     grades    who the game is pitched at — shown as a badge, because
               cousins and classmates get this link and have no idea
               which tile is meant for them
     feature   the big full-width tile with a blurb
     needsMouse the game requires Pointer Lock, which no mobile browser
               supports — the tile checks canPointerLock() before linking */
export const GAMES = {
  'loot-drop':            { name:'Loot Drop',            kind:'learn', xpMult:1.0,  coinMult:1.0,
                            emoji:'\u{1FA82}', grades:'GRADES 1–5', section:'practice',
                            href:'loot-drop/index.html', feature:true,
                            blurb:'Read and solve to loot chests — but you need 80% to get home with them. Level up, win sprites, then trade with your brother.' },
  'math-defender':        { name:'Math Defender',        kind:'learn', xpMult:1.0,  coinMult:1.0,
                            emoji:'⛏️', grades:'GRADES 3–5', section:'practice',
                            href:'math-defender/index.html', tileClass:'ac-tile--math' },
  'coin-climb':           { name:'Coin Climb',           kind:'learn', xpMult:1.0,  coinMult:1.0,
                            emoji:'\u{1FA99}', grades:'GRADES 1–2', section:'practice',
                            href:'coin-climb/index.html', tileClass:'ac-tile--math' },
  'math-baseball':        { name:'Math Baseball',        kind:'learn', xpMult:1.0,  coinMult:1.0,
                            emoji:'⚾', grades:'ALL GRADES', section:'practice',
                            href:'math-baseball/index.html', tileClass:'ac-tile--math' },
  'critter-catchers':     { name:'Critter Catchers',     kind:'learn', xpMult:1.0,  coinMult:1.0,
                            emoji:'\u{1F4D6}', grades:'GRADES 1–3', section:'practice',
                            href:'critter-catchers/index.html', tileClass:'ac-tile--reading' },
  'multiverse-collector': { name:'Raining Cats and Dogs',  kind:'fun',   xpMult:0.30, coinMult:0.25,
                            emoji:'\u{1F436}', grades:'ANY AGE', section:'fun',
                            /* the folder (and the game id) keep the old name:
                               they key the leaderboard and every saved stat */
                            href:'multiverse-collector/index.html' },
  'block-stacker':        { name:'Block Stacker',        kind:'fun',   xpMult:0.30, coinMult:0.25,
                            emoji:'\u{1F9F1}', grades:'ANY AGE', section:'fun',
                            href:'block-stacker/index.html' },
  'harvest-night':        { name:'Harvest Night',        kind:'fun',   xpMult:0.30, coinMult:0.25,
                            emoji:'\u{1F47B}', grades:'GRADES 4+ · SPOOKY', section:'bigkid',
                            href:'harvest-night/index.html', needsMouse:true },
};

/** Today as 'YYYY-MM-DD' in the player's own timezone (not UTC — a kid
    playing at 8pm should not have it count as tomorrow). */
export function todayKey(d){
  const t = d || new Date();
  return t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0');
}

/* =====================================================================
   THE AWARD FORMULA — one function, used by every game.

     units   = correct answers (learning) OR milestones (fun)
     minutes = min(seconds / 60, minutesCap)
     xp      = units * xpPerUnit  * xpMult
             + learning ? (cleared ? clearBonusXp : consolationXp) : 0
             + learning ? minutes * xpPerMinute : 0
     coins   = units * coinsPerUnit * coinMult
             + (learning && cleared ? clearBonusCoins : 0)

   There is deliberately NO zero-reward outcome: a failed learning run
   still pays consolationXp. Fun-game totals are clamped per day by
   clampFunAward() below, which needs the character's running daily total.
   ===================================================================== */
export function computeAward(gameId, result){
  const game = GAMES[gameId];
  if (!game) throw new Error('Unknown game id: ' + gameId);
  const r = result || {};
  const asked   = Math.max(0, Number(r.asked)   || 0);
  const correct = Math.max(0, Number(r.correct) || 0);
  const seconds = Math.max(0, Number(r.seconds) || 0);
  // Learning games count correct answers; fun games pass their own
  // milestone count (blocks / 10, creatures caught, keys found...).
  const units    = Math.max(0, Number(r.units ?? correct) || 0);
  const accuracy = asked > 0 ? correct / asked : 0;
  const minutes  = Math.min(seconds / 60, ECONOMY.minutesCap);
  const learn    = game.kind === 'learn';
  const cleared  = learn && accuracy >= CLEAR_ACCURACY;

  let xp    = Math.round(units * ECONOMY.xpPerUnit    * game.xpMult);
  let coins = Math.round(units * ECONOMY.coinsPerUnit * game.coinMult);
  if (learn){
    xp += cleared ? ECONOMY.clearBonusXp : ECONOMY.consolationXp;
    xp += Math.round(minutes * ECONOMY.xpPerMinute);
    if (cleared) coins += ECONOMY.clearBonusCoins;
  }
  return { xp, coins, kind: game.kind, units, accuracy, minutes, cleared, asked, correct, seconds };
}

/** Clamp a fun-game award to what's left of today's fun budget.
    `daily` is the character's { date, xp, coins }; pass the award through
    unchanged for learning games. Returns the granted amounts plus the
    updated daily tally to store. */
export function clampFunAward(award, daily, dayStr){
  const date = dayStr || todayKey();
  const fresh = (daily && daily.date === date) ? daily : { date, xp:0, coins:0 };
  if (award.kind !== 'fun'){
    return { xp: award.xp, coins: award.coins, daily: fresh, cappedXp:false, cappedCoins:false };
  }
  const xpRoom    = Math.max(0, ECONOMY.funDailyXpCap   - (fresh.xp    || 0));
  const coinsRoom = Math.max(0, ECONOMY.funDailyCoinCap - (fresh.coins || 0));
  const xp    = Math.min(award.xp,    xpRoom);
  const coins = Math.min(award.coins, coinsRoom);
  return {
    xp, coins,
    daily: { date, xp: (fresh.xp || 0) + xp, coins: (fresh.coins || 0) + coins },
    cappedXp:    xp    < award.xp,
    cappedCoins: coins < award.coins,
  };
}

/* ---------------- collection scoring ----------------
   One "how good is this collection" number, so the boys can settle it.
   Takes the counts MAP ({ s0:2, s7:1 }); Loot Drop's array form is
   converted at the boundary. */
export const COLLECTION_POINTS = { common:1, rare:3, epic:8, legendary:20, mythic:60 };
export function collectionScoreFromCounts(counts){
  let s = 0;
  for (const [id, n] of Object.entries(counts || {})){
    const sprite = spriteById(id);
    if (sprite && n > 0) s += n * COLLECTION_POINTS[sprite.r];
  }
  return s;
}
