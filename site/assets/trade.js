/* =====================================================================
   TRADE — siblings swapping duplicate collectibles.

   Structured buttons only, NO text input anywhere. The whole surface:
     1. pick one of YOUR duplicates (count >= 2, so a kid can never
        offer away their last copy)
     2. pick one sprite you DON'T have from your sibling's collection
     3. Send offer
   The sibling sees the pending offer with Accept / Decline. That's it.
   Guests see a friendly sign-in card instead.
   ===================================================================== */
import { SPRITE_IDS, spriteById } from './catalog.js';
import {
  listChildren, getSiblingLoadout, proposeTrade, listTrades, respondToTrade,
} from '../firebase-config.js';
import { el, sectionTitle, spriteChip, toast, signInCard } from './widgets.js';

export async function renderTrade(panel, ctx) {
  if (ctx.guest) { panel.append(signInCard('trade')); return; }

  const [children, trades] = await Promise.all([listChildren(), listTrades(ctx.kid.id)]);
  const sibs = children.filter((c) => c.id !== ctx.kid.id);

  if (!sibs.length) {
    panel.append(el('div', { class: 'ac-gate' },
      el('span', { class: 'ac-gate__emoji', text: '\u{1F46B}' }),
      el('h2', { text: 'Trading needs a trade partner!' }),
      el('p', { text: 'Ask a grown-up to add your brother or sister on the profile screen, and their offers will show up here.' }),
    ));
    return;
  }

  /* ---------------- offers waiting on me ---------------- */
  if (trades.incoming.length) {
    panel.append(sectionTitle('OFFERS FOR YOU'));
    for (const t of trades.incoming) panel.append(incomingOffer(panel, ctx, t));
  }

  /* ---------------- my offers, still waiting ---------------- */
  if (trades.outgoing.length) {
    panel.append(sectionTitle('WAITING FOR AN ANSWER'));
    for (const t of trades.outgoing) {
      const to = sibs.find((s) => s.id === t.toChildId);
      panel.append(el('div', { class: 'ac-offer' },
        spriteChip(t.offerSprite, { count: 1 }),
        el('span', { class: 'ac-offer__swap', text: '\u{1F501}' }),
        spriteChip(t.wantSprite, { count: 1 }),
        el('span', { class: 'ac-offer__text', text: `Waiting for ${to?.nickname || 'your sibling'} to answer…` }),
      ));
    }
  }

  /* ---------------- make a new offer ---------------- */
  panel.append(sectionTitle('MAKE A TRADE'));
  const wizardHost = el('div');
  panel.append(wizardHost);
  wizard(wizardHost, ctx, sibs);
}

function incomingOffer(panel, ctx, t) {
  const card = el('div', { class: 'ac-offer' },
    el('span', { class: 'ac-offer__text' },
      el('b', { text: t.fromNickname }), ` wants to trade!`),
    el('div', { class: 'ac-offer__chips' },
      el('div', { class: 'ac-offer__side' },
        el('span', { class: 'ac-offer__label', text: 'You get' }),
        spriteChip(t.offerSprite, { count: 1 })),
      el('span', { class: 'ac-offer__swap', text: '\u{1F501}' }),
      el('div', { class: 'ac-offer__side' },
        el('span', { class: 'ac-offer__label', text: 'You give' }),
        spriteChip(t.wantSprite, { count: 1 })),
    ),
    t.lastCopy ? el('p', { class: 'ac-offer__warn', text: `Heads up: that’s your only ${spriteById(t.wantSprite)?.n} — but you get one of theirs back!` }) : null,
    el('div', { class: 'ac-offer__btns' },
      el('button', {
        class: 'ac-btn ac-btn--inline', type: 'button', text: 'Accept',
        onClick: (e) => answer(ctx, t, true, e.target, card),
      }),
      el('button', {
        class: 'ac-btn ac-btn--outline ac-btn--inline', type: 'button', text: 'No thanks',
        onClick: (e) => answer(ctx, t, false, e.target, card),
      }),
    ),
  );
  return card;
}

async function answer(ctx, t, accept, btn, card) {
  btn.disabled = true;
  const r = await respondToTrade(t.id, accept);
  if (r.ok && r.status === 'accepted') {
    toast(`\u{1F389} Traded! ${spriteById(r.got)?.g || ''} ${spriteById(r.got)?.n || ''} is yours now!`);
    await ctx.reload();
  } else if (r.ok) {
    toast('Offer declined — no hard feelings!');
  } else {
    // The sprites may have moved since the offer was made; never blame the kid.
    toast('That trade isn’t possible any more — the sprites moved!');
  }
  ctx.show('trade');
}

/* ---------------------------------------------------------------------
   The three-step wizard. Local state, re-rendered on every pick, and
   every choice is a button — there is nothing to type.
   --------------------------------------------------------------------- */
function wizard(host, ctx, sibs) {
  const state = { sib: sibs.length === 1 ? sibs[0] : null, offer: null, want: null, sibLoadout: null };

  async function paint() {
    host.innerHTML = '';

    // step 0 — who with (only shown when there's a choice)
    if (sibs.length > 1) {
      host.append(step('Who do you want to trade with?'));
      host.append(el('div', { class: 'ac-badges' },
        ...sibs.map((s) => el('button', {
          class: 'ac-btn ac-btn--inline ' + (state.sib?.id === s.id ? '' : 'ac-btn--outline'),
          type: 'button', text: s.nickname,
          onClick: () => { state.sib = s; state.want = null; state.sibLoadout = null; paint(); },
        })),
      ));
      if (!state.sib) return;
    }

    // step 1 — my spare
    const dupes = SPRITE_IDS.filter((id) => (ctx.character.counts[id] || 0) >= 2);
    host.append(step('1 · Pick one of your spares to give'));
    if (!dupes.length) {
      host.append(el('p', { class: 'ac-sub', text: 'You need doubles to trade — win more sprites in Loot Drop and the spares show up here!' }));
      return;
    }
    host.append(grid(dupes.map((id) => spriteChip(id, {
      count: ctx.character.counts[id],
      selected: state.offer === id,
      onClick: () => { state.offer = state.offer === id ? null : id; paint(); },
    }))));
    if (!state.offer) return;

    // step 2 — what I want from them
    host.append(step(`2 · Pick what you want from ${state.sib.nickname}`));
    if (!state.sibLoadout) {
      host.append(el('p', { class: 'ac-sub', text: 'Peeking at their collection…' }));
      getSiblingLoadout(state.sib.id).then((l) => { state.sibLoadout = l; paint(); });
      return;
    }
    const wants = SPRITE_IDS.filter((id) =>
      (state.sibLoadout.counts[id] || 0) >= 1 && (ctx.character.counts[id] || 0) === 0);
    if (!wants.length) {
      host.append(el('p', { class: 'ac-sub', text: `Wow — you already have everything ${state.sib.nickname} has!` }));
      return;
    }
    host.append(grid(wants.map((id) => spriteChip(id, {
      count: state.sibLoadout.counts[id],
      selected: state.want === id,
      onClick: () => { state.want = state.want === id ? null : id; paint(); },
    }))));
    if (!state.want) return;

    // step 3 — send it
    host.append(step('3 · Send it!'));
    host.append(el('div', { class: 'ac-offer' },
      spriteChip(state.offer, { count: 1 }),
      el('span', { class: 'ac-offer__swap', text: '\u{1F501}' }),
      spriteChip(state.want, { count: 1 }),
      el('button', {
        class: 'ac-btn ac-btn--inline', type: 'button',
        text: `Send offer to ${state.sib.nickname}`,
        onClick: async (e) => {
          e.target.disabled = true;
          const r = await proposeTrade(ctx.kid.id, state.sib.id, state.offer, state.want);
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

const step = (text) => el('p', { class: 'ac-trade-step', text });
const grid = (chips) => { const g = el('div', { class: 'ac-sprites' }); chips.forEach((c) => g.append(c)); return g; };
