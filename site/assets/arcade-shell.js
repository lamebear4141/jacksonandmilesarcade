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
import {
  GAMES, SKINS, PETS, SAFETY, levelFromXp, COLLECTIONS, GRAND_PRIZE,
  RARITY, LIVE_SPRITE_IDS, spriteById, displayRarity, newlyUnlockedRarities,
  VAULT, vaultPayout, vaultAccuracy, PRACTICE_POWER,
} from './catalog.js';
import { grantCoins } from '../firebase-config.js';

/** The drop reveal's Trade button leaves the spare here; the trade
    builder reads it on mount and pre-loads the "You give" side. */
export const TRADE_OFFER_KEY = 'arcade.tradeOffer';

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
    return { xp: 0, coins: 0, bricksEarned: 0, sparksEarned: 0, leveledUp: false, newLevel: 1, drops: [], saved: false, reason: 'no profile' };
  }

  inFlight = (async () => {
    try {
      const out = await awardRun(kid.id, gameId, result);
      return { ...out, saved: true };
    } catch (e) {
      return { xp: 0, coins: 0, bricksEarned: 0, sparksEarned: 0, leveledUp: false, newLevel: 1, drops: [], saved: false, reason: e.message };
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
 * The end-of-run moments, in order, each waiting for the last to close:
 *   1. revealDrops       any critters this run found (chest → critter)
 *   2. the level-up card — with the NEW CRITTERS beat when a rarity
 *                          band opened
 *   3. celebrateCompletion  a collection finished by this run
 * Call it with finishRun's outcome from any game; it does nothing when
 * there is nothing to celebrate. A kid can never see any of these for
 * doing badly.
 */
export function celebrateLevelUp(outcome) {
  if (!outcome) return;
  revealDrops(outcome, () => {
    runBonusVault(outcome, () => {
      if (!outcome.leveledUp) { celebrateCompletion(outcome); return; }
      showLevelUpCard(outcome, () => celebrateCompletion(outcome));
    });
  });
}

/* =====================================================================
   THE BONUS VAULT — where coins come from.

   Three vaults shimmer; a marker sweeps a timing bar; one tap cracks one
   open. How close the tap lands to the middle sets the payout between
   the floor and the ceiling.

   The rules that matter more than the mechanic:
     · THE FLOOR ALWAYS PAYS. There is no losing this, no zero, and no
       "you missed" — a bad tap is still a win, just a smaller one.
     · One tap skips it and still collects the floor, so it can never
       stand between a kid and playing again.
     · The daily coin cap is spoken in tomorrow's language, never as a
       limit reached.

   Runs after any qualifying run in a game with no bespoke bonus round of
   its own (GAMES[id].bonusRound === 'vault'); awardRun decides that and
   reports it as outcome.bonusVault.
   ===================================================================== */
export function runBonusVault(outcome, onDone) {
  const v = outcome?.bonusVault;
  const done = () => { onDone && onDone(); };
  if (!v?.eligible || !outcome?.saved) return done();

  // No room left today? Say so warmly and move on — never open a vault
  // that cannot pay.
  if (v.room <= 0) {
    const card = vaultCard();
    card.append(
      bigLine('\u{1F319}', 'ac-vault__emoji'),
      h2El('All of today’s coins are collected!'),
      subEl('Tomorrow’s vaults are already filling up. Your critters and XP still count — go play! \u{2728}'),
    );
    return overlayCard(card, 'Okay!', done);
  }

  const kid = getCurrentKid();
  const card = vaultCard();
  const kicker = document.createElement('p');
  kicker.className = 'ac-reveal__kicker';
  kicker.textContent = 'GREAT RUN — BONUS VAULT!';

  const doors = document.createElement('div');
  doors.className = 'ac-vault__doors';
  const doorEls = ['\u{1F5DD}\u{FE0F}', '\u{1F510}', '\u{1F5DD}\u{FE0F}'].map((glyph, i) => {
    const d = document.createElement('div');
    d.className = 'ac-vault__door';
    d.style.animationDelay = `${i * 0.25}s`;
    d.textContent = '\u{1F3E6}';
    doors.appendChild(d);
    return d;
  });

  // A learning run widens the green: the better the maths, the bigger
  // the target, so the coins are won with the subject and not the thumbs.
  const zoneWidth = Math.max(0.08, Math.min(0.9, Number(v.zone) || VAULT.zoneBase));
  const track = document.createElement('div');
  track.className = 'ac-vault__track';
  const zone = document.createElement('div');
  zone.className = 'ac-vault__zone';
  zone.style.left  = `${((1 - zoneWidth) / 2 * 100).toFixed(1)}%`;
  zone.style.width = `${(zoneWidth * 100).toFixed(1)}%`;
  const marker = document.createElement('div');
  marker.className = 'ac-vault__marker';
  track.append(zone, marker);

  const hint = document.createElement('p');
  hint.className = 'ac-levelup__sub';
  hint.textContent = zoneWidth > VAULT.zoneBase + 0.01
    ? 'Great answers made the target BIGGER — tap in the green!'
    : 'Tap when the light is in the green!';

  const tapBtn = document.createElement('button');
  tapBtn.className = 'ac-btn ac-btn--inline ac-vault__tap';
  tapBtn.type = 'button';
  tapBtn.textContent = '\u{1F449} CRACK IT OPEN';

  const skipBtn = document.createElement('button');
  skipBtn.className = 'ac-btn--ghost ac-vault__skip';
  skipBtn.type = 'button';
  skipBtn.textContent = `\u{26A1} Just collect ${VAULT.floorCoins} \u{1FA99}`;

  card.append(kicker, doors, track, hint, tapBtn, skipBtn);
  const overlay = document.createElement('div');
  overlay.className = 'ac-levelup ac-vault';
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  sfx.play('pop');

  /* The sweep. rAF rather than CSS so the tap reads the true position.
     `pos` starts dead centre on purpose: under prefers-reduced-motion the
     marker parks there, and in any situation where frames never arrive
     (a backgrounded tab, a browser that throttles rAF) the tap pays the
     CEILING rather than the floor. A kid who cannot see the bar move must
     never be paid less for it — the error always falls their way. */
  const still = prefersReducedMotion();
  let raf = null, start = null, settled = false;
  const positionAt = (t) => {
    if (still) return 0.5;
    const phase = ((t - start) % VAULT.sweepMs) / VAULT.sweepMs;   // 0..1
    return phase < 0.5 ? phase * 2 : (1 - phase) * 2;              // ping-pong 0..1
  };
  let pos = 0.5;
  const loop = (t) => {
    if (settled) return;
    if (start == null) start = t;
    pos = positionAt(t);
    marker.style.left = `${pos * 100}%`;
    raf = requestAnimationFrame(loop);
  };
  if (still) marker.style.left = '50%'; else raf = requestAnimationFrame(loop);

  const settle = (accuracy) => {
    if (settled) return;
    settled = true;
    if (raf) cancelAnimationFrame(raf);
    tapBtn.disabled = true;
    skipBtn.remove();
    const amount = vaultPayout(accuracy);
    const chosen = doorEls[Math.min(2, Math.floor(accuracy * 3))];
    doorEls.forEach((d) => d.classList.add('is-shut'));
    chosen.classList.remove('is-shut');
    chosen.classList.add('is-open');
    chosen.textContent = '\u{1F4B0}';
    track.remove();

    hint.textContent = accuracy >= 0.85 ? 'PERFECT CRACK! \u{1F929}'
                     : accuracy >= 0.5  ? 'Nice one! \u{1F44F}'
                     : 'Cracked it! \u{1F642}';
    sfx.play(accuracy >= 0.85 ? 'win' : 'coin');
    confetti(window.innerWidth / 2, window.innerHeight * 0.42, accuracy >= 0.85 ? 110 : 50);

    const prize = document.createElement('p');
    prize.className = 'ac-vault__prize';
    prize.textContent = `+${amount} \u{1FA99}`;
    card.insertBefore(prize, tapBtn);
    tapBtn.remove();

    const finish = (granted, capped) => {
      if (granted < amount) {
        prize.textContent = `+${granted} \u{1FA99}`;
        const note = document.createElement('p');
        note.className = 'ac-reveal__note';
        note.textContent = '\u{1F319} That fills up today — tomorrow’s vaults are already waiting!';
        card.insertBefore(note, prize.nextSibling);
      }
      const ok = document.createElement('button');
      ok.className = 'ac-btn ac-btn--yellow ac-btn--inline';
      ok.type = 'button';
      ok.textContent = 'Collect!';
      ok.addEventListener('click', () => { overlay.remove(); done(); });
      card.appendChild(ok);
    };

    if (!kid) return finish(amount, false);
    grantCoins(kid.id, amount)
      .then((r) => finish(r?.ok ? r.granted : amount, !!r?.capped))
      .catch(() => finish(amount, false));
  };

  tapBtn.addEventListener('click', () => {
    settle(still ? 1 : vaultAccuracy(pos, zoneWidth));
  });
  // Skipping is a real choice, not a punishment: it collects the floor.
  skipBtn.addEventListener('click', () => settle(0));

  function overlayCard(c, label, cb) {
    const o = document.createElement('div');
    o.className = 'ac-levelup ac-vault';
    const b = document.createElement('button');
    b.className = 'ac-btn ac-btn--yellow ac-btn--inline';
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', () => { o.remove(); cb(); });
    c.appendChild(b);
    o.appendChild(c);
    document.body.appendChild(o);
  }
}

function vaultCard() {
  const c = document.createElement('div');
  c.className = 'ac-levelup__card ac-vault__card';
  return c;
}
function bigLine(text, cls) {
  const d = document.createElement('div');
  d.className = cls;
  d.textContent = text;
  return d;
}
function h2El(text) { const h = document.createElement('h2'); h.textContent = text; return h; }
function subEl(text) { const p = document.createElement('p'); p.className = 'ac-levelup__sub'; p.textContent = text; return p; }

function showLevelUpCard(outcome, onClose) {
  const unlocked = [...SKINS, ...PETS].filter(
    (i) => i.level > outcome.oldLevel && i.level <= outcome.newLevel);
  // Crossing a RARITY_UNLOCK threshold is now the biggest reason to level
  // up — it gets the second beat and the full confetti.
  const bands = newlyUnlockedRarities(outcome.oldLevel, outcome.newLevel);

  // Levelling up is one of the two screen-shake moments (the other is
  // the front door's PLAY press). All fire-and-forget.
  sfx.play('win');
  confettiRain(bands.length ? 260 : 140);
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

  if (bands.length) {
    const beat = document.createElement('p');
    beat.className = 'ac-levelup__beat';
    beat.textContent = '\u{1F389} NEW CRITTERS ARE OUT THERE!';
    const counts = outcome.counts || {};
    const findable = LIVE_SPRITE_IDS.filter((id) =>
      bands.includes(displayRarity(spriteById(id).r)) && !(counts[id] > 0));
    const row = document.createElement('div');
    row.className = 'ac-levelup__silhouettes';
    findable.slice(0, 6).forEach((id) => {
      const s = spriteById(id);
      const chip = document.createElement('span');
      chip.className = 'ac-silhouette ac-silhouette--' + displayRarity(s.r);
      chip.textContent = s.g;
      chip.title = '??? · ' + RARITY[displayRarity(s.r)].name;
      row.appendChild(chip);
    });
    if (findable.length > 6) {
      const more = document.createElement('span');
      more.className = 'ac-levelup__more';
      more.textContent = `+${findable.length - 6} more`;
      row.appendChild(more);
    }
    card.append(beat, row);
  }

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
  btn.addEventListener('click', () => { overlay.remove(); onClose && onClose(); });
  card.appendChild(btn);
  document.body.appendChild(overlay);
}

/* =====================================================================
   THE DROP REVEAL — a chest pops, the critter scales in with its ring.

   One card per critter, in turn: "NEW CRITTER!" for a first catch,
   "+1 SPARE" for a duplicate (always framed as luck — spares are trade
   goods — with a one-tap Trade button that pre-loads the builder).
   Encounters say CAUGHT! instead of A CHEST!. A qualifying run that hit
   the daily cap gets tomorrow-flavored copy; a failed run that lost a
   pending capture gets "still out there". A run with none of those
   shows nothing at all — there is no sad copy for a 60% run.
   ===================================================================== */
export function revealDrops(outcome, onDone) {
  const drops = (outcome?.drops || []).filter((d) => spriteById(d.spriteId));
  const escaped = outcome?.escapedCaptures || [];
  const done = () => { onDone && onDone(); };
  if (!drops.length && !outcome?.dropsCapped && !escaped.length) return done();

  const queue = drops.slice();
  const next = () => {
    const d = queue.shift();
    if (d) return showDrop(d, queue.length === 0 && outcome.dropsCapped, next);
    if (!drops.length && outcome.dropsCapped) return noteCard('\u{1F319}', 'Tomorrow’s critters are already waking up', 'You earned a roll — it’s waiting for you tomorrow!', next);
    if (!drops.length && escaped.length) return noteCard('\u{1F33F}', 'It scampered off — it’s still out there!', 'Finish the run next time and it’s yours.', next);
    done();
  };
  next();

  function overlayWith(card, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'ac-levelup ac-reveal';
    const btn = document.createElement('button');
    btn.className = 'ac-btn ac-btn--yellow ac-btn--inline';
    btn.type = 'button';
    btn.textContent = 'Awesome!';
    btn.addEventListener('click', () => { overlay.remove(); onClose(); });
    card.appendChild(btn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    return { overlay, btn };
  }

  function noteCard(emoji, title, sub, onClose) {
    const card = document.createElement('div');
    card.className = 'ac-levelup__card ac-reveal__card';
    const big = document.createElement('div'); big.className = 'ac-reveal__chest'; big.textContent = emoji;
    const h2 = document.createElement('h2'); h2.textContent = title;
    const p = document.createElement('p'); p.className = 'ac-levelup__sub'; p.textContent = sub;
    card.append(big, h2, p);
    overlayWith(card, onClose);
  }

  function showDrop(d, cappedAfter, onClose) {
    const s = spriteById(d.spriteId);
    const rar = displayRarity(s.r);
    const card = document.createElement('div');
    card.className = 'ac-levelup__card ac-reveal__card';

    const KICKER = { encounter: 'CAUGHT!', quest: 'FAST ASLEEP!', roll: 'A CHEST!' };
    const OPENER = { encounter: '\u{1FAE7}', quest: '\u{1F319}', roll: '\u{1F381}' };
    const kicker = document.createElement('p');
    kicker.className = 'ac-reveal__kicker';
    kicker.textContent = KICKER[d.source] || KICKER.roll;
    const stage = document.createElement('div');
    stage.className = 'ac-reveal__stage';
    const chest = document.createElement('div');
    chest.className = 'ac-reveal__chest ac-reveal__chest--pop';
    chest.textContent = OPENER[d.source] || OPENER.roll;
    stage.appendChild(chest);
    card.append(kicker, stage);
    sfx.play('pop');

    const { btn } = overlayWith(card, onClose);
    btn.disabled = true;

    // the chest pops, then the critter scales in with its ring
    setTimeout(() => {
      chest.remove();
      const ring = document.createElement('div');
      ring.className = 'ac-reveal__ring ac-reveal__ring--' + rar;
      const glyph = document.createElement('span');
      glyph.className = 'ac-reveal__critter';
      glyph.textContent = s.g;
      ring.appendChild(glyph);
      stage.appendChild(ring);

      const label = document.createElement('h2');
      label.className = 'ac-reveal__label';
      label.textContent = d.isNew ? 'NEW CRITTER!' : '+1 SPARE';
      const name = document.createElement('p');
      name.className = 'ac-reveal__name';
      name.textContent = s.n;
      const pill = document.createElement('span');
      pill.className = 'ac-badge ac-reveal__rarity ac-reveal__rarity--' + rar;
      pill.textContent = RARITY[rar].name;
      const tag = document.createElement('p');
      tag.className = 'ac-levelup__sub';
      tag.textContent = d.isNew
        ? (s.lore?.tag ? `“${s.lore.tag}”` : 'Into the Locker it goes!')
        : 'Lucky — spares are what trades are made of!';
      stage.after(label, name, pill, tag);

      if (!d.isNew) {
        const trade = document.createElement('button');
        trade.className = 'ac-btn ac-btn--outline ac-btn--inline';
        trade.type = 'button';
        trade.textContent = '\u{1F501} Trade it';
        trade.addEventListener('click', () => {
          try { sessionStorage.setItem(TRADE_OFFER_KEY, JSON.stringify({ spriteId: d.spriteId })); } catch {}
          window.location.href = HUB + '#trade';
        });
        btn.before(trade);
      }
      if (cappedAfter) {
        const note = document.createElement('p');
        note.className = 'ac-reveal__note';
        note.textContent = '\u{1F319} Tomorrow’s critters are already waking up';
        btn.before(note);
      }
      sfx.play(rar === 'legendary' || rar === 'epic' ? 'win' : 'coin');
      confetti(window.innerWidth / 2, window.innerHeight * 0.4, rar === 'legendary' ? 120 : 50);
      btn.disabled = false;
    }, 700);
  }
}

/** A kid leaving a run with a pending capture still in the bubble. Warm,
    never punishing: the critter is simply still out there. Games call
    this from their quit path; `onLeave` proceeds with leaving. */
export function showScamperCard({ onLeave, onStay } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'ac-levelup ac-reveal';
  const card = document.createElement('div');
  card.className = 'ac-levelup__card ac-reveal__card';
  const big = document.createElement('div'); big.className = 'ac-reveal__chest'; big.textContent = '\u{1F33F}';
  const h2 = document.createElement('h2'); h2.textContent = 'It scampered off — it’s still out there!';
  const p = document.createElement('p'); p.className = 'ac-levelup__sub';
  p.textContent = 'Finish the run and it’s yours. Leave now and it hides again — no harm done.';
  const stay = document.createElement('button');
  stay.className = 'ac-btn ac-btn--inline'; stay.type = 'button'; stay.textContent = 'Keep playing';
  stay.addEventListener('click', () => { overlay.remove(); onStay && onStay(); });
  const leave = document.createElement('button');
  leave.className = 'ac-btn ac-btn--outline ac-btn--inline'; leave.type = 'button'; leave.textContent = 'Leave anyway';
  leave.addEventListener('click', () => { overlay.remove(); onLeave && onLeave(); });
  const row = document.createElement('div'); row.className = 'ac-reveal__btns';
  row.append(stay, leave);
  card.append(big, h2, p, row);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

/* =====================================================================
   COLLECTION COMPLETE — the thing with no price.

   Fires wherever the grant happened: after finishRun in a game (through
   celebrateLevelUp, so no game needs to know), and on Accept in the
   trade tab. Shows the badge, the statue ("Saved for your Box!" until
   the Box exists) and the new look; all eight adds the Grand Prize.
   One card per newly completed collection, shown in turn.
   ===================================================================== */
export function celebrateCompletion(outcome) {
  const ids = (outcome?.newlyCompleted || []).filter((id) => COLLECTIONS.some((c) => c.id === id));
  const queue = ids.map((id) => COLLECTIONS.find((c) => c.id === id));
  if (!queue.length && !outcome?.grandPrize) return;

  const showNext = () => {
    const col = queue.shift();
    if (col) return showCard(completionCard(col), showNext);
    if (outcome?.grandPrize) { outcome.grandPrize = false; return showCard(grandPrizeCard(), showNext); }
  };
  showNext();

  function showCard(card, onClose) {
    sfx.play('win');
    confettiRain(160);
    const overlay = document.createElement('div');
    overlay.className = 'ac-levelup ac-complete';
    const btn = document.createElement('button');
    btn.className = 'ac-btn ac-btn--yellow ac-btn--inline';
    btn.type = 'button';
    btn.textContent = 'Awesome!';
    btn.addEventListener('click', () => { overlay.remove(); onClose(); });
    card.appendChild(btn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }
}

function rewardTile(emoji, kind, name) {
  const t = document.createElement('div');
  t.className = 'ac-reward';
  t.innerHTML = `<div class="ac-reward__e"></div><div class="ac-reward__k"></div><div class="ac-reward__n"></div>`;
  t.children[0].textContent = emoji;
  t.children[1].textContent = kind;
  t.children[2].textContent = name;
  return t;
}

function completionCard(col) {
  const card = document.createElement('div');
  card.className = 'ac-levelup__card ac-complete__card';
  const kicker = document.createElement('p');
  kicker.className = 'ac-complete__kicker';
  kicker.textContent = 'COLLECTION COMPLETE!';
  const icon = document.createElement('div');
  icon.className = 'ac-complete__icon';
  icon.textContent = col.icon;
  const h2 = document.createElement('h2');
  h2.textContent = col.name;
  const sub = document.createElement('p');
  sub.className = 'ac-levelup__sub';
  sub.textContent = `All ${col.members.length} found. You're officially a ${col.badge.name}!`;
  const rewards = document.createElement('div');
  rewards.className = 'ac-rewards';
  rewards.append(
    rewardTile(col.badge.emoji, 'Badge', col.badge.name),
    rewardTile(col.statue.emoji, 'Saved for your Box! 🏆', col.statue.name),
    rewardTile(col.avatar.emoji, 'New look', col.avatar.name),
  );
  card.append(kicker, icon, h2, sub, rewards);
  return card;
}

function grandPrizeCard() {
  const card = document.createElement('div');
  card.className = 'ac-levelup__card ac-complete__card ac-complete__card--grand';
  const kicker = document.createElement('p');
  kicker.className = 'ac-complete__kicker';
  kicker.textContent = 'ALL EIGHT COLLECTIONS!';
  const icon = document.createElement('div');
  icon.className = 'ac-complete__icon';
  icon.textContent = GRAND_PRIZE.emoji;
  const h2 = document.createElement('h2');
  h2.textContent = GRAND_PRIZE.name;
  const sub = document.createElement('p');
  sub.className = 'ac-levelup__sub';
  sub.textContent = 'The only one in existence — and it’s yours. Saved for your Box! 🏆';
  card.append(kicker, icon, h2, sub);
  return card;
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
  // Practising today made the odds better — say so where the child can
  // see the cause and the effect together.
  if (outcome.practicePower?.gained) bits.push(`+${outcome.practicePower.gained} \u{1F4AA}`);
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
