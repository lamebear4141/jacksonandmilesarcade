// firebase-config.js — shared Firebase (Auth + Firestore) setup for every game.
// No build step on this site, so the SDK is imported straight from the gstatic
// CDN as ES modules. Any page that needs it loads this as a module:
//   <script type="module">
//     import { onParentChange, getCurrentKid } from '../firebase-config.js';
//   </script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, sendPasswordResetEmail, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc,
  query, where, limit, orderBy, serverTimestamp,
  increment, arrayUnion, writeBatch, runTransaction,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {
  ECONOMY, GAMES, SKINS, PETS, levelFromXp, spriteId, spriteIndex,
  computeAward, clampFunAward, collectionScoreFromCounts, todayKey,
} from './assets/catalog.js';

const firebaseConfig = {
  apiKey: "AIzaSyDt0gGlBrdmtd6uMHL-5Cx93wFVaM2Vixg",
  authDomain: "jacksonandmiles-arcade-60b98.firebaseapp.com",
  projectId: "jacksonandmiles-arcade-60b98",
  storageBucket: "jacksonandmiles-arcade-60b98.firebasestorage.app",
  messagingSenderId: "757009166048",
  appId: "1:757009166048:web:a18074e6e3893f00cd6a85",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// This is already the SDK default for web, but set it explicitly: a parent
// who signs in should stay signed in on future visits, not just this tab.
setPersistence(auth, browserLocalPersistence).catch(() => {});

/* =======================================================================
   Parent account — real email/password login. A kid never sees or enters
   an email or password; this is strictly the "family login" layer.
   ======================================================================= */
export function signUpParent(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export function signInParent(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function signOutParent() {
  clearCurrentKid();
  return signOut(auth);
}
// cb(user) fires immediately with current state, then on every change.
export function onParentChange(cb) {
  return onAuthStateChanged(auth, cb);
}

/**
 * "Forgot password" — emails a reset link. Resolves quietly for an
 * unknown email too (Firebase's email-enumeration protection already
 * behaves this way); callers should show the same "check your email"
 * message either way so the login screen never leaks which addresses
 * have accounts.
 */
export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Change the signed-in parent's password. Firebase requires a recent
 * sign-in for this, so the CURRENT password is re-checked first — which
 * also means someone picking up an already-logged-in device can't change
 * it without knowing it.
 */
export async function changeParentPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Not signed in');
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}

// Google sign-in for the parent account. Popups are blocked by some
// browsers/settings, so fall back to a full-page redirect in that case —
// onParentChange picks up the result either way once it completes.
const googleProvider = new GoogleAuthProvider();
export async function signInParentWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (e) {
    if (['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) {
      return signInWithRedirect(auth, googleProvider);
    }
    throw e;
  }
}
// Consumes the result of a signInWithRedirect flow, if one is pending, so
// any error from it (e.g. an account conflict) doesn't go silently unhandled.
getRedirectResult(auth).catch(() => {});

/* =======================================================================
   Kids — families/{parentUID}/children/{childId}:
   { nickname, pin, birthday: 'YYYY-MM-DD', focusArea: 'reading'|'math'|'both' }.
   The PIN is only ever checked against the signed-in parent's own kids
   (Firestore rules restrict that whole subtree to request.auth.uid ==
   parentUID), so it's just a fun "pick who's playing" gate, not security.
   ======================================================================= */
export async function addChild(nickname, pin, birthday, focusArea) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  const ref = collection(db, 'families', uid, 'children');
  const docRef = await addDoc(ref, {
    nickname, pin: String(pin), birthday: birthday || null, focusArea: focusArea || 'both',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateChild(childId, updates) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  await setDoc(doc(db, 'families', uid, 'children', childId), updates, { merge: true });
}

export async function listChildren() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const ref = collection(db, 'families', uid, 'children');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getChild(childId) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'families', uid, 'children', childId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function verifyChildPin(childId, pin) {
  const children = await listChildren();
  const child = children.find((c) => c.id === childId);
  return !!child && String(child.pin) === String(pin);
}

/* =======================================================================
   Age → difficulty tier. Used by the math games to pick how hard the
   numbers get: 5-6 = easiest, 7-8 = medium, 9+ = harder. No birthday on
   file (guests, or a kid profile that hasn't set one) falls back to medium.
   ======================================================================= */
export function ageFromBirthday(birthday) {
  if (!birthday) return null;
  const b = new Date(birthday + 'T00:00:00');
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
export function tierForAge(age) {
  if (age == null) return 'medium';
  if (age <= 6) return 'easy';
  if (age <= 8) return 'medium';
  return 'hard';
}

/* =======================================================================
   "Who's playing" — the kid selected for this browser tab session.
   Lives in sessionStorage: it survives navigating between arcade pages in
   this tab, but a fresh visit asks again. Not itself a security boundary.
   ======================================================================= */
const KID_KEY = 'arcade.currentKid';
export function setCurrentKid(kid) {
  sessionStorage.setItem(KID_KEY, JSON.stringify({ id: kid.id, nickname: kid.nickname }));
}
export function getCurrentKid() {
  try { return JSON.parse(sessionStorage.getItem(KID_KEY)); }
  catch { return null; }
}
export function clearCurrentKid() {
  sessionStorage.removeItem(KID_KEY);
}

// The profile lock: once a kid is picked (via PIN, or a guest nickname),
// nothing gets to write under a DIFFERENT child's id in the same tab
// session without going back through the picker and re-entering that
// child's own PIN. Every score/progress write below checks this first.
function assertActiveChild(childId) {
  const active = getCurrentKid();
  if (!active || active.id !== childId) {
    throw new Error('Profile locked to a different child — switch profile and re-enter a PIN to save as someone else.');
  }
}

/* =======================================================================
   Guest players — no sign-in, no cloud. A family that doesn't want an
   account yet (or is on a device that isn't theirs) can still play: guest
   profiles and their progress live only in this browser's localStorage.
   Stats don't follow them to another device, and re-installing/clearing
   the browser loses them — that's the trade for skipping sign-up. A kid's
   id here is prefixed "guest-" so the functions below can tell at a
   glance whether to talk to Firestore or to localStorage.
   ======================================================================= */
function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function isGuestKid(id) {
  return typeof id === 'string' && id.startsWith('guest-');
}

const GUEST_LIST_KEY = 'arcade.guestChildren';
export function listLocalGuests() {
  return readLocal(GUEST_LIST_KEY, []);
}
export function addLocalGuest(nickname) {
  const guests = listLocalGuests();
  const guest = { id: 'guest-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nickname };
  guests.push(guest);
  localStorage.setItem(GUEST_LIST_KEY, JSON.stringify(guests));
  return guest;
}

/* =======================================================================
   Per-kid game progress. For a real (signed-in) kid this lives on their
   child doc: families/{parentUID}/children/{childId}.progress[gameId].
   For a guest kid it lives under a localStorage key keyed by their id.
   ======================================================================= */
export async function saveChildProgress(childId, gameId, data) {
  assertActiveChild(childId);
  if (isGuestKid(childId)) {
    const key = 'arcade.guestProgress.' + childId;
    const all = readLocal(key, {});
    all[gameId] = { ...data, updatedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(all));
    return;
  }
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  await setDoc(doc(db, 'families', uid, 'children', childId), {
    progress: { [gameId]: { ...data, updatedAt: serverTimestamp() } },
  }, { merge: true });
}

export async function loadChildProgress(childId, gameId) {
  if (isGuestKid(childId)) {
    const all = readLocal('arcade.guestProgress.' + childId, {});
    return all[gameId] || null;
  }
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'families', uid, 'children', childId));
  if (!snap.exists()) return null;
  return snap.data()?.progress?.[gameId] || null;
}

/* =======================================================================
   Public leaderboard — top-level "high_scores" collection. Only ever
   stores/returns a nickname + score: never a real name, email, or which
   family a nickname belongs to. Guest play never reaches this collection
   (Firestore rules require a signed-in user to write it) — it keeps its
   own small local scoreboard instead, via getLocalTopScores.
   ======================================================================= */
export async function saveHighScore(game, nickname, score, childId) {
  assertActiveChild(childId);
  if (isGuestKid(childId)) {
    const key = 'arcade.guestScores.' + game;
    const list = readLocal(key, []);
    list.push({ nickname, score, t: Date.now() });
    localStorage.setItem(key, JSON.stringify(list.slice(-100)));
    return;
  }
  await addDoc(collection(db, 'high_scores'), { game, nickname, score, createdAt: serverTimestamp() });
}

export async function getTopScores(game, max = 10) {
  // Equality filter only (no orderBy) so this never needs a composite index;
  // sort client-side instead. Fine at family-arcade scale.
  const q = query(collection(db, 'high_scores'), where('game', '==', game), limit(200));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ nickname: d.data().nickname, score: d.data().score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

export async function getLocalTopScores(game, max = 10) {
  return readLocal('arcade.guestScores.' + game, [])
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ nickname, score }) => ({ nickname, score }));
}

/* =======================================================================
   THE CHARACTER — one per child, shared by every game in the arcade.

   Every game feeds this one character: XP, coins, level, skins, pets, and
   the 60-sprite collection. A game no longer keeps its own progression.

   ---------------------------------------------------------------------
   READ THIS BEFORE TRUSTING ANY OF IT
   ---------------------------------------------------------------------
   Both children share ONE parent's Firebase Auth account. Firestore rules
   can only check "is this the signed-in parent?", so they cannot stop one
   sibling from writing to the other's character — to the database, both
   boys are the same user.

   The PIN gate and assertActiveChild() below are client-side only. They
   keep honest kids honest and stop accidental cross-saves (the wrong boy
   picking up a tablet mid-session), which is the actual threat here. They
   are NOT security. Anyone who opens the browser console can write
   whatever they like to either character.

   PINs are stored in plaintext on the child doc and are readable by
   anyone signed into the family account. They are a "who's playing?"
   selector, nothing more.

   Real per-child enforcement would need every child to be a separate
   Firebase Auth identity carrying custom claims, which means a backend
   and a token-minting service — out of all proportion for a family
   arcade. Do not describe any of this as secure, in code or in the UI.
   ======================================================================= */


/** A brand-new character. Everyone starts as the Rookie with no pet. */
export function blankCharacter() {
  return {
    xp: 0, level: 1, coins: 0,
    skin: 'rookie', pet: 'none',
    ownedSkins: ['rookie'], ownedPets: ['none'],
    counts: {},                       // sprite id -> how many, e.g. { s12: 3 }
    dayStreak: 0, lastPlayed: null,
    dailyFun: { date: todayKey(), xp: 0, coins: 0 },
    lifetime: { runs: 0, correct: 0, attempted: 0, seconds: 0, byGame: {} },
    claimedStreakGifts: [],
  };
}

// Fill in anything a character saved by an older version is missing, so
// new fields never read as undefined.
function healCharacter(c) {
  const blank = blankCharacter();
  const out = { ...blank, ...(c || {}) };
  out.counts     = { ...(c?.counts || {}) };
  out.ownedSkins = Array.isArray(out.ownedSkins) && out.ownedSkins.length ? out.ownedSkins : ['rookie'];
  out.ownedPets  = Array.isArray(out.ownedPets)  && out.ownedPets.length  ? out.ownedPets  : ['none'];
  out.claimedStreakGifts = Array.isArray(out.claimedStreakGifts) ? out.claimedStreakGifts : [];
  out.lifetime   = { ...blank.lifetime, ...(c?.lifetime || {}) };
  out.lifetime.byGame = { ...(c?.lifetime?.byGame || {}) };
  out.dailyFun   = { ...blank.dailyFun, ...(c?.dailyFun || {}) };
  out.level      = levelFromXp(out.xp || 0).level;
  return out;
}

const charKey    = (childId) => 'arcade.character.' + childId;
const sessionsKey = (childId) => 'arcade.sessions.' + childId;
const GUEST_SESSION_CAP = 80;

function childRef(childId) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  return doc(db, 'families', uid, 'children', childId);
}

/** Read a character without creating one. Used for siblings, where we
    must never write to someone else's doc just by looking at them. */
async function readCharacter(childId) {
  if (isGuestKid(childId)) return healCharacter(readLocal(charKey(childId), null));
  const uid = auth.currentUser?.uid;
  if (!uid) return healCharacter(null);
  const snap = await getDoc(doc(db, 'families', uid, 'children', childId));
  return healCharacter(snap.exists() ? snap.data()?.character : null);
}

/**
 * The character for this child, creating a blank one if there isn't one.
 * Persisting the blank matters: awardRun() writes with dotted field paths
 * (character.counts.s12), and those need the character map to exist.
 */
export async function loadCharacter(childId) {
  if (isGuestKid(childId)) {
    const existing = readLocal(charKey(childId), null);
    const character = healCharacter(existing);
    if (!existing) localStorage.setItem(charKey(childId), JSON.stringify(character));
    return character;
  }
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  const ref = doc(db, 'families', uid, 'children', childId);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data()?.character) return healCharacter(snap.data().character);
  const character = blankCharacter();
  await setDoc(ref, { character: { ...character, updatedAt: serverTimestamp() } }, { merge: true });
  return character;
}

/* ---------------- the day streak ----------------
   Yesterday -> keep counting. Today -> already counted. Anything else
   (or a first ever run) -> start again at 1. Never punishes, never
   silently resets a streak the kid actually kept. */
function rollStreak(character, day) {
  const last = character.lastPlayed;
  if (last === day) return character.dayStreak || 1;
  const yesterday = new Date(day + 'T12:00:00');
  yesterday.setDate(yesterday.getDate() - 1);
  return last === todayKey(yesterday) ? (character.dayStreak || 0) + 1 : 1;
}

/* =======================================================================
   THE AWARD PATH — every finished run in every game ends up here.

   result: { asked, correct, seconds, score, units?, sprites?, grantSkins?,
             grantPets?, claimStreakGifts? }

   `units` defaults to `correct`; fun games pass their own milestone count.
   `sprites` is a list of sprite ids (or indices) the run won.

   xp, coins and each sprite count use increment(), and the owned lists use
   arrayUnion(), so two tabs finishing runs at once can't clobber each
   other. `level` is the one plain value — it's recomputed from the xp we
   just read, so under a genuine simultaneous double-write it can lag by a
   level for a few seconds until the next run rewrites it. That beats
   losing coins, and it self-heals.
   ======================================================================= */
export async function awardRun(childId, gameId, result) {
  assertActiveChild(childId);
  const game = GAMES[gameId];
  if (!game) throw new Error('Unknown game id: ' + gameId);

  const character = await loadCharacter(childId);
  const day = todayKey();

  // Work out the reward, then clamp it if this is a fun game and today's
  // fun budget is already spent.
  const raw = computeAward(gameId, result);
  // Loot Drop computes its own richer totals (sprite rarity bonuses,
  // level-up coins, streak gifts) with numbers that mirror the shared
  // economy. `override` lets it pass those exact totals through while the
  // session doc still records the real asked/correct/accuracy.
  if (result?.override) {
    raw.xp    = Math.max(0, Math.round(Number(result.override.xp)    || 0));
    raw.coins = Math.max(0, Math.round(Number(result.override.coins) || 0));
  }
  const clamped = clampFunAward(raw, character.dailyFun, day);
  const xp    = clamped.xp;
  const coins = clamped.coins;

  const newXp    = (character.xp || 0) + xp;
  const oldLevel = levelFromXp(character.xp || 0).level;
  const newLevel = levelFromXp(newXp).level;
  const streak   = rollStreak(character, day);

  // Sprites won this run, as { s12: 2 } — accepts ids or raw indices so a
  // game can pass whichever it already has.
  const wonCounts = {};
  (result?.sprites || []).forEach((s) => {
    // Key by the id we resolved, not by whatever came in, so the counts
    // map can only ever hold canonical s0..s59 keys.
    const idx = spriteIndex(typeof s === 'number' ? spriteId(s) : String(s));
    if (idx >= 0) { const id = spriteId(idx); wonCounts[id] = (wonCounts[id] || 0) + 1; }
  });

  const session = {
    gameId, kind: game.kind,
    asked: raw.asked, correct: raw.correct,
    accuracy: Math.round(raw.accuracy * 100) / 100,
    seconds: raw.seconds,
    score: Number(result?.score) || 0,
    xpEarned: xp, coinsEarned: coins,
  };

  const byGame = character.lifetime.byGame?.[gameId] || { runs: 0, xp: 0, coins: 0 };
  const lifetimeUpdate = {
    'character.lifetime.runs':      increment(1),
    'character.lifetime.correct':   increment(raw.correct),
    'character.lifetime.attempted': increment(raw.asked),
    'character.lifetime.seconds':   increment(raw.seconds),
    [`character.lifetime.byGame.${gameId}.runs`]:  increment(1),
    [`character.lifetime.byGame.${gameId}.xp`]:    increment(xp),
    [`character.lifetime.byGame.${gameId}.coins`]: increment(coins),
  };

  const levelUp = { leveledUp: newLevel > oldLevel, newLevel, oldLevel };
  const outcome = {
    xp, coins, ...levelUp,
    cappedByDailyFun: clamped.cappedXp || clamped.cappedCoins,
    sprites: wonCounts,
    dayStreak: streak,
  };

  /* ---- guests: same logic, localStorage instead of Firestore ---- */
  if (isGuestKid(childId)) {
    const next = healCharacter(character);
    next.xp = newXp;
    next.level = newLevel;
    next.coins = (next.coins || 0) + coins;
    Object.entries(wonCounts).forEach(([id, n]) => { next.counts[id] = (next.counts[id] || 0) + n; });
    (result?.grantSkins || []).forEach((id) => { if (!next.ownedSkins.includes(id)) next.ownedSkins.push(id); });
    (result?.grantPets  || []).forEach((id) => { if (!next.ownedPets.includes(id))  next.ownedPets.push(id); });
    (result?.claimStreakGifts || []).forEach((d) => { if (!next.claimedStreakGifts.includes(d)) next.claimedStreakGifts.push(d); });
    next.dayStreak  = streak;
    next.lastPlayed = day;
    next.dailyFun   = clamped.daily;
    next.lifetime.runs      = (next.lifetime.runs || 0) + 1;
    next.lifetime.correct   = (next.lifetime.correct || 0) + raw.correct;
    next.lifetime.attempted = (next.lifetime.attempted || 0) + raw.asked;
    next.lifetime.seconds   = (next.lifetime.seconds || 0) + raw.seconds;
    next.lifetime.byGame[gameId] = {
      runs: byGame.runs + 1, xp: byGame.xp + xp, coins: byGame.coins + coins,
    };
    next.updatedAt = Date.now();
    localStorage.setItem(charKey(childId), JSON.stringify(next));

    const log = readLocal(sessionsKey(childId), []);
    log.unshift({ ...session, playedAt: Date.now() });
    localStorage.setItem(sessionsKey(childId), JSON.stringify(log.slice(0, GUEST_SESSION_CAP)));
    return outcome;
  }

  /* ---- signed in: the character update and the session doc go together ---- */
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  const ref = childRef(childId);
  const batch = writeBatch(db);

  const update = {
    'character.xp': increment(xp),
    'character.coins': increment(coins),
    'character.level': newLevel,
    'character.dayStreak': streak,
    'character.lastPlayed': day,
    'character.dailyFun': clamped.daily,
    'character.updatedAt': serverTimestamp(),
    ...lifetimeUpdate,
  };
  Object.entries(wonCounts).forEach(([id, n]) => { update[`character.counts.${id}`] = increment(n); });
  if (result?.grantSkins?.length) update['character.ownedSkins'] = arrayUnion(...result.grantSkins);
  if (result?.grantPets?.length)  update['character.ownedPets']  = arrayUnion(...result.grantPets);
  if (result?.claimStreakGifts?.length) update['character.claimedStreakGifts'] = arrayUnion(...result.claimStreakGifts);

  batch.update(ref, update);
  batch.set(doc(collection(ref, 'sessions')), { ...session, playedAt: serverTimestamp() });
  await batch.commit();
  return outcome;
}

/**
 * A small coin top-up outside a run — Loot Drop's bonus mini-game pays a
 * handful of coins without being a "run", so it shouldn't fake a session
 * doc. increment() only; never negative (spending happens in buyItem's
 * transaction, nowhere else).
 */
export async function grantCoins(childId, amount) {
  assertActiveChild(childId);
  const n = Math.max(0, Math.round(Number(amount) || 0));
  if (!n) return { ok: true, granted: 0 };
  if (isGuestKid(childId)) {
    const character = healCharacter(readLocal(charKey(childId), null));
    character.coins = (character.coins || 0) + n;
    character.updatedAt = Date.now();
    localStorage.setItem(charKey(childId), JSON.stringify(character));
    return { ok: true, granted: n };
  }
  await updateDoc(childRef(childId), {
    'character.coins': increment(n),
    'character.updatedAt': serverTimestamp(),
  });
  return { ok: true, granted: n };
}

/* =======================================================================
   THE SHOP — buying has to be atomic.

   Spending the coins and receiving the item must land together. A partial
   write here means a kid pays for a skin they don't get, which is exactly
   the kind of bug that ends the game's credibility with them. Every value
   the decision depends on is re-read INSIDE the transaction; nothing read
   beforehand is trusted.
   ======================================================================= */
function findItem(kind, itemId) {
  return (kind === 'skin' ? SKINS : PETS).find((i) => i.id === itemId) || null;
}

/** Why a purchase can't happen, or null if it can. Shared by both paths
    so the guest and cloud rules can never drift apart. */
function purchaseProblem(character, kind, item) {
  const owned = kind === 'skin' ? character.ownedSkins : character.ownedPets;
  if (owned.includes(item.id)) return 'owned';
  if (levelFromXp(character.xp || 0).level < item.level) return 'level';
  if ((character.coins || 0) < item.cost) return 'coins';
  return null;
}

export async function buyItem(childId, kind, itemId) {
  assertActiveChild(childId);
  const item = findItem(kind, itemId);
  if (!item) return { ok: false, why: 'missing' };

  if (isGuestKid(childId)) {
    // localStorage is synchronous and single-threaded, so this read →
    // check → write can't be interleaved the way a network round-trip can.
    const character = healCharacter(readLocal(charKey(childId), null));
    const problem = purchaseProblem(character, kind, item);
    if (problem) return { ok: false, why: problem };
    character.coins -= item.cost;
    if (kind === 'skin') { character.ownedSkins.push(item.id); character.skin = item.id; }
    else                 { character.ownedPets.push(item.id);  character.pet  = item.id; }
    character.updatedAt = Date.now();
    localStorage.setItem(charKey(childId), JSON.stringify(character));
    return { ok: true, item, coins: character.coins };
  }

  const ref = childRef(childId);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const character = healCharacter(snap.exists() ? snap.data()?.character : null);
      const problem = purchaseProblem(character, kind, item);
      if (problem) return { ok: false, why: problem };
      tx.update(ref, {
        'character.coins': increment(-item.cost),
        [kind === 'skin' ? 'character.ownedSkins' : 'character.ownedPets']: arrayUnion(item.id),
        [kind === 'skin' ? 'character.skin' : 'character.pet']: item.id,
        'character.updatedAt': serverTimestamp(),
      });
      return { ok: true, item, coins: (character.coins || 0) - item.cost };
    });
  } catch (e) {
    return { ok: false, why: 'failed' };
  }
}

/** Equip something already owned. Cheap and safe — no coins move. */
export async function equipItem(childId, kind, itemId) {
  assertActiveChild(childId);
  const item = findItem(kind, itemId);
  if (!item) return { ok: false, why: 'missing' };
  const character = await readCharacter(childId);
  const owned = kind === 'skin' ? character.ownedSkins : character.ownedPets;
  if (!owned.includes(itemId)) return { ok: false, why: 'not owned' };

  if (isGuestKid(childId)) {
    if (kind === 'skin') character.skin = itemId; else character.pet = itemId;
    character.updatedAt = Date.now();
    localStorage.setItem(charKey(childId), JSON.stringify(character));
    return { ok: true, item };
  }
  await updateDoc(childRef(childId), {
    [kind === 'skin' ? 'character.skin' : 'character.pet']: itemId,
    'character.updatedAt': serverTimestamp(),
  });
  return { ok: true, item };
}

/* =======================================================================
   The family leaderboard. No separate collection — it's just the children
   we can already list, plus the character on each. Nicknames only: never
   a real name, never an email.
   ======================================================================= */
export async function listFamilyCharacters() {
  const children = await listChildren().catch(() => []);
  return Promise.all(children.map(async (child) => {
    const character = await readCharacter(child.id).catch(() => blankCharacter());
    return {
      childId: child.id,
      nickname: child.nickname,
      level: character.level,
      xp: character.xp,
      coins: character.coins,
      skin: character.skin,
      pet: character.pet,
      dayStreak: character.dayStreak,
      collectionScore: collectionScoreFromCounts(character.counts),
      uniqueSprites: Object.values(character.counts).filter((n) => n > 0).length,
    };
  }));
}

/** A sibling's kit, read-only — for the "what has he got equipped?" peek. */
export async function getSiblingLoadout(childId) {
  const character = await readCharacter(childId);
  return {
    childId,
    skin: character.skin, pet: character.pet,
    ownedSkins: character.ownedSkins, ownedPets: character.ownedPets,
    counts: character.counts,
    level: character.level,
    collectionScore: collectionScoreFromCounts(character.counts),
  };
}

/* =======================================================================
   TRADING — siblings swapping duplicate collectibles.

   A pending offer has to outlive the session that made it (the other kid
   might not play until tomorrow), so trades are their own documents
   rather than a field on either character.

   Accepting is a transaction for the same reason buying is, only more so:
   a trade moves items in BOTH directions. A partial write here means a kid
   loses a collectible and gets nothing back.
   ======================================================================= */
function tradesRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  return collection(db, 'families', uid, 'trades');
}

export async function proposeTrade(fromChildId, toChildId, offerSprite, wantSprite) {
  assertActiveChild(fromChildId);
  if (isGuestKid(fromChildId) || isGuestKid(toChildId)) {
    return { ok: false, why: 'guest' };   // guests have no sibling to trade with
  }
  if (fromChildId === toChildId) return { ok: false, why: 'self' };
  if (spriteIndex(offerSprite) < 0 || spriteIndex(wantSprite) < 0) return { ok: false, why: 'missing' };

  // Only offer a spare. A kid must never be able to give away their last
  // copy of something, even by accident.
  const mine = await readCharacter(fromChildId);
  if ((mine.counts[offerSprite] || 0) < 2) return { ok: false, why: 'not a duplicate' };

  const me = (await listChildren()).find((c) => c.id === fromChildId);
  const ref = await addDoc(tradesRef(), {
    fromChildId, fromNickname: me?.nickname || 'Someone', toChildId,
    offerSprite, wantSprite, status: 'pending', createdAt: serverTimestamp(),
  });
  return { ok: true, tradeId: ref.id };
}

/** Offers waiting on this child, plus the ones they sent. Equality
    filters only, sorted client-side, so this needs no composite index. */
export async function listTrades(childId) {
  if (isGuestKid(childId)) return { incoming: [], outgoing: [] };
  const uid = auth.currentUser?.uid;
  if (!uid) return { incoming: [], outgoing: [] };
  const snap = await getDocs(query(tradesRef(), where('status', '==', 'pending')));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const mine = await readCharacter(childId).catch(() => blankCharacter());
  const newest = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
  return {
    incoming: all.filter((t) => t.toChildId === childId).sort(newest).map((t) => ({
      ...t,
      // Flag it so the UI can warn before a kid parts with their only one.
      lastCopy: (mine.counts[t.wantSprite] || 0) <= 1,
    })),
    outgoing: all.filter((t) => t.fromChildId === childId).sort(newest),
  };
}

/**
 * Accept or decline. On accept, both characters change inside one
 * transaction: the offering side gives offerSprite and gets wantSprite,
 * the accepting side does the reverse.
 *
 * Re-checked here, never trusting anything read earlier: the trade is
 * still pending, both sides still hold the sprite they're giving, and the
 * offering side still has a spare (count >= 2). The accepting side needs
 * only one — they're choosing to part with it by tapping Accept, and they
 * get one back in return; listTrades() flags that case so the UI can warn.
 */
export async function respondToTrade(tradeId, accept) {
  const active = getCurrentKid();
  if (!active) return { ok: false, why: 'no profile' };
  const uid = auth.currentUser?.uid;
  if (!uid) return { ok: false, why: 'not signed in' };
  const tradeRef = doc(db, 'families', uid, 'trades', tradeId);

  try {
    return await runTransaction(db, async (tx) => {
      const tradeSnap = await tx.get(tradeRef);
      if (!tradeSnap.exists()) return { ok: false, why: 'missing' };
      const trade = tradeSnap.data();
      if (trade.status !== 'pending') return { ok: false, why: 'already answered' };
      // Only the child the offer was made to can answer it.
      if (trade.toChildId !== active.id) return { ok: false, why: 'not yours' };

      if (!accept) {
        tx.update(tradeRef, { status: 'declined' });
        return { ok: true, status: 'declined' };
      }

      const fromRef = doc(db, 'families', uid, 'children', trade.fromChildId);
      const toRef   = doc(db, 'families', uid, 'children', trade.toChildId);
      const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);
      const fromChar = healCharacter(fromSnap.exists() ? fromSnap.data()?.character : null);
      const toChar   = healCharacter(toSnap.exists()   ? toSnap.data()?.character   : null);

      if ((fromChar.counts[trade.offerSprite] || 0) < 2) return { ok: false, why: 'offer gone' };
      if ((toChar.counts[trade.wantSprite]   || 0) < 1) return { ok: false, why: 'want gone' };

      tx.update(fromRef, {
        [`character.counts.${trade.offerSprite}`]: increment(-1),
        [`character.counts.${trade.wantSprite}`]:  increment(1),
        'character.updatedAt': serverTimestamp(),
      });
      tx.update(toRef, {
        [`character.counts.${trade.wantSprite}`]:  increment(-1),
        [`character.counts.${trade.offerSprite}`]: increment(1),
        'character.updatedAt': serverTimestamp(),
      });
      tx.update(tradeRef, { status: 'accepted' });
      return { ok: true, status: 'accepted', got: trade.offerSprite, gave: trade.wantSprite };
    });
  } catch (e) {
    return { ok: false, why: 'failed' };
  }
}

/* =======================================================================
   Session history — append-only, so the character doc stays small and
   fast. This is what the parent report reads.
   ======================================================================= */
export async function listSessions(childId, max = 100) {
  if (isGuestKid(childId)) return readLocal(sessionsKey(childId), []).slice(0, max);
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const ref = collection(db, 'families', uid, 'children', childId, 'sessions');
  const snap = await getDocs(query(ref, orderBy('playedAt', 'desc'), limit(max)));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, playedAt: data.playedAt?.toMillis?.() ?? null };
  });
}


/* =======================================================================
   Firestore security rules — this repo has no deploy pipeline, so these
   are NOT applied automatically. Paste them into Firebase Console →
   Firestore Database → Rules for the project above:

   The character layer needs no CHANGE to the block below: the recursive
   wildcard `/families/{parentId}/{document=**}` already covers the new
   children/{childId}/sessions subcollection and the families/{uid}/trades
   collection. Nothing new lives at the top level.

   BUT this block is only a description of what SHOULD be deployed — the
   console is the only thing that decides. If a game dies with "Missing or
   insufficient permissions" the moment it tries to save a run, while
   reading and writing the child doc itself works fine, the live rules are
   an older, narrower version that stops at /children/{childId} and never
   reaches the sessions subcollection. Re-paste this whole block and hit
   Publish; that is the fix, and it has happened once already.

   If you ever DO add a top-level collection, add a match block for it
   here — and remember
   these rules only ever prove "the signed-in parent", never "which
   child", which is why the per-child checks in this file are honesty
   aids rather than security (see the character section above).

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /families/{parentId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == parentId;
       }
       match /high_scores/{scoreId} {
         allow read: if true;
         allow create: if request.auth != null
           && request.resource.data.keys().hasOnly(['game', 'nickname', 'score', 'createdAt'])
           && request.resource.data.nickname is string
           && request.resource.data.score is number;
         allow update, delete: if false;
       }
     }
   }
   ======================================================================= */
