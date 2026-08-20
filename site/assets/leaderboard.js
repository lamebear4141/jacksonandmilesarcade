/* =====================================================================
   LEADERBOARD — siblings in this family only.
   Nicknames and avatars, never real names. Tapping a sibling opens
   their read-only loadout: what they've equipped and what they own.
   ===================================================================== */
import { SKINS, PETS, SPRITE_IDS } from './catalog.js';
import { listFamilyCharacters, getSiblingLoadout } from '../firebase-config.js';
import { el, fmt, sectionTitle, spriteChip, signInCard } from './widgets.js';

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

export async function renderLeaderboard(panel, ctx) {
  if (ctx.guest) { panel.append(signInCard('board')); return; }

  const family = await listFamilyCharacters();
  family.sort((a, b) => (b.xp || 0) - (a.xp || 0));

  panel.append(sectionTitle('THE FAMILY BOARD'));
  const list = el('div', { class: 'ac-lb' });
  family.forEach((f, i) => {
    const skin = SKINS.find((s) => s.id === f.skin) || SKINS[0];
    const pet = PETS.find((p) => p.id === f.pet);
    list.append(el('button', {
      class: 'ac-lb__row', type: 'button',
      title: `See ${f.nickname}'s loadout`,
      onClick: () => openLoadout(f),
    },
      el('span', { class: 'ac-lb__medal', text: MEDALS[i] || '\u{1F396}\u{FE0F}' }),
      el('span', { class: 'ac-lb__who' },
        el('span', { text: skin.g }),
        el('span', { text: f.nickname }),
        pet && pet.id !== 'none' ? el('span', { class: 'ac-lb__pet', text: pet.g }) : null,
      ),
      el('span', { class: 'ac-lb__stats' },
        el('span', { text: `Lv ${f.level || 1}` }),
        el('span', { text: `${fmt(f.xp)} XP` }),
        el('span', { text: `\u{1FA99} ${fmt(f.coins)}` }),
        el('span', { text: `\u{1F5C2}\u{FE0F} ${fmt(f.collectionScore)}` }),
        el('span', { text: `\u{1F525} ${f.dayStreak || 0}` }),
      ),
    ));
  });
  panel.append(list);
  panel.append(el('p', { class: 'ac-sub', text: 'Tap anyone to peek at their loadout. Collection score: commons 1, rares 3, epics 8, legendaries 20, mythics 60.' }));
}

/* Read-only peek at a sibling's kit. Looking never writes anything. */
async function openLoadout(f) {
  const modal = el('div', { class: 'ac-modal' });
  const card = el('div', { class: 'ac-modal__card ac-modal__card--loadout' },
    el('p', { class: 'ac-modal__name', text: `${f.nickname}'s loadout` }),
    el('p', { class: 'ac-modal__hint', text: 'Loading…' }),
  );
  modal.append(card);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.body.append(modal);

  try {
    const l = await getSiblingLoadout(f.childId);
    const skin = SKINS.find((s) => s.id === l.skin) || SKINS[0];
    const pet = PETS.find((p) => p.id === l.pet);
    const ownedIds = SPRITE_IDS.filter((id) => (l.counts[id] || 0) > 0);
    card.innerHTML = '';
    card.append(
      el('p', { class: 'ac-modal__name', text: `${f.nickname} · Level ${l.level}` }),
      el('div', { class: 'ac-loadout__equip' },
        el('div', { class: 'ac-avatar', text: skin.g }),
        el('div', { class: 'ac-loadout__labels' },
          el('div', { text: skin.n }),
          pet && pet.id !== 'none' ? el('div', { text: `${pet.g} ${pet.n}` }) : el('div', { class: 'ac-modal__hint', text: 'No pet yet' }),
        ),
      ),
      el('p', { class: 'ac-modal__hint', text: `${ownedIds.length}/${SPRITE_IDS.length} sprites · collection score ${fmt(l.collectionScore)}` }),
      (() => {
        const g = el('div', { class: 'ac-sprites ac-sprites--mini' });
        ownedIds.forEach((id) => g.append(spriteChip(id, { count: l.counts[id] })));
        return g;
      })(),
      el('button', { class: 'ac-btn ac-btn--inline', type: 'button', text: 'Close', onClick: () => modal.remove() }),
    );
  } catch (e) {
    card.querySelector('.ac-modal__hint').textContent = 'Couldn’t load that — try again.';
  }
}
