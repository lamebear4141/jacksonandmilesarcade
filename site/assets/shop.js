/* =====================================================================
   SHOP — skins and pets from the catalog, with cost and level gate.

   Locked items stay VISIBLE, greyed, labelled with the level to reach —
   showing the goal is the motivation. Nothing here ever scolds: a kid
   who can't afford something sees how many coins away they are.
   ===================================================================== */
import { SKINS, PETS, levelFromXp, shopListing } from './catalog.js';
import { buyItem } from '../firebase-config.js';
import { el, fmt, sectionTitle, toast } from './widgets.js';
import { celebrate, sfx } from './arcade-shell.js';

export async function renderShop(panel, ctx) {
  const c = ctx.character;
  const level = levelFromXp(c.xp || 0).level;

  panel.append(el('p', { class: 'ac-sub ac-shop-purse', text: `You have \u{1FA99} ${fmt(c.coins)} — play any game well and the bonus round pays coins!` }));

  panel.append(sectionTitle('SKINS'));
  panel.append(itemGrid(ctx, 'skin', SKINS, c.ownedSkins, level, c.coins));

  panel.append(sectionTitle('PETS'));
  panel.append(itemGrid(ctx, 'pet', PETS.filter((p) => p.id !== 'none'), c.ownedPets, level, c.coins));
}

/* Every list passes through shopListing(): anything buyable:false —
   statues, the Grand Prize — is excluded structurally, not by being
   left off a list. That is the rule "nothing with no price is ever for
   sale", enforced here and again inside buyItem's transaction. */
function itemGrid(ctx, kind, items, ownedList, level, coins) {
  const grid = el('div', { class: 'ac-items' });
  const sorted = shopListing(items).sort((a, b) => a.level - b.level || a.cost - b.cost);
  for (const item of sorted) grid.append(itemCard(ctx, kind, item, ownedList, level, coins));
  return grid;
}

function itemCard(ctx, kind, item, ownedList, level, coins) {
  const owned = ownedList.includes(item.id);
  const lockedByLevel = level < item.level;
  const short = item.cost - coins;

  const locked = lockedByLevel && !owned;
  const card = el('div', {
    class: 'ac-item' + (locked ? ' ac-item--locked' : ''),
    // A locked thing never just does nothing when tapped — it wiggles.
    onClick: locked ? (e) => {
      const c = e.currentTarget;
      sfx.play('nope');               // gentle — a "not yet", never a buzzer
      c.classList.remove('ac-wiggle');
      void c.offsetWidth;             // restart the animation on re-tap
      c.classList.add('ac-wiggle');
    } : null,
  },
    el('span', { class: 'ac-item__glyph', text: item.g || '\u{1F6AB}' }),
    el('span', { class: 'ac-item__name', text: item.n }),
    el('span', { class: 'ac-item__meta' },
      item.cost > 0 ? el('span', { text: `\u{1FA99} ${fmt(item.cost)}` }) : el('span', { text: 'Free' }),
      item.level > 1 ? el('span', { text: `Lv ${item.level}` }) : null,
    ),
  );

  if (owned) {
    card.append(el('span', { class: 'ac-badge ac-badge--quiet', text: 'OWNED' }));
  } else if (lockedByLevel) {
    // The goal, not a wall: say exactly what to reach.
    card.append(el('span', { class: 'ac-item__lock', text: `Reach Level ${item.level}` }));
  } else if (short > 0) {
    card.append(el('span', { class: 'ac-item__lock', text: `${fmt(short)} more coins — keep saving!` }));
  } else {
    card.append(el('button', {
      // yellow, not red — red is reserved for THE action on a screen
      class: 'ac-btn ac-btn--yellow ac-btn--inline ac-item__btn', type: 'button', text: `Buy \u{1FA99} ${fmt(item.cost)}`,
      onClick: async (e) => {
        e.target.disabled = true;
        const r = await buyItem(ctx.kid.id, kind, item.id);
        if (r.ok) {
          celebrate(e.target);        // burst + fanfare, fire-and-forget
          toast(`\u{1F389} You got ${item.g} ${item.n} — it’s equipped!`);
          await ctx.reload();
          ctx.show('shop');
        } else {
          e.target.disabled = false;
          toast(r.why === 'coins' ? 'Not quite enough coins yet — play a practice game!' : 'That didn’t go through — try again.');
        }
      },
    }));
  }
  return card;
}
