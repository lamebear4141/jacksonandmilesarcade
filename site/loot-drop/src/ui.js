/* =====================================================================
   LOOT DROP — screens, navigation, boot
   ===================================================================== */
import { CONFIG, RARITY, RARITY_ORDER, SPRITES, SKINS, PETS, levelFromXp } from './config.js';
import * as S from './state.js';
import * as G from './game.js';
import * as Speech from './speech.js';
import { playMinigame, randomMinigame } from './minigames.js';
import { requireKid, mountBar, celebrateLevelUp } from '../../assets/arcade-shell.js';
import { clearCurrentKid } from '../../firebase-config.js';

const $ = id => document.getElementById(id);
let ALL = null;      // { profiles: { [childId]: sessionProfile } }
let WHO = null;      // the signed-in child's id
let KID = null;      // { id, nickname }
let ROUND_SNAP = null;   // character snapshot from the start of the round
const P = () => ALL.profiles[WHO];
const save = () => S.saveAll(ALL);

function show(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  $(id).classList.add('on');
}

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
      const res = await S.migrateLegacy(KID, P(), o.who);
      if (res.ok){ renderLobby(); show('scrLobby'); }
      else { renderLobby(); show('scrLobby'); }
    };
    box.appendChild(c);
  });
  const fresh = document.createElement('button');
  fresh.className = 'pcard';
  fresh.innerHTML = `<div class="pglyph">✨</div>
    <div class="pname">Start fresh</div>
    <div class="pmeta">None of these are mine</div>`;
  fresh.onclick = () => { S.declineMigration(KID); renderLobby(); show('scrLobby'); };
  box.appendChild(fresh);
}
function skinGlyph(p){ return (SKINS.find(s => s.id === p.skin) || SKINS[0]).g; }
function petGlyph(p){ return (PETS.find(s => s.id === p.pet) || PETS[0]).g; }

/* ============================= LOBBY ============================= */
function renderLobby(){
  const p = P(), li = S.levelInfo(p);
  $('lobbyName').textContent = p.name;
  $('lobbyAvatar').textContent = skinGlyph(p);
  $('lobbyPet').textContent = petGlyph(p);
  $('lobbyLevel').textContent = 'LEVEL ' + li.level;
  $('xpFill').style.width = (li.into / li.need * 100) + '%';
  $('xpText').textContent = `${li.into} / ${li.need} XP`;
  $('lobbyCoins').textContent = '🪙 ' + p.coins;
  $('lobbyStreak').textContent = '🔥 ' + S.dayStreak(p) + ' day' + (S.dayStreak(p)===1?'':'s');
  $('lobbyDex').textContent = `🗂️ ${S.uniqueSprites(p)}/${SPRITES.length}`;
  const mins = S.minutesToday(p);
  $('lobbyToday').textContent = mins ? `${mins} min today` : 'Not played yet today';

  renderShowcase(p);

  const luckNow = Math.round(require_luck(p));
  $('luckFill').style.width = luckNow + '%';
  $('luckText').textContent = luckNow + '% loot luck';
  $('luckWhy').textContent = luckHint(p);
}
/** The rarest things they own — the thing they'll actually want to show off. */
function renderShowcase(p){
  const owned = SPRITES.map((s,i)=>({ s, i, c:p.counts[i]||0 }))
    .filter(x => x.c > 0)
    .sort((a,b)=> RARITY_ORDER.indexOf(b.s.r) - RARITY_ORDER.indexOf(a.s.r) || b.c - a.c)
    .slice(0, 12);
  const el = $('lobbyShowcase');
  if (!owned.length){
    el.innerHTML = '<div class="tiny" style="padding:14px 0">No sprites yet — drop in and win some!</div>';
    return;
  }
  el.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">' + owned.map(x => {
    const r = RARITY[x.s.r];
    return `<div class="sprite" style="border-color:${r.color};width:74px;padding:6px 2px">
      <div class="sp-glyph" style="font-size:24px">${x.s.g}</div>
      <div class="sp-name" style="font-size:9px">${x.s.n}</div>
      ${x.c>1?`<div class="sp-count">×${x.c}</div>`:''}</div>`;
  }).join('') + '</div>';
}

function require_luck(p){
  const { luckScore } = { luckScore: (o) => {
    const acc = Math.max(0,(o.accuracy-0.5)/0.5)*CONFIG.accuracyBonusLuck;
    const st = Math.min(o.dayStreak*CONFIG.streakBonusLuck, CONFIG.streakBonusMaxLuck);
    let t=0; const capped = Math.min(o.minutesToday, CONFIG.timeBonusCapMinutes);
    CONFIG.minutesForTimeBonus.forEach((m,i)=>{ if(capped>=m) t=CONFIG.timeBonusLuck[i]; });
    return Math.max(0, Math.min(100, acc+st+t));
  }};
  const lt = p.lifetime;
  return luckScore({ accuracy: lt.attempted ? lt.correct/lt.attempted : 0.8,
                     dayStreak: S.dayStreak(p), minutesToday: S.minutesToday(p) });
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
  // Push the round's exact delta to the shared character in the
  // background — the end screen never waits on the network.
  if (ROUND_SNAP){
    const snap = ROUND_SNAP; ROUND_SNAP = null;
    S.syncRoundToCharacter(KID, P(), snap, {
      asked: res.round.attempted, correct: res.round.correct,
      seconds: res.seconds, score: Math.round(res.accuracy * 100),
    }).then((outcome) => { celebrateLevelUp(outcome); })
      .catch(() => { /* offline round still played; character catches up next run */ });
  }
}

function renderResult(res){
  const p = P();
  const extracted = res.status === 'extracted';
  $('resTitle').textContent = extracted ? 'EXTRACTED!' : 'ELIMINATED';
  $('resTitle').className = 'res-title ' + (extracted ? 'win' : 'lose');
  $('resSub').textContent = extracted
    ? 'You made it home with the loot.'
    : `You needed ${Math.round(CONFIG.extractThreshold*100)}% to get home.`;
  $('resAcc').textContent = Math.round(res.accuracy * 100) + '%';
  $('resXp').textContent = '+' + res.xp;
  $('resCoins').textContent = '+' + res.coins;

  const lootBox = $('resLoot');
  lootBox.innerHTML = '';
  if (extracted && res.won.length){
    res.won.forEach(w => {
      const r = RARITY[w.rarity];
      const el = document.createElement('div');
      el.className = 'res-sprite';
      el.style.borderColor = r.color;
      el.innerHTML = `<div class="rs-glyph">${w.sprite.g}</div>
        <div class="rs-name" style="color:${r.color}">${w.sprite.n}</div>
        ${w.isNew ? '<div class="rs-new">NEW!</div>' : ''}`;
      lootBox.appendChild(el);
    });
    $('resLootTitle').textContent = `${res.won.length} sprite${res.won.length===1?'':'s'} secured`;
  } else {
    $('resLootTitle').textContent = res.round.backpack.length
      ? `${res.round.backpack.length} sprites lost in the storm`
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
  $('resRetryBtn').textContent = extracted ? 'Drop again' : 'Try again';
  show('scrResult');
  // (No auto-download here any more — it dropped a lootdrop-YYYY-MM-DD.json
  // into the Downloads folder after every single round. The grown-up
  // dashboard's "Save progress file" button still does it on demand.)
  Speech.speak(extracted ? 'Victory! You brought it all home.' : 'So close. Try again!', 1);
}

/* =========================== MINI-GAME =========================== */
function runMinigame(){
  show('scrMini');
  playMinigame(randomMinigame(), $('miniHost'), coins => {
    S.minigameCoins(KID, P(), coins); save();
    $('miniHost').innerHTML = `<div class="mg-title">+${coins} COINS</div>
      <div class="mg-sub">Spend them in the Item Shop.</div>`;
    setTimeout(() => { renderLobby(); show('scrLobby'); }, 1500);
  });
}

/* ========================== COLLECTION =========================== */
function renderCollection(){
  const p = P();
  $('colTitle').textContent = `${p.name}'s Collection`;
  $('colScore').textContent = `Score ${S.collectionScore(p)} · ${S.uniqueSprites(p)}/${SPRITES.length} unique · ${S.totalSprites(p)} total`;
  const tally = S.rarityTally(p);
  $('colTally').innerHTML = RARITY_ORDER.map(r =>
    `<span class="tally" style="background:${RARITY[r].color}">${RARITY[r].name} ${tally[r]}</span>`).join('');
  const grid = $('colGrid');
  grid.innerHTML = '';
  SPRITES.forEach((s, i) => {
    const c = p.counts[i] || 0;
    const r = RARITY[s.r];
    const el = document.createElement('div');
    el.className = 'sprite' + (c ? '' : ' locked');
    el.style.borderColor = c ? r.color : '#2b2f47';
    el.innerHTML = `<div class="sp-glyph">${c ? s.g : '❔'}</div>
      <div class="sp-name">${c ? s.n : '???'}</div>
      ${c > 1 ? `<div class="sp-count">×${c}</div>` : ''}`;
    el.title = `${s.n} — ${r.name}`;
    grid.appendChild(el);
  });
}

/* ============================= SHOP ============================== */
function renderShop(){
  // The shop and locker live on Character Home now — one wallet, one
  // place to buy and equip, shared by every game. This screen just
  // points the way instead of duplicating it.
  const p = P();
  $('shopCoins').textContent = '🪙 ' + p.coins;
  $('shopMsg').textContent = '';
  $('shopSkins').innerHTML = `
    <a class="pcard" href="../index.html" style="text-decoration:none;display:block;text-align:center">
      <div class="pglyph">🛒</div>
      <div class="pname" style="font-size:18px">Skins &amp; pets moved to your Character!</div>
      <div class="pmeta">Your coins work everywhere now. Buy and equip on your
      Character page — tap here, then open SHOP or LOCKER.</div>
    </a>`;
  $('shopPets').innerHTML = '';
}

/* ============================ COMPARE ============================ */
function renderCompare(){
  const p = P();
  const code = S.makeSquadCode(p);
  $('myCode').value = code;
  $('myLink').value = location.origin + location.pathname + '?squad=' + code;
  // Brothers now compare automatically on the family leaderboard back on
  // Character Home; codes are for cousins and friends in OTHER families.
  $('cmpResult').innerHTML = '<div class="tiny">Brothers: check the 🏆 tab on your Character page!<br>Got a cousin\'s squad code? Paste it below.</div>';
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

/* ============================ PARENT ============================= */
function renderParent(){
  const rep = S.buildReport(P());
  const rows = () => {
    const d = rep.player;
    const hist = d.history.map(h => `<tr><td>${h.date}</td><td>${Math.round(h.seconds/60)}m</td>
      <td>${h.correct}/${h.attempted}${h.attempted?` (${Math.round(h.correct/h.attempted*100)}%)`:''}</td>
      <td>${h.extracted}/${h.rounds}</td><td>${(h.missed||[]).slice(0,6).join(', ')||'—'}</td></tr>`).join('');
    return `<div class="par-block">
      <h3>${d.name}</h3>
      <p class="tiny">Level ${d.level} · 🔥 ${d.dayStreak} day streak · ${d.collection.unique}/${d.collection.outOf} sprites ·
        lifetime accuracy ${d.lifetime.accuracyPct}% (reading ${d.lifetime.readingAccuracyPct ?? '—'}%, math ${d.lifetime.mathAccuracyPct ?? '—'}%)</p>
      <table class="par-table"><tr><th>Date</th><th>Time</th><th>Correct</th><th>Extracted</th><th>Missed</th></tr>${hist || '<tr><td colspan=5>No sessions yet</td></tr>'}</table>
    </div>`;
  };
  $('parentBody').innerHTML = rows();
}

/* ============================= BOOT ============================== */
export async function boot(){
  KID = await requireKid({ gameName: 'Loot Drop' });
  if (!KID) return;
  await mountBar({ title: 'Loot Drop' });

  const profile = await S.initFor(KID);
  ALL = { profiles: { [KID.id]: profile } };
  WHO = KID.id;

  // deep-link compare: ?squad=CODE
  const q = new URLSearchParams(location.search).get('squad');
  if (q){
    const them = S.readSquadCode(q);
    if (them) window.__incoming = them;
  }

  $('btnDrop').onclick    = () => show('scrDrop');
  $('btnReading').onclick = () => beginRound('reading');
  $('btnMath').onclick    = () => beginRound('math');
  $('btnDropBack').onclick= () => show('scrLobby');

  $('micBtn').onclick    = () => G.micPressed();
  $('hearBtn').onclick   = () => G.hearPressed();
  $('escapeBtn').onclick = () => G.escapePressed();
  $('quitBtn').onclick = () => { if (confirmQuit()) { renderLobby(); show('scrLobby'); } };

  $('rebootYes').onclick = () => { show('scrPlay'); G.acceptReboot(); };
  $('rebootNo').onclick  = () => { const R = window.__round; R.rebootQueue = []; R.rebooting = false;
                                   handleFinishForce(R); };

  $('resMiniBtn').onclick  = runMinigame;
  $('resRetryBtn').onclick = () => show('scrDrop');
  $('resHomeBtn').onclick  = () => { renderLobby(); show('scrLobby'); };

  $('btnCollection').onclick = () => { renderCollection(); show('scrCollection'); };
  $('btnShop').onclick       = () => { renderShop(); show('scrShop'); };
  $('btnCompare').onclick    = () => { renderCompare(); if (window.__incoming) showCompare(summaryOf(P()), window.__incoming); show('scrCompare'); };
  // Switching always routes back through the arcade's picker — a real
  // kid re-enters their own PIN there.
  $('btnSwitch').onclick     = () => { clearCurrentKid(); window.location.href = '../index.html'; };

  document.querySelectorAll('[data-home]').forEach(b => b.onclick = () => { renderLobby(); show('scrLobby'); });

  $('cmpGo').onclick = () => {
    const them = S.readSquadCode($('cmpInput').value);
    if (!them){ $('cmpResult').innerHTML = '<div class="tiny bad">That code didn\'t work — check it and try again.</div>'; return; }
    showCompare(summaryOf(P()), them);
  };
  $('copyCode').onclick = () => copy($('myCode'));
  $('copyLink').onclick = () => copy($('myLink'));

  $('grownup').onclick   = () => { renderParent(); show('scrParent'); };
  $('parentSave').onclick= () => S.downloadReport(P());

  if (!Speech.hasMic) $('micNote').textContent = 'Tip: open in Chrome for read-aloud mode. Tap mode works everywhere.';

  const offers = S.migrationOffer(KID, P());
  if (offers){ renderMigration(offers); show('scrProfile'); }
  else if (window.__incoming){ renderCompare(); showCompare(summaryOf(P()), window.__incoming); show('scrCompare'); }
  else { renderLobby(); show('scrLobby'); }
}

function confirmQuit(){ return true; }
function handleFinishForce(R){
  // player declined the reboot van — settle the round as-is
  R.rebootQueue = []; R.rebooting = true; R.rebootDone = 0; R._rebootBaseline = { attempted:R.attempted, correct:R.correct };
  G.acceptReboot();
}
function copy(el){
  el.select();
  try { document.execCommand('copy'); } catch(e){}
  try { navigator.clipboard && navigator.clipboard.writeText(el.value); } catch(e){}
}

/* test hooks */
window.__ld = { get ALL(){ return ALL; }, setWho: w => { WHO = w; }, P, show,
                beginRound, renderLobby, renderCollection, renderShop, renderCompare, save };
