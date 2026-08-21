/* =====================================================================
   CHARACTER HOME — what a kid lands on after their PIN.

   The header card is their character: avatar, level bar, coin purse,
   streak, pet. Below it, five tabs:

     PLAY     the game grid, grouped, with the economy taught in labels
     LOCKER   equip owned skins & pets, browse the 60-sprite collection
     SHOP     buy skins & pets — locked items stay visible as goals
     TRADE    structured sibling trading, no text input anywhere
     🏆       the family leaderboard

   index.html mounts this once a kid is picked; each tab lives in its own
   module beside this one.
   ===================================================================== */
import { GAMES, SKINS, PETS, levelFromXp } from './catalog.js';
import { isGuestKid, loadCharacter } from '../firebase-config.js';
import { canPointerLock } from './arcade-shell.js';
import { el, fmt, sectionTitle } from './widgets.js';
import { renderLocker } from './locker.js';
import { renderShop } from './shop.js';
import { renderTrade } from './trade.js';
import { renderLeaderboard } from './leaderboard.js';

const TABS = [
  { id: 'play',   label: 'PLAY',   render: renderPlay },
  { id: 'locker', label: 'LOCKER', render: renderLocker },
  { id: 'shop',   label: 'SHOP',   render: renderShop },
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
    /** Re-read the character and repaint the header — every tab calls
        this after anything that moves coins or items. */
    async reload() {
      ctx.character = await loadCharacter(kid.id);
      renderHead();
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
      el('div', { class: 'ac-home-stats' },
        el('span', { class: 'coins', text: `\u{1FA99} ${fmt(c.coins)}` }),
        el('span', { text: c.dayStreak > 0 ? `\u{1F525} ${c.dayStreak}-day streak` : '\u{1F525} Play today to start a streak!' }),
      ),
    );
  }

  TABS.forEach((t) => tabsBar.append(
    el('button', { class: 'ac-hometab', type: 'button', 'data-tab': t.id, text: t.label, onClick: () => ctx.show(t.id) }),
  ));

  try {
    ctx.character = await loadCharacter(kid.id);
  } catch (e) {
    head.textContent = 'Couldn’t load your character — check the internet and refresh.';
    return;
  }
  renderHead();
  // A game's "My Character" button can deep-link a tab (index.html#locker),
  // so a kid landing here straight off a run sees what they just won.
  const wanted = (location.hash || '').replace('#', '');
  ctx.show(TABS.some((t) => t.id === wanted) ? wanted : 'play');
}

/* =====================================================================
   PLAY — the game grid, grouped so the economy teaches itself.
   Always phrased as a bonus on practice games, never a penalty on fun
   ones, and no tile is ever locked.
   ===================================================================== */
const SECTIONS = [
  { id: 'practice', title: 'PRACTICE · EARNS 4×' },
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
    text: '⚡ Practice games earn 4× the coins and XP — every game feeds the same character.',
  }));
}

function gameTile(id, g) {
  const badges = el('span', { class: 'ac-badges' },
    el('span', { class: 'ac-badge ac-badge--quiet', text: g.grades }),
    g.kind === 'learn' ? el('span', { class: 'ac-badge', text: '⚡ 4× rewards' }) : null,
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
