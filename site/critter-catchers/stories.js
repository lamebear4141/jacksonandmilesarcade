/* =====================================================================
   CRITTER CATCHERS — THE STORY LIBRARY
   ---------------------------------------------------------------------
   Every critter has its own bookshelf. STORIES[level][critterId] is the
   list of books that critter will listen to — nobody else's show up.

   Shape of a story:
     { id, title, emoji, genre, art, pages:[ {text, q, c:[...]} ] }

     id     — unique across BOTH levels; it is written into the save file
              as a "read it!" marker, so never reuse or rename one.
     genre  — 'dragon' | 'royal' | 'silly' | 'night'. Matches CRITTERS[].fav,
              which is what earns the "that's their favourite!" line.
     art    — 2–3 emoji that paint the cover scene (the big one first).
     pages  — 4 pages at level 1 (~1st grade), 5 at level 2 (~3rd grade).
     c      — the CORRECT answer is always c[0]; the game shuffles them.

   Shelf sizes follow rarity, because rarer critters take more nights to
   collect: commons 2 books per level, rares 3, epics 3, legendaries 3,
   mythic 3. Re-reading a book still earns its bedtime star, so a fifteen
   night quest does not need fifteen different books.

   House rules for new stories: the question must be answerable from that
   page's text alone, the wrong answers must be plainly wrong to a child
   who read it, and the last page always lands somewhere warm and sleepy.
   ===================================================================== */

export const STORIES = {
  /* ================= LEVEL 1 — 4 pages, ~1st grade ================= */
  1: {

    /* ---- Pip the Fox 🦊 — common ---- */
    pip: [
      { id:'pip-boots', title:'Pip and the Backwards Boots', emoji:'🥾', genre:'silly', art:['🦊','🥾','💦'], pages:[
        { text:'Pip the fox found four red boots by an old log. He put them all on. But he put them on backwards!',
          q:'How many boots did Pip find?', c:['Four','Two','Ten'] },
        { text:'Pip tried to walk to the pond. The boots walked him back to the log. "Hey!" said Pip.',
          q:'Where did the boots take Pip?', c:['Back to the log','To the pond','Up a tree'] },
        { text:'So Pip tried to walk home. The boots walked him to the pond! Pip laughed so hard he sat down in the mud.',
          q:'What did Pip do when the boots took him to the pond?', c:['He laughed','He cried','He ran'] },
        { text:'Pip pulled the boots off. Then he walked home the right way. He was so tired that he yawned the whole way to bed.',
          q:'How did Pip feel at the end?', c:['Tired','Angry','Hungry'] },
      ]},
      { id:'pip-puddle', title:'Pip and the Moon Puddle', emoji:'🌙', genre:'night', art:['🦊','🌙','💧'], pages:[
        { text:'One night Pip the fox saw the moon in a puddle. "Oh no! The moon fell in!" he said.',
          q:'What did Pip see in the puddle?', c:['The moon','A fish','A boot'] },
        { text:'Pip ran and got a cup. He tried to scoop the moon out. The moon just wiggled.',
          q:'What did Pip use to scoop?', c:['A cup','A net','His hat'] },
        { text:'Luna the owl looked down from her branch. "Look up, Pip," she said. The moon was up in the sky the whole time!',
          q:'Who told Pip to look up?', c:['Luna the owl','A frog','His mom'] },
        { text:'Pip felt silly. Then he lay down by the puddle and watched two moons, one up high and one down low, until his eyes shut.',
          q:'How many moons did Pip watch?', c:['Two','Five','One'] },
      ]},
    ],

    /* ---- Mo the Mouse 🐭 — common ---- */
    mo: [
      { id:'knight', title:'The Knight and the Lost Horse', emoji:'🐴', genre:'silly', art:['🐴','🍎','🏰'], pages:[
        { text:'Sir Ben was a small knight. He had a big horse named Max. One day Max was gone!',
          q:'What was the horse’s name?', c:['Max','Rex','Sam'] },
        { text:'Sir Ben looked in the barn. No Max. He looked by the gate. No Max.',
          q:'Did Sir Ben find Max in the barn?', c:['No','Yes','He found a cow'] },
        { text:'Then Sir Ben heard a munch, munch, munch. It came from the kitchen!',
          q:'What did Sir Ben hear?', c:['Munch, munch, munch','Knock, knock','Splash, splash'] },
        { text:'Max was in the kitchen eating apples! "Silly horse," said Sir Ben. He gave Max one more apple. Then they both went to bed.',
          q:'What was Max eating?', c:['Apples','Carrots','Hay'] },
      ]},
      { id:'mo-crown', title:'Mo and the Tiny Crown', emoji:'👑', genre:'royal', art:['🐭','👑','🍃'], pages:[
        { text:'Mo the mouse lived under the castle steps. One day he found a tiny gold crown. It fit him!',
          q:'What did Mo find?', c:['A tiny crown','A key','A coin'] },
        { text:'Mo wore the crown all day. "Good day, King Mo!" said the birds. Mo felt very grand.',
          q:'What did the birds call Mo?', c:['King Mo','Mister Mo','Silly Mo'] },
        { text:'Then Mo saw the princess crying. She had lost the crown from her doll.',
          q:'Why was the princess sad?', c:['She lost her doll’s crown','She lost her shoe','She was tired'] },
        { text:'Mo gave the crown back. The princess made him a hat out of a leaf instead. Mo liked the leaf hat better. He wore it to bed.',
          q:'What did the princess make for Mo?', c:['A leaf hat','A gold ring','A bed'] },
      ]},
      { id:'mo-cheese', title:'Mo and the Loud Cheese', emoji:'🧀', genre:'silly', art:['🐭','🧀','🐝'], pages:[
        { text:'Mo the mouse had big ears. He could hear a crumb fall. He could hear a cat blink.',
          q:'What could Mo hear?', c:['A crumb fall','Music','Nothing'] },
        { text:'One night he heard a HUM. It came from the kitchen. It came from the cheese!',
          q:'Where did the hum come from?', c:['The cheese','The clock','The door'] },
        { text:'Mo tiptoed close. The cheese hummed and buzzed and wiggled. Mo was very brave. He peeked in a hole.',
          q:'What did the cheese do?', c:['It hummed and wiggled','It rolled away','It talked'] },
        { text:'A little bee was napping in there! Mo said sorry and tiptoed away. Then he went to bed and dreamed of humming cheese.',
          q:'Who was in the cheese?', c:['A bee','A bug','A mouse'] },
      ]},
    ],

    /* ---- Wren the Bunny 🐰 — common ---- */
    wren: [
      { id:'wren-hop', title:'Wren Cannot Stop Hopping', emoji:'🐇', genre:'silly', art:['🐰','🛏️','🌙'], pages:[
        { text:'Wren the bunny hopped all day. She hopped up. She hopped down. She even hopped in her sleep!',
          q:'What did Wren do all day?', c:['Hopped','Ran','Slept'] },
        { text:'At bedtime, Wren hopped right out of bed. Boing! She hopped back in. Boing! Out again.',
          q:'What happened at bedtime?', c:['Wren hopped out of bed','Wren fell asleep','Wren ate a carrot'] },
        { text:'Mom Bunny said, "Try one slow hop." Wren hopped as slow as she could. It took a whole minute.',
          q:'What did Mom Bunny say to try?', c:['One slow hop','Ten fast hops','No hops at all'] },
        { text:'Wren did three slow hops. Then two. Then one very small one. And then she was too slow and too sleepy to hop at all.',
          q:'How did the story end?', c:['Wren was too sleepy to hop','Wren hopped away','Wren ate dinner'] },
      ]},
      { id:'wren-carrot', title:'Wren and the Carrot Castle', emoji:'🥕', genre:'royal', art:['🐰','🥕','🚩'], pages:[
        { text:'Wren the bunny built a castle out of carrots. It had a tower, a gate, and a little flag on top.',
          q:'What was the castle made of?', c:['Carrots','Bricks','Snow'] },
        { text:'Wren was the queen of the carrot castle. She made one rule: everyone gets a snack.',
          q:'What was the rule?', c:['Everyone gets a snack','No one can come in','Everyone must be quiet'] },
        { text:'All her friends came over. They ate the gate. They ate the tower. Soon the whole castle was gone!',
          q:'What happened to the castle?', c:['Her friends ate it','It fell down','It blew away'] },
        { text:'"Best castle ever," said Wren. She kept the little flag. Then she curled up where the tower used to be and had a very good nap.',
          q:'What did Wren keep?', c:['The flag','The gate','One carrot'] },
      ]},
    ],

    /* ---- Sprout the Hedgehog 🦔 — common ---- */
    sprout: [
      { id:'sprout-garden', title:'Sprout and the Moon Garden', emoji:'🌼', genre:'night', art:['🦔','🌼','🌙'], pages:[
        { text:'Sprout the hedgehog had a garden that only grew at night. He planted it when the moon came up.',
          q:'When did Sprout’s garden grow?', c:['At night','In the morning','In the rain'] },
        { text:'He planted one silver seed. He gave it one drop of water. Then he sat down to wait.',
          q:'How much water did he give it?', c:['One drop','A bucket','None at all'] },
        { text:'A white flower opened up. It glowed like a little lamp. Then another one opened. And another!',
          q:'What did the flower do?', c:['It glowed','It sang','It ran away'] },
        { text:'Soon the whole garden was glowing. Sprout rolled into a ball right in the middle of it and slept in the soft white light.',
          q:'Where did Sprout sleep?', c:['In the middle of the garden','In his house','Under a rock'] },
      ]},
      { id:'sprout-roll', title:'Sprout Rolls Down the Hill', emoji:'🍂', genre:'silly', art:['🦔','🍂','⛰️'], pages:[
        { text:'Sprout the hedgehog can roll into a ball. One day he rolled down a big hill by mistake.',
          q:'What can Sprout do?', c:['Roll into a ball','Fly','Swim'] },
        { text:'He rolled past a cow. He rolled past a duck. Then he rolled right through a pile of leaves.',
          q:'What did Sprout roll through?', c:['A pile of leaves','A pond','A fence'] },
        { text:'Sprout stopped at the bottom. He was covered in leaves! He looked just like a walking bush.',
          q:'What did Sprout look like?', c:['A walking bush','A ball','A tree'] },
        { text:'His friends did not know him at all. Sprout laughed and shook the leaves off. Then he made a bed out of them and went to sleep.',
          q:'What did Sprout do with the leaves?', c:['Made a bed','Ate them','Threw them away'] },
      ]},
    ],

    /* ---- Luna the Owl 🦉 — rare ---- */
    luna: [
      { id:'moonsock', title:'The Moon’s Lost Sock', emoji:'🌙', genre:'night', art:['🌙','🧦','⭐'], pages:[
        { text:'The Moon wore two warm socks. One night, one sock fell off. It fell down, down, down.',
          q:'What did the Moon lose?', c:['A sock','A hat','A star'] },
        { text:'The stars went to look for it. They looked on a hill. They looked in the sea.',
          q:'Who went to look for the sock?', c:['The stars','The sun','A ship'] },
        { text:'A soft cloud had the sock. The cloud was using it as a bed! A baby star was asleep inside.',
          q:'Who was asleep inside the sock?', c:['A baby star','A mouse','A bird'] },
        { text:'The Moon smiled. "Keep the sock," she said. "Every star needs a warm bed." And the whole sky went to sleep.',
          q:'Did the Moon take the sock back?', c:['No, she shared it','Yes, she took it','She got mad'] },
      ]},
      { id:'luna-count', title:'Luna Counts the Stars', emoji:'✨', genre:'night', art:['🦉','✨','☁️'], pages:[
        { text:'Luna the owl could not sleep. So she began to count the stars. "One. Two. Three…"',
          q:'What did Luna count?', c:['The stars','Sheep','Trees'] },
        { text:'She counted all the way to one hundred. Then a big cloud came. It sat right on top of her stars.',
          q:'What covered the stars?', c:['A cloud','Rain','The moon'] },
        { text:'Luna gave the cloud a little push with her wing. The cloud drifted away. All her stars were still there!',
          q:'How did Luna move the cloud?', c:['She pushed it with her wing','She blew on it','She called the wind'] },
        { text:'Luna counted three more stars. Then two more. Then she was much too sleepy to count at all. Good night, Luna.',
          q:'Why did Luna stop counting?', c:['She got too sleepy','She lost count','The sun came up'] },
      ]},
      { id:'luna-flip', title:'Luna’s Upside-Down Nap', emoji:'🙃', genre:'silly', art:['🦉','🙃','🦇'], pages:[
        { text:'Bats sleep upside down. Luna the owl wanted to try it. So she hung from a branch by her feet.',
          q:'Who sleeps upside down?', c:['Bats','Foxes','Frogs'] },
        { text:'The world looked funny. The grass was up. The sky was down. A worm waved at her from above.',
          q:'Where was the sky?', c:['Down','Up','Behind a tree'] },
        { text:'Then Luna’s hat fell off. Her feathers fell up. And her head felt full of bubbles!',
          q:'What fell off Luna?', c:['Her hat','Her wing','A star'] },
        { text:'Luna flipped back over. "Bats can keep it," she said. She sat the right way up on her branch and slept the way an owl should.',
          q:'How did Luna sleep at the end?', c:['The right way up','Upside down','On the ground'] },
      ]},
    ],

    /* ---- Bram the Bear 🐻 — rare ---- */
    bram: [
      { id:'bram-crown', title:'Bram Guards the Crown', emoji:'👑', genre:'royal', art:['🐻','👑','🪑'], pages:[
        { text:'Bram the bear had a big job. He had to guard the king’s crown all night long.',
          q:'What did Bram guard?', c:['The crown','The gate','A cake'] },
        { text:'Bram sat up tall. He did not blink. But the room was warm and the chair was very soft.',
          q:'How was the chair?', c:['Soft','Hard','Wet'] },
        { text:'Bram fell asleep! When he woke up, the crown was gone. Then he felt something on his head. It was the crown!',
          q:'Where was the crown?', c:['On his head','Under the bed','Gone forever'] },
        { text:'The king laughed and laughed. "You kept it safe all night," he said. Then he gave Bram a pillow for the chair.',
          q:'What did the king give Bram?', c:['A pillow','A sword','A hat'] },
      ]},
      { id:'bram-hic', title:'Bram’s Honey Hiccups', emoji:'🍯', genre:'silly', art:['🐻','🍯','❄️'], pages:[
        { text:'Bram the bear ate a whole pot of honey. Then he got the hiccups. HIC!',
          q:'What did Bram eat?', c:['A pot of honey','A fish','Ten apples'] },
        { text:'Every hiccup made Bram hop. HIC — hop! HIC — hop! He hopped all around the den.',
          q:'What happened with every hiccup?', c:['Bram hopped','Bram sneezed','Bram sang'] },
        { text:'Mo the mouse ran in. "Drink some water," he said. "Hold your breath. Think about snow."',
          q:'Who helped Bram?', c:['Mo the mouse','A fox','The king'] },
        { text:'Bram thought about snow. He thought about cold, quiet, sleepy snow. The hiccups stopped. And so did Bram. He was fast asleep.',
          q:'What did Bram think about?', c:['Snow','Honey','Fish'] },
      ]},
      { id:'bram-honeymtn', title:'Bram’s Honey Mountain', emoji:'🍯', genre:'silly', art:['🐻','🍯','⛰️'], pages:[
        { text:'Bram the bear found a mountain of honey. It was as tall as three trees!',
          q:'How tall was the honey mountain?', c:['As tall as three trees','As tall as a rock','As small as a cup'] },
        { text:'Bram took one big lick. Then two. Then ten. The mountain got smaller and smaller.',
          q:'What happened to the mountain?', c:['It got smaller','It got bigger','It rolled away'] },
        { text:'Soon Bram was very full and very sticky. He could not even stand up.',
          q:'How did Bram feel?', c:['Very full','Hungry','Scared'] },
        { text:'So Bram lay down right where he was. He licked one last paw. Then the big sticky bear fell asleep under the stars.',
          q:'Where did Bram fall asleep?', c:['Right where he was','In his cave','Up a tree'] },
      ]},
    ],

    /* ---- Puddle the Frog 🐸 — rare ---- */
    puddle: [
      { id:'frog', title:'The Princess and the Sleepy Frog', emoji:'👑', genre:'royal', art:['🐸','👑','🧦'], pages:[
        { text:'Princess Pia could not sleep. She heard a tiny sound. It came from under her bed.',
          q:'Where did the sound come from?', c:['Under her bed','The window','The door'] },
        { text:'It was a small green frog. The frog said, "I can not sleep too. Can you read to me?"',
          q:'What did the frog want?', c:['A story','A fly','A crown'] },
        { text:'Pia read a book about the moon. The frog got sleepy. Pia got sleepy too.',
          q:'What was the book about?', c:['The moon','A dog','The sea'] },
        { text:'The frog slept in a warm sock. Pia slept in her bed. The castle was quiet all night.',
          q:'Where did the frog sleep?', c:['In a sock','In a shoe','In a cup'] },
      ]},
      { id:'puddle-parade', title:'Puddle and the Rain Parade', emoji:'🌧️', genre:'silly', art:['🐸','🌧️','🦆'], pages:[
        { text:'Puddle the frog loved rain best of all. When the first drop fell he shouted, "Parade time!"',
          q:'What did Puddle love best?', c:['Rain','Snow','Sun'] },
        { text:'He hopped in the big puddle. Splash! He hopped in the little puddle. Splish!',
          q:'What sound did the little puddle make?', c:['Splish','Bang','Moo'] },
        { text:'A duck joined in. Then a snail. Then a very slow turtle. They all splashed down the lane.',
          q:'Who joined the parade last?', c:['A turtle','A duck','A snail'] },
        { text:'When the rain stopped, everyone was wet and happy. Puddle floated on his back in the last warm puddle and yawned at the clouds.',
          q:'What did Puddle do at the end?', c:['Floated and yawned','Ran home','Hid in the reeds'] },
      ]},
      { id:'puddle-crown', title:'Puddle’s Lily Pad Crown', emoji:'👑', genre:'royal', art:['🐸','👑','🐞'], pages:[
        { text:'Puddle the frog wanted to be king of the pond. So he made a crown out of one green lily pad.',
          q:'What was the crown made of?', c:['A lily pad','Gold','Mud'] },
        { text:'"I am King Puddle!" he said. The fish did not care. The bugs did not care. Nobody bowed at all.',
          q:'Who bowed to King Puddle?', c:['Nobody','The fish','The bugs'] },
        { text:'Then it began to rain. All the little pond bugs got wet and cold. King Puddle held his crown over them like a roof.',
          q:'What did Puddle do with his crown?', c:['Held it like a roof','Threw it away','Sat on it'] },
        { text:'The bugs stayed dry. "Now you are a king," said a beetle. Puddle smiled and fell asleep with the crown on his tummy.',
          q:'Where was the crown at the end?', c:['On his tummy','On his head','Under the water'] },
      ]},
    ],

    /* ---- Ziggy the Dragon 🐲 — epic ---- */
    ziggy: [
      { id:'roar', title:'The Dragon Who Lost His Roar', emoji:'🐉', genre:'dragon', art:['🐉','🐦','🌳'], pages:[
        { text:'Tiny Dragon had a big roar. One day his roar was gone! Only a small squeak came out.',
          q:'What came out when Tiny Dragon tried to roar?', c:['A squeak','A song','A sneeze'] },
        { text:'Tiny Dragon looked under his bed. He looked in the castle. He looked up in a tree.',
          q:'Where did Tiny Dragon look first?', c:['Under his bed','In the pond','In a cave'] },
        { text:'A little bird was in the tree. The bird had the roar! It was too big for her.',
          q:'Who had the roar?', c:['A little bird','A frog','A knight'] },
        { text:'The bird gave the roar back. Tiny Dragon said thank you. Then he roared a soft, sleepy roar. Good night!',
          q:'What kind of roar did he roar at the end?', c:['A soft, sleepy roar','A loud roar','A scary roar'] },
      ]},
      { id:'ziggy-rings', title:'Ziggy’s Smoke Rings', emoji:'💨', genre:'dragon', art:['🐲','💨','🌙'], pages:[
        { text:'Ziggy is a small dragon. He can not breathe fire yet. He breathes smoke rings instead.',
          q:'What does Ziggy breathe?', c:['Smoke rings','Fire','Bubbles'] },
        { text:'He made a ring for the frog. He made a ring for the owl. The owl wore hers like a hat.',
          q:'Who wore a ring like a hat?', c:['The owl','The frog','Ziggy'] },
        { text:'Then Ziggy made the biggest ring of all. It floated up, up, up, all the way to the moon.',
          q:'Where did the big ring float?', c:['Up to the moon','Into the water','Into a tree'] },
        { text:'Ziggy yawned a great big yawn. One tiny ring came out. It sat on his nose while he fell asleep.',
          q:'Where did the tiny ring sit?', c:['On his nose','On his tail','In the sky'] },
      ]},
      { id:'ziggy-mallow', title:'Ziggy and the Marshmallow', emoji:'🍡', genre:'silly', art:['🐲','🍡','🔥'], pages:[
        { text:'Ziggy the dragon found one marshmallow. He wanted it warm. So he blew a little smoke at it.',
          q:'What did Ziggy find?', c:['A marshmallow','A cookie','An egg'] },
        { text:'Nothing happened. So he blew harder. The marshmallow got big. So he blew even harder!',
          q:'What happened when he blew harder?', c:['The marshmallow got big','It ran away','It fell down'] },
        { text:'POP! The marshmallow stuck right on his nose. Ziggy could not get it off!',
          q:'Where did the marshmallow stick?', c:['On his nose','On his wing','On a rock'] },
        { text:'His friends laughed and helped him pull. Then they all ate a little bit. Ziggy licked his nose and went to bed sticky and happy.',
          q:'How did Ziggy go to bed?', c:['Sticky and happy','Sad','Still hungry'] },
      ]},
    ],

    /* ---- Nova the Unicorn 🦄 — epic ---- */
    nova: [
      { id:'nova-bridge', title:'Nova and the Dream Bridge', emoji:'🌉', genre:'night', art:['🦄','🌉','💤'], pages:[
        { text:'Nova is a unicorn. At night she builds a bridge out of light. It goes up into the sky.',
          q:'What does Nova build?', c:['A bridge of light','A house','A boat'] },
        { text:'Sleepy animals walk up the bridge. At the very top is the place where good dreams live.',
          q:'What is at the top?', c:['Good dreams','A castle','The sun'] },
        { text:'One night a small mouse was afraid to go up. So Nova walked with him the whole way.',
          q:'Who was afraid?', c:['A small mouse','A bear','A frog'] },
        { text:'At the top, the mouse got a dream about cheese. Nova came back down and slept under the bridge she made.',
          q:'What dream did the mouse get?', c:['A dream about cheese','A scary dream','No dream at all'] },
      ]},
      { id:'nova-rainbow', title:'Nova’s Rainbow Nap', emoji:'🌈', genre:'silly', art:['🦄','🌈','💤'], pages:[
        { text:'Nova the unicorn is white. But when she naps, she turns colors!',
          q:'What happens when Nova naps?', c:['She turns colors','She snores','She grows'] },
        { text:'A happy dream makes her pink. A funny dream makes her yellow. A sleepy dream makes her blue.',
          q:'What color is a funny dream?', c:['Yellow','Pink','Green'] },
        { text:'One night Nova had all three dreams at the same time. She turned into a rainbow!',
          q:'What did Nova turn into?', c:['A rainbow','A cloud','A star'] },
        { text:'Her friends came to look. Nobody woke her up. They just sat in the pretty light until they fell asleep too.',
          q:'Did her friends wake her up?', c:['No','Yes','They tried to'] },
      ]},
      { id:'nova-lights', title:'Nova and the Northern Lights', emoji:'🌌', genre:'night', art:['🦄','🌌','❄️'], pages:[
        { text:'One winter night the sky turned green and pink. Nova the unicorn looked up. "The lights are dancing!"',
          q:'What colors was the sky?', c:['Green and pink','All red','All black'] },
        { text:'Nova ran out under them. The lights swirled and curled like long ribbons over the snow.',
          q:'What did the lights look like?', c:['Ribbons','Rain','Rocks'] },
        { text:'She wanted to keep one. But when she reached up, her hoof went right through the light.',
          q:'What happened when Nova reached up?', c:['Her hoof went through','She caught a light','She slipped'] },
        { text:'So Nova lay down in the soft snow and just watched instead. The dancing lights hummed her all the way to sleep.',
          q:'What did Nova do instead?', c:['Watched them','Went home','Ran away'] },
      ]},
    ],

    /* ---- Willow the Dream Wolf 🐺 — legendary ---- */
    willow: [
      { id:'willow-guard', title:'Willow Guards the Dreams', emoji:'🌙', genre:'night', art:['🐺','🌙','🏡'], pages:[
        { text:'Willow is a big grey wolf. All night long she walks around the village while everyone sleeps.',
          q:'When does Willow walk?', c:['All night','At lunch','In the morning'] },
        { text:'She keeps the good dreams in. She keeps the bad ones out. That is her job.',
          q:'What is Willow’s job?', c:['Guarding dreams','Cooking dinner','Digging holes'] },
        { text:'When a child calls out in the dark, Willow sits by the window until the dream turns soft again.',
          q:'What does Willow do when a child calls out?', c:['Sits by the window','Runs away','Howls loudly'] },
        { text:'When the sun comes up, Willow curls into a ball under the big pine tree. Now it is her turn to dream.',
          q:'Where does Willow sleep?', c:['Under the pine tree','In a house','In a cave'] },
      ]},
      { id:'willow-grumpy', title:'Willow and the Grumpy Dream', emoji:'💭', genre:'night', art:['🐺','💭','😤'], pages:[
        { text:'One night a grumpy little dream came to town. It stomped. It huffed. It would not go away.',
          q:'What did the grumpy dream do?', c:['Stomped and huffed','Sang a song','Fell asleep'] },
        { text:'Willow the wolf did not chase it. She sat down beside it in the grass and waited.',
          q:'What did Willow do?', c:['Sat beside it','Chased it off','Barked at it'] },
        { text:'"I am only grumpy because I am tired," said the dream. "Nobody ever tucks ME in."',
          q:'Why was the dream grumpy?', c:['It was tired','It was hungry','It was lost'] },
        { text:'So Willow tucked the little dream under her warm grey tail. It yawned once and went quiet, and the whole town slept well.',
          q:'Where did the dream sleep?', c:['Under Willow’s tail','In a soft bed','Up in the sky'] },
      ]},
      { id:'willow-squeak', title:'Willow’s Squeaky Paw', emoji:'🐭', genre:'silly', art:['🐺','🐭','🌙'], pages:[
        { text:'Willow must be quiet at night. But tonight, one paw went SQUEAK with every single step.',
          q:'What did Willow’s paw do?', c:['It squeaked','It hurt','It glowed'] },
        { text:'Squeak, squeak, squeak. A baby woke up. A cat woke up. Even a snail woke up!',
          q:'Who woke up?', c:['A baby, a cat, and a snail','Only the moon','Nobody at all'] },
        { text:'Willow sat down and looked at her paw. A tiny toy mouse was stuck between her toes!',
          q:'What was stuck in her paw?', c:['A toy mouse','A sharp stone','A leaf'] },
        { text:'She pulled it out and set it by the baby’s door. Then, quiet as snow, Willow walked all night — and everyone dreamed on.',
          q:'How did Willow walk after that?', c:['Quiet as snow','Very loudly','On three paws'] },
      ]},
    ],

    /* ---- Sir Biscuit the Pup 🐶 — legendary ---- */
    biscuit: [
      { id:'biscuit-helmet', title:'Sir Biscuit Loses His Helmet', emoji:'⛑️', genre:'royal', art:['🐶','⛑️','🦆'], pages:[
        { text:'Sir Biscuit is a small brown pup with a big shiny helmet. Today the helmet is gone!',
          q:'What did Sir Biscuit lose?', c:['His helmet','His sword','His bone'] },
        { text:'He looked in the barn. He looked in the hay. He looked under the king’s big chair.',
          q:'Where did he look last?', c:['Under the king’s chair','In the pond','Up a tree'] },
        { text:'Then he looked in his water bowl. There it was! And a duck was swimming in it.',
          q:'Who was in the helmet?', c:['A duck','A frog','A fish'] },
        { text:'Sir Biscuit let the duck keep it. He wore a soup pot instead, all afternoon and all the way to bed.',
          q:'What did Sir Biscuit wear instead?', c:['A soup pot','A hat','A basket'] },
      ]},
      { id:'biscuit-dragon', title:'Sir Biscuit and the Very Small Dragon', emoji:'🐲', genre:'dragon', art:['🐶','🐲','🌵'], pages:[
        { text:'A dragon came to the castle gate. Everyone ran inside. Sir Biscuit did not run.',
          q:'Who did not run?', c:['Sir Biscuit','The king','The cook'] },
        { text:'The dragon was very small. It was crying. It had a big thorn stuck in its foot.',
          q:'What was wrong with the dragon?', c:['A thorn in its foot','It was hungry','It was lost'] },
        { text:'Sir Biscuit pulled the thorn out with his teeth. The little dragon stopped crying at once.',
          q:'How did he pull the thorn out?', c:['With his teeth','With a rope','With a spoon'] },
        { text:'That night the dragon slept by the gate to keep watch. And Sir Biscuit slept beside the dragon, warm as toast.',
          q:'Where did Sir Biscuit sleep?', c:['Beside the dragon','In the tower','Outside the wall'] },
      ]},
      { id:'biscuit-mud', title:'Sir Biscuit’s Muddy Day', emoji:'💦', genre:'silly', art:['🐶','💦','👑'], pages:[
        { text:'Sir Biscuit rolled in the mud. Then he rolled some more. He was brown, then black, then just muddy.',
          q:'What did Sir Biscuit roll in?', c:['Mud','Snow','Leaves'] },
        { text:'The cook chased him. The maid chased him. He ran right through the great hall!',
          q:'Where did he run?', c:['Through the great hall','Into the pond','Up the stairs'] },
        { text:'Then he shook. Mud went on the walls. Mud went on the king. Mud went everywhere!',
          q:'What happened when he shook?', c:['Mud went everywhere','He got clean','He fell over'] },
        { text:'The king laughed so hard he had to sit down. Then he gave Sir Biscuit a warm bath and a soft towel, and the little knight slept like a stone.',
          q:'What did the king do?', c:['Laughed and gave him a bath','Got angry','Sent him away'] },
      ]},
    ],

    /* ---- Twinkle the Star Sprite 🌟 — mythic ---- */
    twinkle: [
      { id:'twinkle-fall', title:'Twinkle Falls Out of the Sky', emoji:'🌟', genre:'night', art:['🌟','🌾','✨'], pages:[
        { text:'Twinkle was a little star way up high. One night Twinkle leaned too far and fell right out of the sky!',
          q:'What happened to Twinkle?', c:['Fell out of the sky','Went to sleep','Grew bigger'] },
        { text:'Down, down, down went Twinkle. At last Twinkle landed in a soft green field. Bump!',
          q:'Where did Twinkle land?', c:['In a green field','In the sea','On a roof'] },
        { text:'The sky looked so far away now. Twinkle was very small and the night was very big.',
          q:'How did Twinkle feel?', c:['Small','Happy','Angry'] },
        { text:'Then a firefly came and sat beside Twinkle and glowed. "You are not alone," it said. And Twinkle slept in the warm grass.',
          q:'Who came to sit with Twinkle?', c:['A firefly','A wolf','Another star'] },
      ]},
      { id:'twinkle-help', title:'Twinkle Lights the Way', emoji:'🐑', genre:'night', art:['🌟','🐑','🏡'], pages:[
        { text:'Twinkle the star lived in the field now. Every night Twinkle glowed a soft gold light.',
          q:'What did Twinkle do every night?', c:['Glowed','Sang','Slept'] },
        { text:'A lost lamb saw the light. It walked toward the light all the way home to its warm barn.',
          q:'Who saw the light first?', c:['A lost lamb','A fox','A boy'] },
        { text:'The next night a lost boy came. Then a lost cat. Twinkle helped every one of them.',
          q:'Who came the next night?', c:['A lost boy','A duck','The moon'] },
        { text:'Soon the whole village knew the little star in the field. Twinkle glowed until everyone was safe in bed — then curled up and slept too.',
          q:'When did Twinkle sleep?', c:['After everyone was in bed','At noon','Never'] },
      ]},
      { id:'twinkle-home', title:'Twinkle Goes Home', emoji:'🌙', genre:'night', art:['🌟','🌙','🏡'], pages:[
        { text:'One night the moon came down low and spoke to Twinkle. "You have earned your place back," she said.',
          q:'Who came down to speak to Twinkle?', c:['The moon','A star','The sun'] },
        { text:'Twinkle looked around the field — at the firefly, and the lamb, and the little boy fast asleep.',
          q:'Who did Twinkle look at?', c:['The firefly, the lamb, and the boy','Only the moon','Nobody'] },
        { text:'"May I still shine on them?" Twinkle asked. The moon smiled. "That is what stars are for."',
          q:'What did Twinkle ask?', c:['To still shine on them','To stay in the field','To be bigger'] },
        { text:'So Twinkle floated up, up, up to a small spot in the sky right above the village. And every night since, that one star shines a little brighter than the rest.',
          q:'Where is Twinkle now?', c:['Above the village','In the field','On the moon'] },
      ]},
    ],
  },

  /* ================= LEVEL 2 — 5 pages, ~3rd grade ================= */
  2: {

    /* ---- Pip the Fox 🦊 — common ---- */
    pip: [
      { id:'pip-giggle', title:'Pip and the Great Giggle Contest', emoji:'🏆', genre:'silly', art:['🦊','🏆','😂'], pages:[
        { text:'Every summer the meadow held a Giggle Contest. The rule was simple: make the judge laugh, and you win the Golden Acorn. Pip the fox had lost six years in a row.',
          q:'What is the prize?', c:['The Golden Acorn','A gold crown','A silver bell'] },
        { text:'This year the judge was Bram the bear, and Bram never laughed. Not at jokes. Not at funny hats. Not even at a duck riding a turtle.',
          q:'Who was the judge?', c:['Bram the bear','Luna the owl','A duck'] },
        { text:'One by one the animals tried. Wren the bunny told a knock-knock joke. A beetle did a tap dance. Bram sat there like a very large, very serious rock.',
          q:'What did Wren do?', c:['Told a knock-knock joke','Danced','Sang a song'] },
        { text:'When Pip’s turn came he was so nervous that he tripped over his own tail and landed in a blackberry bush. He climbed out purple, sticky, and wearing half the bush. Bram made a sound like a rusty gate. He was laughing.',
          q:'Why did Bram laugh?', c:['Pip fell into a blackberry bush','Pip told a joke','Pip wore a funny hat'] },
        { text:'Pip won the Golden Acorn without telling a single joke. He carried it home, ate three blackberries on the way, and fell asleep still a little bit purple.',
          q:'How did Pip fall asleep?', c:['Still a little bit purple','Still laughing','Inside the bush'] },
      ]},
      { id:'pip-socks', title:'Pip and the Royal Sock Thief', emoji:'🧦', genre:'royal', art:['🦊','🧦','🐁'], pages:[
        { text:'Something was stealing socks from the castle. Every morning the queen was missing one. Never two. Never a whole pair. Just one lonely sock.',
          q:'How many socks went missing each night?', c:['One','Two','A whole pair'] },
        { text:'The queen sent for Pip the fox, the cleverest tracker in the kingdom. Pip studied the floor for a long time and found a trail of tiny muddy footprints leading out the window.',
          q:'What did Pip find?', c:['Tiny muddy footprints','A note','A key'] },
        { text:'He followed the prints past the garden, under the hedge, and down into a hollow tree. Inside was a nest, and inside the nest were nineteen royal socks.',
          q:'Where did the trail lead?', c:['Into a hollow tree','To the pond','Up the tower'] },
        { text:'Curled up in the middle was a family of field mice, fast asleep, using the socks as blankets. Pip did not wake them. He tiptoed back to the castle and told the queen everything.',
          q:'What were the mice doing with the socks?', c:['Using them as blankets','Eating them','Hiding them'] },
        { text:'The queen laughed until her crown slipped sideways. "Then they shall have socks," she said, and she sent a basket of them every winter after that. Pip walked home under the stars, yawning, very pleased with himself.',
          q:'What did the queen decide?', c:['To send the mice socks','To catch the mice','To hide her socks'] },
      ]},
    ],

    /* ---- Mo the Mouse 🐭 — common ---- */
    mo: [
      { id:'backwards', title:'Prince Milo’s Backwards Day', emoji:'🤴', genre:'royal', art:['🤴','🔄','🌇'], pages:[
        { text:'Prince Milo woke up and put on his crown — but it slid on backwards. Then his boots walked him backwards to breakfast. "Something strange is happening," Milo said. Except it came out: "Happening is strange something!"',
          q:'What was wrong with Milo’s words?', c:['They came out backwards','They were too loud','They rhymed'] },
        { text:'The royal wizard checked his spellbook. "Ah! A backwards spell," he said. "Someone read a magic word in a mirror. It will only break when you do the most backwards thing of all."',
          q:'How did the spell start?', c:['A magic word was read in a mirror','A potion spilled','A dragon sneezed'] },
        { text:'Milo tried everything. He walked backwards up the stairs. He ate dessert before dinner. He even said hello when he was leaving. The spell held on tight.',
          q:'What did Milo eat before dinner?', c:['Dessert','Breakfast','Soup'] },
        { text:'That evening, Milo flopped onto his bed, exhausted. The sun was still setting. "It’s too early for bed," he yawned. And then he understood. The most backwards thing of all... was saying good night before dark!',
          q:'What was the most backwards thing of all?', c:['Saying good night before dark','Wearing two crowns','Jumping on the bed'] },
        { text:'"Good night!" Milo announced to the sunset. POP! The spell broke, and his crown spun the right way round. And since he was already tucked in, Milo stayed — sometimes backwards days end exactly right.',
          q:'What broke the spell?', c:['Saying good night','A potion','The wizard’s wand'] },
      ]},
      { id:'mo-keys', title:'Mo, Keeper of the Castle Keys', emoji:'🔑', genre:'royal', art:['🐭','🔑','🥧'], pages:[
        { text:'There were four hundred doors in the castle and four hundred keys to go with them, and Mo the mouse knew every single one by the sound it made turning in its lock.',
          q:'How did Mo know the keys apart?', c:['By the sound they made','By their color','By their size'] },
        { text:'On the night of the Harvest Ball, the key to the pantry vanished. Without it there would be no pie at all. The cook sat down on the floor and announced she was never getting up again.',
          q:'Which key went missing?', c:['The pantry key','The gate key','The tower key'] },
        { text:'Everyone searched with their eyes. Mo searched with his ears. He crept along the hallway listening to the quiet, and from somewhere under the great stone floor he heard a small sad clink.',
          q:'How did Mo search?', c:['With his ears','With a lantern','With a map'] },
        { text:'The key had slipped through a crack no wider than a coin. Mo squeezed down into the dark, found it lying in the dust, and pushed it back up one inch at a time. It took him a whole hour.',
          q:'How long did it take Mo?', c:['A whole hour','One minute','All night'] },
        { text:'There was pie. There was dancing. And Mo, who had eaten a slice bigger than his own head, fell asleep in a teacup by the fire with all four hundred keys jingling softly above him.',
          q:'Where did Mo fall asleep?', c:['In a teacup','On a pillow','Under the floor'] },
      ]},
      { id:'mo-whisper', title:'Mo and the Dragon’s Whisper', emoji:'🐉', genre:'dragon', art:['🐭','🐉','🤫'], pages:[
        { text:'A dragon moved into the hill above the village, and everybody panicked, because every time she spoke the windows rattled in their frames and the chickens fainted flat on their backs.',
          q:'What happened when the dragon spoke?', c:['The windows rattled','It started raining','The lights went out'] },
        { text:'The village sent polite letters asking her to be quieter. She never answered a single one. Then they sent a knight. He came back with his helmet on backwards and refused to talk about it ever again.',
          q:'What happened to the knight?', c:['He came back with his helmet backwards','He was never seen again','He became her friend'] },
        { text:'Finally Mo the mouse volunteered, mostly because nobody else would. He climbed the hill, walked straight into the cave, and stood on top of a rock so that he could be seen.',
          q:'Why did Mo stand on a rock?', c:['So he could be seen','To stay dry','To look brave'] },
        { text:'"You are not loud," Mo told her. "You are just very big. Try whispering." The dragon had never once thought to try. She whispered, and it came out like wind moving through tall grass.',
          q:'What did Mo tell the dragon to try?', c:['Whispering','Leaving the village','Singing'] },
        { text:'After that she whispered everything, and the village slept better than it had in months. Some nights, if your window is open, you can still hear her whispering the ends of stories to herself.',
          q:'What does the dragon whisper at night?', c:['The ends of stories','Her own name','Nothing at all'] },
      ]},
    ],

    /* ---- Wren the Bunny 🐰 — common ---- */
    wren: [
      { id:'wren-parade', title:'Wren and the Hiccup Parade', emoji:'🎺', genre:'silly', art:['🐰','🎺','😆'], pages:[
        { text:'It started with one hiccup. Wren the bunny hiccupped at breakfast, and the hiccup was so loud that the goat sitting next to her hiccupped too.',
          q:'How did it start?', c:['Wren hiccupped at breakfast','A parade came to town','A goat sneezed'] },
        { text:'By lunchtime half the meadow had it. The hiccups jumped from animal to animal like a game of tag that nobody had agreed to play.',
          q:'How did the hiccups spread?', c:['From animal to animal','Through the water','On the wind'] },
        { text:'The hiccupping crowd bounced down the road together, up and down, up and down, until it looked exactly like a parade. A traveler passing by took off his hat and clapped.',
          q:'What did the traveler think it was?', c:['A parade','A dance lesson','A fight'] },
        { text:'Wren, who was extremely tired of hiccupping by then, laughed at the clapping traveler, and laughing shook the hiccup right out of her. One by one everybody laughed, and one by one everybody was cured.',
          q:'What cured the hiccups?', c:['Laughing','Cold water','A long sleep'] },
        { text:'That night the meadow was so quiet you could hear the grass growing. Wren fell asleep before her ears did, which is something that only happens to very tired bunnies.',
          q:'How quiet was the meadow?', c:['You could hear the grass growing','As loud as ever','Only a little quiet'] },
      ]},
      { id:'wren-falling', title:'Wren and the Falling Stars', emoji:'💫', genre:'night', art:['🐰','💫','🦔'], pages:[
        { text:'Once a year the stars above the meadow let go and fall, dozens of them, all in one single night. Wren the bunny had been waiting eleven months to see it.',
          q:'How often do the stars fall?', c:['Once a year','Every night','Every month'] },
        { text:'The trouble was that the show did not begin until well past midnight, and Wren had never in her whole life stayed awake that long. She had tried. She had failed. Twice.',
          q:'What was the trouble?', c:['The show started past midnight','It was raining','She was too small'] },
        { text:'This year she made a plan: she would nap first. So she napped at six, and again at seven, and again at eight, which is not really a plan so much as a great deal of napping.',
          q:'What was Wren’s plan?', c:['To nap first','To drink tea','To hop around all night'] },
        { text:'At midnight Sprout the hedgehog rolled over and nudged her awake. The whole sky was busy. Stars were sliding across it one after another, quiet as falling snow.',
          q:'Who woke Wren up?', c:['Sprout the hedgehog','Her mother','Luna the owl'] },
        { text:'Wren watched forty-one of them. She meant to watch a hundred. But the grass was warm and Sprout was snoring, and somewhere around the forty-second star, Wren went to sleep smiling.',
          q:'How many stars did Wren watch?', c:['Forty-one','One hundred','Four'] },
      ]},
    ],

    /* ---- Sprout the Hedgehog 🦔 — common ---- */
    sprout: [
      { id:'sprout-seeds', title:'The Seeds That Only Grow at Night', emoji:'🌱', genre:'night', art:['🦔','🌱','💧'], pages:[
        { text:'Sprout the hedgehog kept the strangest garden in the valley. Nothing in it would grow in daylight. Sunshine made his seeds sulk and shut themselves tight.',
          q:'What did sunlight do to Sprout’s seeds?', c:['Made them shut tight','Made them grow fast','Turned them brown'] },
        { text:'So Sprout worked the night shift. He dug by moonlight and watered by starlight, and his long rows of glowing flowers lit the hillside like a small and patient town.',
          q:'When did Sprout work?', c:['At night','At noon','Only in spring'] },
        { text:'One summer a drought came and the well ran dry. Sprout carried water up from the river in a thimble, because a thimble is all a hedgehog can carry, and it took him two hundred trips.',
          q:'What did Sprout carry water in?', c:['A thimble','A bucket','A folded leaf'] },
        { text:'On the two hundredth trip he found Wren, Mo, and Bram waiting at the riverbank with cups, pots, and one very large paw. Nobody had asked them to come. They had simply noticed.',
          q:'Why did his friends come?', c:['They had noticed he needed help','Sprout asked them to','They wanted free flowers'] },
        { text:'The garden lived. That night it glowed brighter than it ever had, and four tired friends lay down right in the middle of it and slept until the sun came along and spoiled everything.',
          q:'Who slept in the garden?', c:['Four tired friends','Only Sprout','Nobody at all'] },
      ]},
      { id:'sprout-pebble', title:'Sprout and the Dragon’s Garden', emoji:'🍅', genre:'dragon', art:['🦔','🍅','🐲'], pages:[
        { text:'A dragon named Pebble wanted to grow tomatoes. This was a problem. Every time she got excited she breathed fire, and tomatoes do not enjoy that at all.',
          q:'What was Pebble’s problem?', c:['She breathed fire on her plants','She had no seeds','It never rained'] },
        { text:'She had burned eleven gardens in a row. The twelfth time, she sat down in the ashes and did something dragons almost never do. She asked somebody for help.',
          q:'How many gardens had she burned?', c:['Eleven','Two','One hundred'] },
        { text:'Sprout the hedgehog came up the hill with a bag of seeds and one instruction: plant at night, keep the air cool, and absolutely no excitement. Pebble promised to stay calm.',
          q:'What was Sprout’s instruction?', c:['Plant at night and stay calm','Water twice a day','Use bigger pots'] },
        { text:'It very nearly worked. Then a small green shoot appeared, and Pebble was so happy that she sneezed a little flame and set her own tail on fire. Sprout put it out with the watering can and said nothing.',
          q:'What set Pebble’s tail on fire?', c:['A happy sneeze','A lightning strike','A dropped candle'] },
        { text:'By autumn there were forty tomatoes, warm from a dragon’s own garden. Pebble ate thirty and gave ten to Sprout, and both of them slept that night with round bellies and dirt under their claws.',
          q:'How many tomatoes did Sprout get?', c:['Ten','Forty','None'] },
      ]},
    ],

    /* ---- Luna the Owl 🦉 — rare ---- */
    luna: [
      { id:'shepherd', title:'The Star Shepherd', emoji:'⭐', genre:'night', art:['🐑','⭐','☁️'], pages:[
        { text:'High on Cloud Hill lived Elsie, the star shepherd. Every evening she opened the sky-gate and let the stars out to graze. Every morning she counted them home. But tonight, one star was missing.',
          q:'What was Elsie’s job?', c:['Star shepherd','Royal baker','Brave knight'] },
        { text:'Elsie saddled her flying sheep, Barnaby, and swooped down to search. They checked the tops of the pine trees. They checked the wishing well. No star anywhere.',
          q:'What kind of animal was Barnaby?', c:['A flying sheep','A horse','A dog'] },
        { text:'Then Barnaby’s wool began to glow. The little star was hiding inside it, warm and cozy! "The sky is so big," the star whispered. "And I am so small."',
          q:'Where was the star hiding?', c:['In Barnaby’s wool','In the well','In a tree'] },
        { text:'Elsie held the star gently. "The sky is big," she agreed. "But you never shine alone. Look." Above them, a thousand stars twinkled back, like a family of night-lights.',
          q:'What did Elsie want the star to know?', c:['It never shines alone','The way home','Stars can’t fall'] },
        { text:'The little star flew up and found its spot beside its friends. Elsie yawned. Barnaby curled up like a cloud. And together they watched the whole sky glow, until Cloud Hill fell fast asleep.',
          q:'Where did the little star fly to?', c:['Its spot beside its friends','The moon','Elsie’s pocket'] },
      ]},
      { id:'luna-mail', title:'Luna and the Night Mail', emoji:'✉️', genre:'night', art:['🦉','✉️','⛈️'], pages:[
        { text:'Luna the owl carried the night mail. While the rest of the world slept, she flew letters from valley to hill, from lighthouse to lonely farm. She had never once been late.',
          q:'What was Luna’s job?', c:['Carrying the night mail','Counting the stars','Guarding the castle'] },
        { text:'One night a storm swallowed the moon. Rain hammered the trees and Luna could not see the road below her. She had one letter left, and it was the most important kind: a get-well letter.',
          q:'What letter did she have left?', c:['A get-well letter','A birthday card','A royal order'] },
        { text:'So Luna listened instead of looking. She heard the river on her left and a rooster who could not tell time on her right. She followed the sounds the way another owl might follow a map.',
          q:'How did Luna find her way?', c:['By listening','By the stars','With a map'] },
        { text:'She landed at a small window where a sick badger lay awake in the dark. Luna dropped the letter onto his blanket. It was from his sister, and it said, "I am coming in the morning."',
          q:'Who was the letter from?', c:['His sister','His mother','The queen'] },
        { text:'The badger read it twice and finally fell asleep smiling. Luna flew home as the storm broke apart above her, tucked in her wings, and slept all day the way the moon does.',
          q:'When did Luna sleep?', c:['All day','At midnight','She did not sleep'] },
      ]},
      { id:'luna-cinder', title:'Luna and the Dragon Who Slept Too Long', emoji:'😴', genre:'dragon', art:['🦉','🐲','💤'], pages:[
        { text:'On the far side of the valley slept a dragon named Cinder. She slept all through the day and all through the night, and nobody in the village could remember ever seeing her awake.',
          q:'How much did Cinder sleep?', c:['Day and night','Only at night','Only at noon'] },
        { text:'The villagers were not frightened. They were worried. A dragon who never wakes up never eats. So they asked Luna the owl, who knew more about sleeping and waking than anyone, to go and look.',
          q:'Why were the villagers worried?', c:['A sleeping dragon never eats','She might burn the fields','She was too loud'] },
        { text:'Luna flew into the cave and landed on Cinder’s enormous warm nose. She listened for a long time. Underneath the snoring there was another sound: a small, sad hum, like someone humming inside a dream.',
          q:'What did Luna hear under the snoring?', c:['A small, sad hum','A ringing bell','Water dripping'] },
        { text:'"She is not sleeping," Luna said. "She is dreaming, and she does not want the dream to end." So Luna did the only sensible thing. She sat on that nose and told Cinder a better story than the dream.',
          q:'What did Luna do?', c:['Told her a story','Poked her awake','Flew away for help'] },
        { text:'Cinder opened one eye, then the other. She ate eleven pumpkins and thanked the whole village twice. And that night, for the first time in years, she slept the ordinary cozy kind of sleep.',
          q:'What kind of sleep did Cinder have that night?', c:['The ordinary cozy kind','A dream she could not leave','No sleep at all'] },
      ]},
    ],

    /* ---- Bram the Bear 🐻 — rare ---- */
    bram: [
      { id:'bram-fort', title:'Sir Bram and the Blanket Fort', emoji:'🛡️', genre:'royal', art:['🐻','🛡️','🛌'], pages:[
        { text:'Sir Bram was the largest knight in the kingdom and also the gentlest. His armor had to be made in three pieces, because no blacksmith alive could carry it in one.',
          q:'How many pieces was Bram’s armor?', c:['Three','One','Ten'] },
        { text:'When the young prince could not sleep, the king called for a wizard, then a doctor, then a very expensive musician. None of it worked. Finally, out of ideas, he called for Sir Bram.',
          q:'Who did the king call last?', c:['Sir Bram','A wizard','A doctor'] },
        { text:'Bram did not bring a spell or a song. He brought every blanket in the castle. Then he built a fort in the middle of the royal bedroom, with a roof of quilts and a door made of velvet curtains.',
          q:'What did Bram bring?', c:['Every blanket in the castle','A magic spell','A book of lullabies'] },
        { text:'Inside, the fort was dark and warm and small, which is the exact opposite of an enormous stone bedroom. The prince crawled in. Bram sat outside like a mountain and hummed one low note.',
          q:'What was the fort like inside?', c:['Dark, warm, and small','Cold and huge','Bright as day'] },
        { text:'The prince was asleep before the third hum. Bram stayed until morning, which was easy, because he fell asleep too, and nobody in that castle was brave enough to wake a knight that size.',
          q:'What happened to Bram?', c:['He fell asleep too','He went home','He guarded all night'] },
      ]},
      { id:'bram-star', title:'Bram and the Winter Star', emoji:'❄️', genre:'night', art:['🐻','❄️','⭐'], pages:[
        { text:'Bears are supposed to sleep all winter. Bram tried. He truly did try. But every single year one thing kept him awake: he did not want to miss the Winter Star.',
          q:'What kept Bram awake?', c:['He did not want to miss the Winter Star','He was hungry','His cave was cold'] },
        { text:'The Winter Star rose once a season, on the coldest night of the year, and it was blue. Bram had heard about it from his grandmother, but he had never actually stayed awake long enough to see it himself.',
          q:'What color is the Winter Star?', c:['Blue','Gold','Red'] },
        { text:'So this year he made a plan. He drank pine tea. He walked in circles. He counted backwards from one thousand, which turned out to be a mistake, because counting is a trap.',
          q:'Why was counting a mistake?', c:['Counting made him sleepy','He lost his place','He could not count that high'] },
        { text:'His eyes were closing when Sprout the hedgehog came rolling into the cave shouting, "IT IS UP! IT IS UP!" Bram stumbled outside, and there it was: a blue star, sitting on the shoulder of the mountain.',
          q:'Who woke Bram up?', c:['Sprout the hedgehog','His grandmother','Luna the owl'] },
        { text:'Bram looked at it for one long quiet minute. Then he shuffled back into his cave, curled up nose to tail, and slept the rest of the winter with a small blue star still glowing behind his eyes.',
          q:'What did Bram do after seeing the star?', c:['Slept the rest of winter','Stayed up all night','Climbed the mountain'] },
      ]},
      { id:'bram-thief', title:'Bram and the Honey Thief', emoji:'🍯', genre:'silly', art:['🐻','🍯','🦔'], pages:[
        { text:'Every autumn Bram filled twelve clay pots with honey and lined them up at the back of his cave, ready for winter. This year, one pot went missing every single night.',
          q:'How many pots did Bram fill?', c:['Twelve','Three','Twenty'] },
        { text:'Bram decided to stay awake and catch the thief. This was difficult, because staying awake is the one thing bears are worst at. He fell asleep four times before midnight.',
          q:'What are bears worst at?', c:['Staying awake','Finding honey','Climbing trees'] },
        { text:'On the fifth try he finally saw them: a line of small hedgehogs, rolling a pot across the floor like a barrel, very slowly and very seriously.',
          q:'Who was taking the honey?', c:['Hedgehogs','Mice','A dragon'] },
        { text:'They were not stealing, exactly. They were taking the pots to old Grandmother Hedgehog, who had no honey at all and was far too proud to ask for any.',
          q:'Who were the pots for?', c:['Grandmother Hedgehog','A king','Their babies'] },
        { text:'Bram carried the last six pots there himself. Then he walked home under a sky full of stars, climbed into his cave, and slept the whole winter with an empty shelf and a full heart.',
          q:'What did Bram do with the last six pots?', c:['Carried them there himself','Hid them away','Ate them all'] },
      ]},
    ],

    /* ---- Puddle the Frog 🐸 — rare ---- */
    puddle: [
      { id:'sneeze', title:'The Castle That Sneezed', emoji:'🏰', genre:'silly', art:['🏰','🤧','🧹'], pages:[
        { text:'Castle Bramblestone was very old and very grumpy. One morning, its towers began to tremble. Then — AH-CHOO! The whole castle sneezed, and the drawbridge flapped like a giant tongue.',
          q:'What did the castle do?', c:['It sneezed','It fell down','It sang a song'] },
        { text:'Princess Rose investigated at once. Knights checked the dungeons. Cooks checked the chimneys. Everyone found the same thing: dust. Hundreds of years of sleepy old dust.',
          q:'What did everyone find?', c:['Dust','Treasure','Mice'] },
        { text:'"A castle this old needs a proper cleaning," said Rose. So the whole kingdom worked together. Knights swept the halls with brooms, and friendly dragons puffed gentle wind through every room.',
          q:'What did the dragons do?', c:['Puffed gentle wind','Burned the dust','Took a nap'] },
        { text:'By sunset, Bramblestone sparkled. The castle gave a happy rumble instead of a sneeze. Its windows glowed warm and gold, as if the castle was smiling.',
          q:'How did the castle feel at sunset?', c:['Happy','Still sick','Grumpy'] },
        { text:'That night, Rose tucked herself into bed. The castle pulled its drawbridge up like a blanket. "Good night, Bramblestone," Rose whispered. And deep in its old stones, the castle purred.',
          q:'What did the castle use as a blanket?', c:['Its drawbridge','A flag','A cloud'] },
      ]},
      { id:'puddle-umbrella', title:'Puddle and the Queen’s Umbrella', emoji:'☂️', genre:'royal', art:['🐸','☂️','👑'], pages:[
        { text:'The queen’s umbrella blew out of the carriage window in a storm and landed, upside down, in the very middle of Puddle the frog’s pond.',
          q:'Where did the umbrella land?', c:['In Puddle’s pond','In a tall tree','On the road'] },
        { text:'Upside down, it made a magnificent boat. Puddle sailed it around the pond for three days and named it The Royal Splash.',
          q:'What did Puddle name the boat?', c:['The Royal Splash','The Green Leaf','The Queen'] },
        { text:'Then the royal guards came looking for it, and Puddle did the honest thing. He sailed The Royal Splash straight up to the bank and handed it over.',
          q:'What did Puddle do?', c:['Handed it over','Hid it in the reeds','Sank it'] },
        { text:'The queen was so pleased that she had a boat built just for him — small, green, and shaped exactly like an umbrella, with his name painted on the side.',
          q:'What did the queen give him?', c:['His own little boat','A gold crown','A bag of coins'] },
        { text:'That night Puddle slept in it, rocking gently in the middle of his pond, under a sky that had finally, completely run out of rain.',
          q:'Where did Puddle sleep?', c:['In his new boat','In the castle','Under a leaf'] },
      ]},
      { id:'puddle-song', title:'The Pond That Sang', emoji:'🎵', genre:'night', art:['🐸','🎵','🌙'], pages:[
        { text:'On summer nights, Puddle’s pond sang. Every frog there knew the tune, though not one of them could remember ever being taught it.',
          q:'When did the pond sing?', c:['On summer nights','At noon','In winter'] },
        { text:'One evening the singing did not start. The whole pond stayed silent, and the silence was so loud that nobody in the valley could get to sleep.',
          q:'What happened one evening?', c:['The singing stopped','It rained hard','The pond froze'] },
        { text:'Puddle went looking and found the youngest frog sitting alone in the reeds, far too shy to begin. Every single frog had been waiting for him.',
          q:'Why had the song not started?', c:['The youngest frog was too shy','The frogs forgot the tune','A heron was watching'] },
        { text:'So Puddle sang the first note himself — a wobbly, cracked, genuinely terrible note. The young frog laughed out loud, and then joined in, and then the whole pond did.',
          q:'What was Puddle’s first note like?', c:['Wobbly and terrible','Perfect','Very quiet'] },
        { text:'The valley slept beautifully that night. And every summer since, the pond’s song has started with one deliberately dreadful note, in Puddle’s honor.',
          q:'How does the song start now?', c:['With one dreadful note','With a drum','In total silence'] },
      ]},
    ],

    /* ---- Ziggy the Dragon 🐲 — epic ---- */
    ziggy: [
      { id:'ember', title:'The Dragon Afraid of the Dark', emoji:'🐲', genre:'dragon', art:['🐲','🫙','⭐'], pages:[
        { text:'Ember was the biggest dragon on the mountain. He could breathe fire hotter than a hundred campfires. But Ember had a secret. He was afraid of the dark.',
          q:'What was Ember’s secret?', c:['He was afraid of the dark','He could not fly','He hated gold'] },
        { text:'Every night, Ember kept a small flame burning on his nose like a night-light. But when he fell asleep, the flame went out. Then he would wake up in the dark and worry until morning.',
          q:'What happened when Ember fell asleep?', c:['His flame went out','He snored fire','He flew away'] },
        { text:'Ember visited the wizard Marla, who lived in a crooked tower. "I need a light that never sleeps," he said. Marla smiled and handed him an empty jar. "Then we must go catch some starlight."',
          q:'What did Marla hand Ember?', c:['An empty jar','A candle','A map'] },
        { text:'They flew above the clouds, where the stars hum softly. Marla held out the jar, and one curious little star floated right in. It glowed like a tiny silver lantern.',
          q:'What floated into the jar?', c:['A little star','A firefly','The moon'] },
        { text:'That night, Ember set the star jar beside his pillow. The gentle light hummed him to sleep. And the little star felt lucky — it had always wanted to hear a dragon snore.',
          q:'How did the little star feel?', c:['Lucky','Scared','Angry'] },
      ]},
      { id:'ziggy-echo', title:'Ziggy and the Cave of Echoes', emoji:'🏔️', genre:'dragon', art:['🐲','🏔️','📣'], pages:[
        { text:'Ziggy was the smallest dragon in the mountains, and the other dragons never let him forget it. When he roared his very best roar, it came out about the size of a hiccup.',
          q:'How big was Ziggy’s roar?', c:['About the size of a hiccup','Enormous','He had no roar at all'] },
        { text:'One evening he wandered into a cave he had never seen before. He said "hello" very quietly, and the cave said HELLO back, loud enough to shake dust down off the ceiling.',
          q:'What did the cave do?', c:['It echoed loudly','It stayed silent','It collapsed'] },
        { text:'Ziggy spent an entire hour in there roaring. Inside that cave his little hiccup of a roar came back as thunder. He decided, right then and there, that he lived in this cave now.',
          q:'What did Ziggy decide?', c:['To live in the cave','To fight the other dragons','To keep the cave secret'] },
        { text:'But an echo is only a borrowed voice. After a week Ziggy noticed that he felt big inside the cave and smaller than ever outside it. So he left, and leaving was the brave part.',
          q:'Why did Ziggy leave?', c:['He only felt big inside the cave','He got bored','The cave collapsed'] },
        { text:'He still visits sometimes, mostly to say good night and hear the whole mountain say it back. Then he flies home, curls up on his own rock, and snores in tiny smoke rings.',
          q:'Why does Ziggy still visit the cave?', c:['To say good night and hear it back','To practice roaring','To hide from dragons'] },
      ]},
      { id:'ziggy-knight', title:'The Knight Who Was Scared of Dragons', emoji:'⚔️', genre:'royal', art:['🐲','⚔️','💌'], pages:[
        { text:'Sir Oswald had a sword, a shield, a very fine horse, and one small problem. Dragons terrified him. He had become a knight more or less by accident and had been hoping nobody would notice.',
          q:'What was Sir Oswald’s problem?', c:['Dragons terrified him','His horse was slow','He had no sword'] },
        { text:'When the king sent him up the mountain, Oswald rode extremely slowly and gave serious thought to several other careers. At the mouth of the cave he shut his eyes and shouted his challenge at the ceiling.',
          q:'What did Oswald do at the cave?', c:['Shut his eyes and shouted','Ran away','Drew his sword'] },
        { text:'A voice answered from somewhere near his left boot. "Could you shout a bit quieter?" Oswald looked down. Ziggy the dragon was roughly the size of a large cat, and he was holding a book.',
          q:'How big was Ziggy?', c:['About the size of a large cat','As big as a house','As big as a horse'] },
        { text:'They talked for three hours. It turned out Ziggy was scared of knights, and Oswald was scared of dragons, and both of them agreed this was extremely funny once you said it out loud.',
          q:'What was Ziggy scared of?', c:['Knights','The dark','Nothing at all'] },
        { text:'Oswald rode home and told the king that the mountain was perfectly safe. Then he wrote to Ziggy every week for the rest of his life, and Ziggy read every letter twice before bed.',
          q:'What did Oswald tell the king?', c:['That the mountain was safe','That there was a huge dragon','That he had lost his sword'] },
      ]},
    ],

    /* ---- Nova the Unicorn 🦄 — epic ---- */
    nova: [
      { id:'nova-last', title:'Nova and the Last Star of Summer', emoji:'⭐', genre:'night', art:['🦄','⭐','🌾'], pages:[
        { text:'On the final night of summer one star always comes down to the meadow to say goodbye. Only unicorns can hear it arrive, and only then if they are listening properly.',
          q:'When does the star come down?', c:['On the last night of summer','Every single night','In the middle of winter'] },
        { text:'Nova had met it every year since she was a foal. The two of them would sit together in the tall grass, and the star would tell her what the whole summer had looked like from up there.',
          q:'What did the star tell Nova?', c:['What summer looked like from above','Where it came from','What would happen next year'] },
        { text:'This year the star was late. Nova waited well past midnight in an empty field, and for the first time she began to wonder whether it might simply not come at all.',
          q:'What happened this year?', c:['The star was late','The star came early','It rained all night'] },
        { text:'When it finally arrived it was dimmer than before. "I am an old star," it said. "I will not be coming next summer. So I brought you something instead." It left behind a single spark, no bigger than a seed.',
          q:'What did the star leave behind?', c:['A spark the size of a seed','A letter','A small stone'] },
        { text:'Nova planted it and slept beside it in the grass. And in the spring a small new star pushed its way up out of the ground and asked, in a very small voice, what summer looks like from down here.',
          q:'What grew from the spark?', c:['A small new star','A flower','A tree'] },
      ]},
      { id:'nova-wish', title:'Nova and the Queen’s Wish', emoji:'🌟', genre:'royal', art:['🦄','👑','🛏️'], pages:[
        { text:'The queen had everything: a golden crown, nine castles, and a bed with sixteen pillows on it. And still she could not sleep. So at last she sent for a unicorn, because unicorns grant one wish.',
          q:'What could the queen not do?', c:['Sleep','Eat','Ride a horse'] },
        { text:'Nova arrived at midnight and stood at the foot of the enormous royal bed. "You may have one wish," she said. "So do make it a good one."',
          q:'How many wishes did Nova offer?', c:['One','Three','None'] },
        { text:'The queen wished for a sleeping potion, a quieting spell, and a better mattress, all in the same breath. Nova politely pointed out that this was three wishes and also all of them were wrong.',
          q:'What did Nova say about the wishes?', c:['That was three wishes and all wrong','That she would grant them at once','That she needed gold first'] },
        { text:'Instead Nova asked what the queen thought about when the room went dark. Everything, said the queen. All of it. Every single thing at once. Nova nodded slowly. "Then wish for a smaller night."',
          q:'What did Nova tell her to wish for?', c:['A smaller night','A bigger bed','A quieter castle'] },
        { text:'So the queen wished to think about exactly one thing: a horse she had loved when she was six years old. She thought about that horse and nothing else, and she was asleep before Nova reached the door.',
          q:'What did the queen think about?', c:['A horse she loved as a child','Her golden crown','Everything she had to do'] },
      ]},
      { id:'nova-dream', title:'Nova and the Dream That Would Not End', emoji:'💭', genre:'night', art:['🦄','🌸','💭'], pages:[
        { text:'In the dream meadow, dreams grow like flowers. Every morning they fold themselves shut and wait for the next night, and Nova is the one who checks on them.',
          q:'What grows in the dream meadow?', c:['Dreams','Apples','Stars'] },
        { text:'One morning, a single dream stayed wide open. It belonged to a boy in the village who had dreamed of flying and did not want to wake up.',
          q:'What had the boy dreamed of?', c:['Flying','Swimming','A dragon'] },
        { text:'Nova knew the rule: a dream left open too long goes grey and stops working. She had to close it. But she also knew exactly how it felt to want to stay.',
          q:'What happens to a dream left open?', c:['It goes grey','It grows bigger','It floats away'] },
        { text:'So she made a bargain with it instead. She folded the dream carefully, the way you fold a letter, and promised to plant it again the very next night — same boy, same sky.',
          q:'What did Nova promise?', c:['To plant it again the next night','To keep it forever','To give it to someone else'] },
        { text:'The dream folded itself willingly after that. And the boy woke smiling, with no memory of flying at all — only a strange, happy certainty that tonight would be worth waiting for.',
          q:'What did the boy wake up with?', c:['A feeling that tonight would be good','A memory of flying','Nothing at all'] },
      ]},
    ],

    /* ---- Willow the Dream Wolf 🐺 — legendary ---- */
    willow: [
      { id:'willow-ranout', title:'The Night the Dreams Ran Out', emoji:'💭', genre:'night', art:['🐺','💭','❄️'], pages:[
        { text:'Willow the dream wolf had walked the same route for two hundred years: down the lane, past the mill, around the orchard, and home before dawn. She had never once missed a night.',
          q:'How long had Willow walked her route?', c:['Two hundred years','One year','Since the spring'] },
        { text:'Then came a night when the dream meadow was bare. Every dream had been used up, and the new ones would not be ready until the frost lifted.',
          q:'Why were there no dreams?', c:['They had all been used','A storm took them','Willow lost them'] },
        { text:'Willow did the only thing she could think of. She went from house to house and gave each sleeping person one of her OWN dreams instead.',
          q:'What did Willow give people?', c:['Her own dreams','Warm blankets','Quiet songs'] },
        { text:'And that is why, on one strange winter night long ago, every single person in that village dreamed of running through deep snow on four fast legs, and woke up happy without knowing why.',
          q:'What did everyone dream of?', c:['Running on four legs','Flying','The sea'] },
        { text:'Willow herself had nothing left to dream with. So she lay down under the pine and listened to the whole village breathing, which — she decided — was very nearly as good.',
          q:'What did Willow do instead of dreaming?', c:['Listened to the village breathing','Stayed awake sadly','Walked the route again'] },
      ]},
      { id:'willow-tom', title:'Willow and the Boy Who Would Not Sleep', emoji:'🌳', genre:'night', art:['🐺','🧦','🌳'], pages:[
        { text:'There was a boy in the village named Tom who fought sleep every single night, because he was completely certain something interesting would happen the moment he closed his eyes.',
          q:'Why did Tom fight sleep?', c:['He thought he would miss something','He was frightened','He was never tired'] },
        { text:'Willow watched him from the garden for a week. On the eighth night she did something dream wolves are absolutely not supposed to do. She let him see her.',
          q:'What did Willow do on the eighth night?', c:['Let him see her','Howled at the window','Went somewhere else'] },
        { text:'Tom was not frightened in the least. He climbed out of the window in his socks and asked, extremely seriously, whether he might come along on the rounds.',
          q:'What did Tom ask?', c:['To come along on the rounds','For a bedtime story','For something to eat'] },
        { text:'So they walked the whole route together — the lane, the mill, the orchard — while Willow explained her work in a low voice. By the orchard, Tom was walking with his eyes shut.',
          q:'Where was Tom walking with his eyes shut?', c:['By the orchard','At the mill','In the lane'] },
        { text:'She carried him home on her back and posted him gently through his window. Tom never did find out what he had been missing all those nights. It was this. It was always this.',
          q:'How did Tom get home?', c:['On Willow’s back','He walked himself','His father carried him'] },
      ]},
      { id:'willow-dragon', title:'Willow and the Dragon’s Bad Dream', emoji:'🐉', genre:'dragon', art:['🐺','🐉','⛰️'], pages:[
        { text:'Dreams are usually small and quiet. A dragon’s dream is neither. When the old dragon on the ridge had a bad one, the ground shook for a mile in every direction.',
          q:'What happens when a dragon has a bad dream?', c:['The ground shakes','It starts raining','The sky goes dark'] },
        { text:'The village had learned to hold onto their cups and wait it out. But Willow the dream wolf climbed the ridge, because a bad dream is a bad dream no matter how large the dreamer.',
          q:'Why did Willow climb the ridge?', c:['A bad dream is a bad dream','To hide from the shaking','To chase the dragon off'] },
        { text:'The dream was about being small. In it, the great dragon was a hatchling again, and nobody in the whole wide world could hear him calling.',
          q:'What was the dream about?', c:['Being small and unheard','Losing his gold','A brave knight'] },
        { text:'Willow could not chase away a dream that size. So instead she lay down against the dragon’s enormous warm side and howled — one long, low note that said, plainly, I hear you.',
          q:'What did Willow do?', c:['Howled one long note','Woke him up','Ran back down'] },
        { text:'The shaking stopped. The dragon slept right through until noon, which he had not managed in years, and Willow slept beside him, the pair of them warm as an oven.',
          q:'How long did the dragon sleep?', c:['Until noon','For a minute','All week'] },
      ]},
    ],

    /* ---- Sir Biscuit the Pup 🐶 — legendary ---- */
    biscuit: [
      { id:'biscuit-school', title:'The Day Sir Biscuit Left Knight School', emoji:'🏅', genre:'royal', art:['🐶','⚔️','🏅'], pages:[
        { text:'Sir Biscuit failed knight school on a Tuesday. He failed the sword test, the shouting test, and — most spectacularly of all — the looking-fierce test, in which he came last out of forty.',
          q:'Which test did he fail most spectacularly?', c:['The looking-fierce test','The sword test','The riding test'] },
        { text:'The headmaster was kind about it. "You are a very good pup," he said, "but a knight must be frightening, and you are the precise opposite of frightening."',
          q:'What did the headmaster say a knight must be?', c:['Frightening','Very tall','Extremely fast'] },
        { text:'So Biscuit walked home along the river, and that is where he found the miller’s daughter stuck in the mud up to her knees, with nobody else for a mile in either direction.',
          q:'Who did he find at the river?', c:['The miller’s daughter','A lost knight','A small dragon'] },
        { text:'It took him two hours. He dug with his paws, he pulled at her sleeve, and he did not once stop to wonder whether this was a properly knightly sort of task.',
          q:'How long did it take him?', c:['Two hours','Two minutes','All night'] },
        { text:'The king heard about it and knighted him the following spring — the only knight in the kingdom who never did learn to look fierce. Sir Biscuit slept that night with his medal in his mouth.',
          q:'What did Sir Biscuit sleep with?', c:['His medal in his mouth','His sword','A large bone'] },
      ]},
      { id:'biscuit-banquet', title:'Sir Biscuit and the Banquet Disaster', emoji:'🍽️', genre:'silly', art:['🐶','🍽️','🐕'], pages:[
        { text:'The kingdom’s grandest banquet was ruined eleven minutes in, when Sir Biscuit — trying very hard indeed to sit still — thumped his happy tail against the leg of the head table.',
          q:'What did Sir Biscuit hit with his tail?', c:['The table leg','A window','The king’s chair'] },
        { text:'The table wobbled. The soup tureen slid. Four hundred meatballs rolled off the end and across the polished floor in every direction at once.',
          q:'What rolled onto the floor?', c:['Four hundred meatballs','All the soup bowls','The wedding cake'] },
        { text:'What happened next was not really Sir Biscuit’s fault, though everyone agreed it was extremely funny: seven other dogs came in through the open door.',
          q:'Who came in through the door?', c:['Seven other dogs','The palace guards','The queen'] },
        { text:'The banquet became a hunt. Guests climbed onto their chairs. A duke was thoroughly licked. The kitchen simply sent up more meatballs, having run entirely out of ideas.',
          q:'What did the kitchen send up?', c:['More meatballs','Cold water','A large bill'] },
        { text:'By midnight the floor was clean, in the loosest possible sense of the word, and eight tired dogs lay asleep in a heap under the head table. The king stepped over them very carefully on his way to bed.',
          q:'Where were the dogs asleep?', c:['Under the head table','Out in the kitchen','Outside the gate'] },
      ]},
      { id:'biscuit-watch', title:'Sir Biscuit’s Long Watch', emoji:'🕯️', genre:'night', art:['🐶','🕯️','👑'], pages:[
        { text:'When the old king fell ill, the castle filled up with doctors and worried voices, and nobody quite knew what to do with themselves. Sir Biscuit knew exactly what to do.',
          q:'What happened to the old king?', c:['He fell ill','He went travelling','He lost his crown'] },
        { text:'He lay down across the doorway of the king’s chamber, put his chin on his paws, and stayed there. He did not eat much. He did not move at all.',
          q:'Where did Sir Biscuit lie down?', c:['Across the doorway','On the king’s bed','Out in the garden'] },
        { text:'For nine nights the candle burned in that room, and for nine nights the small brown knight kept watch outside it, which is a kind of bravery nobody teaches at knight school.',
          q:'How many nights did he keep watch?', c:['Nine','Two','Thirty'] },
        { text:'On the tenth morning the king sat up in bed and asked for toast. The whole castle cheered. Sir Biscuit thumped his tail twice and then, at last, fell fast asleep on the doorstep.',
          q:'What did the king ask for?', c:['Toast','His crown','A fast horse'] },
        { text:'They carried him inside and set him on a cushion by the fire, where he stayed for two entire days, dreaming — everyone agreed — of something very good indeed.',
          q:'Where did they put Sir Biscuit?', c:['On a cushion by the fire','Out in the kennel','On the throne'] },
      ]},
    ],

    /* ---- Twinkle the Star Sprite 🌟 — mythic ---- */
    twinkle: [
      { id:'twinkle-fell', title:'The Star That Fell', emoji:'🌾', genre:'night', art:['🌟','🌾','🐈'], pages:[
        { text:'Stars are fastened into the sky with something very like a stitch, and Twinkle’s came loose on an ordinary Tuesday evening, with no warning at all.',
          q:'How are stars held in the sky?', c:['With something like a stitch','With strong rope','With glue'] },
        { text:'The fall took most of the night. Twinkle passed a startled goose, three clouds and a weather vane, and landed in the reeds beside a mill pond with a small, undignified splash.',
          q:'Where did Twinkle land?', c:['In the reeds by a mill pond','On a mountain top','In a walled garden'] },
        { text:'On the ground, a star is about the size of a lantern and roughly as useful. Twinkle could not fly, could not float, and — most alarming of all — was slowly going dim.',
          q:'How big is a star on the ground?', c:['About the size of a lantern','As big as a house','As small as a pea'] },
        { text:'The miller’s cat found Twinkle at dawn. Cats are not famous for kindness, but this one sat down, curled right around the cold little star, and stayed until the shivering stopped.',
          q:'Who found Twinkle?', c:['The miller’s cat','The miller himself','A farm dog'] },
        { text:'By morning Twinkle was glowing steadily again — not bright enough for the sky, but bright enough for a barn. The cat carried the little star inside on a bed of clean straw, and the two of them slept there until well past noon.',
          q:'How bright was Twinkle by morning?', c:['Bright enough for a barn','As bright as ever','Not glowing at all'] },
      ]},
      { id:'twinkle-winter', title:'Twinkle and the Winter of Small Kindnesses', emoji:'❄️', genre:'night', art:['🌟','❄️','🫖'], pages:[
        { text:'Twinkle spent that whole winter in the mill, and learned something no star up in the sky ever learns: what light is actually FOR.',
          q:'What did Twinkle learn?', c:['What light is for','How to fly again','How to sing'] },
        { text:'Twinkle lit the miller’s workbench when his lamp oil ran out in February. Twinkle sat in the window on the night the doctor came, so that he could find the door through the snow.',
          q:'Why did Twinkle sit in the window?', c:['So the doctor could find the door','To watch the snow fall','To keep warm'] },
        { text:'Twinkle went out into the fields in the worst of the storms, tucked into a boy’s coat pocket, while they searched for sheep that had wandered off — and they found every single one.',
          q:'What were they searching for?', c:['Sheep that had wandered off','A lost child','Dry firewood'] },
        { text:'None of it was grand. Nobody wrote any of it down. A star in the sky is admired by thousands; a star in a coat pocket is simply used, over and over, by people far too busy to say thank you.',
          q:'How was Twinkle treated on the ground?', c:['Simply used, over and over','Kept on a shelf','Admired by crowds'] },
        { text:'And yet by the end of that winter, Twinkle had not once wanted to leave. It surprised everybody, and it surprised Twinkle most of all, curled up asleep each night in a teacup by the fire.',
          q:'Where did Twinkle sleep?', c:['In a teacup by the fire','Up in the barn','Back in the sky'] },
      ]},
      { id:'twinkle-climb', title:'The Long Climb Home', emoji:'🪜', genre:'night', art:['🌟','🪜','🌄'], pages:[
        { text:'In spring, the sky sent for Twinkle. A ladder of light came down through the mill window one evening, and everybody in that house understood at once what it meant.',
          q:'What came down through the window?', c:['A ladder of light','A white bird','The moon itself'] },
        { text:'The miller said nothing at all and went outside. The boy cried, which he was embarrassed about. The cat, who had never once admitted to caring, sat down heavily on Twinkle’s foot.',
          q:'What did the cat do?', c:['Sat on Twinkle’s foot','Ran out of the room','Went to sleep'] },
        { text:'Twinkle climbed anyway, because that is what the story of a star is, and because the sky had been waiting a very long time. The climb took until nearly dawn.',
          q:'How long did the climb take?', c:['Until nearly dawn','Only a moment','Three whole days'] },
        { text:'The old stitch was mended and Twinkle was fastened back into place — a little dimmer than the others, a little scuffed, and unmistakably changed by one winter spent being useful.',
          q:'How was Twinkle different now?', c:['Dimmer and scuffed','Much bigger','Brighter than all the rest'] },
        { text:'You can find that star tonight, low over the mill, refusing to twinkle in time with the others. It has somewhere particular to shine. It has never once looked away.',
          q:'Where is that star now?', c:['Low over the mill','Right beside the moon','Nobody knows'] },
      ]},
    ],
  },
};

/* ---------------------------------------------------------------------
   THE SHARED SHELF
   ---------------------------------------------------------------------
   Since R2B/E3 a kid can read to ANY critter in the collection, not just
   the twelve this library was written for. Most books here star a named
   bedtime critter and would make no sense read to a zebra — but a
   handful are plain fairy tales with nobody from the den in them, and
   those are the shelf every other critter gets.

   Listed by id rather than moved, so the critters who own them keep them
   too — a book can sit on two shelves. Deliberately excluded: 'sneeze'
   (names Bram) and anything else naming one of the twelve.

   Adding a book here is a pure content edit: write it with no named
   critter and add its id.                                              */
export const SHARED_STORY_IDS = {
  1: ['knight', 'moonsock', 'frog', 'roar'],
  2: ['backwards', 'shepherd', 'ember'],
};

/** Every book in a level, flattened — the lookup behind the shared shelf. */
function allAtLevel(level){
  return Object.values(STORIES[level] || {}).flat();
}

/* The shelf for one critter: their own books, favourite genre first so the
   ⭐ marker is easy to spot. Books belonging to ANOTHER named critter never
   appear; a critter with no books of its own reads the shared shelf. */
export function storiesFor(critter, level){
  const lvl = STORIES[level] ? level : 1;
  const own = (STORIES[lvl] || {})[critter.legacyId || critter.id];
  const mine = own && own.length
    ? own
    : allAtLevel(lvl).filter(s => (SHARED_STORY_IDS[lvl] || []).includes(s.id));
  return [ ...mine.filter(s => s.genre === critter.fav),
           ...mine.filter(s => s.genre !== critter.fav) ];
}
