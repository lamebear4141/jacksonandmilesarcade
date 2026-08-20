/* =====================================================================
   LOOT DROP — content engine
   Reading and math challenges for grade 1 (Miles) and grade 3 (Jackson).

   Every challenge is an object:
     { kind, prompt, target?, choices?, answer, label, bonus?, speak? }
   kind: 'read-word' | 'read-sentence' | 'passage' | 'choice'
   'passage' is a BONUS round — it needs the read-aloud AND the right answer.
   ===================================================================== */

export function pick(arr, n){
  const pool = arr.slice(), out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  return out;
}
const one = a => a[Math.floor(Math.random()*a.length)];
const rnd = n => Math.floor(Math.random()*n);
function shuffle(a){ const c=a.slice(); for(let i=c.length-1;i>0;i--){ const j=rnd(i+1); [c[i],c[j]]=[c[j],c[i]]; } return c; }

/* ============================ READING ============================ */

const SIGHT_1 = ["after","again","any","ask","because","before","could","every","from","give",
  "going","have","here","how","just","know","live","many","must","never","once","only","open",
  "other","over","people","pretty","put","round","some","stop","take","thank","them","then",
  "there","think","those","under","very","walk","want","were","what","when","where","which",
  "would","your","around"];

const SIGHT_3 = ["although","beautiful","believe","caught","certain","complete","develop",
  "different","enough","especially","favorite","finally","government","híghway","important",
  "instead","knowledge","language","material","measure","mountain","nervous","ordinary",
  "particular","possible","probably","question","reason","remember","sentence","serious",
  "special","straight","strength","success","suddenly","suppose","surface","surprise",
  "thought","through","together","tomorrow","trouble","usually","weather","whether","without"]
  .filter(w => !/[^a-z]/.test(w));

const PHONICS_1 = [
  { set:'short vowels', words:['cat','bed','pig','hop','bug','map','ten','win','dog','sun','hat','net','fish','box','cup'] },
  { set:'blends',       words:['stop','flag','clap','drum','frog','sled','spin','trap','grin','swim','plum','crab','skip','stamp','brush'] },
  { set:'digraphs',     words:['ship','chin','that','when','chop','bath','with','shell','chick','thick','whale','much','wish','path','shed'] },
  { set:'silent e',     words:['cake','bike','home','cute','name','ride','note','tube','game','five','late','kite','rope','mule','smile'] },
  { set:'vowel teams',  words:['rain','boat','tree','seed','play','coat','feet','meat','road','green','train','soap','clean','stay','dream'] },
];

const PHONICS_3 = [
  { set:'r-controlled',   words:['charge','thirsty','purple','corner','farther','murmur','sturdy','perfect','morning','carpet'] },
  { set:'multisyllable',  words:['fantastic','remember','important','celebrate','wonderful','adventure','carpenter','invisible','september','telescope'] },
  { set:'tricky endings', words:['nation','motion','question','picture','creature','measure','treasure','feature','fracture','mixture'] },
  { set:'silent letters', words:['knight','wrestle','thumb','listen','castle','island','honest','rhyme','plumber','wrinkle'] },
  { set:'prefixes',       words:['unhappy','rebuild','preview','disagree','mistake','nonstop','overflow','underground','impossible','international'] },
];

const SENT_1 = [
  "The big frog can hop.","I see a red bug.","My dog ran to the pond.","We play in the sun.",
  "She has a green hat.","The cat sat on my lap.","Can you help me find it?","He put the book away.",
  "They went up the hill.","A fish swims in the lake.","My mom made a cake.","The bird flew over the tree.",
  "We ride bikes after school.","Please open the blue box.","The little pig is very fast.",
];
const SENT_3 = [
  "The explorers followed the narrow trail through the forest.",
  "My brother finally finished building his enormous castle.",
  "Thunder rumbled before the storm reached our neighborhood.",
  "She carefully measured each ingredient for the recipe.",
  "The museum displayed skeletons of ancient creatures.",
  "Our team practiced every morning before the tournament.",
  "He discovered a mysterious envelope beneath the floorboards.",
  "The scientist recorded her observations in a notebook.",
  "Several enormous waves crashed against the rocky shoreline.",
  "They celebrated because their project was finally complete.",
];

/* Passages are BONUS rounds: read it out loud AND answer the question. */
const PASSAGE_1 = [
  { text:"Sam has a pet fish. The fish is red and very fast. Sam feeds him every day after school.",
    q:"What color is Sam's fish?", a:"Red", w:["Blue","Green"] },
  { text:"Mia lost her hat at the park. She looked under the slide. Her dog found it in the grass!",
    q:"Who found the hat?", a:"Her dog", w:["Her mom","A bird"] },
  { text:"It was rainy, so Ben could not play outside. He built a big fort with his blocks. Then he read a book inside the fort.",
    q:"Why did Ben stay inside?", a:"It was rainy", w:["He was sick","It was dark"] },
  { text:"Ana planted a seed in a cup. She gave it water every morning. In two weeks a small green plant came up.",
    q:"What did Ana do every morning?", a:"Gave it water", w:["Ate a snack","Dug a hole"] },
  { text:"Leo went to the lake with Dad. They saw six ducks by the boat. Leo fed them bits of bread.",
    q:"How many ducks did they see?", a:"Six", w:["Two","Ten"] },
  { text:"The class made a big paper dragon. Each kid painted one part. They hung it up by the door.",
    q:"Where did they hang the dragon?", a:"By the door", w:["On the floor","In a box"] },
  { text:"Jo could not find her shoe. She looked in the closet and under the bed. It was in the toy box the whole time!",
    q:"Where was the shoe?", a:"In the toy box", w:["Under the bed","In the closet"] },
  { text:"Max helped Grandma bake bread. He stirred the dough with a big spoon. The kitchen smelled warm and sweet.",
    q:"What did Max stir the dough with?", a:"A big spoon", w:["His hands","A fork"] },
];

const PASSAGE_3 = [
  { text:"Marcus had practiced his free throws every day for a month. At the game, with three seconds left, the coach sent him to the line. His hands were shaking, but the ball dropped straight through the net.",
    q:"Why were Marcus's hands shaking?", a:"He was nervous about the pressure", w:["He was cold","He had been running"] },
  { text:"Sea otters wrap themselves in kelp before they sleep. The long strands work like an anchor, keeping the otter from drifting away with the current while it rests.",
    q:"Why do sea otters wrap up in kelp?", a:"So they don't float away while sleeping", w:["To stay warm at night","To hide their food"] },
  { text:"Every morning Nadia set two bowls on the porch, though she only had one cat. The second bowl was for the skinny gray stray who never let her close enough to pet him.",
    q:"What can you tell about Nadia?", a:"She is kind to animals", w:["She owns two cats","She dislikes the stray"] },
  { text:"The old bridge had a sign that read CLOSED, but the boards looked solid enough. Theo took one step, heard a long low crack, and immediately backed off.",
    q:"Why did Theo back off the bridge?", a:"The cracking sound warned him it was unsafe", w:["He read the sign first","Someone called his name"] },
  { text:"Honeybees dance to talk. A bee that finds flowers returns to the hive and waggles in a figure eight. The angle of the dance tells the other bees which direction to fly.",
    q:"What does the angle of the dance tell other bees?", a:"Which direction to fly", w:["How sweet the nectar is","How many bees to send"] },
  { text:"Lena's science project was due Friday. She had gathered every material by Tuesday but had not started building. On Thursday night she realized the glue needed a full day to dry.",
    q:"What is Lena's problem?", a:"She waited too long to start", w:["She lost her materials","Her project was the wrong topic"] },
  { text:"The desert looks empty at noon, but that is only because the animals are hiding. Most desert creatures are nocturnal, sleeping through the blistering day and hunting after sunset.",
    q:"What does nocturnal mean?", a:"Active at night", w:["Living in the desert","Able to go without water"] },
  { text:"Ravi's grandfather never threw anything away. The garage held stacks of glass jars, coils of wire, and a shelf of mismatched screws. Whenever something broke, Grandpa fixed it in an afternoon.",
    q:"Why is Grandpa able to fix things quickly?", a:"He saves parts he might need later", w:["He buys new tools often","He asks Ravi for help"] },
];

const VOCAB_3 = [
  { s:"The trail was so ______ that we had to walk single file.", a:"narrow", w:["gigantic","cheerful"] },
  { s:"After the long hike everyone was ______ and ready for dinner.", a:"exhausted", w:["invisible","delighted"] },
  { s:"She gave a ______ answer, so nobody knew what she really meant.", a:"vague", w:["precise","loud"] },
  { s:"The puppy was ______ — it chewed every shoe in the house.", a:"mischievous", w:["obedient","enormous"] },
  { s:"We could barely hear the ______ whisper from across the room.", a:"faint", w:["blazing","sturdy"] },
  { s:"His ______ for dinosaurs meant he read every book in the library.", a:"enthusiasm", w:["hesitation","distance"] },
  { s:"The ______ storm knocked down branches all over the street.", a:"fierce", w:["gentle","curious"] },
  { s:"They had to ______ the recipe because they were out of sugar.", a:"adjust", w:["announce","deliver"] },
];

/* ============================= MATH ============================= */

function mathGrade1(){
  const kinds = ['add','sub','count','compare','missing','story'];
  const k = one(kinds);
  if (k === 'add'){
    const a = 1+rnd(14), b = 1+rnd(20-a);
    return numQ(`${a} + ${b} = ?`, a+b);
  }
  if (k === 'sub'){
    const a = 5+rnd(15), b = 1+rnd(a-1);
    return numQ(`${a} − ${b} = ?`, a-b);
  }
  if (k === 'count'){
    const step = one([2,5,10]), start = step*(1+rnd(6));
    return numQ(`Count by ${step}s: ${start}, ${start+step}, ${start+step*2}, ?`, start+step*3);
  }
  if (k === 'missing'){
    const a = 2+rnd(10), sum = a + 1+rnd(20-a);
    return numQ(`${a} + ? = ${sum}`, sum-a);
  }
  if (k === 'compare'){
    const nums = []; while (nums.length<3){ const n=1+rnd(60); if(!nums.includes(n)) nums.push(n); }
    const big = Math.random()<0.5;
    return { kind:'choice', label:'MATH', prompt: big?'Which is BIGGEST?':'Which is SMALLEST?',
             choices: shuffle(nums.map(String)), answer: String(big?Math.max(...nums):Math.min(...nums)) };
  }
  // story
  const a = 2+rnd(8), b = 1+rnd(8);
  const t = one([
    { s:`Miles found ${a} coins. Then he found ${b} more. How many coins does he have?`, v:a+b },
    { s:`There were ${a+b} birds on a wire. ${b} flew away. How many are left?`, v:a },
    { s:`A pack has ${a} stickers. You get 2 packs. How many stickers?`, v:a*2 },
  ]);
  return numQ(t.s, t.v);
}

function mathGrade3(){
  const kinds = ['mult','div','add3','sub3','fraction','pattern','story','round'];
  const k = one(kinds);
  if (k === 'mult'){ const a=2+rnd(11), b=2+rnd(11); return numQ(`${a} × ${b} = ?`, a*b); }
  if (k === 'div'){ const b=2+rnd(11), q=2+rnd(11); return numQ(`${b*q} ÷ ${b} = ?`, q); }
  if (k === 'add3'){ const a=100+rnd(900), b=100+rnd(900); return numQ(`${a} + ${b} = ?`, a+b); }
  if (k === 'sub3'){ const a=300+rnd(700), b=100+rnd(a-100); return numQ(`${a} − ${b} = ?`, a-b); }
  if (k === 'round'){
    const n = 110+rnd(880), to = one([10,100]);
    return numQ(`Round ${n} to the nearest ${to}.`, Math.round(n/to)*to);
  }
  if (k === 'pattern'){
    const step = one([3,4,6,7,8,9,25,50]), start = step*(1+rnd(5));
    return numQ(`What comes next? ${start}, ${start+step}, ${start+step*2}, ?`, start+step*3);
  }
  if (k === 'fraction'){
    const den = one([2,3,4,5,6,8,10]);
    const num = 1+rnd(den-1);
    const whole = den * (1+rnd(6));
    const kind2 = one(['of','equal','compare']);
    if (kind2 === 'of') return numQ(`What is ${num}/${den} of ${whole}?`, whole/den*num);
    if (kind2 === 'equal'){
      return { kind:'choice', label:'MATH', prompt:`Which fraction equals ${num}/${den}?`,
        choices: shuffle([`${num*2}/${den*2}`, `${num+1}/${den}`, `${num}/${den+1}`]),
        answer:`${num*2}/${den*2}` };
    }
    const d2 = one([2,3,4,5,6,8].filter(d=>d!==den));
    const v1 = num/den, v2 = 1/d2;
    return { kind:'choice', label:'MATH', prompt:`Which is LARGER?`,
      choices: shuffle([`${num}/${den}`, `1/${d2}`]),
      answer: v1>=v2 ? `${num}/${den}` : `1/${d2}` };
  }
  const a = 3+rnd(9), b = 2+rnd(9), c = 2+rnd(20);
  const t = one([
    { s:`A box holds ${a} packs. Each pack has ${b} cards. How many cards in the box?`, v:a*b },
    { s:`${a*b} players split evenly into ${a} squads. How many on each squad?`, v:b },
    { s:`Jackson scored ${c} points. His teammate scored ${a*b}. How many points together?`, v:c+a*b },
    { s:`A game costs $${a*b}. You have $${c}. How much more do you need?`, v: Math.max(0, a*b-c) },
  ]);
  return numQ(t.s, t.v);
}

/* numeric question -> 3 near-miss choices (no typing for either boy: taps are faster) */
function numQ(prompt, answer){
  const opts = new Set([answer]);
  const jitter = [1,-1,2,-2,10,-10,answer>20?5:3,-3];
  while (opts.size < 3){
    const d = one(jitter);
    const v = answer + d;
    if (v >= 0 && v !== answer) opts.add(v);
  }
  return { kind:'choice', label:'MATH', prompt, choices: shuffle([...opts].map(String)), answer: String(answer) };
}

/* ======================= ROUND ASSEMBLY ======================= */

function readingChallenges(grade){
  const sight   = grade === 1 ? SIGHT_1   : SIGHT_3;
  const phonics = grade === 1 ? PHONICS_1 : PHONICS_3;
  const sents   = grade === 1 ? SENT_1    : SENT_3;
  const psg     = grade === 1 ? PASSAGE_1 : PASSAGE_3;
  const out = [];

  pick(sight, 5).forEach(w => out.push({
    kind:'read-word', label:'READ IT OUT LOUD', prompt:w, target:w }));

  pick(phonics.flatMap(g => g.words.map(w => ({ w, set:g.set }))), 4).forEach(p => out.push({
    kind:'read-word', label:'SOUND IT OUT — ' + p.set.toUpperCase(), prompt:p.w, target:p.w, sound:true }));

  pick(sents, 3).forEach(s => out.push({
    kind:'read-sentence', label:'READ THE SENTENCE', prompt:s, target:s }));

  pick(psg, 3).forEach(p => out.push({
    kind:'passage', label:'SUPPLY DROP — READ IT, THEN ANSWER', bonus:true,
    prompt:p.text, target:p.text, question:p.q,
    choices: shuffle([p.a, ...p.w]), answer:p.a }));

  if (grade === 3){
    pick(VOCAB_3, 2).forEach(v => out.push({
      kind:'choice', label:'WHICH WORD FITS?', prompt:v.s.replace('______','_____'),
      choices: shuffle([v.a, ...v.w]), answer:v.a }));
  }
  return out;
}

function mathChallenges(grade, n){
  const gen = grade === 1 ? mathGrade1 : mathGrade3;
  const out = [], seen = new Set();
  let guard = 0;
  while (out.length < n && guard++ < n * 40){
    const q = gen();
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}

/** Build one round. mode: 'reading' | 'math' */
export function buildRound(grade, mode, count){
  const n = count || 15;
  let items;
  if (mode === 'math'){
    items = mathChallenges(grade, n);
    // one bonus passage even in a math run, so reading never fully disappears
    const psg = pick(grade === 1 ? PASSAGE_1 : PASSAGE_3, 1)[0];
    items[Math.floor(n/2)] = { kind:'passage', label:'SUPPLY DROP — READ IT, THEN ANSWER', bonus:true,
      prompt:psg.text, target:psg.text, question:psg.q, choices: shuffle([psg.a, ...psg.w]), answer:psg.a };
  } else {
    const pool = shuffle(readingChallenges(grade));
    items = pool.slice(0, n);
    while (items.length < n) items.push(...mathChallenges(grade, n - items.length));
  }
  // never open on a bonus round — let them warm up first
  if (items[0] && items[0].bonus){
    const swap = items.findIndex(i => !i.bonus);
    if (swap > 0) [items[0], items[swap]] = [items[swap], items[0]];
  }
  return items.slice(0, n);
}

export const _test = { mathGrade1, mathGrade3, numQ, readingChallenges, VOCAB_3, PASSAGE_1, PASSAGE_3 };
