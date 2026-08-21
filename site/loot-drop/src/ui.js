/* =====================================================================
   LOOT DROP — screens, navigation, boot.

   The flow is question-first now: land on CHOOSE YOUR DROP, play, see
   what you earned, and head back to your Character page to spend it.
   The lobby, collection, item shop and brother-compare that used to
   live in here are the site's job — one character, one locker, one
   wallet, shared by every game. Loot Drop keeps only what's Loot Drop's:
   the rounds, the reboot van, loot luck, the cousin squad codes, and
   the grown-up view.
   ===================================================================== */
import { CONFIG, RARITY, RARITY_ORDER, SPRITES, SKINS, PETS } from './config.js';
import * as S from './state.js';
import * as G from './game.js';
import * as Speech from './speech.js';
import { playMinigame, randomMinigame } from './minigames.js';
import { requireKid, mountBar, celebrateLevelUp, describeAward,
         sfx, confettiRain } from '../../assets/arcade-shell.js';

const $ = id => document.getElementById(id);
let ALL = null;      // { profiles: { [childId]: sessionProfile } }
let WHO = null;      // the signed-in child's id
let KID = null;      // { id, nickname }
let BAR = null;      // mountBar handle — refreshed after every round
let ROUND_SNAP = null;   // character snapshot from the start of the round
let reportDirty = false; // a round finished since the last progress-file download
const P = () => ALL.profiles[WHO];
const save = () => S.saveAll(ALL);

/** One progress file per play session, not per round: downloads happen on
    the way out (Clubhouse button, the top bar's links), inside the same
    click gesture so the browser allows them even as the page navigates. */
function flushReport(){
  if (!reportDirty || !CONFIG.autoSaveReport) return;
  reportDirty = false;
  S.downloadReport(P());
}

function show(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  $(id).classList.add('on');
  window.scrollTo(0, 0);
}
function goHome(){ window.location.href = '../index.html'; }

function skinGlyph(p){ return (SKINS.find(s => s.id === p.skin) || SKINS[0]).g; }
function petGlyph(p){ return (PETS.find(s => s.id === p.pet) || PETS[0]).g; }

/* ==================== ONE-TIME MIGRATION OFFER ====================
   The old lootdrop.v1 blob kept two profiles, miles and jackson. If it
   exists, this child's character is still blank, and a profile hasn't
   been claimed yet, ask WHICH old profile belongs to this kid. Never
   guess — merge the wrong boy's collection and they both notice
   immediately. */
function renderMigration(offers){
  $('profileTitle').textContent = 'BRING OVER YOUR OLD LOOT?';
  $('incomingNote').textContent = `${KID.nickname}, your old Loot Drop stuff is still here. Which one was yours?`;
  const box = $('profileCards');
  box.innerHTML = '';
  offers.forEach((o) => {
    const c = document.createElement('button');
    c.className = 'pcard';
    c.innerHTML = `<div class="pglyph">🎒</div>
      <div class="pname">${o.name}'s loot</div>
      <div class="pmeta">Level ${o.level} · 🪙 ${o.coins}</div>
      <div class="pmeta">${o.sprites} sprites collected</div>`;
    c.onclick = async () => {
      box.innerHTML = '<div class="tiny">Bringing it all over…</div>';
      await S.migrateLegacy(KID, P(), o.who);
      sfx.play('win'); confettiRain(100);
      if (BAR) BAR.refresh();
      renderDrop(); show('scrDrop');
    };
    box.appendChild(c);
  });
  const fresh = document.createElement('button');
  fresh.className = 'pcard';
  fresh.innerHTML = `<div class="pglyph">✨</div>
    <div class="pname">Start fresh</div>
    <div class="pmeta">None of these are mine</div>`;
  fresh.onclick = () => { S.declineMigration(KID); renderDrop(); show('scrDrop'); };
  box.appendChild(fresh);
}

/* ===================== DROP (landing) SCREEN ===================== */
function renderDrop(){
  const p = P();
  $('dropAvatar').textContent = skinGlyph(p);
  $('dropPet').textContent = petGlyph(p);
  $('dropPet').style.display = petGlyph(p) ? '' : 'none';
  $('dropHello').textContent = `Ready, ${p.name}?`;
  const st = S.dayStreak(p);
  $('dropStreak').textContent = `🔥 ${st} day${st === 1 ? '' : 's'}`;
  const mins = S.minutesToday(p);
  $('dropToday').textContent = mins ? `⏱ ${mins} min today` : '⏱ First drop today';
  $('dropDex').textContent = `🗂️ ${S.uniqueSprites(p)}/${SPRITES.length}`;

  const luckNow = Math.round(currentLuck(p));
  $('luckFill').style.width = luckNow + '%';
  $('luckText').textContent = luckNow + '% loot luck right now';
  $('luckWhy').textContent = luckHint(p);
}

function currentLuck(p){
  const lt = p.lifetime;
  const acc = Math.max(0, ((lt.attempted ? lt.correct/lt.attempted : 0.8) - 0.5) / 0.5) * CONFIG.accuracyBonusLuck;
  const st = Math.min(S.dayStreak(p) * CONFIG.streakBonusLuck, CONFIG.streakBonusMaxLuck);
  let t = 0;
  const capped = Math.min(S.minutesToday(p), CONFIG.timeBonusCapMinutes);
  CONFIG.minutesForTimeBonus.forEach((m, i) => { if (capped >= m) t = CONFIG.timeBonusLuck[i]; });
  return Math.max(0, Math.min(100, acc + st + t));
}
function luckHint(p){
  const mins = S.minutesToday(p), st = S.dayStreak(p);
  const next = CONFIG.minutesForTimeBonus.find(m => mins < m);
  const bits = [];
  if (next) bits.push(`${next - mins} more min today = better loot`);
  if (st < 7) bits.push(`day ${st + 1} streak = more luck`);
  return bits.join(' · ') || 'Max daily bonus reached — nice.';
}

/* ============================== PLAY ============================= */
function beginRound(mode){
  ROUND_SNAP = S.takeSnapshot(P());
  show('scrPlay');
  $('playPet').textContent = petGlyph(P());
  $('playAvatar').textContent = skinGlyph(P());
  G.startRound({ profile:P(), mode, onFinish:handleFinish });
}

function handleFinish(res){
  if (res.status === 'reboot'){
    $('rebootNeed').textContent = res.need === 1
      ? 'Get 1 more right and you make it home.'
      : `Get ${res.need} more right and you make it home.`;
    $('rebootCount').textContent = `${res.available} question${res.available===1?'':'s'} you missed`;
    show('scrReboot');
    return;
  }
  save();
  renderResult(res);

  // The nightly email reads a progress file from Downloads — but writing
  // one after EVERY round piles up "lootdrop-… (1).json" duplicates (AJ:
  // "that should not happen"). So a finished round just marks the report
  // dirty; the actual download fires once, on the way OUT of the game
  // (Clubhouse button / top-bar links) with the whole session's data.
  if (CONFIG.autoSaveReport) reportDirty = true;

  // Push the round's exact delta to the shared character in the
  // background — the end screen never waits on the network.
  if (ROUND_SNAP){
    const snap = ROUND_SNAP; ROUND_SNAP = null;
    S.syncRoundToCharacter(KID, P(), snap, {
      asked: res.round.attempted, correct: res.round.correct,
      seconds: res.seconds, score: Math.round(res.accuracy * 100),
    }).then((outcome) => {
        $('resSaved').textContent = '✓ Saved to your character';
        if (BAR) BAR.refresh();
        celebrateLevelUp(outcome);
      })
      .catch(() => {
        $('resSaved').textContent = 'Playing offline — your character catches up next time.';
      });
  }
}

function renderResult(res){
  const extracted = res.status === 'extracted';
  $('resTitle').textContent = extracted ? 'EXTRACTED!' : 'ELIMINATED';
  $('resTitle').className = 'res-title ' + (extracted ? 'win' : 'lose');
  $('resSub').textContent = extracted
    ? 'You made it home with the loot.'
    : `You needed ${Math.round(CONFIG.extractThreshold*100)}% to get home — the loot stays in the storm. Try again 🙂`;
  $('resAcc').textContent = Math.round(res.accuracy * 100) + '%';
  $('resXp').textContent = '+' + res.xp;
  $('resCoins').textContent = '+' + res.coins;
  $('resSaved').textContent = '';

  const lootBox = $('resLoot');
  lootBox.innerHTML = '';
  if (extracted && res.won.length){
    res.won.forEach(w => {
      const el = document.createElement('div');
      el.className = 'ac-sprite ac-sprite--' + w.rarity;
      el.innerHTML = `<span class="ac-sprite__glyph">${w.sprite.g}</span>
        <span class="ac-sprite__name">${w.sprite.n}</span>
        ${w.isNew ? '<span class="ac-badge ac-badge--hot" style="font-size:9px;padding:1px 8px">NEW!</span>' : ''}`;
      lootBox.appendChild(el);
    });
    $('resLootTitle').textContent = `${res.won.length} sprite${res.won.length===1?'':'s'} secured`;
    sfx.play('win');
    confettiRain(110);
  } else {
    $('resLootTitle').textContent = res.round.backpack.length
      ? `${res.round.backpack.length} sprite${res.round.backpack.length===1?'':'s'} lost in the storm`
      : 'No loot this run';
    lootBox.innerHTML = `<div class="res-lost">${res.round.backpack.map(b=>b.sprite.g).join(' ') || '—'}</div>`;
  }

  const extra = [];
  res.levelsGained.forEach(l => extra.push(`⬆️ Reached level ${l}! +${CONFIG.coinsPerLevel} coins`));
  (res.gifts||[]).forEach(g => {
    if (g.awarded) extra.push(`🎁 ${g.day}-day streak: unlocked ${g.awarded.n}!`);
    else extra.push(`🎁 ${g.day}-day streak reward!`);
  });
  const missed = res.round.missed;
  if (missed.length) extra.push(`💪 Practice: ${missed.slice(0,4).join(', ')}`);
  $('resExtra').innerHTML = extra.map(e => `<div class="res-line">${e}</div>`).join('');

  $('resMiniBtn').style.display = extracted ? '' : 'none';
  $('resRetryBtn').textContent = extracted ? '🪂 Drop again' : '🪂 Try again';
  show('scrResult');
  Speech.speak(extracted ? 'Victory! You brought it all home.' : 'So close. Try again!', 1);
}

/* =========================== MINI-GAME =========================== */
function runMinigame(){
  show('scrMini');
  playMinigame(randomMinigame(), $('miniHost'), coins => {
    S.minigameCoins(KID, P(), coins); save();
    sfx.play('coin');
    if (BAR) BAR.refresh();
    $('miniHost').innerHTML = `<div class="mg-title">+${coins} COINS</div>
      <div class="mg-sub">Spend them in the Shop at your Clubhouse.</div>`;
    setTimeout(() => { renderDrop(); show('scrDrop'); }, 1500);
  });
}

/* ==================== SQUAD CODE (cousins) ==================== */
function renderCompare(){
  const p = P();
  $('myCode').value = S.makeSquadCode(p);
  $('myLink').value = location.origin + location.pathname + '?squad=' + S.makeSquadCode(p);
  $('cmpResult').style.display = 'none';
}
function summaryOf(p){
  return { who:p.who, name:p.name, level:S.levelInfo(p).level, streak:S.dayStreak(p),
           counts:p.counts, total:S.totalSprites(p), unique:S.uniqueSprites(p),
           score:S.collectionScore(p), rounds:p.lifetime.rounds };
}
function showCompare(a, b){
  const rows = [
    ['Collection score', a.score, b.score],
    ['Unique sprites', `${a.unique}/${SPRITES.length}`, `${b.unique}/${SPRITES.length}`],
    ['Total sprites', a.total, b.total],
    ['Level', a.level, b.level],
    ['Day streak', a.streak, b.streak],
    ['Rounds played', a.rounds, b.rounds],
  ];
  const tallyOf = c => { const t={}; RARITY_ORDER.forEach(r=>t[r]=0);
    c.forEach((n,i)=>{ if(n>0) t[SPRITES[i].r]+=n; }); return t; };
  const ta = tallyOf(a.counts), tb = tallyOf(b.counts);
  RARITY_ORDER.slice().reverse().forEach(r => rows.push([RARITY[r].name, ta[r], tb[r]]));

  const winner = a.score === b.score ? null : (a.score > b.score ? a : b);
  $('cmpResult').style.display = '';
  $('cmpResult').innerHTML = `
    <div class="cmp-head">
      <div class="cmp-side"><div class="cmp-name">${a.name}</div></div>
      <div class="cmp-vs">VS</div>
      <div class="cmp-side"><div class="cmp-name">${b.name}</div></div>
    </div>
    <div class="cmp-winner">${winner ? `👑 ${winner.name} leads on collection score` : "Dead tie — settle it in a round"}</div>
    <table class="cmp-table">${rows.map(([label,x,y]) => {
      const xs = Number(x)||parseInt(x)||0, ys = Number(y)||parseInt(y)||0;
      return `<tr><td class="${xs>ys?'lead':''}">${x}</td><th>${label}</th><td class="${ys>xs?'lead':''}">${y}</td></tr>`;
    }).join('')}</table>
    <div class="cmp-only">
      <div><b>Only ${a.name} has:</b> ${exclusive(a.counts,b.counts) || '—'}</div>
      <div><b>Only ${b.name} has:</b> ${exclusive(b.counts,a.counts) || '—'}</div>
    </div>`;
}
function exclusive(mine, theirs){
  return SPRITES.map((s,i)=> (mine[i]>0 && !theirs[i]) ? s.g : null).filter(Boolean).join(' ');
}

/* ============================ GROWN-UPS ============================ */
function renderParent(){
  const rep = S.buildReport(P());
  const d = rep.player;
  const hist = d.history.map(h => `<tr><td>${h.date}</td><td>${Math.round(h.seconds/60)}m</td>
    <td>${h.correct}/${h.attempted}${h.attempted?` (${Math.round(h.correct/h.attempted*100)}%)`:''}</td>
    <td>${h.extracted}/${h.rounds}</td><td>${(h.missed||[]).slice(0,6).join(', ')||'—'}</td></tr>`).join('');
  $('parentBody').innerHTML = `<div>
    <h3 style="margin:0 0 4px">${d.name}</h3>
    <p class="tiny" style="margin:0 0 6px">Level ${d.level} · ${d.dayStreak}-day streak · ${d.collection.unique}/${d.collection.outOf} sprites ·
      lifetime accuracy ${d.lifetime.accuracyPct}% (reading ${d.lifetime.readingAccuracyPct ?? '—'}%, math ${d.lifetime.mathAccuracyPct ?? '—'}%)</p>
    <p class="tiny" style="margin:0 0 6px">A progress file saves to Downloads after every round for the nightly email.</p>
    <table class="par-table"><tr><th>Date</th><th>Time</th><th>Correct</th><th>Extracted</th><th>Missed</th></tr>${hist || '<tr><td colspan=5>No sessions yet</td></tr>'}</table>
  </div>`;
}

/* ============================= BOOT ============================== */
export async function boot(){
  KID = await requireKid({ gameName: 'Loot Drop' });
  if (!KID) return;
  BAR = await mountBar({ title: 'Loot Drop' });

  const profile = await S.initFor(KID);
  ALL = { profiles: { [KID.id]: profile } };
  WHO = KID.id;

  // deep-link compare: ?squad=CODE (a cousin's link)
  const q = new URLSearchParams(location.search).get('squad');
  if (q){
    const them = S.readSquadCode(q);
    if (them) window.__incoming = them;
  }

  $('btnReading').onclick = () => { sfx.play('tap'); beginRound('reading'); };
  $('btnMath').onclick    = () => { sfx.play('tap'); beginRound('math'); };

  $('micBtn').onclick    = () => G.micPressed();
  $('hearBtn').onclick   = () => G.hearPressed();
  $('escapeBtn').onclick = () => G.escapePressed();
  $('quitBtn').onclick   = () => { renderDrop(); show('scrDrop'); };

  $('rebootYes').onclick = () => { sfx.play('tap'); show('scrPlay'); G.acceptReboot(); };
  $('rebootNo').onclick  = () => { const R = window.__round; R.rebootQueue = []; R.rebooting = false;
                                   settleDeclinedReboot(R); };

  $('resMiniBtn').onclick  = runMinigame;
  $('resRetryBtn').onclick = () => { renderDrop(); show('scrDrop'); };
  $('resHomeBtn').onclick  = () => { flushReport(); goHome(); };

  // The other ways out of the game live in the shared top bar (← Clubhouse,
  // Switch profile). Capture-phase so the download starts inside the same
  // user gesture, before the link's navigation unloads the page.
  document.addEventListener('click', (e) => {
    if (e.target.closest('.ac-bar a, .ac-bar button')) flushReport();
  }, true);

  $('lnkCompare').onclick = () => { renderCompare(); show('scrCompare'); };
  document.querySelectorAll('[data-home]').forEach(b => b.onclick = () => { renderDrop(); show('scrDrop'); });

  $('cmpGo').onclick = () => {
    const them = S.readSquadCode($('cmpInput').value);
    if (!them){
      $('cmpResult').style.display = '';
      $('cmpResult').innerHTML = '<div class="tiny bad">That code didn\'t work — check it and try again 🙂</div>';
      return;
    }
    showCompare(summaryOf(P()), them);
  };
  $('copyCode').onclick = () => copy($('myCode'));
  $('copyLink').onclick = () => copy($('myLink'));

  $('grownup').onclick    = () => { renderParent(); show('scrParent'); };
  $('parentSave').onclick = () => { reportDirty = false; S.downloadReport(P()); };

  if (!Speech.hasMic) $('micNote').textContent = 'Tip: open in Chrome for read-aloud mode. Tap mode works everywhere.';

  const offers = S.migrationOffer(KID, P());
  if (offers){ renderMigration(offers); show('scrGate'); }
  else if (window.__incoming){ renderCompare(); showCompare(summaryOf(P()), window.__incoming); show('scrCompare'); }
  else { renderDrop(); show('scrDrop'); }
}

function settleDeclinedReboot(R){
  // player declined the reboot van — settle the round as-is
  R.rebootQueue = []; R.rebooting = true; R.rebootDone = 0;
  R._rebootBaseline = { attempted:R.attempted, correct:R.correct };
  G.acceptReboot();
}
function copy(el){
  el.select();
  try { document.execCommand('copy'); } catch(e){}
  try { navigator.clipboard && navigator.clipboard.writeText(el.value); } catch(e){}
}

/* test hooks */
window.__ld = { get ALL(){ return ALL; }, setWho: w => { WHO = w; }, P, show,
                beginRound, renderDrop, renderCompare, save };
