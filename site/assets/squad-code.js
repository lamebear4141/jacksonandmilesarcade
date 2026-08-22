/* =====================================================================
   SQUAD CODE — the compact, shareable collection snapshot Loot Drop
   hands to a cousin in another family (?squad=CODE). Pure: no Firebase,
   no DOM, so it runs under node in catalog.test.mjs.

   Two wire schemes, told apart by the first byte:

     v1  [1][who][level][streak][rounds hi][rounds lo][counts, 4 bits each]
         The original. 60 sprites → 30 count bytes, ~48 chars. Still
         decoded so every link ever shared keeps working.

     v2  [2][who][level][streak][rounds hi][rounds lo][owned, 1 bit each]
         The compare screen only needs owned / not-owned, never exact
         counts, so one bit per sprite is enough — 126 sprites fit in 16
         bytes, ~30 chars, and seasonal collections can keep appending
         without the link growing uncomfortable.

   Bit i of the mask is SPRITES[i]; the array is index-locked, which is
   the whole reason it can never be reordered.
   ===================================================================== */
import { SPRITES } from './catalog.js';

export const SQUAD_SCHEME_V1 = 1;
export const SQUAD_SCHEME_V2 = 2;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function bytesToCode(bytes) {
  let out = '', bits = 0, val = 0;
  for (const b of bytes) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 6) { out += B64[(val >> (bits - 6)) & 63]; bits -= 6; }
  }
  if (bits) out += B64[(val << (6 - bits)) & 63];
  return out;
}
function codeToBytes(code) {
  const out = []; let bits = 0, val = 0;
  for (const ch of code) {
    const i = B64.indexOf(ch); if (i < 0) continue;
    val = (val << 6) | i; bits += 6;
    if (bits >= 8) { out.push((val >> (bits - 8)) & 255); bits -= 8; }
  }
  return out;
}

function header(scheme, { whoBit = 0, level = 1, streak = 0, rounds = 0 }) {
  const r = Math.max(0, Math.min(65535, Math.round(rounds) || 0));
  return [scheme, whoBit ? 1 : 0,
          Math.max(0, Math.min(255, Math.round(level) || 0)),
          Math.max(0, Math.min(255, Math.round(streak) || 0)),
          (r >> 8) & 255, r & 255];
}

/** The current scheme: one bit per sprite, owned or not. */
export function encodeSquad(fields) {
  const counts = fields?.counts || [];
  const bytes = header(SQUAD_SCHEME_V2, fields || {});
  for (let i = 0; i < SPRITES.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) if ((counts[i + b] || 0) > 0) byte |= 1 << (7 - b);
    bytes.push(byte);
  }
  return bytesToCode(bytes);
}

/** The original scheme — kept only so the round-trip test can prove an
    old link still decodes. Nothing in the game writes v1 any more. */
export function encodeSquadV1(fields) {
  const counts = fields?.counts || [];
  const bytes = header(SQUAD_SCHEME_V1, fields || {});
  // Encodes exactly the counts it is given (not SPRITES.length), so a test
  // can build a genuine 60-sprite-era link and prove the decoder pads it.
  for (let i = 0; i < counts.length; i += 2) {
    const a = Math.min(15, counts[i] || 0);
    const b = Math.min(15, counts[i + 1] || 0);
    bytes.push((a << 4) | b);
  }
  return bytesToCode(bytes);
}

/** Either scheme → { scheme, whoBit, level, streak, rounds, counts }, or
    null for junk. `counts` is always SPRITES.length long; a v1 code from
    before the array grew simply reads 0 for everything it predates. */
export function decodeSquad(code) {
  const b = codeToBytes(String(code || '').trim());
  if (b.length < 6) return null;
  const scheme = b[0];
  if (scheme !== SQUAD_SCHEME_V1 && scheme !== SQUAD_SCHEME_V2) return null;
  const counts = new Array(SPRITES.length).fill(0);
  if (scheme === SQUAD_SCHEME_V1) {
    for (let i = 0; i < SPRITES.length; i += 2) {
      const byte = b[6 + i / 2]; if (byte == null) break;
      counts[i] = byte >> 4;
      if (i + 1 < SPRITES.length) counts[i + 1] = byte & 15;
    }
  } else {
    for (let i = 0; i < SPRITES.length; i++) {
      const byte = b[6 + (i >> 3)]; if (byte == null) break;
      counts[i] = (byte >> (7 - (i & 7))) & 1;
    }
  }
  return {
    scheme, whoBit: b[1] === 1 ? 1 : 0, level: b[2], streak: b[3],
    rounds: (b[4] << 8) | b[5], counts,
  };
}
