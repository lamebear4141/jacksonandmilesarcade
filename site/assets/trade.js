/* =====================================================================
   TRADE — siblings swapping spare critters.

   Open trades (R2B · E5): any 1–6 critters on either side. You build an
   offer by TAPPING — two trays (what you give, what you get) above two
   shelves (your spares, theirs). Tap a shelf chip to add a copy, tap a
   tray chip to take it back. There is not one text input on this
   surface, which is what keeps the no-free-text rule intact even with
   open-ended quantities.

   The one hard guardrail is NEVER YOUR LAST COPY, on both sides: a chip
   greys out the moment adding another would leave you without one. It is
   enforced here so the UI can explain it, and again inside
   respondToTrade's transaction so it holds even if someone forces it.

   Deliberately NOT enforced: fairness. A 3rd grader can talk a 1st
   grader into five-for-one and the app will let them — but it says the
   shape of the deal out loud on both cards, and it logs every trade for
   the grown-up portal. A conversation, not a rule.
   ===================================================================== */
import {
  LIVE_SPRITE_IDS, ECONOMY, spriteById, spriteState,
  describeTradeShape, tradeSideProblem, tradeTally, displayRarity,
} from './catalog.js';
import {
  listChildren, getSiblingLoadout, proposeTrade, listTrades, respondToTrade,
} from '../firebase-config.js';
import { el, sectionTitle, spriteChip, toast, signInCard } from './widgets.js';
import { celebrateCompletion, TRADE_OFFER_KEY } from './arcade-shell.js';
import { TRADE_WANT_KEY } from './collections.js';

/** The Collections tab's Trade button leaves the sprite it WANTS under
    TRADE_WANT_KEY; the drop reveal's Trade button leaves the spare it
    would GIVE under TRADE_OFFER_KEY. Each is read once, then cleared, so
    a later visit starts clean. */
function takeKey(key) {
  try {
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function renderTrade(panel, ctx) {
  if (ctx.guest) { panel.append(signInCard('trade')); return; }

  const [children, trades] = await Promise.all([listChildren(), listTrades(ctx.kid.id)]);
  const sibs = children.filter((c) => c.id !== ctx.kid.id);
  ctx.pendingTrades = trades.incoming.length;      // keeps the tab dot honest

  if (!sibs.length) {
    panel.append(el('div', { class: 'ac-gate' },
      el('span', { class: 'ac-gate__emoji', text: '\u{1F46B}' }),
      el('h2', { text: 'Trading needs a trade partner!' }),
      el('p', { text: 'Ask a grown-up to add your brother or sister on the profile screen, and their offers will show up here.' }),
    ));
    return;
  }

  if (trades.incoming.length) {
    panel.append(sectionTitle('OFFERS FOR YOU', 'yellow'));
    for (const t of trades.incoming) panel.append(incomingOffer(ctx, t));
  }

  if (trades.outgoing.length) {
    panel.append(sectionTitle('WAITING FOR AN ANSWER'));
    for (const t of trades.outgoing) {
      const to = sibs.find((s) => s.id === t.toChildId);
      panel.append(el('div', { class: 'ac-offer' },
        el('span', { class: 'ac-offer__text', text: `Waiting for ${to?.nickname || 'your sibling'} to answer…` }),
        offerChips(t.offer, 'You give', t.want, 'You get'),
      ));
    }
  }

  panel.append(sectionTitle('MAKE A TRADE', 'purple'));
  const host = el('div');
  panel.append(host);
  builder(host, ctx, sibs);
}

/* ---------------------------------------------------------------------
   Both sides of a deal, side by side. Always full colour: a critter
   being handed to you is yours whatever your level — trading is the one
   thing that legitimately bypasses the level gate.
   --------------------------------------------------------------------- */
function sideChips(ids, label) {
  const tally = tradeTally(ids);
  const box = el('div', { class: 'ac-offer__side' },
    el('span', { class: 'ac-offer__label', text: label }));
  const row = el('div', { class: 'ac-offer__row' });
  for (const [id, n] of Object.entries(tally)) {
    row.append(spriteChip(id, { count: n, state: 'owned' }));
  }
  box.append(row, rarityDots(ids));
  return box;
}
function offerChips(leftIds, leftLabel, rightIds, rightLabel) {
  return el('div', { class: 'ac-offer__chips' },
    sideChips(leftIds, leftLabel),
    el('span', { class: 'ac-offer__swap', text: '\u{1F501}' }),
    sideChips(rightIds, rightLabel),
  );
}

/** A wordless second read on the shape of a deal — one dot per critter,
    coloured by rarity. Deliberately NOT a score: printing a "value"
    would teach exactly the wrong lesson about giving. */
function rarityDots(ids) {
  const row = el('div', { class: 'ac-offer__dots' });
  for (const id of ids) {
    const s = spriteById(id);
    if (!s) continue;
    const d = el('span', { class: 'ac-dot ac-dot--' + displayRarity(s.r) });
    row.append(d);
  }
  return row;
}

/** Never a scold, and never a dead end: each one says what to do next. */
const PROBLEM_COPY = {
  'last copy': 'This one asks for your only one of something, and you always keep one of everything — so it can’t go through. Ask them to pick something you have a spare of! 🙂',
  'missing':   'This offer asks for a critter you don’t have. No harm done — say no thanks and build your own! 🙂',
  'empty':     'Something went funny with this offer — say no thanks and make a new one! 🙂',
  'too many':  'That’s more critters than one trade can hold. Say no thanks and try a smaller swap! 🙂',
  default:     'This trade can’t go through right now — say no thanks and build a new one! 🙂',
};

function incomingOffer(ctx, t) {
  const shape = describeTradeShape(t.want, t.offer);   // from the RECEIVER's side
  const card = el('div', { class: 'ac-offer' },
    el('span', { class: 'ac-offer__text' }, el('b', { text: t.fromNickname }), ' wants to trade!'),
    offerChips(t.offer, 'You get', t.want, 'You give'),
    shape ? el('p', { class: 'ac-offer__shape', text: shape }) : null,
    // Why Accept is greyed out, always said out loud — a disabled button
    // with no reason is the most annoying thing an app can do to a kid.
    t.problem ? el('p', { class: 'ac-offer__warn', text: PROBLEM_COPY[t.problem] || PROBLEM_COPY.default }) : null,
    el('div', { class: 'ac-offer__btns' },
      el('button', {
        class: 'ac-btn ac-btn--inline', type: 'button', text: 'Accept',
        disabled: !!t.problem,
        onClick: (e) => answer(ctx, t, true, e.target),
      }),
      el('button', {
        class: 'ac-btn ac-btn--outline ac-btn--inline', type: 'button', text: 'No thanks',
        onClick: (e) => answer(ctx, t, false, e.target),
      }),
    ),
  );
  return card;
}

async function answer(ctx, t, accept, btn) {
  btn.disabled = true;
  const r = await respondToTrade(t.id, accept);
  if (r.ok && r.status === 'accepted') {
    const got = (r.got || []).map((id) => spriteById(id)?.g || '').join('');
    toast(`\u{1F389} Traded! ${got} ${r.got.length === 1 ? 'is' : 'are'} yours now!`);
    await ctx.reload();
    // A trade that finishes a set is the whole point of trading.
    celebrateCompletion({
      newlyCompleted: r.newlyCompleted?.[ctx.kid.id] || [],
      grandPrize: !!r.grandPrize?.[ctx.kid.id],
    });
  } else if (r.ok) {
    toast('Offer declined — no hard feelings!');
  } else {
    // Collections move between making an offer and answering it. Never
    // blame the kid for it.
    toast('That trade isn’t possible any more — someone’s collection changed!');
  }
  ctx.show('trade');
}

/* =====================================================================
   THE BUILDER — two trays over two shelves, tap only.
   ===================================================================== */
function builder(host, ctx, sibs) {
  const state = {
    sib: sibs.length === 1 ? sibs[0] : null,
    give: [], get: [], sibLoadout: null,
  };
  // Arrived from the Collections tab ("I need Longneck Lou") or from a
  // drop reveal's "Trade it"? Pre-load that side of the tray.
  const want = takeKey(TRADE_WANT_KEY);
  if (want?.childId) state.sib = sibs.find((s) => s.id === want.childId) || state.sib;
  if (want?.spriteId && spriteById(want.spriteId)) state.get = [want.spriteId];
  const offer = takeKey(TRADE_OFFER_KEY);
  if (offer?.spriteId && spriteById(offer.spriteId)) state.give = [offer.spriteId];

  const max = ECONOMY.maxTradeItems;

  async function paint() {
    host.innerHTML = '';

    if (sibs.length > 1) {
      host.append(step('Who do you want to trade with?'));
      host.append(el('div', { class: 'ac-badges' },
        ...sibs.map((s) => el('button', {
          class: 'ac-btn ac-btn--inline ' + (state.sib?.id === s.id ? '' : 'ac-btn--outline'),
          type: 'button', text: s.nickname,
          onClick: () => { state.sib = s; state.get = []; state.sibLoadout = null; paint(); },
        })),
      ));
      if (!state.sib) return;
    }

    if (!state.sibLoadout) {
      host.append(el('p', { class: 'ac-sub', text: `Peeking at ${state.sib.nickname}’s collection…` }));
      getSiblingLoadout(state.sib.id).then((l) => { state.sibLoadout = l; paint(); });
      return;
    }

    const myCounts = ctx.character.counts || {};
    const theirCounts = state.sibLoadout.counts || {};
    // Drop anything that stopped being offerable since the last paint.
    state.give = state.give.filter((id) => (myCounts[id] || 0) >= 2);
    state.get = state.get.filter((id) => (theirCounts[id] || 0) >= 2);

    /* ---- the two trays ---- */
    host.append(el('div', { class: 'ac-trays' },
      tray('YOU GIVE', state.give, '🎁', (i) => { state.give.splice(i, 1); paint(); }),
      el('span', { class: 'ac-trays__swap', text: '\u{1F501}' }),
      tray('YOU GET', state.get, '✨', (i) => { state.get.splice(i, 1); paint(); }),
    ));

    /* ---- the deal, in plain words ---- */
    const shape = describeTradeShape(state.give, state.get);
    if (shape) host.append(el('p', { class: 'ac-offer__shape', text: shape }));

    /* ---- shelf 1: my spares ---- */
    host.append(step(`Your spares — tap to offer (up to ${max})`));
    const mySpares = LIVE_SPRITE_IDS.filter((id) => (myCounts[id] || 0) >= 2);
    if (!mySpares.length) {
      host.append(el('p', { class: 'ac-sub', text: 'You need doubles to trade — play well and the spares show up here!' }));
    } else {
      host.append(shelf(mySpares, myCounts, state.give, max, (id) => { state.give.push(id); paint(); }));
    }

    /* ---- shelf 2: their spares ---- */
    host.append(step(`${state.sib.nickname}’s spares — tap what you want`));
    const theirSpares = LIVE_SPRITE_IDS.filter((id) => (theirCounts[id] || 0) >= 2);
    if (!theirSpares.length) {
      host.append(el('p', { class: 'ac-sub', text: `${state.sib.nickname} has no spares to trade right now — check back after they play!` }));
    } else {
      host.append(shelf(theirSpares, theirCounts, state.get, max, (id) => { state.get.push(id); paint(); }));
    }

    /* ---- send ---- */
    const problem = tradeSideProblem(myCounts, state.give);
    const ready = !problem && state.get.length >= 1 && state.get.length <= max;
    host.append(el('div', { class: 'ac-trade-send' },
      el('button', {
        class: 'ac-btn ac-btn--inline', type: 'button',
        text: ready ? `Send offer to ${state.sib.nickname}` : 'Pick at least one on each side',
        disabled: !ready,
        onClick: async (e) => {
          e.target.disabled = true;
          const r = await proposeTrade(ctx.kid.id, state.sib.id, state.give, state.get);
          if (r.ok) {
            toast(`\u{2709}\u{FE0F} Offer sent — ${state.sib.nickname} will see it next time they play!`);
            ctx.show('trade');
          } else {
            e.target.disabled = false;
            toast('That offer didn’t send — try again.');
          }
        },
      }),
    ));
  }

  paint();
}

/** One tray. Tapping a chip takes it back out — nothing is committed
    until Send, so a kid can rearrange as long as they like. */
function tray(label, ids, emptyEmoji, onRemove) {
  const box = el('div', { class: 'ac-tray' },
    el('span', { class: 'ac-tray__label', text: label }));
  const row = el('div', { class: 'ac-tray__row' });
  if (!ids.length) {
    row.append(el('span', { class: 'ac-tray__empty', text: emptyEmoji }));
  } else {
    ids.forEach((id, i) => {
      const chip = spriteChip(id, { count: 1, state: 'owned', onClick: () => onRemove(i) });
      chip.classList.add('ac-sprite--tray');
      chip.title = 'Tap to take it back out';
      row.append(chip);
    });
  }
  box.append(row);
  return box;
}

/** A shelf of spares. A chip shows how many are still free to offer and
    greys out at zero — the never-your-last-copy rule, made visible
    rather than explained. */
function shelf(ids, counts, chosen, max, onAdd) {
  const used = tradeTally(chosen);
  const g = el('div', { class: 'ac-sprites' });
  for (const id of ids) {
    const spare = (counts[id] || 0) - 1 - (used[id] || 0);   // keep one, always
    const full = chosen.length >= max;
    const chip = spriteChip(id, {
      count: 0,                     // the badge below says SPARES, not copies
      state: 'owned',
      onClick: spare > 0 && !full ? () => onAdd(id) : null,
    });
    // How many are still free to offer, counted down as they go in the
    // tray. Shown even at 1, because "1 spare" is the whole question a
    // kid is asking of this shelf.
    chip.append(el('span', { class: 'ac-sprite__spare', text: String(Math.max(0, spare)) }));
    if (spare <= 0 || full) chip.classList.add('is-spent');
    chip.title = spare > 0
      ? (full ? `That's the most you can put in one trade (${max})` : `${spare} spare — tap to add one`)
      : 'That’s your last one — you always keep one of everything';
    g.append(chip);
  }
  return g;
}

const step = (text) => el('p', { class: 'ac-trade-step', text });
