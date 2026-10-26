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

// Rough colour family of a hex colour, for outfit challenges and fashion-show judging.
export function colorFamily(hex) {
  if (!hex || hex[0] !== '#') return null;
  const [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (l > 0.9 || (d < 0.08 && l > 0.75)) return 'white';
  if (l < 0.18) return 'black';
  if (d < 0.12) return l > 0.6 ? 'white' : 'grey';
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const s = d / (1 - Math.abs(2 * l - 1));
  if (h < 15 || h >= 335) return l > 0.72 && s > 0.3 ? 'pink' : 'red';
  if (h < 40) return l < 0.45 ? 'brown' : 'orange';
  if (h < 65) return l < 0.4 ? 'brown' : 'yellow';
  if (h < 165) return 'green';
  if (h < 255) return 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}

export const today = () => new Date().toISOString().slice(0, 10);
