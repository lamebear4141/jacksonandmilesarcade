/* =====================================================================
   LOOT DROP — the round
   Drop in, answer, loot chests into your BACKPACK, then try to extract.
   Loot is only yours if you finish at or above the extraction line.
   ===================================================================== */
import { CONFIG, RARITY, luckScore, rollRarity } from './config.js';
import { buildRound } from './content.js';
import * as S from './state.js';
import * as Speech from './speech.js';
import { sfx } from '../../assets/arcade-shell.js';

const $ = id => document.getElementById(id);

export function startRound({ profile, mode, onFinish }){
  // Content comes in two bands (grade 1 and grade 3). The profile carries
  // the right one, derived from the child's birthday at boot — no more
  // hardcoded miles/jackson.
  const grade = profile.grade || 1;
  const R = {
    profile, mode, grade,
    items: buildRound(grade, mode, CONFIG.questionsPerRound),
    idx: 0, tries: 0, stage: 'read',      // passages have a 'read' then 'answer' stage
    attempted: 0, correct: 0,
    readAttempted: 0, readCorrect: 0, mathAttempted: 0, mathCorrect: 0,
    missed: [], missedItems: [],
    backpack: [],                          // [{index, sprite, rarity}]
    startedAt: Date.now(),
    useMic: Speech.hasMic,
    rebooting: false, rebootQueue: [], rebootDone: 0,
    onFinish,
  };
  window.__round = R;
  render(R);
  return R;
}

/* ---------------- helpers ---------------- */
function accuracy(R){ return R.attempted ? R.correct / R.attempted : 0; }
function isMath(item){ return item.label === 'MATH'; }
function currentItem(R){
  return R.rebooting ? R.rebootQueue[R.rebootDone] : R.items[R.idx];
}

function luckFor(R){
  return luckScore({
    accuracy: accuracy(R),
    dayStreak: S.dayStreak(R.profile),
    minutesToday: S.minutesToday(R.profile) + (Date.now() - R.startedAt) / 60000,
  });
}

/* ---------------- rendering ---------------- */
function render(R){
  const item = currentItem(R);
  if (!item) return finish(R);

  R.tries = 0;
  R.stage = item.kind === 'passage' ? 'read' : 'main';

  const total = R.rebooting ? R.rebootQueue.length : R.items.length;
  const at = R.rebooting ? R.rebootDone : R.idx;

  $('roundLabel').textContent = R.rebooting ? 'REBOOT VAN' : (R.mode === 'math' ? 'MATH RUN' : 'READING RUN');
  $('roundCount').textContent = `${at + 1} / ${total}`;
  $('bagCount').textContent = `🎒 ${R.backpack.length}`;
  $('stormFill').style.width = (at / total * 100) + '%';
  updateExtractMeter(R);

  $('qLabel').textContent = item.label + (item.bonus ? '  ✦ DOUBLE LOOT' : '');
  $('qLabel').className = item.bonus ? 'q-label bonus' : 'q-label';
  $('qText').innerHTML = '';
  $('qText').className = 'q-text ' + (item.kind === 'passage' ? 'passage'
                        : item.kind === 'read-sentence' ? 'sentence'
                        : item.kind === 'read-word' ? 'word' : 'problem');
  $('qText').textContent = item.prompt;
  $('qQuestion').textContent = '';
  $('qQuestion').style.display = 'none';
  $('choices').innerHTML = '';
  $('heard').textContent = '';

  const needsVoice = item.kind === 'read-word' || item.kind === 'read-sentence' || item.kind === 'passage';
  $('micBtn').style.display = (needsVoice && R.useMic) ? '' : 'none';
  $('hearBtn').style.display = needsVoice ? '' : 'none';
  $('micBtn').textContent = '🎤 Read it';

  // Escape hatch: never let a broken or blocked mic trap a kid on a question.
  clearTimeout(R._escapeTimer);
  $('escapeBtn').style.display = 'none';
  if (needsVoice && R.useMic){
    R._escapeTimer = setTimeout(() => { $('escapeBtn').style.display = ''; }, CONFIG.escapeHatchMs);
  }

  if (item.kind === 'choice'){
    buildChoices(R, item, item.choices, item.answer, chosen => resolve(R, chosen === item.answer, item));
  } else if (item.kind === 'passage'){
    if (R.useMic){
      $('qQuestion').style.display = 'block';
      $('qQuestion').textContent = '🎤 Read it out loud first, then the question appears.';
    } else {
      showPassageQuestion(R, item);
    }
  } else if (!R.useMic){
    // no mic: hear it, then tap the matching text
    $('qLabel').textContent = 'TAP 🔊 THEN PICK WHAT YOU HEARD';
    $('qText').textContent = '';
    const others = (item.kind === 'read-sentence'
      ? R.items.filter(i => i.kind === 'read-sentence' && i !== item).map(i => i.prompt)
      : R.items.filter(i => i.kind === 'read-word' && i !== item).map(i => i.prompt));
    const opts = shuffle([item.prompt, ...others.slice(0, 2)]);
    while (opts.length < 2) opts.push(item.prompt + 's');
    buildChoices(R, item, opts, item.prompt, chosen => resolve(R, chosen === item.prompt, item));
    Speech.speak(item.prompt);
  }
}

function showPassageQuestion(R, item){
  $('qQuestion').style.display = 'block';
  $('qQuestion').textContent = item.question;
  $('micBtn').style.display = 'none';
  buildChoices(R, item, item.choices, item.answer, chosen => resolve(R, chosen === item.answer, item));
}

function buildChoices(R, item, options, answer, cb){
  const box = $('choices');
  box.innerHTML = '';
  box.dataset.done = '';
  options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'choice'; b.textContent = o;
    b.onclick = () => {
      if (box.dataset.done) return;
      box.dataset.done = '1';
      sfx.play('tap');
      [...box.children].forEach(c => {
        if (c.textContent === answer) c.classList.add('right');
        else if (c === b) c.classList.add('wrong');
      });
      setTimeout(() => cb(o), 750);
    };
    box.appendChild(b);
  });
}

function updateExtractMeter(R){
  const acc = accuracy(R);
  const pct = Math.round(acc * 100);
  $('accFill').style.width = pct + '%';
  $('accFill').className = 'acc-fill ' + (R.attempted === 0 ? '' : acc >= CONFIG.extractThreshold ? 'safe' : 'danger');
  $('accText').textContent = R.attempted ? pct + '%' : '—';
  $('accText').className = R.attempted && acc < CONFIG.extractThreshold ? 'danger' : '';
}

/* ---------------- mic ---------------- */
export function micPressed(){
  const R = window.__round; if (!R) return;
  const item = currentItem(R); if (!item) return;
  if (Speech.isListening()){ Speech.stopListening(); return; }

  $('micBtn').textContent = '🎤 Listening…';
  $('micBtn').classList.add('live');
  Speech.listen({
    onPartial: txt => { $('heard').textContent = 'I heard: ' + txt; },
    onError: err => {
      $('micBtn').classList.remove('live'); $('micBtn').textContent = '🎤 Read it';
      if (err === 'not-allowed' || err === 'service-not-allowed'){
        R.useMic = false;
        render(R); // clears #heard as part of its normal reset — set the message after, not before
        $('heard').textContent = 'Mic is off — switching to tap mode.';
      } else {
        $('heard').textContent = "Didn't catch that — try again!";
      }
    },
    onDone: transcript => {
      $('micBtn').classList.remove('live'); $('micBtn').textContent = '🎤 Read it';
      if (!transcript.trim()) return;
      const score = Speech.scoreSpeech(item.target, transcript);
      const passed = score >= Speech.passMark(item.kind);

      if (item.kind === 'passage'){
        if (passed){
          flash('📖', 'Nice reading! Now the question…', true);
          setTimeout(() => showPassageQuestion(R, item), 900);
        } else {
          R.tries++;
          if (R.tries < 2){
            flash('🤔', 'Read the whole thing — try again!');
          } else {
            // reading failed: they still answer, but the item can't be a win
            item._readFailed = true;
            flash('💪', "Let's practice this one.");
            setTimeout(() => showPassageQuestion(R, item), 1100);
          }
        }
        return;
      }
      resolve(R, passed, item, score);
    },
  });
}

/** "Mic not working? Tap instead" — switch this round to tap mode for good. */
export function escapePressed(){
  const R = window.__round; if (!R) return;
  clearTimeout(R._escapeTimer);
  R.useMic = false;
  R.micTrouble = true;
  Speech.stopListening();
  $('escapeBtn').style.display = 'none';
  render(R); // clears #heard as part of its normal reset — set the message after, not before
  $('heard').textContent = 'Switched to tap mode.';
}

export function hearPressed(){
  const R = window.__round; if (!R) return;
  const item = currentItem(R); if (!item) return;
  Speech.speak(item.prompt, item.sound ? 0.6 : 0.85);
}

/* ---------------- resolving an item ---------------- */
function advance(R){
  if (R.rebooting){ R.rebootDone++; if (R.rebootDone >= R.rebootQueue.length) return finishReboot(R); }
  else R.idx++;
  render(R);
}

function resolve(R, passed, item, score){
  // passages need BOTH: the read-aloud and the right answer
  if (item.kind === 'passage' && item._readFailed) passed = false;

  // The say-it-again retry is a MIC-path feature (score is only passed by
  // the mic handler). In tap mode the correct choice was just highlighted,
  // so a retry teaches nothing — worse, the locked choice buttons made it
  // a dead end. Tap-mode misses go straight to the learn card instead.
  if (!passed && score !== undefined && R.tries < 1 &&
      (item.kind === 'read-word' || item.kind === 'read-sentence')){
    R.tries++;
    flash('🤔', 'So close — try again!');
    $('heard').textContent = 'Tap 🔊 to hear it, then read it again.';
    return;
  }

  clearTimeout(R._escapeTimer);
  $('escapeBtn').style.display = 'none';
  R.attempted++;
  const mathy = isMath(item);
  if (mathy) R.mathAttempted++; else R.readAttempted++;

  if (passed){
    sfx.play('pop');
    R.correct++;
    if (mathy) R.mathCorrect++; else R.readCorrect++;
    celebrateCorrect();
    lootChest(R, item.bonus ? CONFIG.bonusRoundMultiplier : 1);
    setTimeout(() => advance(R), 1400);
  } else {
    sfx.play('nope');
    const label = item.kind === 'passage' ? item.question : item.prompt;
    R.missed.push(label);
    R.missedItems.push(item);
    // No timed auto-advance on a miss: the learn card teaches the answer
    // and the kid moves on when THEY tap "Got it!".
    showLearnCard(R, item);
  }
}

/* ---------------- feedback: celebrate wins, teach misses ---------------- */
const CHEERS = [
  ['🎉', 'You got it!'], ['⭐', 'Nailed it!'], ['🌟', "That's right!"],
  ['🙌', 'Awesome!'], ['🏆', 'Super smart!'], ['✨', 'Boom — correct!'],
];
function celebrateCorrect(){
  const [icon, text] = CHEERS[Math.floor(Math.random() * CHEERS.length)];
  flash(icon, text, true);
}

/** Math symbols the speech engine would otherwise skip or mangle. */
function speakable(text){
  return String(text)
    .replace(/−/g, ' minus ').replace(/\+/g, ' plus ')
    .replace(/×/g, ' times ').replace(/÷/g, ' divided by ')
    .replace(/=/g, ' equals ');
}

/* Every miss becomes a small lesson: show the right answer big and green,
   say it out loud, and wait for the kid — no timer, no rush. */
function showLearnCard(R, item){
  const reading = item.kind === 'read-word' || item.kind === 'read-sentence';
  let prompt, answer, tip, sayText;

  if (reading){
    prompt = item.kind === 'read-word' ? 'This word says…' : 'This sentence says…';
    answer = item.prompt;
    tip = 'Tap 🔊 to hear it, then try saying it along.';
    sayText = item.prompt;
  } else if (item.kind === 'passage'){
    prompt = item.question;
    answer = item.answer;
    tip = 'Look back at the story — the answer is hiding in there.';
    sayText = item.answer;
  } else {
    // A bare equation ("15 − 4 = ?") reads best with the answer dropped in;
    // a word problem keeps its question on top and the answer below.
    const isEquation = /^[\d\s+−×÷=?]+$/.test(item.prompt);
    prompt = item.prompt;
    answer = isEquation ? item.prompt.replace('?', item.answer) : item.answer;
    tip = 'Say it out loud once — that makes it stick.';
    sayText = speakable(answer);
  }

  $('learnPrompt').textContent = prompt;
  $('learnAnswer').textContent = answer;
  $('learnTip').textContent = tip;
  Speech.speak(sayText, 0.72);
  $('learnHear').onclick = () => Speech.speak(sayText, 0.7);
  $('learnGo').onclick = () => {
    if (!$('learnCard').classList.contains('on')) return;
    sfx.play('tap');
    $('learnCard').classList.remove('on');
    advance(R);
  };
  $('learnCard').classList.add('on');
}

function lootChest(R, multiplier){
  const luck = luckFor(R);
  for (let i = 0; i < multiplier; i++){
    const rarity = rollRarity(luck);
    const index = S.pickSpriteOfRarity(rarity);
    const sprite = S.SPRITES[index];
    R.backpack.push({ index, sprite, rarity });
    sfx.play('coin');
    showLoot(sprite, rarity, i * 420);
  }
}
function showLoot(sprite, rarity, delay){
  setTimeout(() => {
    const r = RARITY[rarity];
    const el = document.createElement('div');
    el.className = 'loot-pop';
    el.style.borderColor = r.color;
    el.innerHTML = `<div class="loot-glyph">${sprite.g}</div>
      <div class="loot-name" style="color:${r.color}">${sprite.n}</div>
      <div class="loot-rarity" style="background:${r.color}">${r.name}</div>`;
    $('lootLayer').appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }, delay);
}
let flashTimer = null;
function flash(icon, text, good){
  $('fbIcon').textContent = icon; $('fbText').textContent = text;
  $('feedback').classList.toggle('good', !!good);
  $('feedback').classList.add('on');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => $('feedback').classList.remove('on'), 1150);
}

/* ---------------- reboot van ---------------- */
function offerReboot(R){
  const need = Math.ceil(CONFIG.extractThreshold * R.attempted) - R.correct;
  R.rebootQueue = R.missedItems.slice(0, CONFIG.rebootQuestions);
  R.onFinish({ status:'reboot', round:R, need, available:R.rebootQueue.length });
}
export function acceptReboot(){
  const R = window.__round;
  R.rebooting = true; R.rebootDone = 0;
  // a reboot question that lands converts the earlier miss into a hit
  R._rebootBaseline = { attempted:R.attempted, correct:R.correct };
  R.attempted = R._rebootBaseline.attempted;
  render(R);
}
function finishReboot(R){
  // undo the double-count: reboot answers repair the original misses
  const extraAttempts = R.rebootQueue.length;
  const gained = R.correct - R._rebootBaseline.correct;
  R.attempted = R._rebootBaseline.attempted;
  R.correct = Math.min(R.attempted, R._rebootBaseline.correct + gained);
  R.rebooting = false;
  finish(R, true);
}

/* ---------------- end of round ---------------- */
function finish(R, afterReboot){
  const acc = accuracy(R);
  const extracted = acc >= CONFIG.extractThreshold;

  // The 1e-9 nudge matters: 0.8 - 0.2 is 0.6000000000000001 in floating
  // point, and a 3-of-5 round is EXACTLY 0.6 — without the epsilon the van
  // refuses the one kid it exists for.
  if (!extracted && !afterReboot && R.missedItems.length &&
      acc >= CONFIG.extractThreshold - CONFIG.rebootAllowedIfWithin - 1e-9){
    return offerReboot(R);
  }

  const seconds = Math.round((Date.now() - R.startedAt) / 1000);
  const p = R.profile;
  const day = S.ensureDay(p);

  let xp = R.correct * CONFIG.xpPerCorrect + Math.round(seconds / 60 * CONFIG.xpPerMinutePlayed);
  let coins = 0;
  let won = [];

  if (extracted){
    xp += CONFIG.xpExtractBonus;
    coins += CONFIG.coinsPerExtract;
    R.backpack.forEach(b => {
      const res = S.grantSprite(p, b.index);
      xp += RARITY[b.rarity].xp;
      coins += RARITY[b.rarity].coins;
      won.push({ ...b, isNew: res.isNew });
    });
  } else {
    xp += CONFIG.xpEliminatedConsolation;
  }

  const levelsGained = S.addXp(p, xp);
  p.coins += coins;

  // daily + lifetime bookkeeping
  day.seconds += seconds; day.rounds++; day.attempted += R.attempted; day.correct += R.correct;
  day.readAttempted += R.readAttempted; day.readCorrect += R.readCorrect;
  day.mathAttempted += R.mathAttempted; day.mathCorrect += R.mathCorrect;
  day.xp += xp;
  if (R.micTrouble || !R.useMic) day.micTrouble = true;   // report shouldn't claim reads were verified
  if (extracted){ day.extracted++; day.spritesWon += won.length; }
  R.missed.forEach(m => { if (!day.missed.includes(m)) day.missed.push(m); });
  const best = won.reduce((b, w) =>
    rank(w.rarity) > rank(b) ? w.rarity : b, day.bestRarity || 'common');
  if (won.length) day.bestRarity = best;

  const lt = p.lifetime;
  lt.rounds++; lt.attempted += R.attempted; lt.correct += R.correct; lt.seconds += seconds;
  lt.readAttempted += R.readAttempted; lt.readCorrect += R.readCorrect;
  lt.mathAttempted += R.mathAttempted; lt.mathCorrect += R.mathCorrect;
  if (extracted) lt.extracted++; else lt.eliminated++;

  const gifts = S.checkStreakGift(p);
  gifts.forEach(g => applyGift(p, g));

  R.onFinish({ status: extracted ? 'extracted' : 'eliminated',
               round:R, accuracy:acc, xp, coins, won, levelsGained, gifts, seconds });
}
function rank(r){ return ['common','rare','epic','legendary','mythic'].indexOf(r); }

function applyGift(p, g){
  const v = g.gift;
  if (v.startsWith('coins:')) p.coins += Number(v.split(':')[1]);
  else if (v === 'pet'){
    const locked = S.PETS.filter(x => !p.ownedPets.includes(x.id));
    if (locked.length){ const pick = locked[0]; p.ownedPets.push(pick.id); g.awarded = pick; }
  } else if (v === 'skin'){
    const locked = S.SKINS.filter(x => !p.ownedSkins.includes(x.id));
    if (locked.length){ const pick = locked[0]; p.ownedSkins.push(pick.id); g.awarded = pick; }
  } else if (v === 'mythic'){
    const idx = S.pickSpriteOfRarity('mythic');
    S.grantSprite(p, idx); g.awarded = S.SPRITES[idx];
  }
}

function shuffle(a){ const c=a.slice(); for(let i=c.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; }

export const _test = { accuracy, luckFor };
