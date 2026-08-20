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
  getRedirectResult,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc,
  query, where, limit, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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
   Firestore security rules — this repo has no deploy pipeline, so these
   are NOT applied automatically. Paste them into Firebase Console →
   Firestore Database → Rules for the project above:

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
