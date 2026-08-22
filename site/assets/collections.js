/* =====================================================================
   COLLECTIONS — the curated view of the critter collection.

   Eight themed sets of ten. Header count, the badge banner, one card per
   collection (progress bar + reward preview) that expands into the
   three-state grid, sibling "JAX HAS ONE" hints on silhouettes, and a
   Trade shortcut that pre-loads the builder with the sprite you need.

   The completion celebration does NOT live here: it fires where the
   grant happens (finishRun in a game, Accept on the trade tab) through
   arcade-shell's celebrateCompletion. This tab only ever reads.
   ===================================================================== */
import {
  COLLECTIONS, LIVE_SPRITE_IDS, spriteById, spriteState, collectionProgress, uniqueLiveCount,
} from './catalog.js';
import { listChildren, getSiblingLoadout, setFocusCollection } from '../firebase-config.js';
import { el, sectionTitle, spriteChip, renderBadgeBanner, toast } from './widgets.js';
import { sfx } from './arcade-shell.js';

/** The trade builder reads this on mount and pre-loads the "You get"
    tray — the two-tap path from "I need Longneck Lou" to an offer. */
export const TRADE_WANT_KEY = 'arcade.tradeWant';

export async function renderCollections(panel, ctx) {
  const c = ctx.character;
  const unique = uniqueLiveCount(c.counts);

  panel.append(el('div', { class: 'ac-card ac-col-head' },
    el('span', { class: 'ac-col-head__emoji', text: '\u{1F4D6}' }),
    el('div', { class: 'ac-col-head__text' },
      el('h2', { text: 'Collections' }),
      el('p', { text: 'Finish a set to earn a badge, a statue for your Box, and a new look.' }),
    ),
    el('div', { class: 'ac-col-head__count' },
      el('div', { class: 'ac-col-head__n', text: String(unique) }),
      el('div', { class: 'ac-col-head__of', text: `of ${LIVE_SPRITE_IDS.length} found` }),
    ),
  ));

  panel.append(sectionTitle('MY BADGES', 'yellow'));
  panel.append(renderBadgeBanner(c.badges, { owner: ctx.kid.nickname }));
  panel.append(el('p', { class: 'ac-sub', text: 'Badges show next to your name on the family board and when your brother visits your Box.' }));

  // One read per sibling, shared by every card — never one per chip.
  const sib = await siblingSpares(ctx);

  panel.append(sectionTitle('SETS', 'purple'));
  panel.append(el('p', { class: 'ac-sub', text: '⭐ Pick the set you’re chasing and your critters come from there first. Change it any time!' }));
  const grid = el('div', { class: 'ac-sets' });
  for (const col of COLLECTIONS) grid.append(setCard(ctx, col, sib));
  panel.append(grid);
}

/* ---------------------------------------------------------------------
   Which of my missing critters does a sibling hold a SPARE of (count >=
   2)? Guests have no siblings; a read failure just means no hints.
   --------------------------------------------------------------------- */
async function siblingSpares(ctx) {
  const bySprite = new Map();          // spriteId -> { childId, nickname }
  if (ctx.guest) return bySprite;
  try {
    const sibs = (await listChildren()).filter((k) => k.id !== ctx.kid.id);
    const loadouts = await Promise.all(sibs.map((s) => getSiblingLoadout(s.id).catch(() => null)));
    sibs.forEach((s, i) => {
      const l = loadouts[i];
      if (!l) return;
      for (const id of LIVE_SPRITE_IDS) {
        if ((l.counts[id] || 0) >= 2 && (ctx.character.counts[id] || 0) === 0 && !bySprite.has(id)) {
          bySprite.set(id, { childId: s.id, nickname: s.nickname });
        }
      }
    });
  } catch { /* hints are a bonus, never a blocker */ }
  return bySprite;
}

function setCard(ctx, col, sib) {
  const c = ctx.character;
  const { have, total, complete } = collectionProgress(col, c.counts);

  const card = el('div', { class: 'ac-set' + (complete ? ' is-done' : '') });
  const top = el('button', { class: 'ac-set__top', type: 'button', 'aria-expanded': 'false' },
    el('span', { class: 'ac-set__icon', text: col.icon }),
    el('span', { class: 'ac-set__title' },
      el('span', { class: 'ac-set__name', text: col.name }),
      el('span', { class: 'ac-set__sub', text: col.blurb }),
    ),
    el('span', { class: 'ac-set__chev', text: '▶' }),
  );
  const bar = el('div', { class: 'ac-bar' },
    el('div', { class: 'ac-bar__fill' + (complete ? ' is-full' : ''), style: `width:${Math.round(have / total * 100)}%` }));
  const reward = el('div', { class: 'ac-set__reward' });
  if (complete) {
    reward.append(el('span', { class: 'ac-badge ac-badge--hot', text: `✓ ${col.badge.name}` }));
  } else {
    reward.append(
      el('b', { text: `${have}/${total}` }),
      el('span', { text: ` · unlocks ${col.badge.emoji} ${col.badge.name} · ${col.statue.emoji} ${col.statue.name}` }),
    );
    // Collection Focus: one set at a time; tapping the focused one clears it.
    const focused = c.focusCollection === col.id;
    reward.append(el('button', {
      class: 'ac-btn ac-btn--inline ac-set__focus ' + (focused ? 'ac-btn--yellow' : 'ac-btn--outline'),
      type: 'button', text: focused ? '⭐ CHASING THIS' : '☆ Chase this',
      onClick: async (e) => {
        e.target.disabled = true;
        const r = await setFocusCollection(ctx.kid.id, focused ? null : col.id).catch(() => ({ ok: false }));
        if (r.ok) {
          toast(focused ? 'Not chasing a set — critters come from everywhere again.' : `⭐ Now chasing ${col.name}!`);
          await ctx.reload();
          ctx.show('collections');
        } else {
          e.target.disabled = false;
          toast('That didn’t stick — try again.');
        }
      },
    }));
  }

  const body = el('div', { class: 'ac-set__body' });
  let built = false;
  top.addEventListener('click', () => {
    const open = card.classList.toggle('is-open');
    top.setAttribute('aria-expanded', open ? 'true' : 'false');
    sfx.play('tap');
    if (open && !built) { built = true; body.append(...setBody(ctx, col, sib)); }
  });

  card.append(top, bar, reward, body);
  return card;
}

/* The expanded grid: every member in its three-state form, plus the
   sibling hint row. Hidden slots stay in the grid so the count is honest. */
function setBody(ctx, col, sib) {
  const c = ctx.character;
  const grid = el('div', { class: 'ac-sprites ac-sprites--set' });
  let hidden = 0;
  const needFromSib = [];
  for (const id of col.members) {
    const state = spriteState(id, c);
    if (state === 'hidden') hidden++;
    const holder = state === 'silhouette' ? sib.get(id) : null;
    if (holder) needFromSib.push({ id, holder });
    grid.append(spriteChip(id, {
      count: c.counts[id] || 0,
      state,
      hint: holder ? `${shortName(holder.nickname)} HAS ONE` : null,
    }));
  }

  const out = [grid];
  if (hidden) {
    out.push(el('p', { class: 'ac-set__locked', text: `\u{1F512} ${hidden} more ${hidden === 1 ? 'is' : 'are'} out there — level up to find ${hidden === 1 ? 'it' : 'them'}!` }));
  }
  if (needFromSib.length) {
    const first = needFromSib[0];
    const names = [...new Set(needFromSib.map((n) => n.holder.nickname))].join(' and ');
    out.push(el('div', { class: 'ac-col-hint' },
      el('span', { class: 'ac-col-hint__e', text: '\u{1F501}' }),
      el('span', {}, `${names} ${needFromSib.length === 1 ? 'has' : 'have'} `,
        el('b', { text: String(needFromSib.length) }),
        ` you still need — send a trade offer!`),
      el('button', {
        class: 'ac-btn ac-btn--purple ac-btn--inline ac-col-hint__btn', type: 'button', text: 'Trade',
        onClick: () => {
          try { sessionStorage.setItem(TRADE_WANT_KEY, JSON.stringify({ spriteId: first.id, childId: first.holder.childId })); } catch {}
          ctx.show('trade');
        },
      }),
    ));
  }
  return out;
}

/** "JAX HAS ONE" — nicknames only, shortened so the chip stays a chip. */
function shortName(nickname) {
  return String(nickname || 'THEY').toUpperCase().slice(0, 5);
}

export { spriteById };
