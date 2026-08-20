/* =====================================================================
   LOOT DROP — profiles, saving, progression, squad codes
   Two profiles (miles / jackson) live side by side in localStorage.
   ===================================================================== */
import { CONFIG, SPRITES, RARITY, RARITY_ORDER, SKINS, PETS, levelFromXp, GRADES } from './config.js';

const KEY = 'lootdrop.v1';
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

function blankProfile(who){
  return {
    who, xp:0, coins:0,
    counts: new Array(SPRITES.length).fill(0),   // how many of each sprite
    skin:'rookie', pet:'none',
    ownedSkins:['rookie'], ownedPets:['none'],
    days:{},                 // date -> daily record
    lifetime:{ rounds:0, extracted:0, eliminated:0, attempted:0, correct:0, seconds:0,
               readAttempted:0, readCorrect:0, mathAttempted:0, mathCorrect:0 },
    claimedStreakGifts:[],
  };
}
function blankAll(){ return { version:1, profiles:{ miles:blankProfile('miles'), jackson:blankProfile('jackson') } }; }

export function loadAll(){
  try {
    const raw = JSON.parse(store.get(KEY));
    if (!raw || !raw.profiles) return blankAll();
    // heal older/short arrays if the sprite list ever grows
    Object.values(raw.profiles).forEach(p => {
      if (!Array.isArray(p.counts)) p.counts = new Array(SPRITES.length).fill(0);
      while (p.counts.length < SPRITES.length) p.counts.push(0);
      p.ownedSkins ||= ['rookie']; p.ownedPets ||= ['none'];
      p.claimedStreakGifts ||= []; p.days ||= {};
      p.lifetime ||= blankProfile(p.who).lifetime;
    });
    return raw;
  } catch(e){ return blankAll(); }
}
export function saveAll(all){ store.set(KEY, JSON.stringify(all)); }

/* ---------------- derived ---------------- */
export function dayStreak(p){
  const t = today();
  let n = 0;
  let cursor = p.days[t] ? t : dayBefore(t, 1);
  while (p.days[cursor]){ n++; cursor = dayBefore(cursor, 1); }
  return n;
}
export function minutesToday(p){
  const d = p.days[today()];
  return d ? Math.round(d.seconds / 60) : 0;
}
export function levelInfo(p){ return levelFromXp(p.xp); }
export function totalSprites(p){ return p.counts.reduce((a,b)=>a+b,0); }
export function uniqueSprites(p){ return p.counts.filter(c=>c>0).length; }
export function rarityTally(p){
  const t = { common:0, rare:0, epic:0, legendary:0, mythic:0 };
  p.counts.forEach((c,i)=>{ if (c>0) t[SPRITES[i].r] += c; });
  return t;
}
/** A single "how good is this collection" number, so the boys can settle it. */
export function collectionScore(p){
  const pts = { common:1, rare:3, epic:8, legendary:20, mythic:60 };
  let s = 0;
  p.counts.forEach((c,i)=>{ s += c * pts[SPRITES[i].r]; });
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

/* ---------------- progression ---------------- */
export function addXp(p, amount){
  const before = levelFromXp(p.xp).level;
  p.xp += amount;
  const after = levelFromXp(p.xp).level;
  let gained = [];
  for (let l = before + 1; l <= after; l++){
    p.coins += CONFIG.coinsPerLevel;
    gained.push(l);
  }
  return gained;   // list of newly reached levels
}

export function grantSprite(p, index){
  p.counts[index] = (p.counts[index] || 0) + 1;
  return { sprite: SPRITES[index], index, isNew: p.counts[index] === 1 };
}

export function pickSpriteOfRarity(rarity){
  const idxs = SPRITES.map((s,i)=>[s,i]).filter(([s])=>s.r===rarity).map(([,i])=>i);
  return idxs[Math.floor(Math.random()*idxs.length)];
}

export function unlockablesFor(p){
  const lvl = levelInfo(p).level;
  return {
    skins: SKINS.map(s => ({ ...s, owned:p.ownedSkins.includes(s.id), locked: lvl < s.level })),
    pets:  PETS.map(s => ({ ...s, owned:p.ownedPets.includes(s.id),  locked: lvl < s.level })),
  };
}
export function buy(p, type, id){
  const list = type === 'skin' ? SKINS : PETS;
  const item = list.find(i => i.id === id);
  if (!item) return { ok:false, why:'not found' };
  const owned = type === 'skin' ? p.ownedSkins : p.ownedPets;
  if (owned.includes(id)) return { ok:false, why:'owned' };
  if (levelInfo(p).level < item.level) return { ok:false, why:'level' };
  if (p.coins < item.cost) return { ok:false, why:'coins' };
  p.coins -= item.cost;
  owned.push(id);
  if (type === 'skin') p.skin = id; else p.pet = id;
  return { ok:true, item };
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
   SQUAD CODE — compact, shareable, no backend.
   Layout: [ver][who][level][streak][rounds hi][rounds lo][counts 4bits each]
   ===================================================================== */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function bytesToCode(bytes){
  let out = '', bits = 0, val = 0;
  for (const b of bytes){ val = (val << 8) | b; bits += 8;
    while (bits >= 6){ out += B64[(val >> (bits - 6)) & 63]; bits -= 6; } }
  if (bits) out += B64[(val << (6 - bits)) & 63];
  return out;
}
function codeToBytes(code){
  const out = []; let bits = 0, val = 0;
  for (const ch of code){
    const i = B64.indexOf(ch); if (i < 0) continue;
    val = (val << 6) | i; bits += 6;
    if (bits >= 8){ out.push((val >> (bits - 8)) & 255); bits -= 8; }
  }
  return out;
}

export function makeSquadCode(p){
  const lvl = Math.min(255, levelInfo(p).level);
  const rounds = Math.min(65535, p.lifetime.rounds);
  const bytes = [1, p.who === 'jackson' ? 1 : 0, lvl, Math.min(255, dayStreak(p)),
                 (rounds >> 8) & 255, rounds & 255];
  for (let i = 0; i < SPRITES.length; i += 2){
    const a = Math.min(15, p.counts[i] || 0);
    const b = Math.min(15, p.counts[i+1] || 0);
    bytes.push((a << 4) | b);
  }
  return bytesToCode(bytes);
}

export function readSquadCode(code){
  const b = codeToBytes((code || '').trim());
  if (b.length < 6 || b[0] !== 1) return null;
  const counts = new Array(SPRITES.length).fill(0);
  for (let i = 0; i < SPRITES.length; i += 2){
    const byte = b[6 + i/2]; if (byte == null) break;
    counts[i] = byte >> 4;
    if (i+1 < SPRITES.length) counts[i+1] = byte & 15;
  }
  const who = b[1] === 1 ? 'jackson' : 'miles';
  const fake = { who, counts, xp:0, lifetime:{ rounds:(b[4]<<8)|b[5] } };
  return { who, name: GRADES[who].name, level:b[2], streak:b[3],
           rounds:(b[4]<<8)|b[5], counts,
           total: counts.reduce((x,y)=>x+y,0),
           unique: counts.filter(c=>c>0).length,
           score: collectionScore(fake) };
}

/* =====================================================================
   Nightly report payload — one file covering both boys.
   ===================================================================== */
export function buildReport(all){
  const out = { generatedAt:new Date().toISOString(), game:'Loot Drop', date:today(), players:{} };
  ['miles','jackson'].forEach(who => {
    const p = all.profiles[who];
    const d = p.days[today()] || null;
    const hist = Object.values(p.days).sort((a,b)=> a.date < b.date ? 1 : -1).slice(0, 30);
    const lt = p.lifetime;
    out.players[who] = {
      name: GRADES[who].name, grade: GRADES[who].grade,
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
      collection: { unique: uniqueSprites(p), total: totalSprites(p), outOf: SPRITES.length,
                    score: collectionScore(p), byRarity: rarityTally(p) },
      lifetime: { ...lt, accuracyPct: lt.attempted ? Math.round(lt.correct/lt.attempted*100) : 0,
                  readingAccuracyPct: lt.readAttempted ? Math.round(lt.readCorrect/lt.readAttempted*100) : null,
                  mathAccuracyPct: lt.mathAttempted ? Math.round(lt.mathCorrect/lt.mathAttempted*100) : null,
                  minutes: Math.round(lt.seconds/60) },
      history: hist,
      squadCode: makeSquadCode(p),
    };
  });
  return out;
}

export function downloadReport(all){
  try {
    const blob = new Blob([JSON.stringify(buildReport(all), null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lootdrop-' + today() + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return true;
  } catch(e){ return false; }
}

/* =====================================================================
   SYNC HOOK — drop in a backend later without touching anything else.
   Set window.LOOTDROP_SYNC = { push(profile), pull(who) } and it's used.
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
