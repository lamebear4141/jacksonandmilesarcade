/* =====================================================================
   LOCKER — equip what you own, browse what you've collected.
   Buying happens in the SHOP tab; this tab never moves coins.
   ===================================================================== */
import { SKINS, PETS, SPRITE_IDS, RARITY, RARITY_ORDER } from './catalog.js';
import { equipItem } from '../firebase-config.js';
import { el, sectionTitle, spriteChip, toast } from './widgets.js';

export async function renderLocker(panel, ctx) {
  const c = ctx.character;

  panel.append(sectionTitle('MY SKINS'));
  panel.append(ownedGrid(ctx, 'skin', SKINS.filter((s) => c.ownedSkins.includes(s.id)), c.skin));

  panel.append(sectionTitle('MY PETS'));
  panel.append(ownedGrid(ctx, 'pet', PETS.filter((p) => c.ownedPets.includes(p.id)), c.pet));

  const unique = SPRITE_IDS.filter((id) => (c.counts[id] || 0) > 0).length;
  panel.append(sectionTitle(`COLLECTION · ${unique}/${SPRITE_IDS.length}`));

  // Legend colours come from the --rar-* skin tokens, not catalog hexes.
  const RAR_TOKEN = { common: '--rar-common', rare: '--rar-rare', epic: '--rar-epic',
                      legendary: '--rar-legend', mythic: '--rar-mythic' };
  panel.append(el('div', { class: 'ac-rarity-legend' },
    ...RARITY_ORDER.map((r) => {
      const chip = el('span', { class: 'ac-rarity-key', text: RARITY[r].name });
      chip.style.color = `var(${RAR_TOKEN[r]})`;
      return chip;
    }),
  ));

  const grid = el('div', { class: 'ac-sprites' });
  for (const id of SPRITE_IDS) grid.append(spriteChip(id, { count: c.counts[id] || 0 }));
  panel.append(grid);

  if (unique === 0) {
    panel.append(el('p', { class: 'ac-sub', text: 'Win sprites by playing Loot Drop — every drop is a chance at a rare one!' }));
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
