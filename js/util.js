// Small shared helpers: colour maths, randomness, DOM, storage-safe JSON.

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');
}

// amt < 0 darkens toward black, amt > 0 lightens toward white (range -1..1).
export function shade(hex, amt) {
  if (!hex || hex[0] !== '#') return hex;
  const rgb = hexToRgb(hex);
  const target = amt < 0 ? 0 : 255;
  const k = Math.abs(amt);
  return rgbToHex(rgb.map(c => c + (target - c) * k));
}

export function isLight(hex) {
  if (!hex || hex[0] !== '#') return true;
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export const fmtNum = n => n.toLocaleString('en-US');
