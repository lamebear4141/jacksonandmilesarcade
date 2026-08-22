/* =====================================================================
   CHARACTER HOME — what a kid lands on after their PIN.

   The header card is their character: avatar, level bar, the purse
   (coins, plus 🧱 bricks and ⚡ sparks from the pillar economy),
   streak, pet. Below it, five tabs:

     PLAY         the game grid, grouped, with the economy taught in labels
     LOCKER       equip owned skins & pets, browse the 80-critter collection
     COLLECTIONS  the eight themed sets, badges, and who-has-what hints
     SHOP         buy skins & pets — locked items stay visible as goals
     TRADE    structured sibling trading, no text input anywhere
     🏆       the family leaderboard

   index.html mounts this once a kid is picked; each tab lives in its own
   module beside this one.
   ===================================================================== */
import {
  GAMES, SKINS, PETS, levelFromXp,
  PRACTICE_POWER, practicePowerNow, practicePowerRested,
} from './catalog.js';
import { isGuestKid, loadCharacter, listTrades } from '../firebase-config.js';
import { canPointerLock } from './arcade-shell.js';
import { el, fmt, sectionTitle } from './widgets.js';
import { renderLocker } from './locker.js';
import { renderCollections } from './collections.js';
import { renderShop } from './shop.js';
import { renderTrade } from './trade.js';
import { renderLeaderboard } from './leaderboard.js';

const TABS = [
  { id: 'play',        label: 'PLAY',        render: renderPlay },
  { id: 'locker',      label: 'LOCKER',      render: renderLocker },
  { id: 'collections', label: 'COLLECTIONS', render: renderCollections },
  { id: 'shop',        label: 'SHOP',        render: renderShop },
  { id: 'trade',  label: 'TRADE',  render: renderTrade },
  { id: 'board',  label: '\u{1F3C6}', render: renderLeaderboard },
];

export async function mountHome(container, kid) {
  container.innerHTML = '';
  const head = el('div', { class: 'ac-card ac-card--wide ac-home-head', text: 'Loading your character…' });
  const tabsBar = el('div', { class: 'ac-hometabs' });
  const panel = el('div', { class: 'ac-homepanel' });
  container.append(head, tabsBar, panel);

  const ctx = {
    kid,
    guest: isGuestKid(kid.id),
    character: null,
    // How many offers are waiting on this kid. Read once on mount and
    // refreshed after any trade action — NEVER polled: a red dot that
    // appears while a kid is mid-game is an interruption, not a feature.
    pendingTrades: 0,
    /** Re-read the character and repaint the header — every tab calls
        this after anything that moves coins or items. */
    async reload() {
      ctx.character = await loadCharacter(kid.id);
      renderHead();
    },
    /** The red count badge on the TRADE tab, plus a smaller one on the
        avatar so a kid parked on PLAY still notices. */
    paintTradeDot() {
      const n = ctx.pendingTrades || 0;
      const tab = tabsBar.querySelector('[data-tab="trade"]');
      if (tab) {
        tab.querySelector('.ac-dot')?.remove();
        if (n > 0) tab.append(el('span', { class: 'ac-dot ac-dot--pulse', text: String(n) }));
      }
      const stage = head.querySelector('.ac-stage');
      if (stage) {
        stage.querySelector('.ac-dot')?.remove();
        if (n > 0) stage.append(el('span', { class: 'ac-dot ac-dot--pulse ac-dot--avatar', text: String(n) }));
      }
    },
    async show(tabId) {
      [...tabsBar.children].forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tabId));
      panel.innerHTML = '';
      panel.append(el('p', { class: 'ac-sub', text: 'Loading…' }));
      const tab = TABS.find((t) => t.id === tabId);
      try {
        // Re-read the character on every tab switch so a run finished in
        // a game tab, or a sibling's accepted trade, is already reflected
        // here. One small doc read — cheap at family scale, never stale.
        await ctx.reload();
        const frag = document.createDocumentFragment();
        await tab.render(frag, ctx);
        panel.innerHTML = '';
        panel.append(frag);
        // renderTrade refreshes ctx.pendingTrades as a side effect of the
        // read it already does, so leaving the tab clears the dot.
        ctx.paintTradeDot();
      } catch (e) {
        panel.innerHTML = '';
        panel.append(el('p', { class: 'ac-sub', text: 'That didn’t load — check the internet and try the tab again.' }));
      }
    },
  };

  function renderHead() {
    const c = ctx.character;
    const info = levelFromXp(c.xp || 0);
    const skin = SKINS.find((s) => s.id === c.skin) || SKINS[0];
    const pet = PETS.find((p) => p.id === c.pet);
    head.innerHTML = '';
    head.append(
      el('div', { class: 'ac-home-head__row' },
        // The hero stage: avatar on a warm-cream disc, level pinned
        // top-left, pet peeking out bottom-right.
        el('div', { class: 'ac-stage' },
          el('div', { class: 'ac-avatar ac-floaty', text: skin.g }),
          el('span', { class: 'ac-stage__lvl', text: `LVL ${info.level}` }),
          pet && pet.id !== 'none' ? el('span', { class: 'ac-stage__pet', title: pet.n, text: pet.g }) : null,
        ),
        el('div', { class: 'ac-home-head__id' },
          el('div', { class: 'ac-home-head__name', text: kid.nickname.toUpperCase() }),
          ctx.guest ? el('div', { class: 'ac-home-head__guest', text: 'Guest · saves to this device only' }) : null,
        ),
      ),
      el('div', { class: 'ac-xp' },
        el('div', { class: 'ac-xp__label' },
          el('span', { text: `Level ${info.level}` }),
          el('span', { text: `${fmt(info.into)}/${fmt(info.need)} XP` }),
        ),
        el('div', { class: 'ac-xpbar' },
          el('div', { class: 'ac-xpbar__fill', style: `width:${Math.min(100, Math.round(info.into / info.need * 100))}%` }),
        ),
      ),
      practiceMeter(c),
      el('div', { class: 'ac-home-stats' },
        el('span', { class: 'coins', text: `\u{1FA99} ${fmt(c.coins)}` }),
        el('span', { class: 'bricks', title: 'Bricks — earned by practising', text: `\u{1F9F1} ${fmt(c.wallet?.bricks)}` }),
        el('span', { class: 'sparks', title: 'Sparks — earned by playing',    text: `\u26A1 ${fmt(c.wallet?.sparks)}` }),
        el('span', { text: c.dayStreak > 0 ? `\u{1F525} ${c.dayStreak}-day streak` : '\u{1F525} Play today to start a streak!' }),
      ),
    );
  }

  TABS.forEach((t) => tabsBar.append(
    el('button', { class: 'ac-hometab', type: 'button', 'data-tab': t.id, text: t.label, onClick: () => ctx.show(t.id) }),
  ));

  try {
    // One extra cheap read alongside the character so the dot is right on
    // the FIRST paint, not after a tab switch. Guests have no siblings, so
    // listTrades short-circuits for them.
    const [character, trades] = await Promise.all([
      loadCharacter(kid.id),
      listTrades(kid.id).catch(() => ({ incoming: [], outgoing: [] })),
    ]);
    ctx.character = character;
    ctx.pendingTrades = trades.incoming.length;
  } catch (e) {
    head.textContent = 'Couldn’t load your character — check the internet and refresh.';
    return;
  }
  renderHead();
  ctx.paintTradeDot();
  // A game's "My Character" button can deep-link a tab (index.html#locker),
  // so a kid landing here straight off a run sees what they just won.
  const wanted = (location.hash || '').replace('#', '');
  ctx.show(TABS.some((t) => t.id === wanted) ? wanted : 'play');
}

/* =====================================================================
   PRACTICE POWER — the one meter that can go down.

   It is deliberately NOT called luck: what it measures is the child's
   own consistency, and the copy says so, because the point of the whole
   thing is to teach that sticking with something is what earns the good
   stuff.

   Decay is stated once, here, as a fact about the meter — never as an
   alert, never on a game screen, and never with a countdown. A child
   should never learn that there is a clock running against them.
   ===================================================================== */
function practiceMeter(c) {
  const value  = practicePowerNow(c);
  const rested = practicePowerRested(c);
  const pct    = Math.round(value / PRACTICE_POWER.max * 100);
  const full   = value >= PRACTICE_POWER.max;
  const hint = rested > 0
    ? 'Your Practice Power rested while you were away. One practice game today brings it right back! \u{1F4AA}'
    : full
      ? 'FULL POWER! The rarest critters are looking for you. \u{1F4AA}'
      : 'Practise today to build it up — stronger power, rarer critters!';
  return el('div', { class: 'ac-power' },
    el('div', { class: 'ac-power__top' },
      el('span', { class: 'ac-power__name', text: '\u{1F4AA} PRACTICE POWER' }),
      el('span', { class: 'ac-power__num', text: String(value) }),
    ),
    el('div', { class: 'ac-power__bar' },
      el('div', {
        class: 'ac-power__fill' + (full ? ' is-full' : ''),
        style: `width:${pct}%`,
      }),
    ),
    el('p', { class: 'ac-power__hint', text: hint }),
  );
}

/* =====================================================================
   PLAY — the game grid, grouped so the economy teaches itself.
   Always phrased as a bonus on practice games, never a penalty on fun
   ones, and no tile is ever locked.
   ===================================================================== */
const SECTIONS = [
  { id: 'practice', title: 'PRACTICE · EARNS 4× XP' },
  { id: 'fun',      title: 'JUST FOR FUN' },
  { id: 'bigkid',   title: 'BIG KID · NEEDS A COMPUTER' },
];

function renderPlay(panel, ctx) {
  for (const section of SECTIONS) {
    const games = Object.entries(GAMES).filter(([, g]) => g.section === section.id);
    if (!games.length) continue;
    panel.append(sectionTitle(section.title));
    const grid = el('div', { class: 'ac-grid' });
    for (const [id, g] of games) grid.append(gameTile(id, g));
    panel.append(grid);
  }
  panel.append(el('p', {
    class: 'ac-sub ac-play-note',
    text: '⚡ Practice games earn 4× the XP and 🧱 bricks. Play ANY game well and the bonus vault pays 🪙 coins!',
  }));
}

function gameTile(id, g) {
  const badges = el('span', { class: 'ac-badges' },
    el('span', { class: 'ac-badge ac-badge--quiet', text: g.grades }),
    g.kind === 'learn' ? el('span', { class: 'ac-badge', text: '⚡ 4× XP' }) : null,
  );

  // Harvest Night needs Pointer Lock, which no mobile browser has. A real
  // capability check — not a badge — so a tablet never loads a game that
  // cannot take input. The tile stays visible: dimmed, never hidden.
  if (g.needsMouse && !canPointerLock()) {
    return el('div', { class: 'ac-tile ac-tile--unavailable' },
      el('span', { class: 'ac-tile__emoji', text: g.emoji }),
      el('span', { class: 'ac-tile__name', text: g.name }),
      el('span', { class: 'ac-tile__blurb', text: 'This one needs a computer with a mouse — try it on the laptop!' }),
      badges,
    );
  }

  // The featured tile bobs gently, out of sync with the hero avatar.
  const cls = 'ac-tile' + (g.feature ? ' ac-tile--feature ac-floaty' : '') + (g.tileClass ? ' ' + g.tileClass : '');
  return el('a', { class: cls, href: g.href, style: g.feature ? 'animation-delay:1.2s' : null },
    el('span', { class: 'ac-tile__emoji', text: g.emoji }),
    el('span', { class: 'ac-tile__name', text: g.feature ? g.name.toUpperCase() : g.name }),
    g.feature && g.blurb ? el('span', { class: 'ac-tile__blurb', text: g.blurb }) : null,
    badges,
  );
}
