/* =====================================================================
   LOCKER — equip what you own, browse what you've collected.
   Buying happens in the SHOP tab; this tab never moves coins.

   The collection grid is the flat view of every LIVE sprite (the 80 that
   belong to a collection) in its three-state form — hidden, silhouette,
   owned — from the same spriteState() every other screen uses. The
   Collections tab is the curated view of the same counts.
   ===================================================================== */
import {
  SKINS, PETS, LIVE_SPRITE_IDS, RARITY, DISPLAY_RARITY_ORDER, spriteState, uniqueLiveCount,
} from './catalog.js';
import { equipItem } from '../firebase-config.js';
import { el, sectionTitle, spriteChip, toast } from './widgets.js';

export async function renderLocker(panel, ctx) {
  const c = ctx.character;

  panel.append(sectionTitle('MY SKINS'));
  panel.append(ownedGrid(ctx, 'skin', SKINS.filter((s) => c.ownedSkins.includes(s.id)), c.skin));

  panel.append(sectionTitle('MY PETS'));
  panel.append(ownedGrid(ctx, 'pet', PETS.filter((p) => c.ownedPets.includes(p.id)), c.pet));

  const unique = uniqueLiveCount(c.counts);
  panel.append(sectionTitle(`COLLECTION · ${unique}/${LIVE_SPRITE_IDS.length}`));

  // Legend colours come from the --rar-* skin tokens, not catalog hexes.
  // Four tiers: mythic folds into legendary everywhere a kid looks.
  const RAR_TOKEN = { common: '--rar-common', rare: '--rar-rare', epic: '--rar-epic', legendary: '--rar-legend' };
  panel.append(el('div', { class: 'ac-rarity-legend' },
    ...DISPLAY_RARITY_ORDER.map((r) => {
      const chip = el('span', { class: 'ac-rarity-key', text: RARITY[r].name });
      chip.style.color = `var(${RAR_TOKEN[r]})`;
      return chip;
    }),
  ));

  const grid = el('div', { class: 'ac-sprites' });
  for (const id of LIVE_SPRITE_IDS) {
    grid.append(spriteChip(id, { count: c.counts[id] || 0, state: spriteState(id, c) }));
  }
  panel.append(grid);

  if (unique === 0) {
    panel.append(el('p', { class: 'ac-sub', text: 'Play well and critters find you — every great run is a chance at a rare one!' }));
  }
}

function ownedGrid(ctx, kind, items, equippedId) {
  const grid = el('div', { class: 'ac-items' });
  for (const item of items) {
    const equipped = item.id === equippedId;
    grid.append(el('div', { class: 'ac-item' },
      el('span', { class: 'ac-item__glyph', text: item.g || '\u{1F6AB}' }),
      el('span', { class: 'ac-item__name', text: item.n }),
      equipped
        ? el('span', { class: 'ac-badge', text: 'EQUIPPED' })
        : el('button', {
            class: 'ac-btn ac-btn--outline ac-btn--inline ac-item__btn', type: 'button', text: 'Equip',
            onClick: async (e) => {
              e.target.disabled = true;
              const r = await equipItem(ctx.kid.id, kind, item.id);
              if (r.ok) {
                toast(`${item.g || ''} ${item.n} equipped!`.trim());
                await ctx.reload();
                ctx.show('locker');
              } else {
                e.target.disabled = false;
                toast('Hmm, that didn’t stick — try again.');
              }
            },
          }),
    ));
  }
  return grid;
}
