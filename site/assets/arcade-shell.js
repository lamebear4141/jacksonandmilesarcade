/* =====================================================================
   ARCADE SHELL — the furniture every game shares.

   Four jobs:
     mountBar()     the standard top bar
     requireKid()   refuse to run a game with nobody signed in
     finishRun()    the one way a game reports a finished run
     deviceIsTouch() for the games that genuinely need a mouse

   Pair it with assets/arcade.css. A game loads both, calls requireKid()
   before it starts and finishRun() when it ends, and gets the whole
   character system without knowing anything about Firestore.
   ===================================================================== */
import {
  onParentChange, getCurrentKid, clearCurrentKid, isGuestKid,
  loadCharacter, awardRun,
} from '../firebase-config.js';
import { GAMES, SKINS, PETS, SAFETY, levelFromXp } from './catalog.js';

/* The hub, resolved from this file's own location rather than from the
   page's — so it's the same link whether a game at /loot-drop/index.html
   or the hub itself is doing the asking. */
const HUB = new URL('../index.html', import.meta.url).href;

/** Resolves once with the first auth state, rather than on every change —
    a game only needs to know "is somebody signed in?" at startup. */
function firstAuthState() {
  return new Promise((resolve) => {
    let done = false;
    const stop = onParentChange((user) => {
      if (done) return;
      done = true;
      // unsubscribe on the next tick; calling it synchronously from
      // inside the callback isn't reliable across SDK versions.
      setTimeout(() => { try { stop(); } catch {} }, 0);
      resolve(user);
    });
  });
}

/* ---------------------------------------------------------------------
   WHAT KIND OF DEVICE IS THIS?

   Do NOT use navigator.maxTouchPoints for this. A touchscreen Windows
   laptop reports 10 touch points while sitting there with a trackpad
   attached — testing that number told Harvest Night "you're a tablet" on
   the exact machine the game is built for. Ask about the POINTER instead.
   --------------------------------------------------------------------- */

/** Is the primary way of pointing at this screen a fingertip? */
export function deviceIsTouch() {
  if (!window.matchMedia) return 'ontouchstart' in window;
  return window.matchMedia('(pointer: coarse)').matches;
}

/** Is there a precise pointer available at all? True on a plain laptop
    AND on a touchscreen laptop — both of which can play a mouse game. */
export function deviceHasMouse() {
  if (!window.matchMedia) return !('ontouchstart' in window);
  return window.matchMedia('(any-pointer: fine)').matches;
}

/** The real question for Harvest Night: can this browser actually capture
    the mouse? No mobile browser supports Pointer Lock, so a game that
    needs it cannot take input there at all — better to say so kindly than
    to load a game that ignores every tap. */
export function canPointerLock() {
  return deviceHasMouse() && 'requestPointerLock' in document.documentElement;
}

/* =====================================================================
   THE TOP BAR
   Back link · who's playing · their level · their purse · switch profile.
   ===================================================================== */
export async function mountBar({ back = true, title = '', mount = null } = {}) {
  const kid = getCurrentKid();
  const bar = document.createElement('header');
  bar.className = 'ac-bar ac-bar--game';

  const left = document.createElement('div');
  left.className = 'ac-bar__group';
  if (back) {
    const a = document.createElement('a');
    a.className = 'ac-btn--ghost';
    a.href = HUB;
    // The hub lands on the kid's character home, which the family calls
    // the Clubhouse — the label should match where the door actually goes.
    a.textContent = '← Clubhouse';
    left.appendChild(a);
  }
  if (title) {
    const t = document.createElement('span');
    t.className = 'ac-bar__title';
    t.textContent = title;
    left.appendChild(t);
  }

  const right = document.createElement('div');
  right.className = 'ac-bar__group';

  const who = document.createElement('span');
  who.textContent = kid ? `Playing as ${kid.nickname}` : 'Nobody playing';
  right.appendChild(who);

  const level = document.createElement('span');
  level.className = 'ac-bar__level';
  level.textContent = 'Level —';
  right.appendChild(level);

  const coins = document.createElement('span');
  coins.className = 'ac-bar__coins';
  coins.textContent = '\u{1FA99} —';
  right.appendChild(coins);

  const switcher = document.createElement('button');
  switcher.type = 'button';
  switcher.className = 'ac-btn--ghost';
  switcher.textContent = 'Switch profile';
  // Switching always routes back through the hub's picker — never
  // silently, and a real kid re-enters their own PIN there. The #pick
  // hash tells the hub to open the who's-playing screen directly instead
  // of parking on the front door.
  switcher.addEventListener('click', () => { clearCurrentKid(); window.location.href = HUB + '#pick'; });
  right.appendChild(switcher);

  bar.append(left, right);
  (mount || document.body).prepend(bar);

  // Fill in the live numbers once the character loads. The bar is already
  // on screen by then, so a slow network delays the numbers, not the game.
  const refresh = async () => {
    const k = getCurrentKid();
    if (!k) return;
    try {
      const c = await loadCharacter(k.id);
      const info = levelFromXp(c.xp || 0);
      level.textContent = `Level ${info.level}`;
      coins.textContent = `\u{1FA99} ${(c.coins || 0).toLocaleString()}`;
    } catch { /* leave the dashes rather than shouting at a kid */ }
  };
  refresh();
  return { bar, refresh };
}

/* =====================================================================
   REQUIRE A PROFILE

   Closes a real hole: until now any game URL would load with no profile
   selected, and the whole session saved nowhere. Returns the kid, or
   null after replacing the page with a friendly picker prompt.
   ===================================================================== */
export async function requireKid({ mount = null, gameName = '' } = {}) {
  const user = await firstAuthState();
  const kid = getCurrentKid();
  const guest = kid && isGuestKid(kid.id);
  if (kid && (guest || user)) { beginRun(); return kid; }

  const host = mount || document.body;
  host.innerHTML = '';
  const gate = document.createElement('div');
  gate.className = 'ac-gate';
  gate.innerHTML = `
    <span class="ac-gate__emoji">\u{1F579}️</span>
    <h2>Who's playing?</h2>
    <p>Pick your profile first so ${gameName ? gameName + ' can' : 'we can'} save your
       XP, coins and collection to your character.</p>
    <a class="ac-btn ac-btn--inline" href="${HUB}#pick">Go and pick</a>`;
  host.appendChild(gate);
  document.body.classList.add('ac-page');
  return null;
}

/* =====================================================================
   THE SAFETY NET — SAFETY.maxRunMinutes

   The Phase-2 audit found that no question-driven game here has an idle
   timeout: a kid who walks away mid-question leaves the run open for
   ever, and nothing is saved until it ends. This closes that, for every
   game, without any game having to know about it — the game id is read
   off the URL, since every game lives at /<gameId>/index.html and its
   GAMES href is that same folder.

   The clock starts when requireKid() hands a game its profile, and
   restarts after every completed run, so it measures "how long has this
   one run been going", not "how long has this kid been here". Lots of
   short innings never trip it.

   A game that wants FULL credit at the cutoff registers a snapshot:

       beginRun('math-baseball', () => ({ asked, correct, units }));

   Without one the run still ends and still pays — for the time played —
   but it cannot know what the kid had already earned. Wiring the
   snapshot into each game is a one-line change per game and is NOT part
   of this phase.
   ===================================================================== */
let safetyTimer = null;
let safetyGameId = null;
let safetySnapshot = null;
let safetyStart = 0;

/** Which game is this page? Null on the hub or anywhere else. */
export function currentGameId() {
  const parts = location.pathname.split('/').filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) if (GAMES[parts[i]]) return parts[i];
  return null;
}

/** (Re)start the safety clock. `getResult` is optional; when a game
    supplies it, the cutoff awards exactly what the game says it earned. */
export function beginRun(gameId, getResult) {
  const id = gameId || currentGameId();
  if (!id || !GAMES[id]) return;
  safetyGameId = id;
  if (typeof getResult === 'function') safetySnapshot = getResult;
  safetyStart = Date.now();
  clearTimeout(safetyTimer);
  // Clamp the MILLISECONDS, not the minutes: flooring at 1 minute would
  // silently ignore a smaller value set for testing. 1s is only here so a
  // zero can never turn this into a tight loop.
  const ms = Math.max(1000, (Number(SAFETY.maxRunMinutes) || 0) * 60000);
  safetyTimer = setTimeout(() => { endRunForBreak().catch(() => {}); }, ms);
}

/** Stop the clock without ending anything — for a game that knows it is
    parked on a menu rather than mid-run. */
export function pauseRunClock() {
  clearTimeout(safetyTimer);
  safetyTimer = null;
}

/** The cutoff. Ends the run through the ordinary award path so the kid
    keeps everything, then says so kindly. */
export async function endRunForBreak() {
  safetyTimer = null;
  const gameId = safetyGameId;
  if (!gameId) return null;
  const seconds = Math.round((Date.now() - safetyStart) / 1000);

  let result = { asked: 0, correct: 0, units: 0, seconds };
  try {
    const snap = safetySnapshot && safetySnapshot();
    if (snap) result = { asked: 0, correct: 0, units: 0, ...snap, seconds };
  } catch { /* a broken snapshot must never cost the kid the run */ }

  const outcome = await finishRun(gameId, result);
  // Don't re-arm behind the break card — finishRun just restarted the
  // clock on its way out, and one cutoff per run is the whole idea.
  pauseRunClock();
  safetyGameId = null;
  showBreakCard(outcome);
  return outcome;
}

/** Warm, celebratory, and never a word about screen time. */
function showBreakCard(outcome) {
  if (document.querySelector('.ac-breakcard')) return;
  const overlay = document.createElement('div');
  overlay.className = 'ac-levelup ac-breakcard';
  const card = document.createElement('div');
  card.className = 'ac-levelup__card';

  const h2 = document.createElement('h2');
  h2.textContent = '🏆';   // the sentence below carries the 🎉
  const line = document.createElement('p');
  line.className = 'ac-levelup__sub';
  line.textContent = 'What a session! Time for a break — your stuff is saved. 🎉';
  card.append(h2, line);

  const earned = describeAward(outcome);
  if (earned) {
    const award = document.createElement('p');
    award.className = 'ac-levelup__sub';
    award.textContent = earned;
    card.appendChild(award);
  }

  const back = document.createElement('a');
  back.className = 'ac-btn ac-btn--inline';
  back.href = HUB;
  back.textContent = '← Back to the Clubhouse';
  card.appendChild(back);

  overlay.appendChild(card);
  document.body.appendChild(overlay);
  sfx.play('win');
}

/* =====================================================================
   FINISH A RUN — the single path from a game to the character.

   result: { asked, correct, seconds, score, units?, sprites? }
   returns { xp, coins, bricksEarned, sparksEarned, leveledUp, newLevel, saved }

   bricksEarned / sparksEarned are the pillar wallet — 🧱 from a 'learn'
   game, ⚡ from a 'fun' one — paid alongside xp and coins, never instead
   of them. Both keys are always present, so a game can read either one
   without first checking which kind it is.

   ---------------------------------------------------------------------
   THE DOUBLE-SUBMIT GUARD
   ---------------------------------------------------------------------
   Saving takes a network round-trip, and nothing on screen moves while
   it's in flight. A kid mashing the end-screen button lands a second
   call before the first resolves and gets awarded twice — this really
   happened during Phase 1 testing, with two runs both landing in full.

   So: while a save is in flight, every further call gets handed the SAME
   promise instead of starting another one. The end screen shows one
   award, the character gets one award. A short cooldown afterwards
   covers the clicks that arrive just after it settles; it's far below
   the length of any real run, so it can never block a genuine one.
   ===================================================================== */
const RESUBMIT_COOLDOWN_MS = 1500;
let inFlight = null;
let settledAt = 0;
let lastOutcome = null;

export async function finishRun(gameId, result) {
  if (!GAMES[gameId]) throw new Error('Unknown game id: ' + gameId);

  // Already saving? Hand back the same promise.
  if (inFlight) return inFlight;
  // Just finished saving? Hand back what it produced, without saving again.
  if (lastOutcome && Date.now() - settledAt < RESUBMIT_COOLDOWN_MS) return lastOutcome;

  const kid = getCurrentKid();
  if (!kid) {
    // Nothing to save to. Never blow up a game's end screen over it.
    return { xp: 0, coins: 0, bricksEarned: 0, sparksEarned: 0, leveledUp: false, newLevel: 1, saved: false, reason: 'no profile' };
  }

  inFlight = (async () => {
    try {
      const out = await awardRun(kid.id, gameId, result);
      return { ...out, saved: true };
    } catch (e) {
      return { xp: 0, coins: 0, bricksEarned: 0, sparksEarned: 0, leveledUp: false, newLevel: 1, saved: false, reason: e.message };
    }
  })();

  try {
    const outcome = await inFlight;
    lastOutcome = outcome;
    settledAt = Date.now();
    // The next run gets a fresh 45 minutes. This is what makes the clock
    // measure one run rather than the whole sitting.
    if (safetyGameId) beginRun(safetyGameId);
    return outcome;
  } finally {
    inFlight = null;
  }
}

/** For tests, and for a game that legitimately wants to save two runs
    back to back without waiting out the cooldown. */
export function _resetRunGuard() {
  inFlight = null; lastOutcome = null; settledAt = 0;
}

/* =====================================================================
   Small helpers a few games want.
   ===================================================================== */

/**
 * The full-screen level-up moment. Call it with finishRun's outcome; it
 * does nothing unless the run actually levelled the character up. Shows
 * the new level and anything the shop just unlocked — celebration only,
 * a kid can never see this screen for doing badly.
 */
export function celebrateLevelUp(outcome) {
  if (!outcome?.leveledUp) return;
  const unlocked = [...SKINS, ...PETS].filter(
    (i) => i.level > outcome.oldLevel && i.level <= outcome.newLevel);

  // Levelling up is one of the two screen-shake moments (the other is
  // the front door's PLAY press). All fire-and-forget.
  sfx.play('win');
  confettiRain(140);
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 400);

  const overlay = document.createElement('div');
  overlay.className = 'ac-levelup';
  const card = document.createElement('div');
  card.className = 'ac-levelup__card';
  overlay.appendChild(card);

  const h2 = document.createElement('h2');
  h2.textContent = `\u{1F389} LEVEL ${outcome.newLevel}!`;
  card.appendChild(h2);

  if (unlocked.length) {
    const sub = document.createElement('p');
    sub.className = 'ac-levelup__sub';
    sub.textContent = 'New in the shop:';
    const row = document.createElement('div');
    row.className = 'ac-levelup__items';
    unlocked.forEach((i) => {
      const chip = document.createElement('span');
      chip.className = 'ac-badge';
      chip.textContent = `${i.g} ${i.n}`;
      row.appendChild(chip);
    });
    card.append(sub, row);
  }

  const btn = document.createElement('button');
  btn.className = 'ac-btn ac-btn--inline';
  btn.type = 'button';
  btn.textContent = 'Keep going!';
  btn.addEventListener('click', () => overlay.remove());
  card.appendChild(btn);
  document.body.appendChild(overlay);
}

/** "+316 XP · +125 🪙 · +34 🧱", or a gentle note when nothing could be
    saved. Bricks and sparks sit right beside the coins in the same style;
    each game only ever shows the one its kind pays, because the other is
    zero and zeroes are left out. */
export function describeAward(outcome) {
  if (!outcome?.saved) return 'Played as a guest — nothing saved this time.';
  const bits = [];
  if (outcome.xp) bits.push(`+${outcome.xp} XP`);
  if (outcome.coins) bits.push(`+${outcome.coins} \u{1FA99}`);
  if (outcome.bricksEarned) bits.push(`+${outcome.bricksEarned} \u{1F9F1}`);
  if (outcome.sparksEarned) bits.push(`+${outcome.sparksEarned} \u26A1`);
  if (!bits.length) return "That's today's fun-game limit — practice games still pay full!";
  return bits.join(' · ');
}

/* =====================================================================
   SFX — synthesized WebAudio, no audio files.

   The AudioContext is created lazily on the first play() — which always
   happens inside a user gesture (a click), so autoplay policy is happy —
   and resumed if the browser suspended it. The mute preference lives in
   localStorage('arcade.sound') and is shared with the front door's
   corner toggle.
   ===================================================================== */
const SOUND_KEY = 'arcade.sound';
let audioCtx = null;
let sfxMuted = (() => { try { return localStorage.getItem(SOUND_KEY) === 'off'; } catch { return false; } })();

function audio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

/** One enveloped oscillator note. `to` glides the pitch across `dur`. */
function tone(ac, { freq, type, dur, delay = 0, vol = 0.14, to = null }) {
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SFX_RECIPES = {
  tap:  (ac) => tone(ac, { freq: 660, type: 'square', dur: 0.06, vol: 0.10 }),
  pop:  (ac) => { tone(ac, { freq: 520, type: 'triangle', dur: 0.07, to: 780 });
                  tone(ac, { freq: 780, type: 'triangle', dur: 0.09, delay: 0.06 }); },
  coin: (ac) => { tone(ac, { freq: 988,  type: 'square', dur: 0.07, vol: 0.11 });
                  tone(ac, { freq: 1319, type: 'square', dur: 0.12, delay: 0.07, vol: 0.11 }); },
  win:  (ac) => [523, 659, 784, 1047].forEach((f, i) =>
                  tone(ac, { freq: f, type: 'triangle', dur: 0.14, delay: i * 0.09, vol: 0.16 })),
  // gentle by design — a "not quite", never a buzzer
  nope: (ac) => tone(ac, { freq: 200, type: 'sawtooth', dur: 0.16, vol: 0.07 }),
};

export const sfx = {
  play(name) {
    if (sfxMuted) return;
    const ac = audio();
    if (!ac || !SFX_RECIPES[name]) return;
    try { SFX_RECIPES[name](ac); } catch { /* sound is never worth an error */ }
  },
  setMuted(m) {
    sfxMuted = !!m;
    try { localStorage.setItem(SOUND_KEY, sfxMuted ? 'off' : 'on'); } catch {}
  },
  isMuted() { return sfxMuted; },
};

/* =====================================================================
   CONFETTI — one fixed full-viewport canvas, small rotating rects in
   the four play colors + white, gravity, fade. The rAF loop only runs
   while pieces are alive and goes idle when the canvas is empty.
   Both entry points are no-ops under prefers-reduced-motion.
   ===================================================================== */
const CONFETTI_COLORS = ['#FF5A5A', '#FFC93C', '#4C9BFF', '#A971F5', '#FFFFFF'];
let confettiCanvas = null, confetti2d = null, confettiPieces = [], confettiRaf = null;

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function confettiSurface() {
  if (!confettiCanvas) {
    confettiCanvas = document.createElement('canvas');
    Object.assign(confettiCanvas.style, {
      position: 'fixed', inset: '0', width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: 200,
    });
    document.body.appendChild(confettiCanvas);
    confetti2d = confettiCanvas.getContext('2d');
    window.addEventListener('resize', confettiResize);
  }
  // Re-checked on every burst, not just on resize events: a canvas born
  // while the tab was hidden can have a 0×0 (or stale) backing store,
  // and a hidden tab gets no resize event when it comes back.
  confettiResize();
  return confetti2d;
}
function confettiResize() {
  if (!confettiCanvas) return;
  const w = window.innerWidth, h = window.innerHeight;
  if (w && h && (confettiCanvas.width !== w || confettiCanvas.height !== h)) {
    confettiCanvas.width = w;
    confettiCanvas.height = h;
  }
}

function confettiLoop() {
  const c = confetti2d;
  c.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces = confettiPieces.filter((p) => p.life > 0 && p.y < confettiCanvas.height + 30);
  if (!confettiPieces.length) { confettiRaf = null; return; }   // idle when empty
  for (const p of confettiPieces) {
    p.vy += 0.32;                      // gravity
    p.x += p.vx; p.y += p.vy;
    p.rot += p.vr; p.life -= 1;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.rot);
    c.globalAlpha = Math.max(0, Math.min(1, p.life / 30));
    c.fillStyle = p.color;
    c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    c.restore();
  }
  confettiRaf = requestAnimationFrame(confettiLoop);
}

function addPieces(list) {
  confettiSurface();
  confettiPieces.push(...list);
  if (!confettiRaf) confettiRaf = requestAnimationFrame(confettiLoop);
}

function makePiece(x, y, vx, vy) {
  return {
    x, y, vx, vy,
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    life: 70 + Math.random() * 50,
  };
}

/** A burst from a point — the shape of a single happy moment. */
export function confetti(x, y, n = 60) {
  if (prefersReducedMotion()) return;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 7;
    out.push(makePiece(x, y, Math.cos(a) * speed, Math.sin(a) * speed - 4));
  }
  addPieces(out);
}

/** A rain from the top of the screen — for the really big ones. */
export function confettiRain(n = 120) {
  if (prefersReducedMotion()) return;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(makePiece(
      Math.random() * window.innerWidth, -20 - Math.random() * 120,
      (Math.random() - 0.5) * 2, 1 + Math.random() * 3,
    ));
  }
  addPieces(out);
}

/** Burst at an element's center + the win fanfare. The one call a happy
    moment needs. Fire-and-forget: never await it. */
export function celebrate(el) {
  sfx.play('win');
  if (el?.getBoundingClientRect) {
    const r = el.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, 70);
  } else {
    confettiRain(90);
  }
}

export { getCurrentKid, isGuestKid, loadCharacter };
