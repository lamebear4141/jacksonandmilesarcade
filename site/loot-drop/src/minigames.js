/* =====================================================================
   LOOT DROP — post-victory mini-games
   Each one renders into a container and calls done(coinsEarned).
   Short on purpose: this is a reward, not a second homework session.
   ===================================================================== */

const rnd = n => Math.floor(Math.random() * n);

export const MINIGAMES = ['chests', 'pinata', 'stormdodge', 'sniper'];
export function randomMinigame(){ return MINIGAMES[rnd(MINIGAMES.length)]; }

export function playMinigame(name, host, done){
  host.innerHTML = '';
  ({ chests, pinata, stormdodge, sniper }[name] || chests)(host, done);
}

/* ---------------- 1. Chest Rush — pick one of three ---------------- */
function chests(host, done){
  host.innerHTML = `<div class="mg-title">CHEST RUSH</div>
    <div class="mg-sub">Pick a chest. One of them is loaded.</div>
    <div class="mg-row" id="mgChests"></div>`;
  const prizes = shuffleArr([15, 40, 120]);
  const row = host.querySelector('#mgChests');
  let picked = false;
  prizes.forEach((amount, i) => {
    const b = document.createElement('button');
    b.className = 'mg-chest'; b.textContent = '🎁';
    b.onclick = () => {
      if (picked) return; picked = true;
      [...row.children].forEach((c, j) => {
        c.textContent = prizes[j] >= 120 ? '💎' : prizes[j] >= 40 ? '🪙' : '🥔';
        c.classList.add(j === i ? 'mg-picked' : 'mg-dim');
        c.insertAdjacentHTML('beforeend', `<div class="mg-amt">${prizes[j]}</div>`);
      });
      setTimeout(() => done(amount), 1400);
    };
    row.appendChild(b);
  });
}

/* ---------------- 2. Loot Llama — mash to burst it ---------------- */
function pinata(host, done){
  const SECONDS = 7;
  host.innerHTML = `<div class="mg-title">LOOT LLAMA</div>
    <div class="mg-sub">Whack it as fast as you can!</div>
    <button class="mg-llama" id="mgLlama">🦙</button>
    <div class="mg-bar"><div class="mg-fill" id="mgFill"></div></div>
    <div class="mg-count" id="mgCount">0 hits</div>`;
  let hits = 0, over = false;
  const llama = host.querySelector('#mgLlama');
  const fill  = host.querySelector('#mgFill');
  const count = host.querySelector('#mgCount');
  const started = Date.now();

  llama.onclick = () => {
    if (over) return;
    hits++;
    count.textContent = hits + ' hits';
    llama.style.transform = `scale(${1 + (hits % 2) * 0.14}) rotate(${(hits % 2 ? 6 : -6)}deg)`;
    if (hits >= 40) finish();
  };
  const timer = setInterval(() => {
    const t = (Date.now() - started) / 1000;
    fill.style.width = Math.max(0, 100 - t / SECONDS * 100) + '%';
    if (t >= SECONDS) finish();
  }, 60);

  function finish(){
    if (over) return;
    over = true; clearInterval(timer);
    llama.textContent = '💥'; llama.disabled = true;
    const coins = 20 + hits * 3;
    count.textContent = `${hits} hits → ${coins} coins!`;
    setTimeout(() => done(coins), 1300);
  }
}

/* ---------------- 3. Storm Dodge — survive the closing storm ------- */
function stormdodge(host, done){
  const W = 300, H = 300, SECONDS = 12;
  host.innerHTML = `<div class="mg-title">STORM DODGE</div>
    <div class="mg-sub">Move with your finger or the arrow keys. Don't touch the purple!</div>
    <canvas id="mgCanvas" width="${W}" height="${H}" class="mg-canvas"></canvas>
    <div class="mg-count" id="mgCount">0s</div>`;
  const cv = host.querySelector('#mgCanvas'), ctx = cv.getContext('2d');
  const count = host.querySelector('#mgCount');
  let px = W/2, py = H/2, over = false;
  const bolts = [];
  const started = Date.now();
  const keys = {};

  const onKey = e => { keys[e.key] = e.type === 'keydown'; if (e.key.startsWith('Arrow')) e.preventDefault(); };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  const movePointer = e => {
    const r = cv.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    px = (t.clientX - r.left) * (W / r.width);
    py = (t.clientY - r.top) * (H / r.height);
  };
  cv.addEventListener('mousemove', movePointer);
  cv.addEventListener('touchmove', e => { movePointer(e); e.preventDefault(); }, { passive:false });

  for (let i = 0; i < 5; i++) bolts.push(spawnBolt());
  function spawnBolt(){
    const edge = rnd(4);
    const s = 0.9 + Math.random() * 1.5;
    if (edge === 0) return { x:rnd(W), y:-10, vx:(Math.random()-.5)*s, vy:s };
    if (edge === 1) return { x:rnd(W), y:H+10, vx:(Math.random()-.5)*s, vy:-s };
    if (edge === 2) return { x:-10, y:rnd(H), vx:s, vy:(Math.random()-.5)*s };
    return { x:W+10, y:rnd(H), vx:-s, vy:(Math.random()-.5)*s };
  }

  const loop = setInterval(() => {
    const t = (Date.now() - started) / 1000;
    if (keys.ArrowLeft) px -= 4; if (keys.ArrowRight) px += 4;
    if (keys.ArrowUp) py -= 4;   if (keys.ArrowDown) py += 4;
    px = Math.max(8, Math.min(W-8, px)); py = Math.max(8, Math.min(H-8, py));

    if (t > 3 && bolts.length < 5 + Math.floor(t)) bolts.push(spawnBolt());

    ctx.fillStyle = '#0e1030'; ctx.fillRect(0,0,W,H);
    const radius = Math.max(60, H/2 - t * 7);
    ctx.fillStyle = 'rgba(150,80,255,0.30)'; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(W/2, H/2, radius, 0, Math.PI*2); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#c07bff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(W/2, H/2, radius, 0, Math.PI*2); ctx.stroke();

    let dead = Math.hypot(px - W/2, py - H/2) > radius;
    bolts.forEach(b => {
      b.x += b.vx; b.y += b.vy;
      if (b.x < -20 || b.x > W+20 || b.y < -20 || b.y > H+20) Object.assign(b, spawnBolt());
      ctx.font = '20px serif'; ctx.fillText('⚡', b.x-10, b.y+7);
      if (Math.hypot(b.x-px, b.y-py) < 14) dead = true;
    });

    ctx.font = '26px serif'; ctx.fillText('🛡️', px-13, py+9);
    count.textContent = t.toFixed(1) + 's';
    if (dead || t >= SECONDS) finish(t, dead);
  }, 1000/45);

  function finish(t, dead){
    if (over) return;
    over = true; clearInterval(loop);
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
    const coins = Math.round(10 + t * 9) + (dead ? 0 : 40);
    count.textContent = dead ? `Zapped at ${t.toFixed(1)}s → ${coins} coins`
                             : `Survived the storm! → ${coins} coins`;
    setTimeout(() => done(coins), 1500);
  }
}

/* ---------------- 4. Sharp Shooter — tap the targets --------------- */
function sniper(host, done){
  const SECONDS = 10;
  host.innerHTML = `<div class="mg-title">SHARP SHOOTER</div>
    <div class="mg-sub">Tap every target before time runs out!</div>
    <div class="mg-field" id="mgField"></div>
    <div class="mg-bar"><div class="mg-fill" id="mgFill"></div></div>
    <div class="mg-count" id="mgCount">0 hit</div>`;
  const field = host.querySelector('#mgField');
  const fill = host.querySelector('#mgFill');
  const count = host.querySelector('#mgCount');
  let hits = 0, over = false;
  const started = Date.now();

  function spawn(){
    if (over) return;
    const t = document.createElement('button');
    t.className = 'mg-target'; t.textContent = Math.random() < 0.2 ? '💣' : '🎯';
    const bomb = t.textContent === '💣';
    t.style.left = (5 + Math.random() * 78) + '%';
    t.style.top  = (5 + Math.random() * 70) + '%';
    t.onclick = () => {
      if (over) return;
      if (bomb){ hits = Math.max(0, hits - 2); t.textContent = '💥'; }
      else { hits++; t.textContent = '✅'; }
      count.textContent = hits + ' hit';
      t.disabled = true;
      setTimeout(()=>t.remove(), 180);
    };
    field.appendChild(t);
    setTimeout(()=>t.remove(), 1100 + Math.random()*500);
  }
  const spawner = setInterval(spawn, 380);
  const timer = setInterval(() => {
    const t = (Date.now() - started)/1000;
    fill.style.width = Math.max(0, 100 - t/SECONDS*100) + '%';
    if (t >= SECONDS) finish();
  }, 60);

  function finish(){
    if (over) return;
    over = true; clearInterval(spawner); clearInterval(timer);
    field.innerHTML = '';
    const coins = 15 + hits * 8;
    count.textContent = `${hits} targets → ${coins} coins!`;
    setTimeout(()=>done(coins), 1300);
  }
}

function shuffleArr(a){ const c=a.slice(); for(let i=c.length-1;i>0;i--){ const j=rnd(i+1); [c[i],c[j]]=[c[j],c[i]]; } return c; }
