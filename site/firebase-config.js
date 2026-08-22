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
  getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, limit, orderBy, serverTimestamp,
  increment, arrayUnion, writeBatch, runTransaction,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {
  ECONOMY, GAMES, SKINS, PETS, levelFromXp, spriteId, spriteIndex,
  computeAward, clampFunAward, computePillarAward, collectionScoreFromCounts, todayKey,
  COLLECTIONS, GRAND_PRIZE, newlyCompletedCollections, uniqueLiveCount, isBuyable,
  dropRolls, rollDrops, confirmCaptures, freshDrops, luckScore,
  starsNeededFor, BEDTIME_SPRITE_IDS, inCollection,
  clampDailyCoins, vaultOpens, VAULT, vaultZone,
  tradeSideProblem, tradeTally,
  PRACTICE_POWER, practicePowerNow, practicePowerAfterRun, runQualifies,
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

/** Permanently remove a child profile. Firestore doesn't cascade deletes,
    so the session history is cleared first (in pages), then the child doc
    itself — otherwise orphaned session docs would linger unreachable.
    Trades that referenced the child stay behind as inert status records. */
export async function deleteChild(childId) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  const sessRef = collection(db, 'families', uid, 'children', childId, 'sessions');
  for (;;) {
    const snap = await getDocs(query(sessRef, limit(200)));
    if (snap.empty) break;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < 200) break;
  }
  await deleteDoc(doc(db, 'families', uid, 'children', childId));
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
    // Every coin from every source counts against one cap (E4): the
    // Bonus Vault, a bespoke bonus round, and later Box compliments.
    dailyCoins: { date: todayKey(), total: 0 },
    // The pillar wallet: 🧱 from Learn games, ⚡ from Play games. Kept
    // beside xp/coins rather than replacing them — see PILLAR_ECONOMY.
    wallet: { bricks: 0, sparks: 0, dailySparks: { date: todayKey(), total: 0 } },
    lifetime: { runs: 0, correct: 0, attempted: 0, seconds: 0, byGame: {} },
    claimedStreakGifts: [],
    // Collections (R2B · E1). Completion itself is never stored — it is
    // derived from counts — only what completing GRANTED is:
    badges: [],          // completed collection ids, e.g. ['dinosaurs']
    worldItems: {},      // statues queued for the Box: { 'fossil-skeleton': 1 }
    avatarUnlocks: [],   // studio accessories granted by badges
    // Finding critters (E2): today's drop count against DROPS.dailyCap,
    // the pity counter, and the collection the kid is aiming luck at.
    drops: { date: todayKey(), count: 0, sinceEpic: 0 },
    focusCollection: null,
    // Critter Reader (E3): bedtime stars per sprite and the day the last
    // one was earned. On the character, not in localStorage, so a
    // ten-night quest survives switching iPads.
    critterStars: {},      // { s77: 2 }
    starDay: null,         // 'YYYY-MM-DD' — one star per calendar day
    ccMigrated: false,     // the old local dex has been folded in, once
    // Practice Power (E7): the one number here that can go DOWN. Rises
    // on a day the child practises, decays gently when they stop. Never
    // touches xp, level, counts, badges or coins — progress ratchets,
    // form decays. Read it through practicePowerNow(), which applies the
    // decay since powerDay rather than trusting the stored value.
    practicePower: 0,
    powerDay: null,
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
  out.dailyCoins = { ...blank.dailyCoins, ...(c?.dailyCoins || {}) };
  out.wallet     = { ...blank.wallet, ...(c?.wallet || {}) };
  out.wallet.dailySparks = { ...blank.wallet.dailySparks, ...(c?.wallet?.dailySparks || {}) };
  out.badges        = Array.isArray(c?.badges) ? c.badges.slice() : [];
  out.worldItems    = { ...(c?.worldItems || {}) };
  out.avatarUnlocks = Array.isArray(c?.avatarUnlocks) ? c.avatarUnlocks.slice() : [];
  out.drops         = { ...blank.drops, ...(c?.drops || {}) };
  out.focusCollection = COLLECTIONS.some((x) => x.id === c?.focusCollection) ? c.focusCollection : null;
  out.practicePower = Math.max(0, Math.min(PRACTICE_POWER.max, Number(c?.practicePower) || 0));
  out.powerDay      = c?.powerDay || null;
  out.critterStars  = { ...(c?.critterStars || {}) };
  out.starDay       = c?.starDay || null;
  out.ccMigrated    = !!c?.ccMigrated;
  out.level      = levelFromXp(out.xp || 0).level;
  return out;
}

/* =======================================================================
   CRITTER READER — one bedtime star a day.

   Computed against the character as it really is at write time, then
   folded into awardRun's single write. Completing a quest grants the
   sprite down the same path Loot Drop's loot takes (counts increment),
   which is what makes it land in the Locker with the full reveal and
   fire the collection-completion check.

   On completion the star count RESETS to zero: the quest can be run
   again for a spare, which is the whole "read it again for a trade
   good" idea. A quest on a critter the kid already owns is therefore
   just another lap — it grants a duplicate, never nothing.
   ======================================================================= */
function critterStarGrant(character, spriteId, day) {
  const none = { earned: false, spriteId: null, stars: 0, needed: 0, complete: false, granted: false, isNew: false, alreadyToday: false };
  if (!spriteId || !inCollection(spriteId)) return { ...none, update: {} };
  if (character.starDay === day) {
    // Already tucked one in today. The story still counts (XP is paid by
    // the normal award); the star simply waits for tomorrow.
    return { ...none, spriteId, stars: character.critterStars?.[spriteId] || 0,
             needed: starsNeededFor(spriteId), alreadyToday: true, update: {} };
  }
  const needed = starsNeededFor(spriteId);
  const stars = (character.critterStars?.[spriteId] || 0) + 1;
  const complete = stars >= needed;
  const isNew = !((character.counts?.[spriteId] || 0) > 0);
  const update = {
    'character.starDay': day,
    [`character.critterStars.${spriteId}`]: complete ? 0 : stars,
  };
  if (complete) update[`character.counts.${spriteId}`] = increment(1);
  return { earned: true, spriteId, stars, needed, complete, granted: complete, isNew, alreadyToday: false, update };
}

/**
 * Fold the old local Critter Catchers dex into the character, once.
 *
 * `dex` is { pip:{n:3}, luna:{...} } and `stars` is { pip:2 } straight
 * out of the game's localStorage save. Collected critters are granted as
 * counts[spriteId] = max(existing, 1) — never a second copy for someone
 * who already has one — and star progress copies across, clamped to the
 * new (cheaper) rarity ladder. Guarded by character.ccMigrated, so
 * running it twice changes nothing at all.
 */
export async function migrateCritterDex(childId, { dex = {}, stars = {} } = {}) {
  assertActiveChild(childId);
  const day = todayKey();

  const plan = (character) => {
    if (character.ccMigrated) return { ok: true, already: true, granted: [], starsCopied: [] };
    const granted = [], starsCopied = [];
    const update = { 'character.ccMigrated': true, 'character.updatedAt': serverTimestamp() };
    for (const [legacyId, spriteId] of Object.entries(BEDTIME_SPRITE_IDS)) {
      const needed = starsNeededFor(spriteId);
      const had = Number(stars[legacyId]) || 0;
      const wasCollected = !!dex[legacyId] || had >= needed;
      if (wasCollected) {
        // max(existing, 1): never double-grant, never remove.
        if ((character.counts?.[spriteId] || 0) < 1) {
          update[`character.counts.${spriteId}`] = increment(1);
          granted.push({ legacyId, spriteId, tuckIns: dex[legacyId]?.n || 0 });
        }
      } else if (had > 0) {
        const keep = Math.min(had, needed - 1);
        if (keep > 0) {
          update[`character.critterStars.${spriteId}`] = keep;
          starsCopied.push({ legacyId, spriteId, stars: keep, needed });
        }
      }
    }
    return { ok: true, already: false, granted, starsCopied, update };
  };

  if (isGuestKid(childId)) {
    const character = healCharacter(readLocal(charKey(childId), null));
    const p = plan(character);
    if (p.already) return p;
    p.granted.forEach(({ spriteId }) => { character.counts[spriteId] = Math.max(character.counts[spriteId] || 0, 1); });
    p.starsCopied.forEach(({ spriteId, stars: n }) => { character.critterStars[spriteId] = n; });
    character.ccMigrated = true;
    character.updatedAt = Date.now();
    localStorage.setItem(charKey(childId), JSON.stringify(character));
    return { ok: true, already: false, granted: p.granted, starsCopied: p.starsCopied };
  }

  const ref = childRef(childId);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const character = healCharacter(snap.exists() ? snap.data()?.character : null);
      const p = plan(character);
      if (p.already) return p;
      tx.update(ref, p.update);
      return { ok: true, already: false, granted: p.granted, starsCopied: p.starsCopied };
    });
  } catch (e) {
    return { ok: false, why: 'failed' };
  }
}

/** Collection Focus — the one collection a share of the kid's rolls is
    aimed at. `collectionId` null clears it. Never moves anything else. */
export async function setFocusCollection(childId, collectionId) {
  assertActiveChild(childId);
  const id = COLLECTIONS.some((c) => c.id === collectionId) ? collectionId : null;
  if (isGuestKid(childId)) {
    const character = healCharacter(readLocal(charKey(childId), null));
    character.focusCollection = id;
    character.updatedAt = Date.now();
    localStorage.setItem(charKey(childId), JSON.stringify(character));
    return { ok: true, focusCollection: id };
  }
  await updateDoc(childRef(childId), {
    'character.focusCollection': id,
    'character.updatedAt': serverTimestamp(),
  });
  return { ok: true, focusCollection: id };
}

/* =======================================================================
   COLLECTION COMPLETION — derived, never stored as a flag.

   A collection is complete iff every member's count is > 0. The only
   thing written is the GRANT: the badge (arrayUnion, so a double-fire
   can't double-grant), the statue queued in worldItems for the Box, the
   avatar unlock — and, once all eight badges are in, the Grand Prize.

   Called INSIDE the same transaction that writes the sprites, with the
   counts as they will be after that write. Returns the dotted-path
   update to merge into that write plus what to celebrate.
   ======================================================================= */
function completionGrants(nextCounts, character) {
  const badgesBefore = character?.badges || [];
  const newly = newlyCompletedCollections(nextCounts, badgesBefore);
  const update = {};
  const cols = newly.map((id) => COLLECTIONS.find((c) => c.id === id)).filter(Boolean);
  if (cols.length) {
    update['character.badges']        = arrayUnion(...cols.map((c) => c.id));
    update['character.avatarUnlocks'] = arrayUnion(...cols.map((c) => c.avatar.id));
    cols.forEach((c) => { update[`character.worldItems.${c.statue.id}`] = 1; });
  }
  const all = new Set([...badgesBefore, ...newly]);
  const grandPrize = cols.length > 0
    && COLLECTIONS.every((c) => all.has(c.id))
    && !(character?.worldItems || {})[GRAND_PRIZE.id];
  if (grandPrize) update[`character.worldItems.${GRAND_PRIZE.id}`] = 1;
  return { newlyCompleted: newly, grandPrize, update };
}

/** The guest (localStorage) twin of the dotted update above. */
function applyGrantsLocal(next, grants) {
  for (const id of grants.newlyCompleted) {
    const c = COLLECTIONS.find((x) => x.id === id);
    if (!c) continue;
    if (!next.badges.includes(c.id)) next.badges.push(c.id);
    if (!next.avatarUnlocks.includes(c.avatar.id)) next.avatarUnlocks.push(c.avatar.id);
    next.worldItems[c.statue.id] = 1;
  }
  if (grants.grandPrize) next.worldItems[GRAND_PRIZE.id] = 1;
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
  // Loot Drop computes its own richer XP total (sprite rarity bonuses,
  // streak gifts) with numbers that mirror the shared economy.
  // `override` lets it pass that exact total through while the session
  // doc still records the real asked/correct/accuracy. Since E4 it may
  // no longer override COINS: coins come from bonus rounds only, and
  // Loot Drop's bonus round is its mini-game, which pays through
  // grantCoins() like the Vault does.
  if (result?.override) {
    raw.xp = Math.max(0, Math.round(Number(result.override.xp) || 0));
  }
  const clamped = clampFunAward(raw, character.dailyFun, day);
  const xp    = clamped.xp;
  // The run's own coins are whatever its bespoke bonus round paid
  // (Math Baseball's derby) — nothing else. Clamped against the ONE
  // daily coin cap, computed against fresh state at write time below.
  const wantCoins = Math.max(0, Math.round(Number(raw.coins) || 0));

  // Bricks and sparks ride alongside, from the same run, on their own
  // daily budget. Deliberately computed from `raw` (the real correct
  // count / unit count), never from the clamped xp/coins — a kid who has
  // used up today's fun XP is still building up their wallet. Loot Drop's
  // `override` rewrites xp/coins only, so bricks still track real answers.
  const pillars = computePillarAward(raw, character.wallet?.dailySparks, day);
  const bricksEarned = pillars.bricksEarned;
  const sparksEarned = pillars.sparksEarned;

  const newXp    = (character.xp || 0) + xp;
  const oldLevel = levelFromXp(character.xp || 0).level;
  const newLevel = levelFromXp(newXp).level;
  const streak   = rollStreak(character, day);

  /* ---- critters (E2) ----
     'roll' games: a qualifying run earns rolls, taken here against the
     daily cap. 'encounter' games: the run's pending captures confirm
     only if the game's own success condition holds. Both are computed
     against the FRESH character (inside the transaction for a signed-in
     kid) so the cap, the pity counter and isNew are all true at write
     time. Loot Drop's in-round chests ride `result.sprites` above and
     are exempt. */
  const rolls = dropRolls(gameId, raw);
  // Practice Power only ever rises on a qualifying LEARN run — not for
  // fun games, not for logging in, and never for minutes played.
  const earnsPower = game.kind === 'learn' && runQualifies(gameId, raw);
  const powerFor = (fresh) => earnsPower
    ? practicePowerAfterRun(fresh, day)
    : { power: practicePowerNow(fresh, day), powerDay: fresh.powerDay, gained: 0, alreadyToday: false };
  const pendingCaptures = game.critterMode === 'encounter' ? (result?.captures || []) : [];
  const captureOk = game.critterMode === 'encounter' && !!game.captureCondition?.test?.(result);
  function critterDrops(fresh, power) {
    const me = { ...fresh, level: levelFromXp((fresh.xp || 0) + xp).level };
    // Today's practice counts toward today's odds: the meter is read
    // AFTER this run's gain, so practising pays immediately.
    const luck = luckScore({ accuracy: raw.accuracy, practicePower: power });
    if (game.critterMode === 'roll') {
      return { ...rollDrops({ rolls, character: me, luck, dayStr: day }), escaped: [] };
    }
    if (game.critterMode === 'encounter') {
      if (!captureOk) return { drops: [], dropsState: freshDrops(fresh.drops, day), capped: false, escaped: pendingCaptures };
      const c = confirmCaptures({ captures: pendingCaptures, character: me, dayStr: day });
      return { drops: c.drops, dropsState: c.dropsState, capped: false, escaped: c.overflow };
    }
    return { drops: [], dropsState: freshDrops(fresh.drops, day), capped: false, escaped: [] };
  }
  const dropCountsOf = (drops) => {
    const m = {};
    drops.forEach((d) => { m[d.spriteId] = (m[d.spriteId] || 0) + 1; });
    return m;
  };
  // Critter Reader's bedtime star rides the same write (E3).
  const starSprite = result?.critterStar || null;

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
    xpEarned: xp, coinsEarned: 0,   // rewritten below with the granted amount
    bricksEarned, sparksEarned,
  };

  const byGame = character.lifetime.byGame?.[gameId] || { runs: 0, xp: 0, coins: 0 };
  const lifetimeUpdate = {
    'character.lifetime.runs':      increment(1),
    'character.lifetime.correct':   increment(raw.correct),
    'character.lifetime.attempted': increment(raw.asked),
    'character.lifetime.seconds':   increment(raw.seconds),
    [`character.lifetime.byGame.${gameId}.runs`]:  increment(1),
    [`character.lifetime.byGame.${gameId}.xp`]:    increment(xp),
    [`character.lifetime.byGame.${gameId}.coins`]: increment(0),   // rewritten below with the granted amount
  };

  const levelUp = { leveledUp: newLevel > oldLevel, newLevel, oldLevel };
  let byGameCoins = 0;
  const outcome = {
    xp, coins: 0, coinsCapped: false, bonusVault: { eligible: false, room: 0 },
    bricksEarned, sparksEarned, ...levelUp,
    cappedByDailyFun: clamped.cappedXp || clamped.cappedCoins,
    sprites: wonCounts,
    dayStreak: streak,
    // filled in below once the critter roll has run against fresh counts
    drops: [], dropsCapped: false, dropsEarned: rolls, escapedCaptures: [], counts: {},
    star: null, practicePower: { value: 0, gained: 0, max: PRACTICE_POWER.max },
  };

  /* ---- guests: same logic, localStorage instead of Firestore ---- */
  if (isGuestKid(childId)) {
    const next = healCharacter(character);
    // Practice Power first: today's practice counts toward today's odds,
    // so the meter has to be settled before the critter roll reads it.
    const pw = powerFor(character);
    next.practicePower = pw.power;
    next.powerDay = pw.powerDay;
    outcome.practicePower = { value: pw.power, gained: pw.gained, max: PRACTICE_POWER.max };
    const coinRes = clampDailyCoins(wantCoins, character.dailyCoins, day);
    const coins = coinRes.granted;
    next.dailyCoins = coinRes.dailyCoins;
    outcome.coins = coins;
    outcome.coinsCapped = coinRes.capped;
    outcome.bonusVault = vaultOpens(gameId, raw)
      ? { eligible: true, floor: VAULT.floorCoins, ceiling: VAULT.ceilingCoins,
          zone: vaultZone(game.kind, raw.accuracy), room: Math.max(0, coinRes.room - coins) }
      : { eligible: false, room: Math.max(0, coinRes.room - coins) };
    const found = critterDrops(character, pw.power);
    Object.assign(outcome, { drops: found.drops, dropsCapped: found.capped, escapedCaptures: found.escaped });
    next.drops = found.dropsState;
    next.xp = newXp;
    next.level = newLevel;
    next.coins = (next.coins || 0) + coins;
    byGameCoins = coins;
    Object.entries(wonCounts).forEach(([id, n]) => { next.counts[id] = (next.counts[id] || 0) + n; });
    Object.entries(dropCountsOf(found.drops)).forEach(([id, n]) => { next.counts[id] = (next.counts[id] || 0) + n; });
    outcome.counts = { ...next.counts };
    (result?.grantSkins || []).forEach((id) => { if (!next.ownedSkins.includes(id)) next.ownedSkins.push(id); });
    (result?.grantPets  || []).forEach((id) => { if (!next.ownedPets.includes(id))  next.ownedPets.push(id); });
    (result?.claimStreakGifts || []).forEach((d) => { if (!next.claimedStreakGifts.includes(d)) next.claimedStreakGifts.push(d); });
    next.dayStreak  = streak;
    next.lastPlayed = day;
    next.dailyFun   = clamped.daily;
    next.wallet.bricks = (next.wallet.bricks || 0) + bricksEarned;
    next.wallet.sparks = (next.wallet.sparks || 0) + sparksEarned;
    next.wallet.dailySparks = pillars.dailySparks;
    next.lifetime.runs      = (next.lifetime.runs || 0) + 1;
    next.lifetime.correct   = (next.lifetime.correct || 0) + raw.correct;
    next.lifetime.attempted = (next.lifetime.attempted || 0) + raw.asked;
    next.lifetime.seconds   = (next.lifetime.seconds || 0) + raw.seconds;
    next.lifetime.byGame[gameId] = {
      runs: byGame.runs + 1, xp: byGame.xp + xp, coins: byGame.coins + byGameCoins,
    };
    session.coinsEarned = byGameCoins;
    const star = critterStarGrant(character, starSprite, day);
    if (starSprite) {
      outcome.star = star;
      if (star.earned) {
        next.starDay = day;
        next.critterStars[star.spriteId] = star.complete ? 0 : star.stars;
        if (star.granted) next.counts[star.spriteId] = (next.counts[star.spriteId] || 0) + 1;
      }
    }
    const guestGrants = completionGrants(next.counts, character);
    applyGrantsLocal(next, guestGrants);
    outcome.newlyCompleted = guestGrants.newlyCompleted;
    outcome.grandPrize = guestGrants.grandPrize;
    next.updatedAt = Date.now();
    localStorage.setItem(charKey(childId), JSON.stringify(next));

    const log = readLocal(sessionsKey(childId), []);
    log.unshift({ ...session, playedAt: Date.now() });
    localStorage.setItem(sessionsKey(childId), JSON.stringify(log.slice(0, GUEST_SESSION_CAP)));
    return outcome;
  }

  /* ---- signed in: the character update and the session doc go together ----
     A transaction rather than a batch (since R2B): the completion check
     needs the counts as they really are at write time, not as they were
     when the run started, so a sprite that arrived by trade mid-run
     still completes the set on this write. */
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  const ref = childRef(childId);
  const sessionRef = doc(collection(ref, 'sessions'));

  const update = {
    'character.xp': increment(xp),
    'character.level': newLevel,
    'character.dayStreak': streak,
    'character.lastPlayed': day,
    'character.dailyFun': clamped.daily,
    'character.wallet.bricks': increment(bricksEarned),
    'character.wallet.sparks': increment(sparksEarned),
    'character.wallet.dailySparks': pillars.dailySparks,
    'character.updatedAt': serverTimestamp(),
    ...lifetimeUpdate,
  };
  Object.entries(wonCounts).forEach(([id, n]) => { update[`character.counts.${id}`] = increment(n); });
  if (result?.grantSkins?.length) update['character.ownedSkins'] = arrayUnion(...result.grantSkins);
  if (result?.grantPets?.length)  update['character.ownedPets']  = arrayUnion(...result.grantPets);
  if (result?.claimStreakGifts?.length) update['character.claimedStreakGifts'] = arrayUnion(...result.claimStreakGifts);

  const grants = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const fresh = healCharacter(snap.exists() ? snap.data()?.character : null);
    const pw = powerFor(fresh);
    const found = critterDrops(fresh, pw.power);
    const dropCounts = dropCountsOf(found.drops);
    const star = critterStarGrant(fresh, starSprite, day);
    const coinRes = clampDailyCoins(wantCoins, fresh.dailyCoins, day);
    const nextCounts = { ...fresh.counts };
    Object.entries(wonCounts).forEach(([id, n])  => { nextCounts[id] = (nextCounts[id] || 0) + n; });
    Object.entries(dropCounts).forEach(([id, n]) => { nextCounts[id] = (nextCounts[id] || 0) + n; });
    if (star.granted) nextCounts[star.spriteId] = (nextCounts[star.spriteId] || 0) + 1;
    const g = completionGrants(nextCounts, fresh);
    const txUpdate = {
      ...update, ...g.update, ...star.update,
      'character.drops': found.dropsState,
      // Only written on a day the child actually practised; decay needs
      // no write, since practicePowerNow() derives it from powerDay.
      ...(pw.gained > 0 ? { 'character.practicePower': pw.power, 'character.powerDay': pw.powerDay } : {}),
      'character.coins': increment(coinRes.granted),
      'character.dailyCoins': coinRes.dailyCoins,
      [`character.lifetime.byGame.${gameId}.coins`]: increment(coinRes.granted),
    };
    Object.entries(dropCounts).forEach(([id, n]) => {
      txUpdate[`character.counts.${id}`] = increment(n + (wonCounts[id] || 0));
    });
    // A quest grant and a drop of the same sprite in one run would write
    // the same field twice — fold them into one increment.
    if (star.granted) {
      const already = dropCounts[star.spriteId] ? (dropCounts[star.spriteId] + (wonCounts[star.spriteId] || 0)) : 0;
      txUpdate[`character.counts.${star.spriteId}`] = increment(already + 1);
    }
    tx.update(ref, txUpdate);
    tx.set(sessionRef, { ...session, coinsEarned: coinRes.granted, playedAt: serverTimestamp(), dropsWon: found.drops.length });
    return { ...g, found, nextCounts, star, coinRes, pw };
  });
  outcome.newlyCompleted = grants.newlyCompleted;
  outcome.grandPrize = grants.grandPrize;
  outcome.drops = grants.found.drops;
  outcome.dropsCapped = grants.found.capped;
  outcome.escapedCaptures = grants.found.escaped;
  outcome.counts = grants.nextCounts;
  if (starSprite) outcome.star = grants.star;
  outcome.practicePower = { value: grants.pw.power, gained: grants.pw.gained, max: PRACTICE_POWER.max };
  outcome.coins = grants.coinRes.granted;
  outcome.coinsCapped = grants.coinRes.capped;
  outcome.bonusVault = vaultOpens(gameId, raw)
    ? { eligible: true, floor: VAULT.floorCoins, ceiling: VAULT.ceilingCoins,
        zone: vaultZone(game.kind, raw.accuracy), room: Math.max(0, grants.coinRes.room - grants.coinRes.granted) }
    : { eligible: false, room: Math.max(0, grants.coinRes.room - grants.coinRes.granted) };
  return outcome;
}

/**
 * THE COIN FAUCET — every coin a kid earns outside a run's own award
 * arrives here: the shared Bonus Vault, Loot Drop's between-round
 * mini-games, and (once the Box exists) compliments.
 *
 * Nothing about it is a "run", so it writes no session doc. It is
 * clamped by the SAME daily cap as everything else, which is what stops
 * any one surface becoming the faucet — a kid who reads six bedtime
 * stories gets six Vaults but not six times the coins. Being capped is
 * never an error: it returns ok with a smaller `granted` and
 * `capped: true`, and the UI says it in tomorrow's language.
 *
 * increment() only; never negative — spending happens in buyItem's
 * transaction, nowhere else.
 */
export async function grantCoins(childId, amount) {
  assertActiveChild(childId);
  const want = Math.max(0, Math.round(Number(amount) || 0));
  if (!want) return { ok: true, granted: 0, capped: false };
  const day = todayKey();

  if (isGuestKid(childId)) {
    const character = healCharacter(readLocal(charKey(childId), null));
    const res = clampDailyCoins(want, character.dailyCoins, day);
    character.coins = (character.coins || 0) + res.granted;
    character.dailyCoins = res.dailyCoins;
    character.updatedAt = Date.now();
    localStorage.setItem(charKey(childId), JSON.stringify(character));
    return { ok: true, granted: res.granted, capped: res.capped };
  }

  const ref = childRef(childId);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const character = healCharacter(snap.exists() ? snap.data()?.character : null);
      const res = clampDailyCoins(want, character.dailyCoins, day);
      tx.update(ref, {
        'character.coins': increment(res.granted),
        'character.dailyCoins': res.dailyCoins,
        'character.updatedAt': serverTimestamp(),
      });
      return { ok: true, granted: res.granted, capped: res.capped };
    });
  } catch (e) {
    return { ok: false, granted: 0, capped: false, why: 'failed' };
  }
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
  // Structural, not by omission: anything buyable:false (statues, the
  // Grand Prize) cannot be bought even if a shop somehow lists it.
  if (!item || !isBuyable(item)) return { ok: false, why: 'missing' };

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
      uniqueSprites: uniqueLiveCount(character.counts),
      badges: character.badges,
    };
  }));
}

/** A sibling's kit, read-only — for the "what has he got equipped?" peek.
    Shaped so spriteState(id, loadout) works on it directly. */
export async function getSiblingLoadout(childId) {
  const character = await readCharacter(childId);
  return {
    childId,
    skin: character.skin, pet: character.pet,
    ownedSkins: character.ownedSkins, ownedPets: character.ownedPets,
    counts: character.counts,
    level: character.level,
    xp: character.xp,
    badges: character.badges,
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

/**
 * A trade doc, whichever shape it was written in. Trades from before
 * multi-item offers existed carry a single offerSprite/wantSprite; they
 * are read as one-element arrays so a pending offer made yesterday
 * still works today. Nothing rewrites them — the old shape is simply
 * understood.
 */
function readTrade(id, t) {
  const offer = Array.isArray(t.offer) ? t.offer : (t.offerSprite ? [t.offerSprite] : []);
  const want  = Array.isArray(t.want)  ? t.want  : (t.wantSprite  ? [t.wantSprite]  : []);
  return { ...t, id, offer, want, legacy: !Array.isArray(t.offer) };
}

/**
 * Offer any 1–6 sprites for any 1–6 of theirs. The receiver simply
 * accepts or declines — there is no counter-offer, and no haggling
 * surface, because every extra step is another thing to explain to a
 * six-year-old.
 *
 * Validated here so a bad offer is never written, and validated AGAIN
 * inside respondToTrade's transaction, because the collection can move
 * between making an offer and answering it.
 */
export async function proposeTrade(fromChildId, toChildId, offer, want) {
  assertActiveChild(fromChildId);
  if (isGuestKid(fromChildId) || isGuestKid(toChildId)) {
    return { ok: false, why: 'guest' };   // guests have no sibling to trade with
  }
  if (fromChildId === toChildId) return { ok: false, why: 'self' };
  const offerIds = Array.isArray(offer) ? offer : [offer];
  const wantIds  = Array.isArray(want)  ? want  : [want];

  const mine = await readCharacter(fromChildId);
  const problem = tradeSideProblem(mine.counts, offerIds);
  if (problem) return { ok: false, why: problem };
  // The want side is only size-checked here: whether THEY can spare it is
  // their business, re-checked when they answer.
  if (!wantIds.length || wantIds.length > ECONOMY.maxTradeItems) return { ok: false, why: 'want size' };
  if (wantIds.some((id) => !inCollection(id))) return { ok: false, why: 'missing' };

  const me = (await listChildren()).find((c) => c.id === fromChildId);
  const ref = await addDoc(tradesRef(), {
    fromChildId, fromNickname: me?.nickname || 'Someone', toChildId,
    offer: offerIds, want: wantIds,
    status: 'pending', createdAt: serverTimestamp(),
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
  const all = snap.docs.map((d) => readTrade(d.id, d.data()));
  const mine = await readCharacter(childId).catch(() => blankCharacter());
  const newest = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
  return {
    incoming: all.filter((t) => t.toChildId === childId).sort(newest).map((t) => ({
      ...t,
      // Can this kid actually afford their side right now? The card uses
      // it to explain rather than to fail silently on Accept.
      problem: tradeSideProblem(mine.counts, t.want),
    })),
    outgoing: all.filter((t) => t.fromChildId === childId).sort(newest),
  };
}

/**
 * Every trade ever, newest first, for the grown-up portal. This is the
 * real safety valve on open-ended trading: rather than a rule that stops
 * a big brother talking a little brother into five-for-one, there is a
 * log a parent can look at, notice a pattern in, and have a conversation
 * about. That is a parenting moment, not a code rule.
 */
export async function listTradeLog(max = 100) {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(query(tradesRef(), limit(max)));
  const kids = await listChildren().catch(() => []);
  const nameOf = (id) => kids.find((k) => k.id === id)?.nickname || 'someone';
  return snap.docs
    .map((d) => readTrade(d.id, d.data()))
    .map((t) => ({
      id: t.id, status: t.status,
      from: t.fromNickname || nameOf(t.fromChildId), to: nameOf(t.toChildId),
      offer: t.offer, want: t.want,
      createdAt: t.createdAt?.toMillis?.() ?? null,
      resolvedAt: t.resolvedAt?.toMillis?.() ?? null,
    }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Accept or decline. On accept, EVERY sprite on both sides moves inside
 * one transaction: the proposer hands over `offer` and receives `want`,
 * the accepter does the reverse. A partial write here would mean a kid
 * loses a critter and gets nothing back, which is the one bug that would
 * end this feature's credibility with them.
 *
 * Nothing read before the transaction is trusted. Re-checked at the
 * moment the sprites move:
 *   · the trade is still pending, and this really is the kid it was sent to
 *   · 1–6 items on each side
 *   · NEVER YOUR LAST COPY, on BOTH sides — each kid must hold at least
 *     one more of every sprite than they are giving away
 *
 * Then the collection-completion check runs for both kids, because a
 * trade that finishes someone's set is the entire point of trading.
 *
 * Note what is deliberately NOT checked: the receiver's level. Trading
 * legitimately bypasses the level gate — a legendary handed over by a
 * generous brother lands in full colour at Level 1.
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
      const trade = readTrade(tradeId, tradeSnap.data());
      if (trade.status !== 'pending') return { ok: false, why: 'already answered' };
      // Only the child the offer was made to can answer it.
      if (trade.toChildId !== active.id) return { ok: false, why: 'not yours' };

      if (!accept) {
        tx.update(tradeRef, { status: 'declined', resolvedAt: serverTimestamp() });
        return { ok: true, status: 'declined' };
      }

      const fromRef = doc(db, 'families', uid, 'children', trade.fromChildId);
      const toRef   = doc(db, 'families', uid, 'children', trade.toChildId);
      const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);
      const fromChar = healCharacter(fromSnap.exists() ? fromSnap.data()?.character : null);
      const toChar   = healCharacter(toSnap.exists()   ? toSnap.data()?.character   : null);

      // The guardrail, both ways. Whoever is giving something up must
      // keep at least one of it — the proposer for `offer`, the
      // accepter for `want`.
      const fromProblem = tradeSideProblem(fromChar.counts, trade.offer);
      if (fromProblem) return { ok: false, why: 'offer gone', side: 'from', problem: fromProblem };
      const toProblem = tradeSideProblem(toChar.counts, trade.want);
      if (toProblem) return { ok: false, why: 'want gone', side: 'to', problem: toProblem };

      // Move every sprite on both sides. Repeats in an array mean
      // quantity, so the tally is what actually gets incremented.
      const giving   = tradeTally(trade.offer);   // proposer → accepter
      const wanting  = tradeTally(trade.want);    // accepter → proposer
      const fromNext = { ...fromChar.counts };
      const toNext   = { ...toChar.counts };
      const fromUpdate = { 'character.updatedAt': serverTimestamp() };
      const toUpdate   = { 'character.updatedAt': serverTimestamp() };
      // Netted per sprite rather than written per side, so a sprite that
      // appears on BOTH sides of a trade nets out correctly instead of
      // one dotted-path write clobbering the other.
      const netFrom = {}, netTo = {};
      for (const [id, n] of Object.entries(giving)) { netFrom[id] = (netFrom[id] || 0) - n; netTo[id] = (netTo[id] || 0) + n; }
      for (const [id, n] of Object.entries(wanting)) { netTo[id] = (netTo[id] || 0) - n; netFrom[id] = (netFrom[id] || 0) + n; }
      for (const [id, n] of Object.entries(netFrom)) {
        fromNext[id] = (fromNext[id] || 0) + n;
        if (n !== 0) fromUpdate[`character.counts.${id}`] = increment(n);
      }
      for (const [id, n] of Object.entries(netTo)) {
        toNext[id] = (toNext[id] || 0) + n;
        if (n !== 0) toUpdate[`character.counts.${id}`] = increment(n);
      }

      // The completion check runs for BOTH kids on the counts as they
      // will be after the swap — a trade that finishes a set is the whole
      // point of trading, and the receiver gets the full celebration.
      const fromGrants = completionGrants(fromNext, fromChar);
      const toGrants   = completionGrants(toNext, toChar);

      tx.update(fromRef, { ...fromUpdate, ...fromGrants.update });
      tx.update(toRef,   { ...toUpdate,   ...toGrants.update });
      tx.update(tradeRef, { status: 'accepted', resolvedAt: serverTimestamp() });
      return {
        ok: true, status: 'accepted',
        got: trade.offer, gave: trade.want,
        newlyCompleted: { [trade.fromChildId]: fromGrants.newlyCompleted, [trade.toChildId]: toGrants.newlyCompleted },
        grandPrize:     { [trade.fromChildId]: fromGrants.grandPrize,     [trade.toChildId]: toGrants.grandPrize },
      };
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
