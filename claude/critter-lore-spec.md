# Critter Lore Spec — "Who & What" cards for every collectible

Every critter in the arcade gets a **lore card** shown on its Locker/Collections tile
(tap to flip). The goal: a 1st grader can *feel* who the critter is in five seconds,
a 3rd grader can read the story, and epics/legendaries land like a trading-card pull.

## 1. The card format (what the kid sees)

```
┌──────────────────────────────────────┐
│  🦕  LONGNECK LOU            ● RARE  │   ← nickname + rarity ring
│  Brachiosaurus                       │   ← real name (small caps)
│  "Tallest neck in the whole valley"  │   ← tagline (≤ 8 words, big font)
│                                      │
│  SIZE   ▮▮▮▮▮▮  GIANT                │   ← 6-step pips + word
│  SPEED  ▮▮░░░░  Slow                 │
│  WEIGHT ▮▮▮▮▮▮  Mega                 │
│                                      │
│  LIKES  🌳 treetop leaves · 🌅 sunrise │   ← 2 icons + words, never a sentence
│                                      │
│  Lou eats breakfast from the tops of │   ← story (2–3 short sentences)
│  trees. When he sneezes, leaves rain │
│  down for a whole minute.            │
│                                      │
│  ★ DID YOU KNOW  Real brachiosaurus  │   ← one true fact (optional, off for
│    were as tall as a 4-story house.  │      fantasy/space — replaced by LEGEND)
└──────────────────────────────────────┘
```

**Scales (kid words, 6 steps each, shown as pips so Miles doesn't have to read):**

| Pips | SIZE | SPEED | WEIGHT |
|---|---|---|---|
| 1 | Tiny (fits on a fingertip) | Creeper | Feather |
| 2 | Small (fits in two hands) | Slow | Light |
| 3 | Medium (about dog-size) | Steady | Middle |
| 4 | Big (bigger than a kid) | Quick | Heavy |
| 5 | Huge (bigger than a car) | Zoom | Super Heavy |
| 6 | GIANT (bigger than a house) | LIGHTNING | Mega |

**Rarity voice rules:**
- **Common** — friendly neighbor. Story is warm, a little silly, everyday.
- **Rare** — has a *skill* or a *job*. Story mentions something it's the best at.
- **Epic** — has a **title** (e.g. "Strut King, Lord of the Coop") and a *moment*
  — something dramatic it once did. Card gets a shimmer border; story gets a
  fourth sentence.
- **Legendary** — has a title, a **legend** (an origin myth the other critters
  tell), and a one-line *"The Legend Says…"* block replacing Did-You-Know. Card gets
  animated foil + the whole collection's theme music sting on first reveal.

Data shape to add per sprite (see §10 for the Claude Code prompt):

```js
lore: {
  real: 'Brachiosaurus',          // real animal / thing; fantasy uses species
  tag: 'Tallest neck in the whole valley',
  size: 6, speed: 2, weight: 6,   // 1–6 pips
  likes: ['🌳 treetop leaves', '🌅 sunrise'],
  story: '...',                   // 2–3 sentences (4 for epic/legendary)
  fact: '...',                    // OR legend: '...' for legendaries
  title: '...',                   // epic + legendary only
}
```

---

## 2. 🦖 DINOSAURS — "Dino Dig"

### s72 🥚 Nest Egg — *Dinosaur egg (Maiasaura)* · COMMON
- **Tag:** "Something's tapping in there…"
- **Size 2 · Speed 1 · Weight 2**
- **Likes:** ☀️ warm sand · 🎵 humming
- **Story:** Nest Egg isn't hatched yet, and nobody knows what's inside. If you hold it up to your ear you can hear a tiny *tap tap tap*. It wiggles when you sing.
- **Did you know:** Some dino moms built nests as wide as a trampoline and kept eggs warm with rotting plants.

### s73 🦴 Rattlebones — *Fossil skeleton (Coelophysis)* · COMMON
- **Tag:** "Clatters when he giggles"
- **Size 3 · Speed 4 · Weight 1**
- **Likes:** 🌙 moonlight · 🪘 drumming
- **Story:** Rattlebones is a little dino who is all bones and all fun. He can take his own leg off and use it as a drumstick. He rattles like maracas when he runs.
- **Did you know:** Fossils aren't actually bones anymore — over millions of years the bone turns into stone.

### s74 🐾 Trackway — *Fossil footprints (Theropod)* · COMMON
- **Tag:** "You can't see him, only where he's been"
- **Size 3 · Speed 5 · Weight 1**
- **Likes:** 🏖️ wet mud · 🙈 hide-and-seek
- **Story:** Trackway is the shyest dinosaur ever. Nobody has ever seen him, but his footprints show up everywhere — even on the ceiling. Follow the prints and you might catch a glimpse of a tail.
- **Did you know:** Scientists can tell how fast a dinosaur was running just from how far apart its footprints are.

### s75 🪶 First Feather — *Archaeopteryx* · COMMON
- **Tag:** "Half dino, half bird, all brave"
- **Size 2 · Speed 4 · Weight 1**
- **Likes:** 🌬️ windy days · 🪨 high rocks
- **Story:** First Feather was the first dinosaur to try jumping off a cliff and flapping. She didn't quite fly… but she didn't quite fall either. She's still practicing, and she's getting better every day.
- **Did you know:** Birds ARE dinosaurs! Every pigeon and chicken is a living dino cousin.

### s76 🐢 Ankylosaurus — *Ankylosaurus* · COMMON
- **Tag:** "A tank with a tail-hammer"
- **Size 5 · Speed 1 · Weight 6**
- **Likes:** 🌿 ferns · 😴 naps in the sun
- **Story:** Nothing bothers Ankylosaurus. Not rain, not roars, not even a T-rex — his back is covered in armor plates and his tail ends in a bone club. He mostly uses it to knock fruit out of trees.
- **Did you know:** Even its eyelids had armor.

### s77 🦕 Longneck Lou — *Brachiosaurus* · RARE
- **Tag:** "Tallest neck in the whole valley"
- **Size 6 · Speed 2 · Weight 6**
- **Likes:** 🌳 treetop leaves · 🌅 sunrise
- **Story:** Lou eats breakfast from the tops of trees and can see tomorrow's weather coming. When he sneezes, leaves rain down for a whole minute. Smaller critters ride on his head to get a view.
- **Did you know:** A real brachiosaurus was as tall as a 4-story building.

### s78 🦏 Triceratops — *Triceratops* · RARE
- **Tag:** "Three horns, zero fear"
- **Size 5 · Speed 3 · Weight 6**
- **Likes:** 🛡️ protecting friends · 🥬 tough plants
- **Story:** Triceratops is the bodyguard of the valley. When trouble comes, she lowers her giant frill and the ground shakes. Her favorite thing is scratching her horns on a big rock until it squeaks.
- **Did you know:** Its head was one-third of its whole body length.

### s79 🦎 Velociraptor — *Velociraptor* · RARE
- **Tag:** "Small, fast, and very, very sneaky"
- **Size 3 · Speed 6 · Weight 2**
- **Likes:** 🧩 puzzles · 🚪 doors that open
- **Story:** Velociraptor is the smartest hunter around, and he knows it. He can open latches, solve riddles, and he once stole every sandwich from a picnic without anyone noticing. He's covered in feathers and clicks his big toe claw when he's thinking.
- **Did you know:** Real velociraptors were about the size of a turkey — and had feathers!

### s80 🐊 Spinosaurus — *Spinosaurus* · EPIC — **"The River Dragon"**
- **Tag:** "Bigger than T-rex. Swims like a shark."
- **Size 6 · Speed 4 · Weight 6**
- **Likes:** 🐟 giant fish · 🌊 deep rivers
- **Story:** Spinosaurus is the biggest meat-eating dinosaur that ever lived — and the only one that loved to swim. The tall sail on his back cuts through the water like a shark fin. Once, a whole herd came to the river to drink and saw the sail rising up out of the dark water. Nobody drank from that river for a week.
- **Did you know:** Spinosaurus was longer than a school bus and had a paddle tail like a crocodile.

### s51 🦖 Rex Prime — *Tyrannosaurus rex* · LEGENDARY — **"King of the Thunder Lizards"**
- **Tag:** "When he roars, the clouds move"
- **Size 6 · Speed 4 · Weight 6**
- **Likes:** 🌩️ thunderstorms · 👑 being first
- **Story:** Every dinosaur knows the rule: when Rex Prime walks, you step aside. His teeth are as long as bananas and his roar can be heard three valleys away. But here's the secret only his friends know — he can't reach to scratch his own nose, and he loves it when someone helps.
- **The Legend Says:** Rex Prime was the last dino awake when the great fire fell from the sky, and he roared at it so loudly that one piece of the sky got scared and turned into the moon.

---

## 3. 🚜 FARM — "Barnyard Buddies"

### s4 🐷 Porkchop — *Pig* · COMMON
- **Tag:** "Happiest when muddiest"
- **Size 3 · Speed 3 · Weight 4**
- **Likes:** 🟤 mud puddles · 🍎 apple cores
- **Story:** Porkchop believes every puddle is a swimming pool. He's really smart — he learned to open the gate, but he always closes it behind him because he's polite. He snorts when he laughs.
- **Did you know:** Pigs are smarter than dogs and can learn their own names.

### s5 🐮 Moo Merc — *Dairy cow* · COMMON
- **Tag:** "Chews slow, thinks deep"
- **Size 4 · Speed 2 · Weight 5**
- **Likes:** 🌾 tall grass · 🌄 sunsets
- **Story:** Moo Merc is the calmest critter on the farm. She chews one mouthful of grass for a whole minute while she thinks about clouds. If you tell her a secret, she keeps it forever.
- **Did you know:** Cows have best friends and get stressed when they're apart.

### s6 🐔 Cluck Norris — *Rooster* · COMMON
- **Tag:** "Wakes up the sun every morning"
- **Size 2 · Speed 4 · Weight 2**
- **Likes:** 🌅 dawn · 🥇 being loudest
- **Story:** Cluck Norris is sure the sun only rises because he tells it to. Every morning he climbs the fence post, puffs up his chest, and lets out a COCK-A-DOODLE-DOO that rattles the windows. He's also a surprisingly good dancer.
- **Did you know:** Chickens can remember over 100 different faces.

### s7 🐰 Thumper — *Rabbit* · COMMON
- **Tag:** "Three hops and gone"
- **Size 2 · Speed 5 · Weight 1**
- **Likes:** 🥕 carrot tops · 🕳️ cozy burrows
- **Story:** Thumper thumps her back foot when she's excited, which is always. She can hop higher than the fence and zigzag faster than a fox can follow. Her ears hear you coming from a whole field away.
- **Did you know:** Rabbits can see almost all the way behind themselves without turning their heads.

### s81 🐴 Clover — *Farm horse* · COMMON
- **Tag:** "Strong enough to pull the barn"
- **Size 4 · Speed 4 · Weight 5**
- **Likes:** 🍬 sugar cubes · 🏃 running in the rain
- **Story:** Clover is big and gentle and loves to work. She pulls the hay wagon, the plow, and once, a stuck tractor. She nickers softly when you scratch right between her ears.
- **Did you know:** Horses can sleep standing up.

### s82 🐑 Woolbert — *Sheep* · RARE
- **Tag:** "Softest cloud on four legs"
- **Size 3 · Speed 2 · Weight 3**
- **Likes:** 🧶 being fluffy · ⛰️ hilltops
- **Story:** Woolbert's wool grows so thick that birds nest in it in the spring. He's the farm's weather expert — when Woolbert lies down, rain is coming. Every summer he gets a haircut and feels silly for a week.
- **Did you know:** One sheep can grow enough wool in a year to make five sweaters.

### s83 🐐 Ramjam — *Goat* · RARE
- **Tag:** "Climbs anything. Eats everything."
- **Size 3 · Speed 4 · Weight 3**
- **Likes:** 🧗 roofs · 📦 cardboard
- **Story:** Ramjam has been found on top of the barn, the tractor, and once the farmer's car. If it's standing still, he'll climb it. He head-butts the gate every morning just to say hello.
- **Did you know:** Goats have rectangle-shaped pupils so they can see almost all around them.

### s84 🐈 Mouser — *Barn cat* · RARE
- **Tag:** "Night guard of the hayloft"
- **Size 2 · Speed 5 · Weight 2**
- **Likes:** 🌙 midnight patrols · ☀️ sunny windowsills
- **Story:** Mouser works the night shift. While everyone sleeps she patrols the barn, silent as a shadow, and no mouse ever gets the grain. By day she sleeps in a sunbeam and pretends she doesn't know you.
- **Did you know:** Cats can jump six times their own height.

### s85 🦃 Strut King — *Wild turkey* · EPIC — **"Lord of the Coop"**
- **Tag:** "All feathers, all fanned, all the time"
- **Size 3 · Speed 3 · Weight 3**
- **Likes:** 🪞 his reflection · 🥁 parades
- **Story:** Strut King doesn't walk — he *parades*. Every feather fans out, his chest puffs up, and he gobbles so loud the chickens scatter. Once a fox came into the yard and Strut King marched straight at it, feathers blazing, until the fox decided the chicken coop wasn't worth it. He's been in charge ever since.
- **Did you know:** Wild turkeys can fly 55 miles per hour in short bursts.

### s86 🦙 Llamarama — *Llama* · LEGENDARY — **"The Spitting Sage of the Hill"**
- **Tag:** "Sees all. Spits at some."
- **Size 4 · Speed 3 · Weight 4**
- **Likes:** 🏔️ high places · 🧘 staring calmly
- **Story:** Llamarama stands on the tallest hill and watches the whole farm with an expression that says she knows something you don't. Every animal comes to her for advice. She hums when she's happy and spits when she's not — and her aim is perfect.
- **The Legend Says:** Long ago the farm had no hill. Llamarama wanted a better view, so she stood in one spot for a hundred years until the ground grew up underneath her.

---

## 4. 🐞 BUGS — "Bug Brigade"

### s22 🐜 Tiny Titan — *Leafcutter ant* · COMMON
- **Tag:** "Lifts 50 times her weight"
- **Size 1 · Speed 3 · Weight 1**
- **Likes:** 🍃 leaf pieces · 👯 teamwork
- **Story:** Tiny Titan is the strongest critter in the arcade for her size. She carries leaf slices bigger than herself in a line with a thousand sisters. She never, ever gives up on a heavy load.
- **Did you know:** Ants don't have lungs — they breathe through tiny holes in their sides.

### s23 🕷️ Web Slinger — *Orb-weaver spider* · COMMON
- **Tag:** "Builds a new house every night"
- **Size 1 · Speed 3 · Weight 1**
- **Likes:** 💧 dewdrops · 🌙 building at night
- **Story:** Web Slinger is an artist. Every night she spins a brand-new web, each one a perfect circle, and every morning it sparkles with dew. She eats the old one for breakfast so nothing goes to waste.
- **Did you know:** Spider silk is stronger than steel of the same thickness.

### s20 🐌 Slow Mo — *Garden snail* · COMMON
- **Tag:** "Never late, just on snail time"
- **Size 1 · Speed 1 · Weight 1**
- **Likes:** 🌧️ rain · 🥬 lettuce
- **Story:** Slow Mo carries his house on his back so he's always home. He moves so slowly that a race against him takes all afternoon — but he always finishes. He leaves a shiny trail so he never gets lost.
- **Did you know:** A snail can sleep for three years.

### s87 🐝 Buzz Cut — *Honeybee* · COMMON
- **Tag:** "Busy, buzzy, full of honey"
- **Size 1 · Speed 4 · Weight 1**
- **Likes:** 🌻 sunflowers · 💃 dancing
- **Story:** Buzz Cut visits a thousand flowers a day and tells her hive where the best ones are by doing a wiggle dance. Her legs get so covered in yellow pollen she looks like she's wearing fuzzy pants.
- **Did you know:** Bees dance in a figure-8 to give directions to other bees.

### s88 🐛 Inchy — *Inchworm* · COMMON
- **Tag:** "Measuring the whole world, one inch at a time"
- **Size 1 · Speed 1 · Weight 1**
- **Likes:** 📏 measuring things · 🌿 green leaves
- **Story:** Inchy walks by making a loop with his back and then stretching out — loop, stretch, loop, stretch. He is measuring everything. He's measured three leaves, a fence, and once, a sleeping cat.
- **Did you know:** Inchworms turn into moths.

### s89 🐞 Dot Matrix — *Seven-spot ladybug* · RARE
- **Tag:** "Seven spots, all lucky"
- **Size 1 · Speed 3 · Weight 1**
- **Likes:** 🍀 luck · 🌹 rose bushes
- **Story:** Dot Matrix has exactly seven spots and says each one is a different kind of luck. Land on your hand? Good luck tomorrow. Land on your nose? Extra good luck. She protects the garden by eating the tiny bugs that chew the roses.
- **Did you know:** A ladybug can eat 5,000 aphids in its life.

### s90 🦋 Flutter Byte — *Monarch butterfly* · RARE
- **Tag:** "Flew 2,000 miles. Not tired."
- **Size 2 · Speed 4 · Weight 1**
- **Likes:** 🌸 milkweed · 🧭 long journeys
- **Story:** Flutter Byte started life as a striped caterpillar, went into a green sleeping bag, and came out with orange wings. Then she flew across a whole country to a forest she'd never seen. She never needed a map.
- **Did you know:** Monarchs fly to the same Mexican forests their great-great-grandparents flew to.

### s35 🦂 Sting Ray — *Desert scorpion* · RARE
- **Tag:** "Glows in the dark. Seriously."
- **Size 2 · Speed 3 · Weight 1**
- **Likes:** 🌵 desert nights · 🔦 blacklights
- **Story:** Sting Ray hides under rocks all day and comes out at night, and here's the wild part — under moonlight he glows blue-green. He raises his tail when he's nervous but he's never stung a friend.
- **Did you know:** All scorpions glow under UV light, and nobody knows why.

### s91 🦟 Sky Skimmer — *Emperor dragonfly* · EPIC — **"The Pond Pilot"**
- **Tag:** "Flies backward. Catches everything."
- **Size 2 · Speed 6 · Weight 1**
- **Likes:** 🪷 lily pads · 🎯 never missing
- **Story:** Sky Skimmer is the best flyer that has ever lived. He can hover, zoom, turn in midair, and fly *backward*, and when he hunts he catches his target 95 times out of 100. His giant eyes see in every direction at once. The story goes that a bird once tried to chase him over the pond — and Sky Skimmer flew circles around it until it got dizzy and had to land.
- **Did you know:** Dragonflies have been around since before the dinosaurs — and some were as big as hawks.

### s92 🦗 Mantis Monk — *Praying mantis* · LEGENDARY — **"Master of the Still Garden"**
- **Tag:** "Stands still for hours. Strikes in a blink."
- **Size 2 · Speed 5 · Weight 1**
- **Likes:** 🧘 patience · 🍃 blending in
- **Story:** Mantis Monk is so still you'd think he was a leaf. Bugs walk right past him for hours. Then, faster than you can blink, he strikes — and sits back down like nothing happened. He turns his head to look at you, which no other bug can do, and it's a little bit spooky and a lot bit cool.
- **The Legend Says:** Mantis Monk once stood so still through a whole winter that the snow built a tiny temple around him. When spring came he stepped out, bowed, and that's how he got his name.

---

## 5. 🌊 SEA — "Deep Blue"

### s19 🐧 Chill Pip — *Emperor penguin* · COMMON
- **Tag:** "Belly-slides everywhere"
- **Size 3 · Speed 3 · Weight 3**
- **Likes:** 🧊 ice slides · 🐟 fish snacks
- **Story:** Chill Pip waddles on land and flies underwater. Why walk when you can flop on your belly and slide? He huddles with his friends in a big penguin pile when it's cold, and takes turns being in the warm middle.
- **Did you know:** Penguin dads hold the egg on their feet for two months without eating.

### s3 🐢 Tank Shell — *Sea turtle* · COMMON
- **Tag:** "Slow on sand, smooth in the sea"
- **Size 3 · Speed 2 · Weight 4**
- **Likes:** 🪼 jellyfish · 🏝️ the beach she was born on
- **Story:** Tank Shell has been swimming the ocean for longer than your grandparents have been alive. She flies through the water with her flippers like wings. Every few years she swims all the way back to the exact beach where she hatched.
- **Did you know:** Sea turtles can hold their breath for hours.

### s93 🐟 Finn — *Clownfish* · COMMON
- **Tag:** "Small fish, big attitude"
- **Size 1 · Speed 3 · Weight 1**
- **Likes:** 🪸 his anemone · 🧹 keeping it clean
- **Story:** Finn lives inside a stinging anemone that would zap any other fish — but not him. He's covered in a special slime that keeps him safe. He guards his little home like it's a castle.
- **Did you know:** Clownfish are born boys, and the biggest one in the group turns into a girl.

### s94 🦐 Pop Shrimp — *Pistol shrimp* · COMMON
- **Tag:** "Loudest animal in the ocean"
- **Size 1 · Speed 3 · Weight 1**
- **Likes:** 💥 loud snaps · 🏠 his burrow
- **Story:** Pop Shrimp is the size of your pinky but has a claw that snaps so hard it makes a bubble — and a BANG louder than a firecracker. He uses it to stun his dinner. Divers can hear him popping from far away.
- **Did you know:** The snap is so fast it makes a flash of light for a split second.

### s95 🐡 Puffball — *Porcupinefish* · COMMON
- **Tag:** "Don't scare him. Too late."
- **Size 2 · Speed 2 · Weight 2**
- **Likes:** 🫧 bubbles · 🧘 calm water
- **Story:** Puffball is a small, slow, round fish — until something startles him. Then he gulps water and swells up into a spiky balloon three times his size. Afterward he's a little embarrassed and has to let all the air out.
- **Did you know:** Puffing up is so tiring that they can only do it a few times a day.

### s32 🐬 Splash Dart — *Bottlenose dolphin* · RARE
- **Tag:** "Jumps for the fun of it"
- **Size 4 · Speed 5 · Weight 4**
- **Likes:** 🌊 boat waves · 🎶 clicking songs
- **Story:** Splash Dart can't stop playing. She surfs on the waves behind boats, leaps into the air for no reason, and blows bubble rings to swim through. She talks with clicks and whistles, and every dolphin has its own name-whistle.
- **Did you know:** Dolphins sleep with one half of their brain at a time.

### s33 🦈 Chomp Zone — *Great white shark* · RARE
- **Tag:** "Smells one drop in a swimming pool"
- **Size 5 · Speed 5 · Weight 5**
- **Likes:** 🌊 open ocean · 😬 showing teeth
- **Story:** Chomp Zone has 300 teeth in rows, and when one falls out, another moves forward. He's always smiling — it's just how his face works. He cruises the deep blue and can smell a snack from a mile away.
- **Did you know:** Sharks have been around longer than trees.

### s34 🐙 Ink Ops — *Common octopus* · RARE
- **Tag:** "Eight arms, three hearts, zero bones"
- **Size 3 · Speed 3 · Weight 2**
- **Likes:** 🫙 jars with lids · 🎭 disguises
- **Story:** Ink Ops can change color to match anything — rock, sand, or seaweed — and squeeze through a hole the size of a coin. She opens jars, solves mazes, and sprays a cloud of ink to escape. Nobody keeps her in a tank for long.
- **Did you know:** Each octopus arm has its own little brain.

### s96 🦑 Deep Ink — *Giant squid* · EPIC — **"Eyes of the Midnight Zone"**
- **Tag:** "Eyes as big as dinner plates"
- **Size 6 · Speed 4 · Weight 5**
- **Likes:** 🌑 total darkness · 🤫 mystery
- **Story:** Deep Ink lives so far down that sunlight never reaches her. Her eyes are the biggest in the animal world, and they glow faintly in the black. For hundreds of years sailors told stories about her but no one had ever seen her alive. Then one day a camera went down into the dark — and two giant eyes looked back.
- **Did you know:** The giant squid wasn't filmed alive until 2012.

### s97 🐋 Tidal King — *Blue whale* · LEGENDARY — **"The Biggest Heart in the World"**
- **Tag:** "The largest animal that has ever lived"
- **Size 6 · Speed 3 · Weight 6**
- **Likes:** 🦐 krill clouds · 🎵 deep songs
- **Story:** Tidal King is bigger than any dinosaur that ever walked. His heart is the size of a car and his tongue weighs as much as an elephant. He sings songs so low and so loud that other whales hear them from across the ocean. When he surfaces, his breath shoots up three stories high.
- **The Legend Says:** The tides used to stay still. Then Tidal King was born, and every time he rolls over in his sleep the whole ocean sloshes — and that's why the sea comes in and out every day.

---

## 6. 🦄 FANTASY — "Make-Believe"

*(No "Did you know" for fantasy — every card uses a "Legend Says" line instead, even commons, because the whole set is myth.)*

### s98 🦄 Shimmer-Horn — *Unicorn foal* · COMMON
- **Tag:** "Her horn is still growing in"
- **Size 3 · Speed 4 · Weight 3**
- **Likes:** 🌈 rainbows after rain · 🍓 wild berries
- **Story:** Shimmer-Horn is a baby unicorn whose horn is only as long as your thumb so far. It sparkles when she's happy and goes dim when she's sleepy. She leaves tiny glittering hoofprints that fade by morning.
- **Legend Says:** When her horn is fully grown, she'll be able to make one wish come true — and she's saving it.

### s99 🗿 Pebble-Gargoyle — *Stone gargoyle* · COMMON
- **Tag:** "Statue by day, guard by night"
- **Size 2 · Speed 2 · Weight 5**
- **Likes:** 🌧️ rain on his head · 🏰 rooftops
- **Story:** Pebble-Gargoyle sits perfectly still on the castle roof all day, and everyone thinks he's a statue. At night he stretches, cracks his stone knuckles, and keeps watch. He's heavy as a boulder but his wings can still carry him.
- **Legend Says:** He's never once fallen asleep on watch in 900 years — though he has yawned twice.

### s100 🧚 Whisper-Sprite — *Pixie* · COMMON
- **Tag:** "Mischief, but the nice kind"
- **Size 1 · Speed 5 · Weight 1**
- **Likes:** 🧦 hiding socks · 🍯 honey drops
- **Story:** Whisper-Sprite is the reason your sock goes missing and then turns up somewhere silly. She's the size of a thumb, glows like a firefly, and giggles in a voice only dogs and kids can hear. She always gives things back. Eventually.
- **Legend Says:** If you leave a drop of honey on the windowsill, she'll do a tiny chore for you while you sleep.

### s101 🦅 Cinder-Griffin — *Griffin cub* · COMMON
- **Tag:** "Eagle up front, lion in back"
- **Size 3 · Speed 4 · Weight 3**
- **Likes:** ✨ shiny things · 🪶 preening
- **Story:** Cinder-Griffin has the head and wings of an eagle and the body of a lion cub. He can't quite fly yet — he gets about three feet up and then tumbles into a fluffy heap. He collects shiny buttons and sorts them by color.
- **Legend Says:** Griffins guard treasure, and Cinder has already decided his friends are his treasure.

### s102 🐴 Frost-Pegasus — *Winged horse* · COMMON
- **Tag:** "Leaves snowflakes where she gallops"
- **Size 4 · Speed 5 · Weight 3**
- **Likes:** ❄️ first snow · ☁️ cloud-jumping
- **Story:** Frost-Pegasus gallops across the sky with wings made of frost. Wherever her hooves touch a cloud, it snows a little bit underneath. On the first snowy day of winter, that's her doing a victory lap.
- **Legend Says:** She's the reason snow days happen.

### s103 🔮 Crystal-Golem — *Crystal golem* · RARE
- **Tag:** "Made of gems. Powered by friendship."
- **Size 5 · Speed 1 · Weight 6**
- **Likes:** 🌞 sunlight through his body · 🧩 being useful
- **Story:** Crystal-Golem is a giant built of purple crystal, and when the sun shines through him, rainbows land everywhere. He's slow, he's heavy, and he's strong enough to lift a house. He only moves when someone needs help — then nothing can stop him.
- **Legend Says:** A lonely wizard built him for company, and the first word he ever said was "friend."

### s104 🐉 Cloud-Wyrm — *Sky serpent* · RARE
- **Tag:** "A dragon with no wings and no need for them"
- **Size 6 · Speed 4 · Weight 2**
- **Likes:** 🌤️ swimming through clouds · ⛈️ thunder
- **Story:** Cloud-Wyrm is a long, long dragon who swims through the sky like a ribbon. She has no wings — she just *goes*. On stormy days you might see her whole body flash when lightning goes through the clouds. She's the one who makes them rumble.
- **Legend Says:** Every thunderclap is Cloud-Wyrm laughing at a joke.

### s105 🔥 Nova-Phoenix — *Phoenix* · RARE
- **Tag:** "Burns out. Comes back. Every time."
- **Size 3 · Speed 5 · Weight 1**
- **Likes:** 🌅 sunrise · 🔥 bonfires
- **Story:** Nova-Phoenix is a bird made of living fire. Once every hundred years she gets old, bursts into flames, and turns to ash — and then a brand-new baby phoenix pops out of the ash, bright as ever. Her feathers are warm to the touch but never burn a friend.
- **Legend Says:** A single one of her tears can heal any hurt.

### s106 🐋 Aurora-Leviathan — *Sky leviathan* · EPIC — **"The Light Behind the Stars"**
- **Tag:** "A whale made of northern lights"
- **Size 6 · Speed 3 · Weight 1**
- **Likes:** 🌌 polar nights · 🎵 silent songs
- **Story:** Aurora-Leviathan is a whale the size of a mountain, made of shimmering green and purple light. She swims through the night sky far, far to the north, and the glow you see on the horizon is her passing by. She weighs nothing at all — you could put your hand right through her. Once, a lost explorer followed her light for three nights and she led him all the way home.
- **Legend Says:** The northern lights are her tail, and when they ripple, she's waving.

### s107 🐲 Chrono-Dragon — *Time dragon* · LEGENDARY — **"Keeper of Every Tomorrow"**
- **Tag:** "Older than time. Knows how it ends."
- **Size 6 · Speed 6 · Weight 6**
- **Likes:** ⏳ hourglasses · 🕰️ the sound of ticking
- **Story:** Chrono-Dragon's scales are clock faces, and every one shows a different time. He can slow down a moment so it lasts all day, or skip a boring afternoon in a blink. His wings are so wide they have their own weather. When he breathes, it's not fire — it's a swirl of yesterdays and tomorrows.
- **The Legend Says:** Chrono-Dragon was there before the first sunrise, and he'll be there after the last one. He already knows your whole story, and he says it's a good one.

---

## 7. 🛸 SPACE INVASION — "Star Squad"

*(Space uses "Did you know" space facts for the real-astronomy critters and "Mission Log" for the alien ones.)*

### s108 🛸 Hover Bob — *Scout saucer* · COMMON
- **Tag:** "Beep boop, just looking around"
- **Size 2 · Speed 4 · Weight 2**
- **Likes:** 🌽 corn fields · 📸 taking pictures
- **Story:** Hover Bob is a tiny flying saucer that came to Earth to take pictures and got distracted by everything. He hovers over your yard going *bweep bweep* and flashing his lights. He's not invading — he just thinks you're interesting.
- **Mission Log:** "Day 212. The Earth creatures have something called 'pizza.' Investigating."

### s109 🪐 Hoops — *Ringed planet* · COMMON
- **Tag:** "Rings so wide you could drive on them"
- **Size 6 · Speed 2 · Weight 1**
- **Likes:** 🧊 ice chunks · 🎠 spinning
- **Story:** Hoops is a gas planet with the prettiest rings in the galaxy, made of billions of ice chunks, some as small as a snowflake and some as big as a school. He's enormous but so light that if you had a big enough bathtub, he'd float.
- **Did you know:** Saturn is the only planet that would float in water.

### s110 ☄️ Skyscratch — *Comet* · COMMON
- **Tag:** "A dirty snowball with a tail of fire"
- **Size 3 · Speed 6 · Weight 2**
- **Likes:** ☀️ zooming past the sun · 🎇 showing off
- **Story:** Skyscratch is a chunk of ice and rock that's been flying around the sun for millions of years. Every time he gets close, the sun melts a little of him into a glowing tail millions of miles long. Then he zooms back out to the dark for a while to cool off.
- **Did you know:** Halley's Comet comes back every 76 years. You might see it in 2061!

### s111 🌙 Moonbeam — *The Moon* · COMMON
- **Tag:** "Earth's best friend, always orbiting"
- **Size 6 · Speed 3 · Weight 6**
- **Likes:** 🌊 pulling the tides · 👣 footprints
- **Story:** Moonbeam has followed Earth around for four billion years and never gets bored. She changes shape every night — sliver, half, full, and back again — but she's always the same moon. She keeps twelve sets of astronaut footprints perfectly safe, because there's no wind to blow them away.
- **Did you know:** The moon is slowly drifting away from Earth — about as fast as your fingernails grow.

### s112 🛰️ Blip — *Satellite* · COMMON
- **Tag:** "Goes around the world every 90 minutes"
- **Size 3 · Speed 6 · Weight 3**
- **Likes:** 📡 sending messages · 🌍 watching weather
- **Story:** Blip zips around Earth 16 times a day, bouncing messages, maps, and weather pictures down to everyone. He's the reason the TV works and the car knows where to go. At night, if you look up, you might see him as a tiny moving star.
- **Did you know:** There are over 10,000 satellites around Earth right now.

### s113 👾 Pixel Pest — *Glitch alien* · RARE
- **Tag:** "Came out of an old video game"
- **Size 2 · Speed 4 · Weight 1**
- **Likes:** 🕹️ arcade machines · 🔊 8-bit sounds
- **Story:** Pixel Pest is made of squares and moves in little jumps — left, left, down, right. He escaped from an old arcade game and now he hops between screens, showing up in the corner when you least expect it. He goes *pew pew* but it never actually does anything.
- **Mission Log:** "Level 1 cleared. Level 2 cleared. Level 3… where is Level 3? Have been looking for 40 years."

### s114 🚀 Blastoff — *Rocket* · RARE
- **Tag:** "Three, two, one… GONE"
- **Size 5 · Speed 6 · Weight 5**
- **Likes:** 🔟 countdowns · 🔥 big launches
- **Story:** Blastoff spends most of his time standing very still on the launch pad. Then the countdown starts and he starts to shake with excitement. At zero he roars off the ground with a flame longer than a football field and is gone into the sky in under two minutes.
- **Did you know:** A rocket has to go 17,500 miles per hour to stay in orbit.

### s115 🌌 Nebula — *Star nursery* · RARE
- **Tag:** "Where baby stars are born"
- **Size 6 · Speed 1 · Weight 1**
- **Likes:** ⭐ new stars · 🎨 glowing colors
- **Story:** Nebula is a giant cloud of glowing gas and dust, bigger than a thousand solar systems, painted in pink and blue and gold. Deep inside her, gas squishes together until — *pop* — a brand-new star lights up. She's made thousands. Every star you see started in a cloud like her.
- **Did you know:** The Pillars of Creation nebula is 7,000 light-years away — the light you see left it before the pyramids were built.

### s42 👽 Zeta Ray — *Zeta-class alien* · EPIC — **"Captain of the Invasion (Sort Of)"**
- **Tag:** "Here to conquer Earth. Got distracted."
- **Size 3 · Speed 4 · Weight 2**
- **Likes:** 🐶 Earth dogs · 🍦 ice cream
- **Story:** Zeta Ray is the captain of the whole space invasion. She has a ray gun, a shiny ship, and a plan to take over Earth. The problem is, every time she lands she meets a dog, or finds a playground, or tries ice cream, and forgets the plan. The invasion has been "starting tomorrow" for eleven years.
- **Mission Log:** "Earth conquest postponed. Found a creature called 'golden retriever.' Must study further."

### s71 🌟 Twinkle the Star Sprite — *Newborn star* · LEGENDARY — **"The Youngest Light in the Sky"**
- **Tag:** "The first star you see tonight"
- **Size 6 · Speed 3 · Weight 6**
- **Likes:** 🌃 being wished on · 😴 bedtime stories
- **Story:** Twinkle is a real, actual star — but a baby one, only a few million years old, which is a toddler for a star. She's the first star to come out every evening and she *loves* being wished on. She's so far away that her light takes years to reach you, so when you see her, you're seeing a little bit of the past.
- **The Legend Says:** Every wish made on Twinkle gets stored in her light. One day, when she's all grown up, she'll shine them all back down at once.

---

## 8. 🌴 JUNGLE — "Jungle Canopy"

### s17 🐒 Banana Split — *Capuchin monkey* · COMMON
- **Tag:** "Loud, fast, and sticky-fingered"
- **Size 2 · Speed 5 · Weight 2**
- **Likes:** 🍌 obviously · 🪨 cracking nuts with rocks
- **Story:** Banana Split never sits still. He swings by his tail, steals hats, and chatters like he's telling the best joke in the world. He's smart enough to use a rock as a hammer, which he mostly uses to open snacks.
- **Did you know:** Capuchins have been using stone tools for at least 3,000 years.

### s12 🦥 Slow Clap — *Three-toed sloth* · COMMON
- **Tag:** "Takes a whole day to cross one tree"
- **Size 3 · Speed 1 · Weight 2**
- **Likes:** 🌿 hanging upside down · 😴 22-hour naps
- **Story:** Slow Clap moves so slowly that moss grows on his fur, which is great because it makes him green and hard to spot. He always looks like he's smiling. He comes down from his tree once a week, and it's a big deal.
- **Did you know:** Sloths are surprisingly good swimmers — three times faster in water than on land.

### s2 🐸 Hopper Jax — *Red-eyed tree frog* · COMMON
- **Tag:** "Sticky toes, big red eyes"
- **Size 1 · Speed 4 · Weight 1**
- **Likes:** 🌧️ rainy nights · 🍃 shiny wet leaves
- **Story:** Hopper Jax sleeps all day with his big red eyes closed so he looks like a plain green leaf. Then at night — BOING — he pops them open to scare anything sneaking up, and leaps away on sticky toes. He sings a *chack chack* song when it rains.
- **Did you know:** Frogs drink water through their skin — they don't need to sip.

### s21 🦎 Gecko Zap — *Day gecko* · COMMON
- **Tag:** "Walks on the ceiling like it's nothing"
- **Size 1 · Speed 5 · Weight 1**
- **Likes:** 🪟 warm glass · 🦟 snack bugs
- **Story:** Gecko Zap has millions of tiny hairs on his toes that let him stick to anything, even glass, even upside down. He licks his own eyeballs clean because he has no eyelids. If something grabs his tail, it pops off — and he grows a new one.
- **Did you know:** A gecko could hang from the ceiling by one toe.

### s116 🦜 Skwak — *Scarlet macaw* · COMMON
- **Tag:** "Says every word she hears. Loudly."
- **Size 3 · Speed 4 · Weight 2**
- **Likes:** 🥜 nuts · 🗣️ copying voices
- **Story:** Skwak is a rainbow with a beak. She can crack a nut that you'd need a hammer for, and she repeats everything she hears — the phone, the doorbell, your mom calling you for dinner. She's learned 60 words, and "SKWAK" is still her favorite.
- **Did you know:** Macaws can live to be 80 years old.

### s25 🐯 Stripe Storm — *Bengal tiger* · RARE
- **Tag:** "No two tigers have the same stripes"
- **Size 4 · Speed 5 · Weight 5**
- **Likes:** 🏊 swimming · 🤫 sneaking
- **Story:** Stripe Storm is the biggest cat in the world, and unlike most cats, she loves the water. She moves through the tall grass so quietly you'd never know she was there until she wanted you to. Her stripes go all the way down to her skin.
- **Did you know:** A tiger's roar can be heard two miles away.

### s39 🦚 Fan Feather — *Indian peacock* · RARE
- **Tag:** "A hundred eyes on his tail"
- **Size 3 · Speed 3 · Weight 2**
- **Likes:** 🪞 being admired · 🌧️ dancing in the rain
- **Story:** Fan Feather's tail is taller than you and covered in feathers that look like shining blue-green eyes. When he's feeling fancy, he spreads it all out and shakes it so it rattles. He can fly, but he mostly prefers to be looked at.
- **Did you know:** Peacock feathers aren't really colored — their shape bends light to make the colors.

### s117 🐍 Noodle — *Emerald tree boa* · RARE
- **Tag:** "Hangs in a loop and waits"
- **Size 4 · Speed 2 · Weight 3**
- **Likes:** 🌿 green branches · 🔥 warm spots
- **Story:** Noodle is bright green and coils herself over a branch in a neat pile, head resting in the middle, and waits. And waits. She can feel heat with her face, so even in the dark she knows where everything is. She's never in a hurry.
- **Did you know:** Snakes smell with their tongues.

### s118 🦍 Thunder Chest — *Mountain gorilla* · EPIC — **"Gentle Giant of the Mist"**
- **Tag:** "Strongest in the jungle. Gentlest too."
- **Size 5 · Speed 3 · Weight 6**
- **Likes:** 🎋 bamboo shoots · 👶 babysitting
- **Story:** Thunder Chest is ten times stronger than the strongest person you know. When he stands up and beats his chest, it booms through the whole forest and every animal goes quiet. But he spends his days eating leaves, napping in the mist, and letting the babies climb all over him. Once a leopard came too close to the little ones, and Thunder Chest just stood up — and that was enough.
- **Did you know:** Gorillas share 98% of their DNA with humans, and each has a unique nose print.

### s50 🐉 Scaldrake — *Jungle dragon* · LEGENDARY — **"The Volcano's Heartbeat"**
- **Tag:** "Sleeps inside the mountain. Breathes out the fog."
- **Size 6 · Speed 5 · Weight 6**
- **Likes:** 🌋 lava pools · 🌫️ morning mist
- **Story:** Deep in the jungle there's a mountain that's always smoking. That's not a volcano — that's Scaldrake, breathing in his sleep. His scales are the color of cooling lava and his wings, when he finally stretches them, block out the sun. The animals leave fruit at the mountain's foot every morning. He's never once asked them to.
- **The Legend Says:** The jungle used to be a desert. Scaldrake breathed out the first fog, and from the fog came the rain, and from the rain came every green thing.

---

## 9. 🦁 SAFARI — "Savanna Sun"

### s15 🐗 Tusker — *Warthog* · COMMON
- **Tag:** "Not pretty. Doesn't care."
- **Size 3 · Speed 4 · Weight 4**
- **Likes:** 🟤 mud baths · 🏃 running with tail up
- **Story:** Tusker has a bumpy face, big curved tusks, and a tail that sticks straight up like a flag when he runs. He kneels down on his front knees to eat grass. He knows he's not the handsomest on the savanna and he's completely fine with it.
- **Did you know:** Warthogs back into their burrows so they can charge straight out at danger.

### s119 🦓 Zig Zag — *Plains zebra* · COMMON
- **Tag:** "Is he white with black stripes or…?"
- **Size 4 · Speed 5 · Weight 4**
- **Likes:** 🌾 grasslands · 👯 the herd
- **Story:** Zig Zag's stripes are like a fingerprint — no other zebra has the same ones. When the whole herd runs together, the stripes blur and lions can't tell where one zebra ends and the next begins. He barks, which surprises people.
- **Did you know:** Zebras are black with white stripes — their skin underneath is dark.

### s120 🦛 Mud Bud — *Hippopotamus* · COMMON
- **Tag:** "Looks sleepy. Runs faster than you."
- **Size 5 · Speed 4 · Weight 6**
- **Likes:** 🌊 rivers · 🌙 night grazing
- **Story:** Mud Bud spends all day in the river with just his eyes and nose sticking out, yawning a yawn that could swallow a watermelon. Don't let the sleepy look fool you — on land he can outrun a person. His sweat is pink and works like sunscreen.
- **Did you know:** Hippos can't swim — they walk and bounce along the river bottom.

### s121 🐪 Humphrey — *Dromedary camel* · COMMON
- **Tag:** "Hasn't had a drink in a week. Feels great."
- **Size 4 · Speed 3 · Weight 5**
- **Likes:** 🏜️ long walks · 🌵 thorny snacks
- **Story:** Humphrey's hump isn't full of water — it's full of fat, which is his lunchbox for long trips. He has three eyelids and can close his nose to keep sand out. When he finally finds water, he can drink 30 gallons in ten minutes.
- **Did you know:** Camel eyelashes are so long and thick they work like goggles in a sandstorm.

### s122 🦏 Iron Horn — *Black rhinoceros* · COMMON
- **Tag:** "Can't see well. Charges anyway."
- **Size 5 · Speed 4 · Weight 6**
- **Likes:** 🪨 scratching on rocks · 🐦 the birds on her back
- **Story:** Iron Horn is built like a truck and has skin so thick thorns don't bother her. Her eyesight is terrible, so if she's not sure what you are, she might just charge to find out. Little birds ride on her back and eat the bugs — they're her lookouts.
- **Did you know:** A rhino's horn is made of the same stuff as your fingernails.

### s123 🦒 Tall Tale — *Giraffe* · RARE
- **Tag:** "Eats lunch from the second floor"
- **Size 6 · Speed 4 · Weight 5**
- **Likes:** 🌳 acacia leaves · 👀 seeing everything first
- **Story:** Tall Tale's neck is longer than a grown-up is tall, and her tongue is purple and almost two feet long so she can eat around thorns. She's the lookout for the whole savanna. She only sleeps about 30 minutes a day and does it standing up.
- **Did you know:** A giraffe's neck has the same number of bones as yours — seven — they're just huge.

### s124 🐆 Spot Rush — *Cheetah* · EPIC — **"The Fastest Thing on Legs"**
- **Tag:** "Zero to 60 faster than a sports car"
- **Size 3 · Speed 6 · Weight 3**
- **Likes:** 🏁 short sprints · 😺 chirping (yes, chirping)
- **Story:** Spot Rush is the fastest land animal that has ever lived. When she runs, all four feet leave the ground at once and her tail steers like a rudder. The black tear-stripes under her eyes cut the sun's glare like a football player's face paint. She once chased a gazelle across the whole plain, missed it, and then lay down panting in the grass for 20 minutes — because even the fastest thing alive has to catch her breath.
- **Did you know:** Cheetahs can't roar. They chirp, like a bird.

### s125 🐘 Trunk Titan — *African elephant* · LEGENDARY — **"The Old One Who Remembers"**
- **Tag:** "Never forgets a face. Or a friend."
- **Size 6 · Speed 3 · Weight 6**
- **Likes:** 💦 water fights · 👵 long memories
- **Story:** Trunk Titan is the biggest animal on land, and the wisest. Her trunk has 40,000 muscles — she can pick up a peanut or push over a tree with it. She remembers every waterhole, every path, and every friend she's ever had, even after fifty years. When the herd is lost in the dry season, she's the one who knows the way.
- **The Legend Says:** Trunk Titan was there the day the first rain fell on the savanna, and she remembers exactly where it landed. That's the only waterhole that has never, ever gone dry.

---

## 10. Claude Code prompt — "Add lore cards"

> Add a `lore` object to every sprite in `assets/catalog.js` using the data in
> `critter-lore-spec.md` (copy text exactly; don't rewrite). Shape:
> `{ real, tag, size, speed, weight, likes:[2], story, fact | legend | log, title? }`.
> Then add a **tap-to-flip lore card** to every tile renderer that shows an *owned*
> sprite (Locker, Collections grid, trade builder, reveal screen). Silhouette and
> hidden tiles do **not** flip. Card layout per §1 of the spec: nickname + rarity
> ring, real name in small caps, tagline large, three 6-pip bars with the kid-word
> label, two `likes` chips, story, then the footer block (`★ DID YOU KNOW` /
> `📜 THE LEGEND SAYS` / `📡 MISSION LOG`, picking whichever key is present).
> Epic cards get the existing epic shimmer border and show `title` under the
> nickname; legendary cards get the foil animation and play the collection's
> reveal sting on first open (flag `loreSeen[id]` in the character doc, written
> inside the same transaction pattern as other grants). Pips use `RARITY` colors
> for the fill. Contrast ≥ 4.5:1 both themes; story text ≥ 16px on phone. Flip is
> a 3D CSS rotate, 350ms, `prefers-reduced-motion` → instant. Add a `lore` test
> in `window.__CC`-style exposure that asserts every sprite has all required keys
> and size/speed/weight ∈ 1–6. Stop after wiring the data and show me three cards
> (a common, an epic, a legendary) in both themes before building the flip.
