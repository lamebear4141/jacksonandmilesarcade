/* =====================================================================
   LOOT DROP — state: the bridge to the site-wide character.

   Loot Drop used to keep two hardcoded profiles (miles / jackson) in its
   own localStorage blob. The character is site-wide now, so this module
   became an ADAPTER:

     · XP, coins, skins, pets, sprite counts and the day streak are THE
       SHARED CHARACTER's — loaded once at boot into a session profile
       object shaped exactly like the old one, so game.js keeps mutating
       it synchronously mid-round without knowing anything changed.

     · At the end of a round, syncRoundToCharacter() diffs the session
       profile against a snapshot taken at round start and pushes exactly
       that delta through awardRun() — one write, increments only.

     · Loot-Drop-SPECIFIC history stays Loot Drop's: the daily records
       (`days`, which feed the grown-up view) and the
       reading/math lifetime split live in localStorage under
       lootdrop.v2.{childId}, per child.

   The extraction rule, reboot van, luck and rarity rolls are untouched —
   those are game mechanics, not progression.
   ===================================================================== */
import { CONFIG, SPRITES, RARITY, RARITY_ORDER, SKINS, PETS, levelFromXp, GRADES, spriteId } from './config.js';
import { spriteIndex, inCollection, displayRarity, LIVE_SPRITE_IDS, practicePowerNow } from '../../assets/catalog.js';
import { encodeSquad, decodeSquad } from '../../assets/squad-code.js';

/** Does index i belong to a collection? Parked sprites never count,
    never roll, and never show — here or anywhere else. */
const live = (i) => inCollection(spriteId(i));
import { loadCharacter, awardRun, grantCoins, equipItem, getChild, ageFromBirthday, isGuestKid } from '../../firebase-config.js';

const MEM = {};
const store = {
  get(k){ try { const v = localStorage.getItem(k); return v == null ? (MEM[k] ?? null) : v; } catch(e){ return MEM[k] ?? null; } },
  set(k,v){ MEM[k] = v; try { localStorage.setItem(k, v); } catch(e){} },
};

export function today(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function dayBefore(s, n){
  const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() - n);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

/* ---------------- local (Loot-Drop-only) history ---------------- */
const LOCAL_KEY = (childId) => 'lootdrop.v2.' + childId;

function blankLocal(){
  return {
    days: {},               // date -> daily record (luck + grown-up view)
    lifetime: { rounds:0, extracted:0, eliminated:0, attempted:0, correct:0, seconds:0,
                readAttempted:0, readCorrect:0, mathAttempted:0, mathCorrect:0 },
    migrated: null,         // null = never asked; 'miles'|'jackson'|'fresh'
  };
}
function readLocal(childId){
  try {
    const raw = JSON.parse(store.get(LOCAL_KEY(childId)));
    if (!raw) return blankLocal();
    return { ...blankLocal(), ...raw, lifetime: { ...blankLocal().lifetime, ...(raw.lifetime||{}) } };
  } catch(e){ return blankLocal(); }
}
function writeLocal(childId, local){ store.set(LOCAL_KEY(childId), JSON.stringify(local)); }

/* ---------------- boot: character -> session profile ---------------- */
let CURRENT = null;   // { childId, local }

/** Load the shared character and shape it like a Loot Drop profile.
    game.js mutates this object synchronously all round long. */
export async function initFor(kid){
  const character = await loadCharacter(kid.id);
  const local = readLocal(kid.id);
  CURRENT = { childId: kid.id, local };

  // Content difficulty from the birthday on the child's profile — the
  // same source the math games use. Two bands exist: grade 1 and grade 3.
  // No birthday (guests) gets the gentler band; reading too easy beats
  // reading too hard.
  let grade = 1;
  if (!isGuestKid(kid.id)){
    try {
      const child = await getChild(kid.id);
      const age = ageFromBirthday(child?.birthday);
      if (age != null && age >= 8) grade = 3;
    } catch(e){ /* stay gentle */ }
  }

  const counts = new Array(SPRITES.length).fill(0);
  for (const [id, n] of Object.entries(character.counts || {})){
    const i = spriteIndex(id);
    if (i >= 0) counts[i] = n;
  }

  return {
    who: kid.id, id: kid.id, name: kid.nickname, grade,
    xp: character.xp || 0,
    coins: character.coins || 0,
    skin: character.skin || 'rookie',
    pet: character.pet || 'none',
    ownedSkins: [...(character.ownedSkins || ['rookie'])],
    ownedPets: [...(character.ownedPets || ['none'])],
    counts,
    dayStreak: character.dayStreak || 0,
    // Read through the helper, so a profile opened after a few days away
    // shows the decayed value rather than the stored one.
    practicePower: practicePowerNow(character),
    lastPlayed: character.lastPlayed || null,
    claimedStreakGifts: [...(character.claimedStreakGifts || [])],
    days: local.days,
    lifetime: local.lifetime,
  };
}

/** Persist the Loot-Drop-only history (days + read/math lifetime).
    Everything shared flows through syncRoundToCharacter instead. */
export function saveAll(all){
  if (!CURRENT) return;
  const p = all?.profiles?.[CURRENT.childId];
  if (!p) return;
  CURRENT.local.days = p.days;
  CURRENT.local.lifetime = p.lifetime;
  writeLocal(CURRENT.childId, CURRENT.local);
}

/* ---------------- the round -> character sync ---------------- */

/** Everything a round can change on the shared character, frozen at
    round start so the delta is exact no matter what the round grants. */
export function takeSnapshot(p){
  return {
    xp: p.xp, coins: p.coins,
    counts: p.counts.slice(),
    ownedSkins: p.ownedSkins.slice(),
    ownedPets: p.ownedPets.slice(),
    claimedStreakGifts: p.claimedStreakGifts.slice(),
  };
}

/**
 * Push one finished round to the shared character as a single award:
 * the exact xp/coin delta (Loot Drop's richer totals — sprite bonuses,
 * level coins, streak gifts — ride through awardRun's override), the
 * sprites won, and anything gifts unlocked. Returns awardRun's outcome.
 */
export async function syncRoundToCharacter(kid, p, snap, meta){
  const sprites = [];
  p.counts.forEach((n, i) => {
    for (let k = (snap.counts[i] || 0); k < n; k++) sprites.push(spriteId(i));
  });
  const outcome = await awardRun(kid.id, 'loot-drop', {
    asked: meta.asked, correct: meta.correct,
    seconds: meta.seconds, score: meta.score,
    sprites,
    grantSkins: p.ownedSkins.filter((s) => !snap.ownedSkins.includes(s)),
    grantPets:  p.ownedPets.filter((s) => !snap.ownedPets.includes(s)),
    claimStreakGifts: p.claimedStreakGifts.filter((d) => !snap.claimedStreakGifts.includes(d)),
    override: { xp: p.xp - snap.xp, coins: Math.max(0, p.coins - snap.coins) },
  });
  // keep the session profile's streak in step with what awardRun rolled
  p.dayStreak = outcome.dayStreak;
  p.lastPlayed = today();
  return outcome;
}

/** Loot Drop's bespoke bonus round. Floored at the same value as the
    shared Vault so a kid is never worse off for playing the game that
    earned its own bonus round, and clamped by the same daily coin cap
    as every other coin in the arcade (grantCoins owns that rule).
    Returns what was actually granted so the UI can say it honestly. */
export async function minigameCoins(kid, p, coins){
  const want = Math.max(CONFIG.minigameFloorCoins, Math.round(coins) || 0);
  try {
    const r = await grantCoins(kid.id, want);
    const granted = r?.ok ? r.granted : want;
    p.coins += granted;
    return { granted, capped: !!r?.capped };
  } catch(e){
    p.coins += want;                    // keep playing; the cloud catches up
    return { granted: want, capped: false };
  }
}

/* ---------------- derived (same shapes as always) ---------------- */
export function dayStreak(p){
  const t = today(), y = dayBefore(t, 1);
  // played Loot Drop today already? count today even if the shared roll
  // hasn't happened yet this session — matches the old feel exactly
  if (p.days?.[t]){
    if (p.lastPlayed === t) return p.dayStreak || 1;
    return p.lastPlayed === y ? (p.dayStreak || 0) + 1 : 1;
  }
  if (p.lastPlayed === t) return p.dayStreak || 0;
  return p.lastPlayed === y ? (p.dayStreak || 0) : 0;
}
export function minutesToday(p){
  const d = p.days[today()];
  return d ? Math.round(d.seconds / 60) : 0;
}
export function levelInfo(p){ return levelFromXp(p.xp); }
export function totalSprites(p){ return p.counts.reduce((a,b,i)=>a+(live(i)?b:0),0); }
export function uniqueSprites(p){ return p.counts.filter((c,i)=>c>0&&live(i)).length; }
/** Four tiers: mythic folds into legendary everywhere a kid looks. */
export function rarityTally(p){
  const t = { common:0, rare:0, epic:0, legendary:0 };
  p.counts.forEach((c,i)=>{ if (c>0 && live(i)) t[displayRarity(SPRITES[i].r)] += c; });
  return t;
}
/** A single "how good is this collection" number, so the boys can settle it. */
export function collectionScore(p){
  const pts = { common:1, rare:3, epic:8, legendary:20, mythic:60 };
  let s = 0;
  p.counts.forEach((c,i)=>{ if (live(i)) s += c * pts[SPRITES[i].r]; });
  return s;
}

/* ---------------- daily record ---------------- */
export function ensureDay(p){
  const t = today();
  p.days[t] ||= { date:t, seconds:0, rounds:0, extracted:0, attempted:0, correct:0,
                  readAttempted:0, readCorrect:0, mathAttempted:0, mathCorrect:0,
                  missed:[], spritesWon:0, bestRarity:null, xp:0, micTrouble:false };
  return p.days[t];
}

/* ---------------- progression (session-local; synced by the diff) ---------------- */
export function addXp(p, amount){
  const before = levelFromXp(p.xp).level;
  p.xp += amount;
  const after = levelFromXp(p.xp).level;
  let gained = [];
  // Levelling up no longer pays coins (E4) — the reward for a level is
  // what it UNLOCKS: shop items, and a new band of critters in the wild.
  for (let l = before + 1; l <= after; l++) gained.push(l);
  return gained;   // list of newly reached levels
}

export function grantSprite(p, index){
  p.counts[index] = (p.counts[index] || 0) + 1;
  return { sprite: SPRITES[index], index, isNew: p.counts[index] === 1 };
}

/** A random LIVE sprite of this rarity. Mythic folds into legendary on
    both sides of the match, so a 'mythic' roll draws from the eight
    legendary crowns (one of which is stored as mythic). */
export function pickSpriteOfRarity(rarity){
  const want = displayRarity(rarity);
  const idxs = SPRITES.map((s,i)=>[s,i]).filter(([s,i])=>live(i) && displayRarity(s.r)===want).map(([,i])=>i);
  return idxs[Math.floor(Math.random()*idxs.length)];
}

/* streak gifts — claimed once each */
export function checkStreakGift(p){
  const s = dayStreak(p);
  const out = [];
  Object.entries(CONFIG.streakGifts).forEach(([dayStr, gift]) => {
    const d = Number(dayStr);
    if (s >= d && !p.claimedStreakGifts.includes(d)){
      p.claimedStreakGifts.push(d);
      out.push({ day:d, gift });
    }
  });
  return out;
}

/* =====================================================================
   ONE-TIME MIGRATION — the old lootdrop.v1 blob, claimed profile by
   profile. Never guess which boy is which: the signed-in child (or the
   parent beside them) picks, and each old profile can only be claimed
   once. The old blob is left in place until both are claimed, so the
   second brother's loot is still there waiting for him.
   ===================================================================== */
const LEGACY_KEY = 'lootdrop.v1';
const CLAIMED_KEY = 'lootdrop.v1.claimed';

function readLegacy(){
  try {
    const raw = JSON.parse(store.get(LEGACY_KEY));
    return raw?.profiles ? raw.profiles : null;
  } catch(e){ return null; }
}
function readClaimed(){
  try { return JSON.parse(store.get(CLAIMED_KEY)) || {}; } catch(e){ return {}; }
}

/**
 * Is there anything to offer this child? Only when the old blob exists,
 * has unclaimed profiles with actual progress, this child hasn't already
 * answered, and their shared character is still blank (never merge into
 * a character that already earned things).
 */
export function migrationOffer(kid, p){
  if (CURRENT?.local.migrated) return null;
  if (p.xp > 0 || totalSprites(p) > 0) return null;
  const legacy = readLegacy();
  if (!legacy) return null;
  const claimed = readClaimed();
  const offers = ['miles', 'jackson']
    .filter((who) => legacy[who] && !claimed[who])
    .map((who) => {
      const lp = legacy[who];
      const counts = Array.isArray(lp.counts) ? lp.counts : [];
      return {
        who, name: GRADES[who]?.name || who,
        level: levelFromXp(lp.xp || 0).level,
        xp: lp.xp || 0, coins: lp.coins || 0,
        sprites: counts.reduce((a,b)=>a+(b||0),0),
      };
    })
    .filter((o) => o.xp > 0 || o.sprites > 0 || o.coins > 0);
  return offers.length ? offers : null;
}

/** Bring one old profile's earnings onto this child's shared character. */
export async function migrateLegacy(kid, p, who){
  const legacy = readLegacy();
  const lp = legacy?.[who];
  if (!lp) return { ok:false };

  const counts = Array.isArray(lp.counts) ? lp.counts : [];
  const sprites = [];
  counts.forEach((n, i) => { for (let k = 0; k < (n||0); k++) sprites.push(spriteId(i)); });

  const outcome = await awardRun(kid.id, 'loot-drop', {
    asked: 0, correct: 0, seconds: 0, score: 0,
    sprites,
    grantSkins: (lp.ownedSkins || []).filter((s) => s !== 'rookie'),
    grantPets:  (lp.ownedPets  || []).filter((s) => s !== 'none'),
    claimStreakGifts: lp.claimedStreakGifts || [],
    override: { xp: lp.xp || 0, coins: lp.coins || 0 },
  });

  // What they WORE comes along too, not just what they owned. Ownership
  // was written by the award above, so the equip's owned-check passes.
  if (lp.skin && lp.skin !== 'rookie') await equipItem(kid.id, 'skin', lp.skin).catch(() => {});
  if (lp.pet && lp.pet !== 'none')     await equipItem(kid.id, 'pet',  lp.pet).catch(() => {});

  // Loot-Drop-only history rides along locally.
  CURRENT.local.days = lp.days || {};
  CURRENT.local.lifetime = { ...blankLocal().lifetime, ...(lp.lifetime || {}) };
  CURRENT.local.migrated = who;
  writeLocal(kid.id, CURRENT.local);
  const claimed = readClaimed();
  claimed[who] = kid.id;
  store.set(CLAIMED_KEY, JSON.stringify(claimed));

  // refresh the session profile in place
  const fresh = await initFor(kid);
  Object.assign(p, fresh);
  return { ok:true, outcome };
}

/** The child chose to start fresh — don't ask again. */
export function declineMigration(kid){
  CURRENT.local.migrated = 'fresh';
  writeLocal(kid.id, CURRENT.local);
}

/* =====================================================================
   SQUAD CODE — compact, shareable, no backend; still the only way to
   compare with a cousin in a different family. The codec itself lives
   in assets/squad-code.js (pure, so it is unit-tested): codes are now
   written as scheme v2 — one OWNED bit per sprite, which is all the
   compare screen ever showed — and old v1 links still decode.
   ===================================================================== */
export function makeSquadCode(p){
  // the who-byte kept meaning "miles or jackson" in old codes; a migrated
  // child keeps their old identity bit so existing shared codes line up
  const whoBit = CURRENT?.local.migrated === 'jackson' ? 1 : 0;
  return encodeSquad({
    whoBit, level: levelInfo(p).level, streak: dayStreak(p),
    rounds: p.lifetime.rounds, counts: p.counts,
  });
}

export function readSquadCode(code){
  const d = decodeSquad(code);
  if (!d) return null;
  const who = d.whoBit === 1 ? 'jackson' : 'miles';
  const fake = { counts: d.counts };
  return { who, name: GRADES[who]?.name || 'Rival', level: d.level, streak: d.streak,
           rounds: d.rounds, counts: d.counts,
           total: totalSprites(fake),
           unique: uniqueSprites(fake),
           score: collectionScore(fake) };
}

/* =====================================================================
   Grown-up view payload — this child only, from the local history.
   ===================================================================== */
export function buildReport(p){
  const d = p.days[today()] || null;
  const hist = Object.values(p.days).sort((a,b)=> a.date < b.date ? 1 : -1).slice(0, 30);
  const lt = p.lifetime;
  return {
    generatedAt: new Date().toISOString(), game:'Loot Drop', date: today(),
    player: {
      name: p.name,
      playedToday: !!d,
      today: d && { minutes: Math.round(d.seconds/60), rounds:d.rounds, extracted:d.extracted,
        attempted:d.attempted, correct:d.correct,
        accuracyPct: d.attempted ? Math.round(d.correct/d.attempted*100) : 0,
        readingAccuracyPct: d.readAttempted ? Math.round(d.readCorrect/d.readAttempted*100) : null,
        mathAccuracyPct: d.mathAttempted ? Math.round(d.mathCorrect/d.mathAttempted*100) : null,
        missed: d.missed, spritesWon:d.spritesWon, bestRarity:d.bestRarity, xpEarned:d.xp },
      level: levelInfo(p).level,
      dayStreak: dayStreak(p),
      coins: p.coins,
      collection: { unique: uniqueSprites(p), total: totalSprites(p), outOf: LIVE_SPRITE_IDS.length,
                    score: collectionScore(p), byRarity: rarityTally(p) },
      lifetime: { ...lt, accuracyPct: lt.attempted ? Math.round(lt.correct/lt.attempted*100) : 0,
                  readingAccuracyPct: lt.readAttempted ? Math.round(lt.readCorrect/lt.readAttempted*100) : null,
                  mathAccuracyPct: lt.mathAttempted ? Math.round(lt.mathCorrect/lt.mathAttempted*100) : null,
                  minutes: Math.round(lt.seconds/60) },
      history: hist,
      squadCode: makeSquadCode(p),
    },
  };
}

export function downloadReport(p){
  try {
    const blob = new Blob([JSON.stringify(buildReport(p), null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lootdrop-' + today() + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return true;
  } catch(e){ return false; }
}

/* =====================================================================
   SYNC HOOK — kept as the seam for cross-family compare. Siblings now
   compare automatically on the family leaderboard; codes remain the only
   way to compare with a cousin in a different family.
   Set window.LOOTDROP_SYNC = { push(who, code), pull(who) } and it's used.
   ===================================================================== */
export async function syncPush(p){
  const s = window.LOOTDROP_SYNC;
  if (!s || !s.push) return false;
  try { await s.push(p.who, makeSquadCode(p)); return true; } catch(e){ return false; }
}
export async function syncPull(who){
  const s = window.LOOTDROP_SYNC;
  if (!s || !s.pull) return null;
  try { const code = await s.pull(who); return code ? readSquadCode(code) : null; } catch(e){ return null; }
}

export { RARITY, RARITY_ORDER, SPRITES, SKINS, PETS, GRADES };
