/* =====================================================================
   LOOT DROP — read-aloud checking
   Web Speech API. Chrome only for recognition; TTS works nearly everywhere.
   Falls back to tap-the-word if the mic is blocked or missing.
   ===================================================================== */

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const hasMic = !!SR;
let recog = null, listening = false;

export function speak(text, rate){
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate || 0.85; u.pitch = 1.05; u.lang = 'en-US';
    speechSynthesis.speak(u);
  } catch(e){}
}
export function stopSpeaking(){ try { speechSynthesis.cancel(); } catch(e){} }

const FORGIVE = {
  of:['off','uv'], were:['where','wear'], there:['their',"they're"], your:["you're"],
  know:['no'], here:['hear'], some:['sum'], would:['wood'], for:['four'],
  to:['too','two'], ate:['eight'], see:['sea'], by:['buy','bye'], one:['won'],
  read:['red','reed'], meat:['meet'], road:['rode'], way:['weigh'], sun:['son'],
  whale:['wail'], through:['threw'], knight:['night'], thumb:['thum'], island:['iland'],
  honest:['onest'], rhyme:['rime'], write:['right'], hour:['our'], flour:['flower'],
  tail:['tale'], plain:['plane'], bear:['bare'], pair:['pear','pare'], made:['maid'],
};

export function normalize(s){
  return (s || '').toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function lev(a, b){
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length:n+1 }, (_,i)=>i), cur = new Array(n+1);
  for (let i=1;i<=m;i++){ cur[0]=i;
    for (let j=1;j<=n;j++) cur[j] = Math.min(prev[j]+1, cur[j-1]+1, prev[j-1] + (a[i-1]===b[j-1]?0:1));
    [prev,cur] = [cur,prev];
  }
  return prev[n];
}
function matches(target, spokenWords){
  const t = normalize(target);
  const alts = [t].concat(FORGIVE[t] || []);
  const tol = t.length > 7 ? 2 : 1;    // longer 3rd-grade words get a little more slack
  return spokenWords.some(w => alts.some(a => w === a || (a.length > 3 && lev(w, a) <= tol)));
}

/** 0..1 — how much of the target actually got read. */
export function scoreSpeech(target, transcript){
  const spoken = normalize(transcript).split(' ').filter(Boolean);
  const targets = normalize(target).split(' ').filter(Boolean);
  if (!spoken.length) return 0;

  if (targets.length === 1){
    // sounding out "be-cause" comes back as two words — glue chunks back together
    const glued = [spoken.join('')];
    for (let i=0;i<spoken.length-1;i++) glued.push(spoken[i]+spoken[i+1]);
    for (let i=0;i<spoken.length-2;i++) glued.push(spoken[i]+spoken[i+1]+spoken[i+2]);
    return matches(targets[0], spoken.concat(glued)) ? 1 : 0;
  }
  let hit = 0;
  targets.forEach(t => { if (matches(t, spoken)) hit++; });
  return hit / targets.length;
}

/** Pass mark: single words must be right; longer text allows some slippage. */
export function passMark(kind){
  if (kind === 'read-word') return 0.99;
  if (kind === 'read-sentence') return 0.7;
  return 0.6;                     // passages are long; getting most of it is the point
}

export function listen({ onPartial, onDone, onError }){
  if (!SR || listening) return false;
  try {
    recog = new SR();
    recog.lang = 'en-US'; recog.interimResults = true; recog.maxAlternatives = 3; recog.continuous = false;
    let best = '';
    recog.onstart = () => { listening = true; };
    recog.onresult = e => {
      let txt = '';
      for (let i=0;i<e.results.length;i++)
        for (let j=0;j<e.results[i].length;j++) txt += ' ' + e.results[i][j].transcript;
      best = txt;
      onPartial && onPartial(normalize(txt));
    };
    recog.onerror = e => { listening = false; onError && onError(e.error); };
    recog.onend = () => { listening = false; onDone && onDone(best); };
    recog.start();
    return true;
  } catch(e){ listening = false; onError && onError('start-failed'); return false; }
}
export function stopListening(){ try { recog && recog.stop(); } catch(e){} }
export function isListening(){ return listening; }
