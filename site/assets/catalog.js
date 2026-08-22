/* =====================================================================
   ARCADE CATALOG — the single source of truth for the shared character.

   Everything a character can own, earn, or be measured by lives here:
   the collectible sprites (80 live, in 8 collections), rarities, skins,
   pets, the level curve,
   and the reward economy. Every game reads from this file; no game
   defines its own progression numbers any more.

   Loot Drop's config.js re-exports from here, so Loot Drop keeps working
   unchanged — its own file now holds only Loot-Drop-specific mechanics.
   ===================================================================== */

/* ---------------- what makes a critter rarer ----------------
   Two things, and deliberately only two: how well this run went, and how
   consistently the child has been practising (PRACTICE_POWER below).

   REMOVED in E7, on purpose: minutesForTimeBonus / timeBonusLuck /
   timeBonusCapMinutes, which paid up to 30 of these 100 points for
   "minutes on the tablet today". That is a screen-time incentive
   wearing a costume, and it is the opposite of what this project is
   for. They are deleted rather than set to zero so nothing can quietly
   start paying for time on the device again.

   Also removed: the day-streak term. The streak survives as a fun stat
   a kid can see, but the thing that actually moves the odds is now
   Practice Power, which decays gently instead of falling off a cliff. */
export const LUCK = {
  accuracyBonusLuck:    40,   // a perfect run adds this much
  practicePowerLuck:    60,   // a full Practice Power meter adds this much
};

/* =====================================================================
   PRACTICE POWER — the meter that rewards showing up.

   Not luck. It is the skill and the commitment the child is building,
   and every kid-facing string says so (AJ, Aug 2026: "it really is skill
   they are developing, better skill better rewards; train kids to commit
   to what they want to achieve").

   It rises on any day the child completes a qualifying LEARN run — once
   per day, not once per run, and never for minutes played. It falls
   gently when they stop, after one free day, so a week away is a
   setback and not a loss.

   The line that keeps this from being an anxious streak mechanic:
   PROGRESS RATCHETS, FORM DECAYS. XP, levels, critters, badges and coins
   can never go down. Only this can.
   ===================================================================== */
export const PRACTICE_POWER = {
  gainPerDay:   8,    // a day with at least one qualifying learn run
  decayPerDay:  5,    // per missed day, AFTER the grace day
  graceDays:    1,    // the first missed day costs nothing, and says nothing
  max:        100,
};

/** Whole calendar days from one 'YYYY-MM-DD' key to another. */
export function daysBetweenKeys(from, to){
  if (!from || !to) return 0;
  const a = new Date(from + 'T12:00:00'), b = new Date(to + 'T12:00:00');
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

/**
 * What the meter reads TODAY, decay included — so it is honest on a
 * screen a child is only looking at, not just after they play.
 * The character needs { practicePower, powerDay }.
 */
export function practicePowerNow(character, dayStr){
  const today = dayStr || todayKey();
  const stored = Math.max(0, Math.min(PRACTICE_POWER.max, Number(character?.practicePower) || 0));
  if (!character?.powerDay) return stored;
  const gap    = daysBetweenKeys(character.powerDay, today);  // 0 = practised today
  const missed = Math.max(0, gap - 1);                        // today isn't over yet
  const charged = Math.max(0, missed - PRACTICE_POWER.graceDays);
  return Math.max(0, stored - charged * PRACTICE_POWER.decayPerDay);
}

/** How many days of decay are showing right now — for the one gentle
    "your Practice Power rested" line on the Clubhouse. */
export function practicePowerRested(character, dayStr){
  const today = dayStr || todayKey();
  if (!character?.powerDay) return 0;
  const missed = Math.max(0, daysBetweenKeys(character.powerDay, today) - 1);
  return Math.max(0, missed - PRACTICE_POWER.graceDays);
}

/**
 * The meter after a qualifying learn run. Once per calendar day: a
 * second run today is just as welcome, it simply doesn't stack.
 * Returns what to store plus what the end screen should celebrate.
 */
export function practicePowerAfterRun(character, dayStr){
  const today = dayStr || todayKey();
  const before = practicePowerNow(character, today);
  if (character?.powerDay === today) {
    return { power: before, powerDay: today, gained: 0, alreadyToday: true };
  }
  const power = Math.min(PRACTICE_POWER.max, before + PRACTICE_POWER.gainPerDay);
  return { power, powerDay: today, gained: power - before, alreadyToday: false };
}

/* ---------------- rarity ---------------- */
export const RARITY = {
  common:    { name:'Common',    color:'#b6c2d6', glow:'#7a8699', weight:55, xp:5,  coins:3  },
  rare:      { name:'Rare',      color:'#4fa3ff', glow:'#1b6fd0', weight:27, xp:12, coins:8  },
  epic:      { name:'Epic',      color:'#b56bff', glow:'#7a2fd0', weight:12, xp:25, coins:18 },
  legendary: { name:'Legendary', color:'#ffb547', glow:'#c97a00', weight:5,  xp:50, coins:40 },
  mythic:    { name:'Mythic',    color:'#ff5f4d', glow:'#c62d1c', weight:1,  xp:120,coins:100},
};
export const RARITY_ORDER = ['common','rare','epic','legendary','mythic'];

/* ---------------- the collectible sprites ----------------
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

  /* ---- appended Aug 22, 2026 (R2B · E1) — APPEND ONLY, never reorder ----
     The 12 bedtime critters from Critter Catchers come first (s60–s71),
     in that game's own order so its migration map is one line per
     critter. Only Twinkle sits in a collection; the other eleven are
     kept for a future collection and never appear in the game until
     one claims them (see LIVE_SPRITE_IDS below). */
  { g:'🦊', n:'Pip the Fox',             r:'common' },     // s60
  { g:'🐭', n:'Mo the Mouse',            r:'common' },     // s61
  { g:'🐰', n:'Wren the Bunny',          r:'common' },     // s62
  { g:'🦔', n:'Sprout the Hedgehog',     r:'common' },     // s63
  { g:'🦉', n:'Luna the Owl',            r:'rare' },       // s64
  { g:'🐻', n:'Bram the Bear',           r:'rare' },       // s65
  { g:'🐸', n:'Puddle the Frog',         r:'rare' },       // s66
  { g:'🐲', n:'Ziggy the Dragon',        r:'epic' },       // s67
  { g:'🦄', n:'Nova the Unicorn',        r:'epic' },       // s68
  { g:'🐺', n:'Willow the Dream Wolf',   r:'legendary' },  // s69
  { g:'🐶', n:'Sir Biscuit the Pup',     r:'legendary' },  // s70
  { g:'🌟', n:'Twinkle the Star Sprite', r:'mythic' },     // s71 · Space Invasion's legendary

  // 🦖 Dinosaurs (real names by AJ's call — only 🦖/🦕 exist as emoji,
  // so the others wear a look-alike glyph and the name carries them)
  { g:'🥚', n:'Nest Egg',      r:'common' },     // s72
  { g:'🦴', n:'Rattlebones',   r:'common' },     // s73
  { g:'🐾', n:'Trackway',      r:'common' },     // s74
  { g:'🪶', n:'First Feather', r:'common' },     // s75
  { g:'🐢', n:'Ankylosaurus',  r:'common' },     // s76
  { g:'🦕', n:'Longneck Lou',  r:'rare' },       // s77
  { g:'🦏', n:'Triceratops',   r:'rare' },       // s78
  { g:'🦎', n:'Velociraptor',  r:'rare' },       // s79
  { g:'🐊', n:'Spinosaurus',   r:'epic' },       // s80
  // 🚜 Farm Animals
  { g:'🐴', n:'Clover',        r:'common' },     // s81
  { g:'🐑', n:'Woolbert',      r:'rare' },       // s82
  { g:'🐐', n:'Ramjam',        r:'rare' },       // s83
  { g:'🐈', n:'Mouser',        r:'rare' },       // s84
  { g:'🦃', n:'Strut King',    r:'epic' },       // s85
  { g:'🦙', n:'Llamarama',     r:'legendary' },  // s86
  // 🐞 Bugs (no mantis or dragonfly emoji exist: 🦗 and 🦟 stand in)
  { g:'🐝', n:'Buzz Cut',      r:'common' },     // s87
  { g:'🐛', n:'Inchy',         r:'common' },     // s88
  { g:'🐞', n:'Dot Matrix',    r:'rare' },       // s89
  { g:'🦋', n:'Flutter Byte',  r:'rare' },       // s90
  { g:'🦟', n:'Sky Skimmer',   r:'epic' },       // s91
  { g:'🦗', n:'Mantis Monk',   r:'legendary' },  // s92
  // 🌊 Sea Creatures
  { g:'🐟', n:'Finn',          r:'common' },     // s93
  { g:'🦐', n:'Pop Shrimp',    r:'common' },     // s94
  { g:'🐡', n:'Puffball',      r:'common' },     // s95
  { g:'🦑', n:'Deep Ink',      r:'epic' },       // s96
  { g:'🐋', n:'Tidal King',    r:'legendary' },  // s97
  // 🦄 Fantasy (AJ's ten, Aug 22)
  { g:'🦄', n:'Shimmer-Horn',     r:'common' },     // s98
  { g:'🗿', n:'Pebble-Gargoyle',  r:'common' },     // s99
  { g:'🧚', n:'Whisper-Sprite',   r:'common' },     // s100
  { g:'🦅', n:'Cinder-Griffin',   r:'common' },     // s101
  { g:'🐴', n:'Frost-Pegasus',    r:'common' },     // s102
  { g:'🔮', n:'Crystal-Golem',    r:'rare' },       // s103
  { g:'🐉', n:'Cloud-Wyrm',       r:'rare' },       // s104
  { g:'🔥', n:'Nova-Phoenix',     r:'rare' },       // s105
  { g:'🐋', n:'Aurora-Leviathan', r:'epic' },       // s106
  { g:'🐲', n:'Chrono-Dragon',    r:'legendary' },  // s107
  // 🛸 Space Invasion
  { g:'🛸', n:'Hover Bob',     r:'common' },     // s108
  { g:'🪐', n:'Hoops',         r:'common' },     // s109
  { g:'☄️', n:'Skyscratch',    r:'common' },     // s110
  { g:'🌙', n:'Moonbeam',      r:'common' },     // s111
  { g:'🛰️', n:'Blip',          r:'common' },     // s112
  { g:'👾', n:'Pixel Pest',    r:'rare' },       // s113
  { g:'🚀', n:'Blastoff',      r:'rare' },       // s114
  { g:'🌌', n:'Nebula',        r:'rare' },       // s115
  // 🌴 Jungle
  { g:'🦜', n:'Skwak',         r:'common' },     // s116
  { g:'🐍', n:'Noodle',        r:'rare' },       // s117
  { g:'🦍', n:'Thunder Chest', r:'epic' },       // s118
  // 🦁 Safari
  { g:'🦓', n:'Zig Zag',       r:'common' },     // s119
  { g:'🦛', n:'Mud Bud',       r:'common' },     // s120
  { g:'🐪', n:'Humphrey',      r:'common' },     // s121
  { g:'🦏', n:'Iron Horn',     r:'common' },     // s122
  { g:'🦒', n:'Tall Tale',     r:'rare' },       // s123
  { g:'🐆', n:'Spot Rush',     r:'epic' },       // s124
  { g:'🐘', n:'Trunk Titan',   r:'legendary' },  // s125
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

/* ---------------- how good the odds are right now ----------------
   0..100, shifting probability mass toward the better rarities. Exactly
   two inputs: how this run went, and how consistently the child has been
   practising. Nothing here rewards time on the device. */
export function luckScore({ accuracy = 0, practicePower = 0 } = {}){
  const acc = Math.max(0, ((Number(accuracy) || 0) - 0.5) / 0.5) * LUCK.accuracyBonusLuck;
  const power = Math.max(0, Math.min(PRACTICE_POWER.max, Number(practicePower) || 0))
              / PRACTICE_POWER.max * LUCK.practicePowerLuck;
  return Math.max(0, Math.min(100, acc + power));
}

/* Practice Power TILTS the odds; it does not invert them.

   The old multipliers quadrupled legendary at full power, which left a
   strong player on 13% commons — and since a collection needs FIVE
   specific commons and only one crown, playing well actually made
   finishing a set slower. Measured in E6: a specific common was ten
   times harder to obtain than a specific legendary.

   Retuned so a full meter roughly DOUBLES legendary (6% → 12%) while
   commons stay the bulk of what arrives:

       at full power:  common 40% · rare 32% · epic 16% · legendary 12%
       at zero power:  common 55% · rare 27% · epic 12% · legendary  6%   */
export function rollRarity(luck, rand){
  const r = rand || Math.random;
  const t = luck / 100;
  const w = {
    common:    RARITY.common.weight    * (1 - 0.27 * t),
    rare:      RARITY.rare.weight      * (1 + 0.19 * t),
    epic:      RARITY.epic.weight      * (1 + 0.33 * t),
    legendary: RARITY.legendary.weight * (1 + 1.00 * t),
    mythic:    RARITY.mythic.weight    * (1 + 1.00 * t),
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
/** Every id in index order (s0..s125). Includes the unaffiliated sprites
    that never show in the game — use LIVE_SPRITE_IDS for anything a kid
    sees. This full list is what the squad code and migrations index. */
export const SPRITE_IDS = SPRITES.map((_, i) => spriteId(i));

/* =====================================================================
   COLLECTIONS — eight themed sets of ten (R2B · E1, Aug 22 2026)

   SPRITES above is index-locked, so the restructure works by MEMBERSHIP:
   a collection is a list of sprite ids. Each holds exactly ten members in
   the shape 5 common / 3 rare / 1 epic / 1 legendary. Sprites that belong
   to no collection stay in SPRITES (a kid's counts for them are never
   touched) but are hidden from every surface in the game until a future
   collection claims them — see LIVE_SPRITE_IDS and inCollection().

   Mythic folds into legendary: a display-and-roll change only. Stored
   rarity values are never edited; use displayRarity() wherever a kid can
   see a rarity, and DISPLAY_RARITY_ORDER for legends and tallies.
   ===================================================================== */

/* ---------------- level gates the wild ----------------
   The rarity band a kid can FIND. A sprite above the band is hidden (an
   empty slot); at or below it, uncaught sprites show as silhouettes.
   Trading bypasses this on purpose — a received legendary renders in
   full colour at any level. (Also the clamp table for E2's drop rolls.) */
export const RARITY_UNLOCK = { common: 1, rare: 3, epic: 7, legendary: 11 };

/** What a kid sees: mythic reads, rolls and rings as legendary. */
export function displayRarity(r){ return r === 'mythic' ? 'legendary' : r; }
export const DISPLAY_RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

/* ---------------- lore cards ----------------
   Every live sprite's "who & what" card, copied word for word from
   claude/critter-lore-spec.md. Kept as a map keyed by sprite id rather
   than inline in SPRITES so the index-locked array stays short and the
   existing entries above are never edited in place; attachLore() below
   hangs each card on its sprite as `sprite.lore` at load.

   Shape: { real, tag, size, speed, weight, likes:[2], story,
            fact | legend | log, title? }   (pips are 1–6)
   Footer key: `fact` → ★ DID YOU KNOW · `legend` → 📜 THE LEGEND SAYS ·
   `log` → 📡 MISSION LOG. Epic and legendary cards carry `title`. */
export const SPRITE_LORE = {
  /* ---- 🦖 Dinosaurs ---- */
  s72: { real: "Dinosaur egg (Maiasaura)", tag: "Something's tapping in there…", size: 2, speed: 1, weight: 2,
    likes: ["☀️ warm sand", "🎵 humming"],
    story: "Nest Egg isn't hatched yet, and nobody knows what's inside. If you hold it up to your ear you can hear a tiny *tap tap tap*. It wiggles when you sing.",
    fact: "Some dino moms built nests as wide as a trampoline and kept eggs warm with rotting plants." },
  s73: { real: "Fossil skeleton (Coelophysis)", tag: "Clatters when he giggles", size: 3, speed: 4, weight: 1,
    likes: ["🌙 moonlight", "🪘 drumming"],
    story: "Rattlebones is a little dino who is all bones and all fun. He can take his own leg off and use it as a drumstick. He rattles like maracas when he runs.",
    fact: "Fossils aren't actually bones anymore — over millions of years the bone turns into stone." },
  s74: { real: "Fossil footprints (Theropod)", tag: "You can't see him, only where he's been", size: 3, speed: 5, weight: 1,
    likes: ["🏖️ wet mud", "🙈 hide-and-seek"],
    story: "Trackway is the shyest dinosaur ever. Nobody has ever seen him, but his footprints show up everywhere — even on the ceiling. Follow the prints and you might catch a glimpse of a tail.",
    fact: "Scientists can tell how fast a dinosaur was running just from how far apart its footprints are." },
  s75: { real: "Archaeopteryx", tag: "Half dino, half bird, all brave", size: 2, speed: 4, weight: 1,
    likes: ["🌬️ windy days", "🪨 high rocks"],
    story: "First Feather was the first dinosaur to try jumping off a cliff and flapping. She didn't quite fly… but she didn't quite fall either. She's still practicing, and she's getting better every day.",
    fact: "Birds ARE dinosaurs! Every pigeon and chicken is a living dino cousin." },
  s76: { real: "Ankylosaurus", tag: "A tank with a tail-hammer", size: 5, speed: 1, weight: 6,
    likes: ["🌿 ferns", "😴 naps in the sun"],
    story: "Nothing bothers Ankylosaurus. Not rain, not roars, not even a T-rex — his back is covered in armor plates and his tail ends in a bone club. He mostly uses it to knock fruit out of trees.",
    fact: "Even its eyelids had armor." },
  s77: { real: "Brachiosaurus", tag: "Tallest neck in the whole valley", size: 6, speed: 2, weight: 6,
    likes: ["🌳 treetop leaves", "🌅 sunrise"],
    story: "Lou eats breakfast from the tops of trees and can see tomorrow's weather coming. When he sneezes, leaves rain down for a whole minute. Smaller critters ride on his head to get a view.",
    fact: "A real brachiosaurus was as tall as a 4-story building." },
  s78: { real: "Triceratops", tag: "Three horns, zero fear", size: 5, speed: 3, weight: 6,
    likes: ["🛡️ protecting friends", "🥬 tough plants"],
    story: "Triceratops is the bodyguard of the valley. When trouble comes, she lowers her giant frill and the ground shakes. Her favorite thing is scratching her horns on a big rock until it squeaks.",
    fact: "Its head was one-third of its whole body length." },
  s79: { real: "Velociraptor", tag: "Small, fast, and very, very sneaky", size: 3, speed: 6, weight: 2,
    likes: ["🧩 puzzles", "🚪 doors that open"],
    story: "Velociraptor is the smartest hunter around, and he knows it. He can open latches, solve riddles, and he once stole every sandwich from a picnic without anyone noticing. He's covered in feathers and clicks his big toe claw when he's thinking.",
    fact: "Real velociraptors were about the size of a turkey — and had feathers!" },
  s80: { real: "Spinosaurus", title: "The River Dragon", tag: "Bigger than T-rex. Swims like a shark.", size: 6, speed: 4, weight: 6,
    likes: ["🐟 giant fish", "🌊 deep rivers"],
    story: "Spinosaurus is the biggest meat-eating dinosaur that ever lived — and the only one that loved to swim. The tall sail on his back cuts through the water like a shark fin. Once, a whole herd came to the river to drink and saw the sail rising up out of the dark water. Nobody drank from that river for a week.",
    fact: "Spinosaurus was longer than a school bus and had a paddle tail like a crocodile." },
  s51: { real: "Tyrannosaurus rex", title: "King of the Thunder Lizards", tag: "When he roars, the clouds move", size: 6, speed: 4, weight: 6,
    likes: ["🌩️ thunderstorms", "👑 being first"],
    story: "Every dinosaur knows the rule: when Rex Prime walks, you step aside. His teeth are as long as bananas and his roar can be heard three valleys away. But here's the secret only his friends know — he can't reach to scratch his own nose, and he loves it when someone helps.",
    legend: "Rex Prime was the last dino awake when the great fire fell from the sky, and he roared at it so loudly that one piece of the sky got scared and turned into the moon." },

  /* ---- 🚜 Farm ---- */
  s4: { real: "Pig", tag: "Happiest when muddiest", size: 3, speed: 3, weight: 4,
    likes: ["🟤 mud puddles", "🍎 apple cores"],
    story: "Porkchop believes every puddle is a swimming pool. He's really smart — he learned to open the gate, but he always closes it behind him because he's polite. He snorts when he laughs.",
    fact: "Pigs are smarter than dogs and can learn their own names." },
  s5: { real: "Dairy cow", tag: "Chews slow, thinks deep", size: 4, speed: 2, weight: 5,
    likes: ["🌾 tall grass", "🌄 sunsets"],
    story: "Moo Merc is the calmest critter on the farm. She chews one mouthful of grass for a whole minute while she thinks about clouds. If you tell her a secret, she keeps it forever.",
    fact: "Cows have best friends and get stressed when they're apart." },
  s6: { real: "Rooster", tag: "Wakes up the sun every morning", size: 2, speed: 4, weight: 2,
    likes: ["🌅 dawn", "🥇 being loudest"],
    story: "Cluck Norris is sure the sun only rises because he tells it to. Every morning he climbs the fence post, puffs up his chest, and lets out a COCK-A-DOODLE-DOO that rattles the windows. He's also a surprisingly good dancer.",
    fact: "Chickens can remember over 100 different faces." },
  s7: { real: "Rabbit", tag: "Three hops and gone", size: 2, speed: 5, weight: 1,
    likes: ["🥕 carrot tops", "🕳️ cozy burrows"],
    story: "Thumper thumps her back foot when she's excited, which is always. She can hop higher than the fence and zigzag faster than a fox can follow. Her ears hear you coming from a whole field away.",
    fact: "Rabbits can see almost all the way behind themselves without turning their heads." },
  s81: { real: "Farm horse", tag: "Strong enough to pull the barn", size: 4, speed: 4, weight: 5,
    likes: ["🍬 sugar cubes", "🏃 running in the rain"],
    story: "Clover is big and gentle and loves to work. She pulls the hay wagon, the plow, and once, a stuck tractor. She nickers softly when you scratch right between her ears.",
    fact: "Horses can sleep standing up." },
  s82: { real: "Sheep", tag: "Softest cloud on four legs", size: 3, speed: 2, weight: 3,
    likes: ["🧶 being fluffy", "⛰️ hilltops"],
    story: "Woolbert's wool grows so thick that birds nest in it in the spring. He's the farm's weather expert — when Woolbert lies down, rain is coming. Every summer he gets a haircut and feels silly for a week.",
    fact: "One sheep can grow enough wool in a year to make five sweaters." },
  s83: { real: "Goat", tag: "Climbs anything. Eats everything.", size: 3, speed: 4, weight: 3,
    likes: ["🧗 roofs", "📦 cardboard"],
    story: "Ramjam has been found on top of the barn, the tractor, and once the farmer's car. If it's standing still, he'll climb it. He head-butts the gate every morning just to say hello.",
    fact: "Goats have rectangle-shaped pupils so they can see almost all around them." },
  s84: { real: "Barn cat", tag: "Night guard of the hayloft", size: 2, speed: 5, weight: 2,
    likes: ["🌙 midnight patrols", "☀️ sunny windowsills"],
    story: "Mouser works the night shift. While everyone sleeps she patrols the barn, silent as a shadow, and no mouse ever gets the grain. By day she sleeps in a sunbeam and pretends she doesn't know you.",
    fact: "Cats can jump six times their own height." },
  s85: { real: "Wild turkey", title: "Lord of the Coop", tag: "All feathers, all fanned, all the time", size: 3, speed: 3, weight: 3,
    likes: ["🪞 his reflection", "🥁 parades"],
    story: "Strut King doesn't walk — he *parades*. Every feather fans out, his chest puffs up, and he gobbles so loud the chickens scatter. Once a fox came into the yard and Strut King marched straight at it, feathers blazing, until the fox decided the chicken coop wasn't worth it. He's been in charge ever since.",
    fact: "Wild turkeys can fly 55 miles per hour in short bursts." },
  s86: { real: "Llama", title: "The Spitting Sage of the Hill", tag: "Sees all. Spits at some.", size: 4, speed: 3, weight: 4,
    likes: ["🏔️ high places", "🧘 staring calmly"],
    story: "Llamarama stands on the tallest hill and watches the whole farm with an expression that says she knows something you don't. Every animal comes to her for advice. She hums when she's happy and spits when she's not — and her aim is perfect.",
    legend: "Long ago the farm had no hill. Llamarama wanted a better view, so she stood in one spot for a hundred years until the ground grew up underneath her." },

  /* ---- 🐞 Bugs ---- */
  s22: { real: "Leafcutter ant", tag: "Lifts 50 times her weight", size: 1, speed: 3, weight: 1,
    likes: ["🍃 leaf pieces", "👯 teamwork"],
    story: "Tiny Titan is the strongest critter in the arcade for her size. She carries leaf slices bigger than herself in a line with a thousand sisters. She never, ever gives up on a heavy load.",
    fact: "Ants don't have lungs — they breathe through tiny holes in their sides." },
  s23: { real: "Orb-weaver spider", tag: "Builds a new house every night", size: 1, speed: 3, weight: 1,
    likes: ["💧 dewdrops", "🌙 building at night"],
    story: "Web Slinger is an artist. Every night she spins a brand-new web, each one a perfect circle, and every morning it sparkles with dew. She eats the old one for breakfast so nothing goes to waste.",
    fact: "Spider silk is stronger than steel of the same thickness." },
  s20: { real: "Garden snail", tag: "Never late, just on snail time", size: 1, speed: 1, weight: 1,
    likes: ["🌧️ rain", "🥬 lettuce"],
    story: "Slow Mo carries his house on his back so he's always home. He moves so slowly that a race against him takes all afternoon — but he always finishes. He leaves a shiny trail so he never gets lost.",
    fact: "A snail can sleep for three years." },
  s87: { real: "Honeybee", tag: "Busy, buzzy, full of honey", size: 1, speed: 4, weight: 1,
    likes: ["🌻 sunflowers", "💃 dancing"],
    story: "Buzz Cut visits a thousand flowers a day and tells her hive where the best ones are by doing a wiggle dance. Her legs get so covered in yellow pollen she looks like she's wearing fuzzy pants.",
    fact: "Bees dance in a figure-8 to give directions to other bees." },
  s88: { real: "Inchworm", tag: "Measuring the whole world, one inch at a time", size: 1, speed: 1, weight: 1,
    likes: ["📏 measuring things", "🌿 green leaves"],
    story: "Inchy walks by making a loop with his back and then stretching out — loop, stretch, loop, stretch. He is measuring everything. He's measured three leaves, a fence, and once, a sleeping cat.",
    fact: "Inchworms turn into moths." },
  s89: { real: "Seven-spot ladybug", tag: "Seven spots, all lucky", size: 1, speed: 3, weight: 1,
    likes: ["🍀 luck", "🌹 rose bushes"],
    story: "Dot Matrix has exactly seven spots and says each one is a different kind of luck. Land on your hand? Good luck tomorrow. Land on your nose? Extra good luck. She protects the garden by eating the tiny bugs that chew the roses.",
    fact: "A ladybug can eat 5,000 aphids in its life." },
  s90: { real: "Monarch butterfly", tag: "Flew 2,000 miles. Not tired.", size: 2, speed: 4, weight: 1,
    likes: ["🌸 milkweed", "🧭 long journeys"],
    story: "Flutter Byte started life as a striped caterpillar, went into a green sleeping bag, and came out with orange wings. Then she flew across a whole country to a forest she'd never seen. She never needed a map.",
    fact: "Monarchs fly to the same Mexican forests their great-great-grandparents flew to." },
  s35: { real: "Desert scorpion", tag: "Glows in the dark. Seriously.", size: 2, speed: 3, weight: 1,
    likes: ["🌵 desert nights", "🔦 blacklights"],
    story: "Sting Ray hides under rocks all day and comes out at night, and here's the wild part — under moonlight he glows blue-green. He raises his tail when he's nervous but he's never stung a friend.",
    fact: "All scorpions glow under UV light, and nobody knows why." },
  s91: { real: "Emperor dragonfly", title: "The Pond Pilot", tag: "Flies backward. Catches everything.", size: 2, speed: 6, weight: 1,
    likes: ["🪷 lily pads", "🎯 never missing"],
    story: "Sky Skimmer is the best flyer that has ever lived. He can hover, zoom, turn in midair, and fly *backward*, and when he hunts he catches his target 95 times out of 100. His giant eyes see in every direction at once. The story goes that a bird once tried to chase him over the pond — and Sky Skimmer flew circles around it until it got dizzy and had to land.",
    fact: "Dragonflies have been around since before the dinosaurs — and some were as big as hawks." },
  s92: { real: "Praying mantis", title: "Master of the Still Garden", tag: "Stands still for hours. Strikes in a blink.", size: 2, speed: 5, weight: 1,
    likes: ["🧘 patience", "🍃 blending in"],
    story: "Mantis Monk is so still you'd think he was a leaf. Bugs walk right past him for hours. Then, faster than you can blink, he strikes — and sits back down like nothing happened. He turns his head to look at you, which no other bug can do, and it's a little bit spooky and a lot bit cool.",
    legend: "Mantis Monk once stood so still through a whole winter that the snow built a tiny temple around him. When spring came he stepped out, bowed, and that's how he got his name." },

  /* ---- 🌊 Sea ---- */
  s19: { real: "Emperor penguin", tag: "Belly-slides everywhere", size: 3, speed: 3, weight: 3,
    likes: ["🧊 ice slides", "🐟 fish snacks"],
    story: "Chill Pip waddles on land and flies underwater. Why walk when you can flop on your belly and slide? He huddles with his friends in a big penguin pile when it's cold, and takes turns being in the warm middle.",
    fact: "Penguin dads hold the egg on their feet for two months without eating." },
  s3: { real: "Sea turtle", tag: "Slow on sand, smooth in the sea", size: 3, speed: 2, weight: 4,
    likes: ["🪼 jellyfish", "🏝️ the beach she was born on"],
    story: "Tank Shell has been swimming the ocean for longer than your grandparents have been alive. She flies through the water with her flippers like wings. Every few years she swims all the way back to the exact beach where she hatched.",
    fact: "Sea turtles can hold their breath for hours." },
  s93: { real: "Clownfish", tag: "Small fish, big attitude", size: 1, speed: 3, weight: 1,
    likes: ["🪸 his anemone", "🧹 keeping it clean"],
    story: "Finn lives inside a stinging anemone that would zap any other fish — but not him. He's covered in a special slime that keeps him safe. He guards his little home like it's a castle.",
    fact: "Clownfish are born boys, and the biggest one in the group turns into a girl." },
  s94: { real: "Pistol shrimp", tag: "Loudest animal in the ocean", size: 1, speed: 3, weight: 1,
    likes: ["💥 loud snaps", "🏠 his burrow"],
    story: "Pop Shrimp is the size of your pinky but has a claw that snaps so hard it makes a bubble — and a BANG louder than a firecracker. He uses it to stun his dinner. Divers can hear him popping from far away.",
    fact: "The snap is so fast it makes a flash of light for a split second." },
  s95: { real: "Porcupinefish", tag: "Don't scare him. Too late.", size: 2, speed: 2, weight: 2,
    likes: ["🫧 bubbles", "🧘 calm water"],
    story: "Puffball is a small, slow, round fish — until something startles him. Then he gulps water and swells up into a spiky balloon three times his size. Afterward he's a little embarrassed and has to let all the air out.",
    fact: "Puffing up is so tiring that they can only do it a few times a day." },
  s32: { real: "Bottlenose dolphin", tag: "Jumps for the fun of it", size: 4, speed: 5, weight: 4,
    likes: ["🌊 boat waves", "🎶 clicking songs"],
    story: "Splash Dart can't stop playing. She surfs on the waves behind boats, leaps into the air for no reason, and blows bubble rings to swim through. She talks with clicks and whistles, and every dolphin has its own name-whistle.",
    fact: "Dolphins sleep with one half of their brain at a time." },
  s33: { real: "Great white shark", tag: "Smells one drop in a swimming pool", size: 5, speed: 5, weight: 5,
    likes: ["🌊 open ocean", "😬 showing teeth"],
    story: "Chomp Zone has 300 teeth in rows, and when one falls out, another moves forward. He's always smiling — it's just how his face works. He cruises the deep blue and can smell a snack from a mile away.",
    fact: "Sharks have been around longer than trees." },
  s34: { real: "Common octopus", tag: "Eight arms, three hearts, zero bones", size: 3, speed: 3, weight: 2,
    likes: ["🫙 jars with lids", "🎭 disguises"],
    story: "Ink Ops can change color to match anything — rock, sand, or seaweed — and squeeze through a hole the size of a coin. She opens jars, solves mazes, and sprays a cloud of ink to escape. Nobody keeps her in a tank for long.",
    fact: "Each octopus arm has its own little brain." },
  s96: { real: "Giant squid", title: "Eyes of the Midnight Zone", tag: "Eyes as big as dinner plates", size: 6, speed: 4, weight: 5,
    likes: ["🌑 total darkness", "🤫 mystery"],
    story: "Deep Ink lives so far down that sunlight never reaches her. Her eyes are the biggest in the animal world, and they glow faintly in the black. For hundreds of years sailors told stories about her but no one had ever seen her alive. Then one day a camera went down into the dark — and two giant eyes looked back.",
    fact: "The giant squid wasn't filmed alive until 2012." },
  s97: { real: "Blue whale", title: "The Biggest Heart in the World", tag: "The largest animal that has ever lived", size: 6, speed: 3, weight: 6,
    likes: ["🦐 krill clouds", "🎵 deep songs"],
    story: "Tidal King is bigger than any dinosaur that ever walked. His heart is the size of a car and his tongue weighs as much as an elephant. He sings songs so low and so loud that other whales hear them from across the ocean. When he surfaces, his breath shoots up three stories high.",
    legend: "The tides used to stay still. Then Tidal King was born, and every time he rolls over in his sleep the whole ocean sloshes — and that's why the sea comes in and out every day." },

  /* ---- 🦄 Fantasy (every card is a legend — the whole set is myth) ---- */
  s98: { real: "Unicorn foal", tag: "Her horn is still growing in", size: 3, speed: 4, weight: 3,
    likes: ["🌈 rainbows after rain", "🍓 wild berries"],
    story: "Shimmer-Horn is a baby unicorn whose horn is only as long as your thumb so far. It sparkles when she's happy and goes dim when she's sleepy. She leaves tiny glittering hoofprints that fade by morning.",
    legend: "When her horn is fully grown, she'll be able to make one wish come true — and she's saving it." },
  s99: { real: "Stone gargoyle", tag: "Statue by day, guard by night", size: 2, speed: 2, weight: 5,
    likes: ["🌧️ rain on his head", "🏰 rooftops"],
    story: "Pebble-Gargoyle sits perfectly still on the castle roof all day, and everyone thinks he's a statue. At night he stretches, cracks his stone knuckles, and keeps watch. He's heavy as a boulder but his wings can still carry him.",
    legend: "He's never once fallen asleep on watch in 900 years — though he has yawned twice." },
  s100: { real: "Pixie", tag: "Mischief, but the nice kind", size: 1, speed: 5, weight: 1,
    likes: ["🧦 hiding socks", "🍯 honey drops"],
    story: "Whisper-Sprite is the reason your sock goes missing and then turns up somewhere silly. She's the size of a thumb, glows like a firefly, and giggles in a voice only dogs and kids can hear. She always gives things back. Eventually.",
    legend: "If you leave a drop of honey on the windowsill, she'll do a tiny chore for you while you sleep." },
  s101: { real: "Griffin cub", tag: "Eagle up front, lion in back", size: 3, speed: 4, weight: 3,
    likes: ["✨ shiny things", "🪶 preening"],
    story: "Cinder-Griffin has the head and wings of an eagle and the body of a lion cub. He can't quite fly yet — he gets about three feet up and then tumbles into a fluffy heap. He collects shiny buttons and sorts them by color.",
    legend: "Griffins guard treasure, and Cinder has already decided his friends are his treasure." },
  s102: { real: "Winged horse", tag: "Leaves snowflakes where she gallops", size: 4, speed: 5, weight: 3,
    likes: ["❄️ first snow", "☁️ cloud-jumping"],
    story: "Frost-Pegasus gallops across the sky with wings made of frost. Wherever her hooves touch a cloud, it snows a little bit underneath. On the first snowy day of winter, that's her doing a victory lap.",
    legend: "She's the reason snow days happen." },
  s103: { real: "Crystal golem", tag: "Made of gems. Powered by friendship.", size: 5, speed: 1, weight: 6,
    likes: ["🌞 sunlight through his body", "🧩 being useful"],
    story: "Crystal-Golem is a giant built of purple crystal, and when the sun shines through him, rainbows land everywhere. He's slow, he's heavy, and he's strong enough to lift a house. He only moves when someone needs help — then nothing can stop him.",
    legend: "A lonely wizard built him for company, and the first word he ever said was \"friend.\"" },
  s104: { real: "Sky serpent", tag: "A dragon with no wings and no need for them", size: 6, speed: 4, weight: 2,
    likes: ["🌤️ swimming through clouds", "⛈️ thunder"],
    story: "Cloud-Wyrm is a long, long dragon who swims through the sky like a ribbon. She has no wings — she just *goes*. On stormy days you might see her whole body flash when lightning goes through the clouds. She's the one who makes them rumble.",
    legend: "Every thunderclap is Cloud-Wyrm laughing at a joke." },
  s105: { real: "Phoenix", tag: "Burns out. Comes back. Every time.", size: 3, speed: 5, weight: 1,
    likes: ["🌅 sunrise", "🔥 bonfires"],
    story: "Nova-Phoenix is a bird made of living fire. Once every hundred years she gets old, bursts into flames, and turns to ash — and then a brand-new baby phoenix pops out of the ash, bright as ever. Her feathers are warm to the touch but never burn a friend.",
    legend: "A single one of her tears can heal any hurt." },
  s106: { real: "Sky leviathan", title: "The Light Behind the Stars", tag: "A whale made of northern lights", size: 6, speed: 3, weight: 1,
    likes: ["🌌 polar nights", "🎵 silent songs"],
    story: "Aurora-Leviathan is a whale the size of a mountain, made of shimmering green and purple light. She swims through the night sky far, far to the north, and the glow you see on the horizon is her passing by. She weighs nothing at all — you could put your hand right through her. Once, a lost explorer followed her light for three nights and she led him all the way home.",
    legend: "The northern lights are her tail, and when they ripple, she's waving." },
  s107: { real: "Time dragon", title: "Keeper of Every Tomorrow", tag: "Older than time. Knows how it ends.", size: 6, speed: 6, weight: 6,
    likes: ["⏳ hourglasses", "🕰️ the sound of ticking"],
    story: "Chrono-Dragon's scales are clock faces, and every one shows a different time. He can slow down a moment so it lasts all day, or skip a boring afternoon in a blink. His wings are so wide they have their own weather. When he breathes, it's not fire — it's a swirl of yesterdays and tomorrows.",
    legend: "Chrono-Dragon was there before the first sunrise, and he'll be there after the last one. He already knows your whole story, and he says it's a good one." },

  /* ---- 🛸 Space Invasion (facts for the real sky, mission logs for the aliens) ---- */
  s108: { real: "Scout saucer", tag: "Beep boop, just looking around", size: 2, speed: 4, weight: 2,
    likes: ["🌽 corn fields", "📸 taking pictures"],
    story: "Hover Bob is a tiny flying saucer that came to Earth to take pictures and got distracted by everything. He hovers over your yard going *bweep bweep* and flashing his lights. He's not invading — he just thinks you're interesting.",
    log: "Day 212. The Earth creatures have something called 'pizza.' Investigating." },
  s109: { real: "Ringed planet", tag: "Rings so wide you could drive on them", size: 6, speed: 2, weight: 1,
    likes: ["🧊 ice chunks", "🎠 spinning"],
    story: "Hoops is a gas planet with the prettiest rings in the galaxy, made of billions of ice chunks, some as small as a snowflake and some as big as a school. He's enormous but so light that if you had a big enough bathtub, he'd float.",
    fact: "Saturn is the only planet that would float in water." },
  s110: { real: "Comet", tag: "A dirty snowball with a tail of fire", size: 3, speed: 6, weight: 2,
    likes: ["☀️ zooming past the sun", "🎇 showing off"],
    story: "Skyscratch is a chunk of ice and rock that's been flying around the sun for millions of years. Every time he gets close, the sun melts a little of him into a glowing tail millions of miles long. Then he zooms back out to the dark for a while to cool off.",
    fact: "Halley's Comet comes back every 76 years. You might see it in 2061!" },
  s111: { real: "The Moon", tag: "Earth's best friend, always orbiting", size: 6, speed: 3, weight: 6,
    likes: ["🌊 pulling the tides", "👣 footprints"],
    story: "Moonbeam has followed Earth around for four billion years and never gets bored. She changes shape every night — sliver, half, full, and back again — but she's always the same moon. She keeps twelve sets of astronaut footprints perfectly safe, because there's no wind to blow them away.",
    fact: "The moon is slowly drifting away from Earth — about as fast as your fingernails grow." },
  s112: { real: "Satellite", tag: "Goes around the world every 90 minutes", size: 3, speed: 6, weight: 3,
    likes: ["📡 sending messages", "🌍 watching weather"],
    story: "Blip zips around Earth 16 times a day, bouncing messages, maps, and weather pictures down to everyone. He's the reason the TV works and the car knows where to go. At night, if you look up, you might see him as a tiny moving star.",
    fact: "There are over 10,000 satellites around Earth right now." },
  s113: { real: "Glitch alien", tag: "Came out of an old video game", size: 2, speed: 4, weight: 1,
    likes: ["🕹️ arcade machines", "🔊 8-bit sounds"],
    story: "Pixel Pest is made of squares and moves in little jumps — left, left, down, right. He escaped from an old arcade game and now he hops between screens, showing up in the corner when you least expect it. He goes *pew pew* but it never actually does anything.",
    log: "Level 1 cleared. Level 2 cleared. Level 3… where is Level 3? Have been looking for 40 years." },
  s114: { real: "Rocket", tag: "Three, two, one… GONE", size: 5, speed: 6, weight: 5,
    likes: ["🔟 countdowns", "🔥 big launches"],
    story: "Blastoff spends most of his time standing very still on the launch pad. Then the countdown starts and he starts to shake with excitement. At zero he roars off the ground with a flame longer than a football field and is gone into the sky in under two minutes.",
    fact: "A rocket has to go 17,500 miles per hour to stay in orbit." },
  s115: { real: "Star nursery", tag: "Where baby stars are born", size: 6, speed: 1, weight: 1,
    likes: ["⭐ new stars", "🎨 glowing colors"],
    story: "Nebula is a giant cloud of glowing gas and dust, bigger than a thousand solar systems, painted in pink and blue and gold. Deep inside her, gas squishes together until — *pop* — a brand-new star lights up. She's made thousands. Every star you see started in a cloud like her.",
    fact: "The Pillars of Creation nebula is 7,000 light-years away — the light you see left it before the pyramids were built." },
  s42: { real: "Zeta-class alien", title: "Captain of the Invasion (Sort Of)", tag: "Here to conquer Earth. Got distracted.", size: 3, speed: 4, weight: 2,
    likes: ["🐶 Earth dogs", "🍦 ice cream"],
    story: "Zeta Ray is the captain of the whole space invasion. She has a ray gun, a shiny ship, and a plan to take over Earth. The problem is, every time she lands she meets a dog, or finds a playground, or tries ice cream, and forgets the plan. The invasion has been \"starting tomorrow\" for eleven years.",
    log: "Earth conquest postponed. Found a creature called 'golden retriever.' Must study further." },
  s71: { real: "Newborn star", title: "The Youngest Light in the Sky", tag: "The first star you see tonight", size: 6, speed: 3, weight: 6,
    likes: ["🌃 being wished on", "😴 bedtime stories"],
    story: "Twinkle is a real, actual star — but a baby one, only a few million years old, which is a toddler for a star. She's the first star to come out every evening and she *loves* being wished on. She's so far away that her light takes years to reach you, so when you see her, you're seeing a little bit of the past.",
    legend: "Every wish made on Twinkle gets stored in her light. One day, when she's all grown up, she'll shine them all back down at once." },

  /* ---- 🌴 Jungle ---- */
  s17: { real: "Capuchin monkey", tag: "Loud, fast, and sticky-fingered", size: 2, speed: 5, weight: 2,
    likes: ["🍌 obviously", "🪨 cracking nuts with rocks"],
    story: "Banana Split never sits still. He swings by his tail, steals hats, and chatters like he's telling the best joke in the world. He's smart enough to use a rock as a hammer, which he mostly uses to open snacks.",
    fact: "Capuchins have been using stone tools for at least 3,000 years." },
  s12: { real: "Three-toed sloth", tag: "Takes a whole day to cross one tree", size: 3, speed: 1, weight: 2,
    likes: ["🌿 hanging upside down", "😴 22-hour naps"],
    story: "Slow Clap moves so slowly that moss grows on his fur, which is great because it makes him green and hard to spot. He always looks like he's smiling. He comes down from his tree once a week, and it's a big deal.",
    fact: "Sloths are surprisingly good swimmers — three times faster in water than on land." },
  s2: { real: "Red-eyed tree frog", tag: "Sticky toes, big red eyes", size: 1, speed: 4, weight: 1,
    likes: ["🌧️ rainy nights", "🍃 shiny wet leaves"],
    story: "Hopper Jax sleeps all day with his big red eyes closed so he looks like a plain green leaf. Then at night — BOING — he pops them open to scare anything sneaking up, and leaps away on sticky toes. He sings a *chack chack* song when it rains.",
    fact: "Frogs drink water through their skin — they don't need to sip." },
  s21: { real: "Day gecko", tag: "Walks on the ceiling like it's nothing", size: 1, speed: 5, weight: 1,
    likes: ["🪟 warm glass", "🦟 snack bugs"],
    story: "Gecko Zap has millions of tiny hairs on his toes that let him stick to anything, even glass, even upside down. He licks his own eyeballs clean because he has no eyelids. If something grabs his tail, it pops off — and he grows a new one.",
    fact: "A gecko could hang from the ceiling by one toe." },
  s116: { real: "Scarlet macaw", tag: "Says every word she hears. Loudly.", size: 3, speed: 4, weight: 2,
    likes: ["🥜 nuts", "🗣️ copying voices"],
    story: "Skwak is a rainbow with a beak. She can crack a nut that you'd need a hammer for, and she repeats everything she hears — the phone, the doorbell, your mom calling you for dinner. She's learned 60 words, and \"SKWAK\" is still her favorite.",
    fact: "Macaws can live to be 80 years old." },
  s25: { real: "Bengal tiger", tag: "No two tigers have the same stripes", size: 4, speed: 5, weight: 5,
    likes: ["🏊 swimming", "🤫 sneaking"],
    story: "Stripe Storm is the biggest cat in the world, and unlike most cats, she loves the water. She moves through the tall grass so quietly you'd never know she was there until she wanted you to. Her stripes go all the way down to her skin.",
    fact: "A tiger's roar can be heard two miles away." },
  s39: { real: "Indian peacock", tag: "A hundred eyes on his tail", size: 3, speed: 3, weight: 2,
    likes: ["🪞 being admired", "🌧️ dancing in the rain"],
    story: "Fan Feather's tail is taller than you and covered in feathers that look like shining blue-green eyes. When he's feeling fancy, he spreads it all out and shakes it so it rattles. He can fly, but he mostly prefers to be looked at.",
    fact: "Peacock feathers aren't really colored — their shape bends light to make the colors." },
  s117: { real: "Emerald tree boa", tag: "Hangs in a loop and waits", size: 4, speed: 2, weight: 3,
    likes: ["🌿 green branches", "🔥 warm spots"],
    story: "Noodle is bright green and coils herself over a branch in a neat pile, head resting in the middle, and waits. And waits. She can feel heat with her face, so even in the dark she knows where everything is. She's never in a hurry.",
    fact: "Snakes smell with their tongues." },
  s118: { real: "Mountain gorilla", title: "Gentle Giant of the Mist", tag: "Strongest in the jungle. Gentlest too.", size: 5, speed: 3, weight: 6,
    likes: ["🎋 bamboo shoots", "👶 babysitting"],
    story: "Thunder Chest is ten times stronger than the strongest person you know. When he stands up and beats his chest, it booms through the whole forest and every animal goes quiet. But he spends his days eating leaves, napping in the mist, and letting the babies climb all over him. Once a leopard came too close to the little ones, and Thunder Chest just stood up — and that was enough.",
    fact: "Gorillas share 98% of their DNA with humans, and each has a unique nose print." },
  s50: { real: "Jungle dragon", title: "The Volcano's Heartbeat", tag: "Sleeps inside the mountain. Breathes out the fog.", size: 6, speed: 5, weight: 6,
    likes: ["🌋 lava pools", "🌫️ morning mist"],
    story: "Deep in the jungle there's a mountain that's always smoking. That's not a volcano — that's Scaldrake, breathing in his sleep. His scales are the color of cooling lava and his wings, when he finally stretches them, block out the sun. The animals leave fruit at the mountain's foot every morning. He's never once asked them to.",
    legend: "The jungle used to be a desert. Scaldrake breathed out the first fog, and from the fog came the rain, and from the rain came every green thing." },

  /* ---- 🦁 Safari ---- */
  s15: { real: "Warthog", tag: "Not pretty. Doesn't care.", size: 3, speed: 4, weight: 4,
    likes: ["🟤 mud baths", "🏃 running with tail up"],
    story: "Tusker has a bumpy face, big curved tusks, and a tail that sticks straight up like a flag when he runs. He kneels down on his front knees to eat grass. He knows he's not the handsomest on the savanna and he's completely fine with it.",
    fact: "Warthogs back into their burrows so they can charge straight out at danger." },
  s119: { real: "Plains zebra", tag: "Is he white with black stripes or…?", size: 4, speed: 5, weight: 4,
    likes: ["🌾 grasslands", "👯 the herd"],
    story: "Zig Zag's stripes are like a fingerprint — no other zebra has the same ones. When the whole herd runs together, the stripes blur and lions can't tell where one zebra ends and the next begins. He barks, which surprises people.",
    fact: "Zebras are black with white stripes — their skin underneath is dark." },
  s120: { real: "Hippopotamus", tag: "Looks sleepy. Runs faster than you.", size: 5, speed: 4, weight: 6,
    likes: ["🌊 rivers", "🌙 night grazing"],
    story: "Mud Bud spends all day in the river with just his eyes and nose sticking out, yawning a yawn that could swallow a watermelon. Don't let the sleepy look fool you — on land he can outrun a person. His sweat is pink and works like sunscreen.",
    fact: "Hippos can't swim — they walk and bounce along the river bottom." },
  s121: { real: "Dromedary camel", tag: "Hasn't had a drink in a week. Feels great.", size: 4, speed: 3, weight: 5,
    likes: ["🏜️ long walks", "🌵 thorny snacks"],
    story: "Humphrey's hump isn't full of water — it's full of fat, which is his lunchbox for long trips. He has three eyelids and can close his nose to keep sand out. When he finally finds water, he can drink 30 gallons in ten minutes.",
    fact: "Camel eyelashes are so long and thick they work like goggles in a sandstorm." },
  s122: { real: "Black rhinoceros", tag: "Can't see well. Charges anyway.", size: 5, speed: 4, weight: 6,
    likes: ["🪨 scratching on rocks", "🐦 the birds on her back"],
    story: "Iron Horn is built like a truck and has skin so thick thorns don't bother her. Her eyesight is terrible, so if she's not sure what you are, she might just charge to find out. Little birds ride on her back and eat the bugs — they're her lookouts.",
    fact: "A rhino's horn is made of the same stuff as your fingernails." },
  s123: { real: "Giraffe", tag: "Eats lunch from the second floor", size: 6, speed: 4, weight: 5,
    likes: ["🌳 acacia leaves", "👀 seeing everything first"],
    story: "Tall Tale's neck is longer than a grown-up is tall, and her tongue is purple and almost two feet long so she can eat around thorns. She's the lookout for the whole savanna. She only sleeps about 30 minutes a day and does it standing up.",
    fact: "A giraffe's neck has the same number of bones as yours — seven — they're just huge." },
  s26: { real: "Lion", tag: "The loudest nap on the savanna", size: 4, speed: 5, weight: 5,
    likes: ["😴 20-hour naps", "🌅 dawn patrols"],
    story: "Mane Event sleeps most of the day in the shade and lets the lionesses do the hunting. But when he stands up and roars, every animal for miles stops and listens. He's the biggest brother of the whole pride and he looks after every cub.",
    fact: "A lion's roar can be heard five miles away." },
  s38: { real: "Greater flamingo", tag: "Pink from the inside out", size: 4, speed: 3, weight: 2,
    likes: ["🦐 pink shrimp", "🦩 standing on one leg"],
    story: "Pink Stilt isn't born pink — she turns pink from eating tiny pink shrimp. She stands on one leg for hours without wobbling, and sleeps that way too. When the whole flock takes off, the sky turns pink.",
    fact: "Flamingos eat with their heads upside down." },
  s124: { real: "Cheetah", title: "The Fastest Thing on Legs", tag: "Zero to 60 faster than a sports car", size: 3, speed: 6, weight: 3,
    likes: ["🏁 short sprints", "😺 chirping (yes, chirping)"],
    story: "Spot Rush is the fastest land animal that has ever lived. When she runs, all four feet leave the ground at once and her tail steers like a rudder. The black tear-stripes under her eyes cut the sun's glare like a football player's face paint. She once chased a gazelle across the whole plain, missed it, and then lay down panting in the grass for 20 minutes — because even the fastest thing alive has to catch her breath.",
    fact: "Cheetahs can't roar. They chirp, like a bird." },
  s125: { real: "African elephant", title: "The Old One Who Remembers", tag: "Never forgets a face. Or a friend.", size: 6, speed: 3, weight: 6,
    likes: ["💦 water fights", "👵 long memories"],
    story: "Trunk Titan is the biggest animal on land, and the wisest. Her trunk has 40,000 muscles — she can pick up a peanut or push over a tree with it. She remembers every waterhole, every path, and every friend she's ever had, even after fifty years. When the herd is lost in the dry season, she's the one who knows the way.",
    legend: "Trunk Titan was there the day the first rain fell on the savanna, and she remembers exactly where it landed. That's the only waterhole that has never, ever gone dry." },
};

/* ---------------- the eight collections ----------------
   Statues are Box items that can never be bought: size 2×2, animated,
   buyable:false. The shop filters on `buyable` structurally (see
   shopListing), so a statue can't leak in by being left off a list. */
export const COLLECTIONS = [
  { id:'dinosaurs', icon:'🦖', name:'Dinosaurs',
    blurb:'Bones, eggs, and the biggest teeth ever',
    members:['s72','s73','s74','s75','s76','s77','s78','s79','s80','s51'],
    badge:  { emoji:'🦖', name:'Dino Ranger' },
    statue: { id:'fossil-skeleton', emoji:'🦴', name:'Fossil Skeleton', size:[2,2], animated:true, buyable:false },
    avatar: { id:'dino-ranger-hat', emoji:'🎩', name:'Ranger Hat', slot:'acc' },
    season: null },
  { id:'farm', icon:'🚜', name:'Farm Animals',
    blurb:'Mud, moos, and one very loud rooster',
    members:['s4','s5','s6','s7','s81','s82','s83','s84','s85','s86'],
    badge:  { emoji:'🚜', name:'Ranch Boss' },
    statue: { id:'big-red-barn', emoji:'🏚️', name:'Big Red Barn', size:[2,2], animated:true, buyable:false },
    avatar: { id:'ranch-bandana', emoji:'🧣', name:'Ranch Bandana', slot:'acc' },
    season: null },
  { id:'bugs', icon:'🐞', name:'Bugs',
    blurb:'Small, six-legged, secretly the toughest',
    members:['s22','s23','s20','s87','s88','s89','s90','s35','s91','s92'],
    badge:  { emoji:'🐞', name:'Master Bug Catcher' },
    statue: { id:'giant-ladybug', emoji:'🐞', name:'Giant Ladybug', size:[2,2], animated:true, buyable:false },
    avatar: { id:'antenna-band', emoji:'🥽', name:'Antenna Band', slot:'acc' },
    season: null },
  { id:'sea', icon:'🌊', name:'Sea Creatures',
    blurb:'Everything under the waves',
    members:['s19','s3','s93','s94','s95','s32','s33','s34','s96','s97'],
    badge:  { emoji:'🌊', name:'Marine Biologist' },
    statue: { id:'whale-fountain', emoji:'⛲', name:'Whale Fountain', size:[2,2], animated:true, buyable:false },
    avatar: { id:'snorkel-set', emoji:'🤿', name:'Snorkel Set', slot:'acc' },
    season: null },
  { id:'fantasy', icon:'🦄', name:'Fantasy',
    blurb:'Creatures from the land of make-believe',
    members:['s98','s99','s100','s101','s102','s103','s104','s105','s106','s107'],
    badge:  { emoji:'🦄', name:'Legend Keeper' },
    statue: { id:'crystal-castle', emoji:'🏰', name:'Crystal Castle', size:[2,2], animated:true, buyable:false },
    avatar: { id:'starlight-cape', emoji:'🧿', name:'Starlight Cape', slot:'acc' },
    season: null },
  { id:'space', icon:'🛸', name:'Space Invasion',
    blurb:'They came from the stars. Mostly for the snacks.',
    members:['s108','s109','s110','s111','s112','s113','s114','s115','s42','s71'],
    badge:  { emoji:'🛸', name:'Galaxy Defender' },
    statue: { id:'crashed-ufo', emoji:'🛸', name:'Crashed UFO', size:[2,2], animated:true, buyable:false },
    avatar: { id:'space-helmet', emoji:'🪖', name:'Space Helmet', slot:'acc' },
    season: null },
  { id:'jungle', icon:'🌴', name:'Jungle',
    blurb:'Everything that swings, croaks, or prowls',
    members:['s17','s12','s2','s21','s116','s25','s39','s117','s118','s50'],
    badge:  { emoji:'🌴', name:'Jungle Explorer' },
    statue: { id:'ancient-temple', emoji:'🛕', name:'Ancient Temple', size:[2,2], animated:true, buyable:false },
    avatar: { id:'explorer-hat', emoji:'👒', name:'Explorer Hat', slot:'acc' },
    season: null },
  { id:'safari', icon:'🦁', name:'Safari',
    blurb:'The big, the bold, and the barely awake',
    members:['s15','s119','s120','s121','s122','s26','s38','s123','s124','s125'],
    badge:  { emoji:'🦁', name:'Safari Guide' },
    statue: { id:'watering-hole', emoji:'🏞️', name:'Watering Hole', size:[2,2], animated:true, buyable:false },
    avatar: { id:'safari-binoculars', emoji:'🔭', name:'Safari Binoculars', slot:'acc' },
    season: null },
];

/** All eight complete → the only one in existence. */
export const GRAND_PRIZE = { id:'sky-coaster', emoji:'🎢', name:'Sky Coaster Island', size:[3,3], animated:true, buyable:false };

/** Every Box item the collections can grant — for the shop's exclusion
    test and, later, the Box's inventory. None of these are for sale. */
export const STATUES = COLLECTIONS.map((c) => c.statue);

/* ---------------- membership lookups ---------------- */
const COLLECTION_OF = new Map();
for (const c of COLLECTIONS) for (const id of c.members) COLLECTION_OF.set(id, c);

/** The collection a sprite belongs to, or null for an unaffiliated one. */
export function collectionOf(spriteId){ return COLLECTION_OF.get(spriteId) || null; }
/** Does this sprite appear anywhere in the game? Only collection members do. */
export function inCollection(spriteId){ return COLLECTION_OF.has(spriteId); }
/** The sprites a kid can ever see, in index order — the Locker's grid,
    the roll pools, the trade shelves. Everything else in SPRITES is
    parked for a future collection. */
export const LIVE_SPRITE_IDS = SPRITE_IDS.filter(inCollection);

/* Hang the lore on each sprite so spriteById(id).lore just works. */
for (const [id, lore] of Object.entries(SPRITE_LORE)){
  const s = spriteById(id);
  if (s) s.lore = lore;
}

/* ---------------- the three states ----------------
   One helper for EVERY renderer — Locker, Collections, trade builder,
   reveals, the sibling peek — so a sprite can never look different on
   two screens. `character` needs only { counts, level | xp }.

     hidden      rarity band above the kid's level: an empty slot, no
                 shape, no name, no ring — it still counts in totals
     silhouette  findable but uncaught: dark shape, name ???, ring shown
     owned       full colour, name, ring, duplicate count

   A caught sprite is ALWAYS owned, whatever the level: trading hands a
   kid things above their band on purpose. */
export function spriteState(id, character){
  const sprite = spriteById(id);
  if (!sprite) return 'hidden';
  const counts = character?.counts || {};
  if ((counts[id] || 0) > 0) return 'owned';
  const level = character?.level ?? levelFromXp(character?.xp || 0).level;
  return level >= RARITY_UNLOCK[displayRarity(sprite.r)] ? 'silhouette' : 'hidden';
}

/* ---------------- completion — derived, never stored ----------------
   A collection is complete iff every member's count is > 0. Only the
   GRANT is written (badge, statue, avatar unlock), inside the same
   transaction as the sprite write, guarded by arrayUnion on badges. */
export function isCollectionComplete(collection, counts){
  return collection.members.every((id) => ((counts || {})[id] || 0) > 0);
}
export function collectionProgress(collection, counts){
  const have = collection.members.filter((id) => ((counts || {})[id] || 0) > 0).length;
  return { have, total: collection.members.length, complete: have === collection.members.length };
}
/** Collections complete under `counts` that aren't in `badges` yet —
    what a sprite write just finished. */
export function newlyCompletedCollections(counts, badges){
  const had = new Set(badges || []);
  return COLLECTIONS.filter((c) => !had.has(c.id) && isCollectionComplete(c, counts)).map((c) => c.id);
}
/** Unique live sprites owned — the "n / 80" everywhere. */
export function uniqueLiveCount(counts){
  return LIVE_SPRITE_IDS.filter((id) => ((counts || {})[id] || 0) > 0).length;
}

/* ---------------- the shop's structural filter ----------------
   Anything with buyable:false is not for sale, full stop — statues and
   the Grand Prize never reach a shop grid even if someone lists them.
   Every shop surface passes its items through here. */
export function isBuyable(item){
  return !!item && item.buyable !== false && Number.isFinite(Number(item.cost));
}
export function shopListing(items){ return (items || []).filter(isBuyable); }


/* =====================================================================
   THE ECONOMY
   Every tunable reward number in the arcade, in plain language. Retune
   the game's whole feel from this block without reading any real code.
   ===================================================================== */
export const ECONOMY = {
  /* ---- learning games: paid for the SHARE OF THE RUN completed ----
     Difficulty is already scaled per child by birthday, so a 6-year-old
     clearing 6-year-old work has done as much as a 9-year-old clearing
     9-year-old work and must be paid the same (AJ, Aug 2026). Paying per
     QUESTION broke that: the games pitched at younger children are
     shorter, so they paid less for the same accomplishment — Loot Drop's
     5-question round paid 88% less than Math Defender's 20-question one.

     So each learning game declares how many questions a full run is
     (GAMES[id].runQuestions, or result.runQuestions when the game knows
     better), and the reward follows the fraction of that run finished.
     Doing your work pays the same whether your work is five questions or
     twenty. Fun games are the explicit exception and still pay per unit,
     because better tablet control is a real skill. */
  xpPerRun:      200,   // a full learning run
  maxRunShare:   1.5,   // going long still pays — but not for ever
  xpPerUnit:      10,   // FUN games only now: per milestone
  clearBonusXp:   100,  // learning games only, at >= 80% accuracy
  consolationXp:   25,  // learning games only, below 80% — you still learned something
  xpPerMinute:      4,  // capped by minutesCap
  minutesCap:      20,  // no reward for grinding all afternoon
  funDailyXpCap:  250,

  /* ---- coins (R2B · E4) ----
     Coins are no longer a per-run wage. Nothing in computeAward pays a
     coin any more: they come from BONUS ROUNDS only — the shared Bonus
     Vault, a game's bespoke round (Math Baseball's derby, Loot Drop's
     mini-games) and, once the Box exists, compliments. The retired
     numbers were coinsPerUnit: 3 and clearBonusCoins: 65; they are gone
     rather than zeroed so nothing can quietly start paying again.

     dailyCoinCap covers EVERY source together, so no single surface can
     become the faucet. AJ, Aug 22 2026: 300. */
  dailyCoinCap:   300,
  maxTradeItems:    6,  // per side of a trade, so an offer card stays readable
  funDailyCoinCap: 80,  // legacy: fun-game coins no longer exist, kept so an
                        // old saved dailyFun tally still reads sensibly
};

/* =====================================================================
   THE BONUS VAULT — where coins actually come from now.

   Three vaults shimmer; one timing-bar tap cracks one open. The payout
   scales with how close the tap lands to the middle, between the floor
   and the ceiling. THE FLOOR ALWAYS PAYS: there is no losing the bonus
   round, and skipping it collects the floor rather than nothing.

   Calibrated in E4.1 against what the boys really earned before the
   change, so a typical day lands within ±30% of the old income:
   Miles ~130/day (was ~110), Jackson ~187/day (was ~250).

   A bespoke bonus round (GAMES[id].bonusRound === 'custom') replaces the
   Vault and must never pay LESS than floorCoins — a kid should never be
   worse off for playing the game that earned its own bonus round.
   ===================================================================== */
export const VAULT = {
  floorCoins:   40,   // a deliberately terrible tap still pays this
  ceilingCoins: 90,   // a perfect tap
  seconds:      10,   // roughly how long the whole thing takes
  sweepMs:     1400,  // one full left-right sweep of the timing bar
  /* How wide the green target is. After a LEARNING run it widens with
     that run's own accuracy, so the coins are won with the maths rather
     than with thumbs — a 9-year-old must not out-earn a 6-year-old on
     reflexes for the same age-appropriate work. Fun games keep the plain
     narrow bar, because there dexterity is the point. */
  zoneBase:         0.24,
  zoneFromAccuracy: 0.40,
};

/** How wide the target is, 0..1 of the bar. */
export function vaultZone(kind, accuracy){
  if (kind !== 'learn') return VAULT.zoneBase;
  const a = Math.max(0, Math.min(1, Number(accuracy) || 0));
  return VAULT.zoneBase + a * VAULT.zoneFromAccuracy;
}

/** How good the tap was, 0..1, from where the marker sat. Anywhere
    inside the green pays in full; outside it falls away to the floor. */
export function vaultAccuracy(pos, zone){
  const z = Math.max(0.01, Math.min(0.98, Number(zone) || VAULT.zoneBase));
  const d = Math.abs((Number(pos) || 0) - 0.5) * 2;   // 0 centre .. 1 edge
  if (d <= z) return 1;
  return Math.max(0, 1 - (d - z) / (1 - z));
}

/** floor..ceiling by how good the tap was (0..1). */
export function vaultPayout(accuracy){
  const a = Math.max(0, Math.min(1, Number(accuracy) || 0));
  return Math.round(VAULT.floorCoins + (VAULT.ceilingCoins - VAULT.floorCoins) * a);
}

/** Every coin that lands anywhere goes through here first: the shared
    daily cap, tomorrow-flavoured rather than refused. */
export function clampDailyCoins(want, daily, dayStr){
  const date  = dayStr || todayKey();
  const fresh = (daily && daily.date === date) ? daily : { date, total: 0 };
  const asked = Math.max(0, Math.round(Number(want) || 0));
  const room  = Math.max(0, ECONOMY.dailyCoinCap - (fresh.total || 0));
  const granted = Math.min(asked, room);
  return {
    granted, room,
    dailyCoins: { date, total: (fresh.total || 0) + granted },
    capped: granted < asked,
  };
}

/* =====================================================================
   THE PILLAR ECONOMY — bricks & sparks (foundation only)

   The three-pillar reward model: 🧠 Learn pays 🧱 bricks, 🎮 Play pays
   ⚡ sparks, 🎨 Create pays 🪙 coins.

   This block adds the first two ALONGSIDE the ECONOMY above. Nothing
   about how xp or coins are earned changes here. Coins moving to the
   Create pillar (friends visiting a kid's My World) is a real later
   step, but it can't happen until My World exists — doing it now would
   leave the Shop with no way to earn anything to spend.

   There is nowhere to spend bricks or sparks yet either; My World's
   Build Mode is the spend surface. They pile up on purpose until then.
   ===================================================================== */
export const PILLAR_ECONOMY = {
  bricksPerRun:    30,   // Learn games: bricks = share of the run × this,
                         // for the same equal-pay reason as xpPerRun
  bricksPerCorrect: 2,   // retired — kept only so an old saved award that
                         // still carries the key reads sensibly
  sparksPerUnit:    1,   // Play games: sparks = whatever `units` that game
                         // already passes to finishRun × this
  dailySparkCap:   60,   // per kid per day, across all fun games combined —
                         // same spirit as the existing daily fun cap
};

/* =====================================================================
   THE SAFETY NET

   No run may last forever. Every game is supposed to end on its own —
   three outs, sixty seconds, the last page — but a kid who walks away
   mid-question leaves a run open indefinitely in every question-driven
   game here, because none of them has an idle timeout.

   This is the backstop, not the design. A run that crosses this line is
   ended warmly through the normal award path with full credit for
   everything earned. Never a freeze, never a lost run, and never a word
   about screen time.
   ===================================================================== */
export const SAFETY = {
  maxRunMinutes: 45,    // measured from the start of the run, or from the
                        // last completed one — a kid playing lots of short
                        // innings keeps resetting it
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
  'loot-drop':            { name:'Loot Drop',            kind:'learn', xpMult:1.0,  coinMult:1.0, critterMode:'roll',
                            bonusRound:'custom',   // its own between-round mini-games
                            runQuestions:5,        // one drop = five challenges
                            emoji:'\u{1FA82}', grades:'GRADES 1–5', section:'practice',
                            href:'loot-drop/index.html', feature:true,
                            blurb:'Read and solve to loot chests — but you need 80% to get home with them. Level up, win sprites, then trade with your brother.' },
  'math-defender':        { name:'Math Defender',        kind:'learn', xpMult:1.0,  coinMult:1.0, critterMode:'roll', bonusRound:'vault',
                            runQuestions:20,       // Sprint: 20 correct ends it
                            emoji:'⛏️', grades:'GRADES 3–5', section:'practice',
                            href:'math-defender/index.html', tileClass:'ac-tile--math' },
  'coin-climb':           { name:'Coin Climb',           kind:'learn', xpMult:1.0,  coinMult:1.0, critterMode:'roll', bonusRound:'vault',
                            runQuestions:15,       // Race: 15 correct reaches the flag
                            emoji:'\u{1FA99}', grades:'GRADES 1–2', section:'practice',
                            href:'coin-climb/index.html', tileClass:'ac-tile--math' },
  'math-baseball':        { name:'Math Baseball',        kind:'learn', xpMult:1.0,  coinMult:1.0, critterMode:'roll',
                            bonusRound:'custom',   // the Home Run Derby
                            runQuestions:12,       // a typical inning before three outs
                            emoji:'⚾', grades:'ALL GRADES', section:'practice',
                            href:'math-baseball/index.html', tileClass:'ac-tile--math' },
  /* Kid-facing name only. The folder, the game id, the URLs and every
     saved stat keep 'critter-catchers' — renaming those would orphan the
     session history and the parent report. */
  'critter-catchers':     { name:'Critter Reader',       kind:'learn', xpMult:1.0,  coinMult:1.0,
                            /* no random rolls: the Reader is the one place a kid CHOOSES a
                               critter — star quests grant through awardRun's sprite path (E3) */
                            critterMode:null, bonusRound:'vault',
                            /* one story; the game passes its real page count, so a
                               4-page and a 5-page story are both one full run */
                            runQuestions:4,
                            emoji:'\u{1F4D6}', grades:'GRADES 1–3', section:'practice',
                            href:'critter-catchers/index.html', tileClass:'ac-tile--reading' },
  'multiverse-collector': { name:'Raining Cats and Dogs',  kind:'fun',   xpMult:0.30, coinMult:0.25,
                            critterMode:'encounter', bonusRound:'vault',
                            captureCondition:{ text:'Stay on the trampoline until the timer runs out',
                                               test:(r) => r?.completed === true },
                            emoji:'\u{1F436}', grades:'ANY AGE', section:'fun',
                            /* the folder (and the game id) keep the old name:
                               they key the leaderboard and every saved stat */
                            href:'multiverse-collector/index.html' },
  'block-stacker':        { name:'Block Stacker',        kind:'fun',   xpMult:0.30, coinMult:0.25, critterMode:'roll', bonusRound:'vault',
                            emoji:'\u{1F9F1}', grades:'ANY AGE', section:'fun',
                            href:'block-stacker/index.html' },
  'escape-jungle':        { name:'Escape from the Jungle', kind:'fun',  xpMult:0.30, coinMult:0.25, critterMode:'roll', bonusRound:'vault',
                            emoji:'\u{1F334}', grades:'ANY AGE', section:'fun',
                            href:'escape-jungle/index.html' },
  'harvest-night':        { name:'Harvest Night',        kind:'fun',   xpMult:0.30, coinMult:0.25,
                            critterMode:'encounter', bonusRound:'vault',
                            captureCondition:{ text:'Escape through the gate with all three keys',
                                               test:(r) => r?.escaped === true },
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
     xp      = learning ? runShare * xpPerRun  * xpMult
                        : units    * xpPerUnit * xpMult
             + learning ? (cleared ? clearBonusXp : consolationXp) : 0
             + learning ? minutes * xpPerMinute : 0
     coins   = bonusCoins only — see below

   Coins are NOT paid per run any more (R2B · E4). A run's coin line is
   whatever its bonus round handed over, nothing else; the shared Bonus
   Vault runs after the award and pays through grantCoins().

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

  // How much of a full run this was. A game may pass its own target when
  // it knows better than the catalog does — Critter Reader does, because
  // a level-2 story is five pages where a level-1 story is four, and both
  // are one whole story.
  const target   = Math.max(1, Number(r.runQuestions) || game.runQuestions || 1);
  const runShare = learn ? Math.min(ECONOMY.maxRunShare, units / target) : 0;

  let xp = learn
    ? Math.round(runShare * ECONOMY.xpPerRun * game.xpMult)
    : Math.round(units * ECONOMY.xpPerUnit * game.xpMult);
  if (learn){
    xp += cleared ? ECONOMY.clearBonusXp : ECONOMY.consolationXp;
    xp += Math.round(minutes * ECONOMY.xpPerMinute);
  }
  // The ONLY coins a run carries: what its bespoke bonus round paid
  // (Math Baseball's Home Run Derby). Coins are what earned bonus PLAY
  // pays — never answering questions — so this can never touch units,
  // accuracy or 🧱 bricks, and answering perfectly pays no coin by
  // itself. The shared Vault pays separately, after the award.
  const bonusCoins = Math.max(0, Math.round(Number(r.bonusCoins) || 0));
  const coins = bonusCoins;
  return { xp, coins, kind: game.kind, units, runShare, accuracy, minutes, cleared, asked, correct, seconds, bonusCoins };
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

/** Bricks and sparks for one finished run, paid alongside xp/coins.

    Learn games pay bricks per correct answer; fun games pay sparks on the
    same `units` they already report, clamped to what's left of today's
    spark budget. `award` is computeAward()'s result, `daily` is the
    character's wallet.dailySparks ({ date, total }), and the returned
    `dailySparks` is what to store back.

    A learn run never moves the spark total, but still returns the
    date-rolled tally so a new day starts from zero whatever was played. */
export function computePillarAward(award, daily, dayStr){
  const date  = dayStr || todayKey();
  const fresh = (daily && daily.date === date) ? daily : { date, total: 0 };

  // Same equal-pay rule as xp: the share of the run, not the raw count.
  const bricksEarned = award.kind === 'learn'
    ? Math.round(Math.max(0, Number(award.runShare) || 0) * PILLAR_ECONOMY.bricksPerRun)
    : 0;

  // Sparks come from a fun game's own units and nothing else. A bonus
  // round earned inside a learn game (Math Baseball's Home Run Derby)
  // pays 🪙 coins instead, through computeAward — see the note there.
  const want = award.kind === 'fun'
    ? Math.round(Math.max(0, Number(award.units) || 0) * PILLAR_ECONOMY.sparksPerUnit)
    : 0;
  const room = Math.max(0, PILLAR_ECONOMY.dailySparkCap - (fresh.total || 0));
  const sparksEarned = Math.min(want, room);

  return {
    bricksEarned,
    sparksEarned,
    dailySparks: { date, total: (fresh.total || 0) + sparksEarned },
    cappedSparks: sparksEarned < want,
  };
}

/* =====================================================================
   TRADING — saying the shape of a deal out loud.

   A 3rd grader can talk a 1st grader into five-for-one. The call (AJ,
   Aug 2026) is NOT to block that — kids negotiate, and generosity is
   the point — but to make sure the smaller kid can see what they are
   agreeing to. So both the builder and the incoming-offer card print
   the shape in plain words.

   Information, never judgement: there is no "good deal"/"bad deal", no
   score, and no price tag, because scoring a trade would teach exactly
   the wrong lesson about giving things to your brother.
   ===================================================================== */
export function describeTradeShape(giveIds, getIds){
  const give = (giveIds || []).length, get = (getIds || []).length;
  if (!give || !get) return '';
  const shape = `That's ${give} for ${get}`;
  if (give === get){
    return give === 1
      ? `${shape} — a straight swap. Your call! 🙂`
      : `${shape} — an even swap. Your call! 🙂`;
  }
  // The never-your-last-copy rule means this is always true when it is
  // shown, so it can be stated as a fact rather than a promise.
  if (give > get) return `${shape} — you'd still have one of each. Your call! 🙂`;
  return `${shape} — you'd be getting more than you give. Your call! 🙂`;
}

/** Every distinct sprite in a side, with how many copies it asks for. */
export function tradeTally(ids){
  const t = {};
  for (const id of ids || []) t[id] = (t[id] || 0) + 1;
  return t;
}

/**
 * Why this side of a trade is not allowed, or null if it is. ONE
 * definition, used by the builder to grey a chip out, by proposeTrade
 * before the offer is written, and again inside respondToTrade's
 * transaction at the moment the sprites actually move.
 *
 * The hard guardrail: never your last copy. For each distinct sprite a
 * kid is giving up, they must hold at least one MORE than they are
 * handing over — on both sides of the trade, so nobody can be talked
 * out of the only one they have.
 */
export function tradeSideProblem(counts, ids){
  if (!Array.isArray(ids) || ids.length < 1) return 'empty';
  if (ids.length > ECONOMY.maxTradeItems) return 'too many';
  const tally = tradeTally(ids);
  for (const [id, n] of Object.entries(tally)){
    if (!inCollection(id)) return 'missing';
    if ((counts?.[id] || 0) < n + 1) return 'last copy';
  }
  return null;
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
    // Parked (unaffiliated) sprites are invisible everywhere, the score
    // included — otherwise a number a kid can't see would move the board.
    if (sprite && n > 0 && inCollection(id)) s += n * COLLECTION_POINTS[sprite.r];
  }
  return s;
}

/* =====================================================================
   FINDING CRITTERS — drops, encounters, and the level gate (R2B · E2)

   Two ways a game hands out a critter, declared per game as
   GAMES[id].critterMode:

     'roll'       question games — a qualifying run rolls at the end
     'encounter'  spatial games — the critter appears IN the gameplay,
                  is carried as a pending capture, and only confirms
                  through awardRun when the run ends successfully
                  (GAMES[id].captureCondition says what "successfully"
                  means for that game)

   Both draw from the same level-gated pool, share the same daily cap,
   and go through rollCritter() below, so neither is a better farm.
   Loot Drop's in-round chests are separate and exempt from the cap —
   they only respect the gate and the mythic fold.
   ===================================================================== */
export const DROPS = {
  qualifyAccuracy: 0.80,   // learn games: a run this accurate earns a roll
  qualifyUnits: {          // fun games: units in one run that earn a roll
    'multiverse-collector': 12,
    'block-stacker': 10,
    'harvest-night': 1,
    'escape-jungle': 10,   // gems banked on an escape (not in the spec table — tunable)
  },
  bonusAtAccuracy: 1.0,    // a perfect learn run earns a second roll
  bonusAtUnitsMult: 2,     // twice the milestone earns a second roll
  dailyCap: 4,             // per kid per day — reward rolls AND confirmed encounters
  pityRuns: 8,             // qualifying runs without an epic+ (once epic is
                           // unlocked) guarantee rare+ on the next roll
  /* Share of drops aimed at a critter the kid does NOT have yet, so most
     of what arrives is progress rather than a lottery ticket. The rest
     may well be a duplicate — and duplicates are trade goods, so this
     number must never reach 1.0 or trading runs out of fuel.

     Measured at 4 drops/day: at 0.70 a kid's FIRST spare does not arrive
     until day 8, which leaves the trade tab unusable for a week. At 0.60
     it arrives on day 2, for the same number of unique critters by day
     30 (76 vs 77). Hence 0.60. */
  aimAtMissingChance: 0.60,
};

const RARITY_RANK = { common: 0, rare: 1, epic: 2, legendary: 3 };
const rank = (r) => RARITY_RANK[displayRarity(r)] ?? 0;

/** The highest rarity a kid at this level can find. */
export function unlockedBand(level){
  let band = 'common';
  for (const r of DISPLAY_RARITY_ORDER) if ((Number(level) || 1) >= RARITY_UNLOCK[r]) band = r;
  return band;
}

/** Clamp, never waste: a roll above the kid's band lands at the top of
    their band. Returns the (display) rarity and whether it moved. */
export function clampRarity(rarity, level){
  const r = displayRarity(rarity);
  const band = unlockedBand(level);
  return rank(r) > rank(band) ? { rarity: band, clamped: true } : { rarity: r, clamped: false };
}

/** Which rarity bands open between two levels — the level-up beat. */
export function newlyUnlockedRarities(oldLevel, newLevel){
  return DISPLAY_RARITY_ORDER.filter((r) => RARITY_UNLOCK[r] > (oldLevel || 1) && RARITY_UNLOCK[r] <= (newLevel || 1));
}

/** Was this a good run? ONE definition, shared by critter drops and the
    Bonus Vault, so "you did well" means exactly the same thing to both:
    learn games on accuracy, fun games on a per-game milestone. */
export function runQualifies(gameId, award){
  const game = GAMES[gameId];
  if (!game) return false;
  if (game.kind === 'learn') return (award.asked || 0) > 0 && award.accuracy >= DROPS.qualifyAccuracy;
  const need = DROPS.qualifyUnits[gameId];
  return !!need && award.units >= need;
}

/** Does a finished run earn a roll? `award` is computeAward()'s result.
    A perfect run or a double milestone earns a second roll.
    Returns 0, 1 or 2. */
export function dropRolls(gameId, award){
  const game = GAMES[gameId];
  if (!game || game.critterMode !== 'roll') return 0;
  if (!runQualifies(gameId, award)) return 0;
  if (game.kind === 'learn') return award.accuracy >= DROPS.bonusAtAccuracy ? 2 : 1;
  return award.units >= DROPS.qualifyUnits[gameId] * DROPS.bonusAtUnitsMult ? 2 : 1;
}

/** Does the shared Bonus Vault open after this run? Only for a
    qualifying run in a game with no bespoke bonus round of its own. */
export function vaultOpens(gameId, award){
  return GAMES[gameId]?.bonusRound === 'vault' && runQualifies(gameId, award);
}

/** Today's drop state, rolled to `dayStr`: the daily count resets, the
    pity counter carries across days. */
export function freshDrops(drops, dayStr){
  const date = dayStr || todayKey();
  const d = drops || {};
  return { date, count: d.date === date ? (d.count || 0) : 0, sinceEpic: d.sinceEpic || 0 };
}
export function dropsLeftToday(drops, dayStr){
  return Math.max(0, DROPS.dailyCap - freshDrops(drops, dayStr).count);
}

/**
 * ONE critter from the wild — the roll every mode shares.
 *   1. rarity from rollRarity(luck), mythic folded to legendary
 *   2. clamped down to the kid's band (never wasted, never refused)
 *   3. pity: once epic is unlocked and `sinceEpic` runs have gone by
 *      without one, a common becomes a rare
 *   4. Collection Focus: a share of rolls is re-aimed at the focused
 *      collection's missing, unlocked members — same rarity if it has
 *      one missing, otherwise a lower one; never higher
 * Returns { spriteId, rarity, clamped, pity, focus }.
 */
export function rollCritter({ level = 1, luck = 0, counts = {}, focusCollection = null, sinceEpic = 0, rand = Math.random } = {}){
  let { rarity, clamped } = clampRarity(rollRarity(luck, rand), level);
  let pity = false;
  if (level >= RARITY_UNLOCK.epic && sinceEpic >= DROPS.pityRuns && rank(rarity) < RARITY_RANK.rare){
    rarity = 'rare'; pity = true;
  }

  /* Which ONE of that rarity. Most of the time it is aimed at something
     the kid is still missing, so a drop is progress rather than a
     lottery ticket; the rest of the time it is anything, which is often
     a spare — and spares are what trading runs on.

     Collection Focus is a PRIORITY here, not a bonus: it decides which
     collection gets first claim on the aimed drops. It never raises the
     rarity and it never downgrades one either. */
  const ofRarity = LIVE_SPRITE_IDS.filter((id) => displayRarity(spriteById(id).r) === rarity);
  const has = (id) => (((counts || {})[id]) || 0) > 0;

  let pool = ofRarity, aimed = false, focus = false;
  if (rand() < DROPS.aimAtMissingChance){
    const missing = ofRarity.filter((id) => !has(id));
    const col = focusCollection && COLLECTIONS.find((c) => c.id === focusCollection);
    const focused = col ? missing.filter((id) => col.members.includes(id)) : [];
    if (focused.length){ pool = focused; aimed = true; focus = true; }
    else if (missing.length){ pool = missing; aimed = true; }
    // Nothing of this rarity left to find? Fall through to a spare. Never
    // nothing, and never a downgrade to a rarity the kid didn't roll.
  }

  const spriteId = pool[Math.floor(rand() * pool.length)];
  return { spriteId, rarity: displayRarity(spriteById(spriteId).r), clamped, pity, focus, aimed };
}

/**
 * A run's worth of reward rolls against the daily cap.
 *   rolls      from dropRolls()
 *   character  { level | xp, counts, drops, focusCollection }
 * Returns { drops:[{spriteId, rarity, isNew, clamped, pity, focus, source}],
 *           dropsState, capped } — `capped` means at least one earned
 * roll had to wait for tomorrow. Never throws, never returns a drop the
 * kid can't keep.
 */
export function rollDrops({ rolls = 0, character = {}, luck = 0, dayStr, rand = Math.random } = {}){
  const level = character.level ?? levelFromXp(character.xp || 0).level;
  const state = freshDrops(character.drops, dayStr);
  const counts = { ...(character.counts || {}) };
  const n = Math.max(0, Math.min(rolls, DROPS.dailyCap - state.count));
  const drops = [];
  for (let i = 0; i < n; i++){
    const d = rollCritter({ level, luck, counts, focusCollection: character.focusCollection, sinceEpic: state.sinceEpic, rand });
    d.isNew = !(counts[d.spriteId] > 0);
    d.source = 'roll';
    counts[d.spriteId] = (counts[d.spriteId] || 0) + 1;
    drops.push(d);
  }
  state.count += n;
  tallyPity(state, level, rolls > 0, drops);
  return { drops, dropsState: state, capped: rolls > n };
}

/** Pity bookkeeping, shared by rolls and confirmed encounters: one
    qualifying run without an epic+ adds one; any epic+ resets. Only
    counts once epic is actually findable. */
export function tallyPity(state, level, qualified, drops){
  if (!qualified || level < RARITY_UNLOCK.epic) return state;
  state.sinceEpic = drops.some((d) => rank(d.rarity) >= RARITY_RANK.epic) ? 0 : (state.sinceEpic || 0) + 1;
  return state;
}

/** Confirm a spatial game's pending captures at the end of a successful
    run, against what's left of today's cap. Anything over the cap is
    simply not granted (spawning already stops at the cap, so this is a
    backstop, not a path a kid should ever hit). */
export function confirmCaptures({ captures = [], character = {}, dayStr } = {}){
  const level = character.level ?? levelFromXp(character.xp || 0).level;
  const state = freshDrops(character.drops, dayStr);
  const counts = { ...(character.counts || {}) };
  const ids = captures.map((s) => spriteId(spriteIndex(typeof s === 'number' ? spriteId(s) : String(s))))
                      .filter((id) => inCollection(id));
  const keep = ids.slice(0, Math.max(0, DROPS.dailyCap - state.count));
  const drops = keep.map((id) => {
    const d = { spriteId: id, rarity: displayRarity(spriteById(id).r), isNew: !(counts[id] > 0), clamped: false, pity: false, focus: false, source: 'encounter' };
    counts[id] = (counts[id] || 0) + 1;
    return d;
  });
  state.count += keep.length;
  tallyPity(state, level, keep.length > 0, drops);
  return { drops, dropsState: state, overflow: ids.slice(keep.length) };
}

/** What an encounter game should spawn right now, or null when today's
    cap (minus what's already pending in this run) is spent — never spawn
    something that can't be kept. `luck` defaults to the streak alone. */
export function encounterSpawn(character, { pending = 0, dayStr, rand = Math.random } = {}){
  const left = dropsLeftToday(character?.drops, dayStr) - pending;
  if (left <= 0) return null;
  const level = character?.level ?? levelFromXp(character?.xp || 0).level;
  const luck = luckScore({ accuracy: 0.5, practicePower: practicePowerNow(character, dayStr) });
  const d = rollCritter({ level, luck, counts: character?.counts, focusCollection: character?.focusCollection, sinceEpic: character?.drops?.sinceEpic || 0, rand });
  return { ...d, sprite: spriteById(d.spriteId), index: spriteIndex(d.spriteId), left };
}

/* =====================================================================
   CRITTER READER — the bedtime star ladder (R2B · E3)

   Reading is the slow, guaranteed road to a critter, and the ONLY place
   in the arcade where a kid picks which one they are chasing. One star
   per calendar day, however many stories they read; the rarer the
   critter, the more nights it takes.

   Mythic folds into legendary here like everywhere else, so Twinkle
   costs the same ten nights as any other crown.
   ===================================================================== */
export const CRITTER_STARS = { common: 1, rare: 3, epic: 6, legendary: 10 };

/** Nights of reading to earn this critter. */
export function starsNeededFor(id){
  const s = spriteById(id);
  return s ? CRITTER_STARS[displayRarity(s.r)] : 1;
}

/* The 12 bedtime critters, by the string id Critter Reader has always
   used locally, mapped to the sprite ids they were appended as in E1.
   This is the one and only migration table for the old local dex. */
export const BEDTIME_SPRITE_IDS = {
  pip:'s60', mo:'s61', wren:'s62', sprout:'s63', luna:'s64', bram:'s65',
  puddle:'s66', ziggy:'s67', nova:'s68', willow:'s69', biscuit:'s70', twinkle:'s71',
};
