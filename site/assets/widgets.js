/* =====================================================================
   WIDGETS — tiny DOM helpers shared by the Character Home tabs.
   Nothing clever: build an element, format a number, show a sprite chip,
   pop a toast. Every tab imports from here so they all look the same.
   ===================================================================== */
import { RARITY, spriteById, displayRarity, COLLECTIONS } from './catalog.js';

/** el('div', { class:'x', text:'hi', onClick: fn }, ...children) */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children) if (c != null) node.append(c);
  return node;
}

export const fmt = (n) => (n || 0).toLocaleString();

/** The section ribbon used between groups on every tab: a navy pill and
    a dashed rule. `tint` may be 'purple' | 'yellow' | 'blue'. */
export function sectionTitle(text, tint = null) {
  return el('div', { class: 'ac-section' + (tint ? ' ac-section--' + tint : '') },
    el('span', { class: 'ac-section__pill', text }));
}

/**
 * One collectible as a chip, in one of the three states every renderer
 * shares (catalog.js spriteState):
 *
 *   hidden      an empty slot — no shape, no name, no ring. It still
 *               takes a cell so totals stay honest ("3 / 10").
 *   silhouette  the emoji blacked out on a light tile, name ???, the
 *               rarity ring showing: findable, not yet caught.
 *   owned       full colour, name, ring, ×N on duplicates.
 *
 * `state` should always be passed (from spriteState); when it isn't,
 * count > 0 means owned and anything else is a silhouette. `hint` is the
 * small blue chip ("JAX HAS ONE") the Collections tab pins on a
 * silhouette a sibling can trade.
 */
export function spriteChip(id, { count = 0, state = null, onClick = null, selected = false, hint = null } = {}) {
  const s = spriteById(id);
  if (!s) return null;
  const st = state || (count > 0 ? 'owned' : 'silhouette');
  if (st === 'hidden') {
    return el('div', { class: 'ac-sprite ac-sprite--hidden', title: 'Something is out there — level up to find it!' });
  }
  const owned = st === 'owned';
  const rar = displayRarity(s.r);       // mythic rings and reads as legendary
  const r = RARITY[rar];
  // Rarity colours come from the --rar-* CSS tokens via these classes,
  // not from catalog.js's JS hex values — the skin owns its own palette.
  const chip = el(onClick ? 'button' : 'div', {
    class: 'ac-sprite ac-sprite--' + rar + (owned ? '' : ' ac-sprite--silhouette') + (selected ? ' is-selected' : ''),
    type: onClick ? 'button' : null,
    title: owned ? `${s.n} · ${r.name}` : `??? · ${r.name} — still out there!`,
    onClick,
  },
    el('span', { class: 'ac-sprite__glyph', text: s.g }),
    el('span', { class: 'ac-sprite__name', text: owned ? s.n : '???' }),
  );
  if (owned && count >= 2) chip.append(el('span', { class: 'ac-sprite__count', text: '×' + count }));
  if (hint) chip.append(el('span', { class: 'ac-sprite__hint', text: hint }));
  return chip;
}

/**
 * The badge banner: bunting with one pennant per earned badge, all at
 * once (no "featured" pick), plus up to three faded empty pennants so the
 * goal count is always visible. Used on the Collections tab and on any
 * read-only view of another kid. Nicknames only — safe on shared
 * surfaces.
 */
export function renderBadgeBanner(badges, { owner = '' } = {}) {
  const have = new Set(badges || []);
  const earned = COLLECTIONS.filter((c) => have.has(c.id));
  const left = COLLECTIONS.length - earned.length;
  const line = el('div', { class: 'ac-bunting' });
  earned.forEach((c, i) => line.append(
    el('div', { class: 'ac-pennant', style: `animation-delay:${(i * 0.35).toFixed(2)}s`, title: c.badge.name },
      el('span', { class: 'ac-pennant__e', text: c.badge.emoji }),
      el('span', { class: 'ac-pennant__n', text: c.badge.name }),
    )));
  for (let i = 0; i < Math.min(left, 3); i++) line.append(
    el('div', { class: 'ac-pennant ac-pennant--empty' },
      el('span', { class: 'ac-pennant__e', text: '\u{1F512}' }),
      el('span', { class: 'ac-pennant__n', text: 'Keep collecting…' }),
    ));
  const caption = left === 0
    ? 'ALL BADGES! \u{1F3C6}'
    : `${earned.length} of ${COLLECTIONS.length} badges · ${left} still to win`;
  return el('div', { class: 'ac-banner', 'data-owner': owner },
    line, el('p', { class: 'ac-banner__caption', text: caption }));
}

/* One toast at a time; a new one replaces the old rather than stacking. */
let toastEl = null, toastTimer = null;
export function toast(msg, ms = 2600) {
  if (toastEl) toastEl.remove();
  clearTimeout(toastTimer);
  toastEl = el('div', { class: 'ac-toast', text: msg });
  document.body.appendChild(toastEl);
  toastTimer = setTimeout(() => { toastEl?.remove(); toastEl = null; }, ms);
}

/** The friendly “this needs a family account” card guests see on the
    TRADE and LEADERBOARD tabs. Never a scold — signing in is an upgrade. */
export function signInCard(what) {
  return el('div', { class: 'ac-gate' },
    el('span', { class: 'ac-gate__emoji', text: '\u{1F46A}' }),
    el('h2', { text: what === 'board' ? 'The family leaderboard' : 'Trading is a family thing' }),
    el('p', { text: 'Sign in to trade with your family and see who’s winning the leaderboard. Your guest character stays on this device.' }),
    el('button', {
      class: 'ac-btn ac-btn--inline', type: 'button', text: 'Sign in with the family',
      onClick: () => { sessionStorage.removeItem('arcade.currentKid'); window.location.reload(); },
    }),
  );
}
