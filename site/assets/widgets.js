/* =====================================================================
   WIDGETS — tiny DOM helpers shared by the Character Home tabs.
   Nothing clever: build an element, format a number, show a sprite chip,
   pop a toast. Every tab imports from here so they all look the same.
   ===================================================================== */
import { RARITY, spriteById } from './catalog.js';

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
 * One collectible as a chip: glyph, name, rarity-coloured border, and a
 * count badge on duplicates. Unowned sprites render dimmed with a “?” —
 * the kid can see there's something to find without being told what.
 */
export function spriteChip(id, { count = 0, onClick = null, selected = false, showUnknown = true } = {}) {
  const s = spriteById(id);
  if (!s) return null;
  const owned = count > 0;
  const r = RARITY[s.r];
  // Rarity colours come from the --rar-* CSS tokens via these classes,
  // not from catalog.js's JS hex values — the skin owns its own palette.
  const chip = el(onClick ? 'button' : 'div', {
    class: 'ac-sprite ' + (owned ? 'ac-sprite--' + s.r : 'ac-sprite--unknown') + (selected ? ' is-selected' : ''),
    type: onClick ? 'button' : null,
    title: owned ? `${s.n} · ${r.name}` : 'Not found yet',
    onClick,
  },
    el('span', { class: 'ac-sprite__glyph', text: owned || !showUnknown ? s.g : '?' }),
    el('span', { class: 'ac-sprite__name', text: owned ? s.n : '???' }),
  );
  if (count >= 2) chip.append(el('span', { class: 'ac-sprite__count', text: '×' + count }));
  return chip;
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
