// Dress-Up Studio: free play, or a country's dressing challenge when params.challenge is set.

import { $, esc, pick, shade } from '../util.js';
import { HAIR_STYLES, HAIR_COLORS, SKIN_TONES, EYE_COLORS, PATTERNS, MY_LOOK, renderItemThumb, renderHairThumb, patternSwatch, normalizeLook } from '../doll.js';
import { itemsForSlot, getItem, freshWorn, thumbBox } from '../items.js';
import { store, isUnlocked, isOwned, trip, dollName } from '../store.js';
import { RESPECT_LINE } from '../data/religions.js';
import { getTheme } from '../data/themes.js';
import { getCountry, COUNTRIES, displayName } from '../data/countries.js';
import { SCENE_IDS, sceneInfo, sceneThumb } from '../scenes.js';
import { sfx, narrate } from '../audio.js';
import { go, topbar, stageHTML, updateDoll, setScene, zoomDoll, bubble, wiggle, setWeather, SEASONS, modal, closeModal, toast, confetti, STAGE_VIEW, FACE_VIEW } from '../ui.js';

export const PALETTE = [
  ['Ruby', '#e53935'], ['Crimson', '#b0123b'], ['Coral', '#ff7f6e'], ['Tangerine', '#ff9800'], ['Sunshine', '#ffd43b'], ['Lemon', '#fff176'],
  ['Mint', '#7ee0c3'], ['Emerald', '#2e9e5b'], ['Turquoise', '#30d5c8'], ['Sky blue', '#7ec8ff'], ['Royal blue', '#3f51b5'], ['Navy', '#1f3a8a'],
  ['Lavender', '#c9a7ff'], ['Purple', '#8e44ad'], ['Magenta', '#e91e8c'], ['Pink', '#ff8fc8'], ['Blush', '#ffc6e0'], ['Peach', '#ffcba4'],
  ['Ivory', '#fffaf0'], ['White', '#ffffff'], ['Silver', '#cfd8dc'], ['Gold', '#f2c14e'], ['Chocolate', '#6d4c41'], ['Black', '#262626'],
];
const LIPS = [['Natural', null], ['Rose', '#e06c8a'], ['Cherry', '#d32f2f'], ['Coral', '#ff7f6e'], ['Berry', '#8e244d'], ['Bubblegum', '#ff5fa2'], ['Peach', '#ff9e80'], ['Plum', '#7b1fa2']];
const SHADOWS = [['None', null], ['Pink', '#ff8fc8'], ['Lilac', '#b39ddb'], ['Purple', '#8e44ad'], ['Sky', '#64b5f6'], ['Gold', '#f2c14e'], ['Mint', '#7ee0c3'], ['Bronze', '#b8733b'], ['Silver', '#cfd8dc']];
const BLUSH = [['None', null], ['Pink', '#ff8fa8'], ['Peach', '#ffab91'], ['Rose', '#f06292'], ['Coral', '#ff7f6e']];
const NAIL_COLORS = [['Bubblegum', '#ff5fa2'], ['Ruby', '#e53935'], ['Coral', '#ff7f6e'], ['Sunshine', '#ffd43b'], ['Mint', '#7ee0c3'], ['Sky blue', '#7ec8ff'], ['Lavender', '#c9a7ff'], ['Purple', '#8e44ad'], ['Gold', '#f2c14e'], ['Silver', '#cfd8dc'], ['White', '#ffffff'], ['Black', '#262626'], ['Peach', '#ffcba4'], ['Clear', null]];
const NAIL_ART = [['plain', 'Plain', '💅'], ['dots', 'Dots', '⚪'], ['stripes', 'Stripes', '〰️'], ['glitter', 'Glitter', '✨'], ['hearts', 'Hearts', '💗'], ['french', 'French tips', '🤍'], ['stars', 'Stars', '⭐']];

const TABS = [
  { id: 'hair', name: 'Hair', e: '💇‍♀️' },
  { id: 'face', name: 'Face', e: '💄' },
  { id: 'nails', name: 'Nails', e: '💅' },
  { id: 'dresses', name: 'Dresses', e: '👗', slots: ['dress'], filter: i => !(i.tags || []).includes('traditional') },
  { id: 'world', name: 'World', e: '🌏', slots: ['dress'], filter: i => (i.tags || []).includes('traditional') },
  { id: 'tops', name: 'Tops', e: '👚', slots: ['top'] },
  { id: 'bottoms', name: 'Skirts', e: '👖', slots: ['bottom'] },
  { id: 'coats', name: 'Layers', e: '🧥', slots: ['outer', 'scarf'] },
  { id: 'shoes', name: 'Shoes', e: '👟', slots: ['shoes', 'socks'] },
  { id: 'jewelry', name: 'Jewellery', e: '💍', slots: ['necklace', 'earrings', 'bracelet', 'ring'] },
  { id: 'hats', name: 'Hats', e: '👑', slots: ['head'] },
  { id: 'extras', name: 'Extras', e: '👜', slots: ['prop', 'glasses', 'back'] },
  { id: 'pets', name: 'Pets', e: '🐾', slots: ['pet'] },
];
const SLOT_TITLES = {
  dress: 'Dresses', outer: 'Coats, jackets & drapes', scarf: 'Scarves', shoes: 'Shoes', socks: 'Socks & tights', necklace: 'Necklaces', earrings: 'Earrings',
  bracelet: 'Bracelets & bangles', ring: 'Rings', head: 'Hats, scarves, crowns & hair things', pet: 'Pets', prop: 'Things to hold', glasses: 'Glasses', back: 'Wings', top: 'Tops', bottom: 'Skirts, shorts & pants',
};
const NO_PATTERN = new Set(['necklace', 'earrings', 'ring', 'bracelet', 'glasses', 'shoes', 'back', 'pet']);
const canWear = i => (!i.unlock || isUnlocked(i.id)) && (!i.price || isOwned(i.id));

export function warmth(L) {
  return ['top', 'bottom', 'dress', 'outer', 'socks', 'shoes', 'scarf', 'head'].reduce((n, s) => n + ((L[s] && getItem(L[s].id)?.warmth) || 0), 0);
}

function weatherLine(L, season) {
  const w = warmth(L);
  const outer = L.outer && getItem(L.outer.id);
  if (season === 'winter' && w < 6) return { text: 'Brrr! I\'m cold! Can I have a coat, a sweater or boots?', cold: true };
  if (season === 'summer' && ((outer && outer.warmth >= 2) || L.scarf || ['beanie', 'earmuffs'].includes(L.head?.id) || ['puffer'].includes(L.outer?.id))) return { text: 'Phew, it\'s so hot! Maybe take off the warm things?' };
  if (season === 'monsoon' && L.prop?.id !== 'umbrella' && L.outer?.id !== 'raincoat') return { text: 'It\'s raining! Do I have an umbrella or a raincoat?' };
  return null;
}

function randomLook(base) {
  const L = normalizeLook(base);
  const col = () => pick(PALETTE)[1];
  const worn = (slot, filter = () => true) => {
    const it = pick(itemsForSlot(slot).filter(i => canWear(i) && filter(i)));
    const w = freshWorn(it);
    if (Math.random() < 0.6) w.color = col();
    if (!NO_PATTERN.has(slot) && Math.random() < 0.3) w.pattern = pick(PATTERNS).id;
    return w;
  };
  L.hairStyle = pick(HAIR_STYLES).id;
  L.hairColor = Math.random() < 0.6 ? pick(HAIR_COLORS.slice(0, 6)).id : pick(HAIR_COLORS).id;
  ['top', 'bottom', 'dress', 'outer', 'scarf', 'socks', 'head', 'necklace', 'earrings', 'bracelet', 'ring', 'glasses', 'prop', 'back'].forEach(s => { L[s] = null; });
  if (Math.random() < 0.55) L.dress = worn('dress'); else { L.top = worn('top'); L.bottom = worn('bottom'); }
  L.shoes = worn('shoes');
  if (Math.random() < 0.5) L.necklace = worn('necklace');
  if (Math.random() < 0.6) L.earrings = worn('earrings');
  if (Math.random() < 0.5) L.head = worn('head');
  if (Math.random() < 0.3) L.prop = worn('prop');
  if (Math.random() < 0.3) L.bracelet = worn('bracelet');
  const nc = pick(NAIL_COLORS.slice(0, 12))[1];
  L.nails = [nc, nc, nc, nc, nc];
  L.makeup = { ...L.makeup, lips: pick(LIPS)[1], shadow: Math.random() < 0.5 ? pick(SHADOWS)[1] : null };
  return L;
}

// Big hand for the nail studio. Nail order: thumb, index, middle, ring, pinky.
const FINGERS = [
  { x: 52, top: 112, w: 36, rot: -38, len: 80 },
  { x: 104, top: 36, w: 36, len: 130 },
  { x: 148, top: 18, w: 38, len: 148 },
  { x: 192, top: 34, w: 36, len: 132 },
  { x: 232, top: 74, w: 30, len: 92 },
];

function nailArt(kind, x, y, w, h) {
  const cx = x + w / 2;
  switch (kind) {
    case 'dots': return [[cx - 5, y + 10], [cx + 5, y + 18], [cx - 4, y + 26]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3" fill="#fff"/>`).join('');
    case 'stripes': return `<path d="M${x + 3} ${y + 14}L${x + w - 3} ${y + 8}M${x + 3} ${y + 24}L${x + w - 3} ${y + 18}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
    case 'glitter': return Array.from({ length: 7 }, (_, i) => `<circle cx="${x + 5 + ((i * 7) % (w - 8))}" cy="${y + 6 + ((i * 11) % (h - 10))}" r="1.6" fill="#fff"/>`).join('');
    case 'hearts': return `<path d="M${cx} ${y + 24}l-6-6c-3-3 1-8 6-3 5-5 9 0 6 3z" fill="#fff"/>`;
    case 'french': return `<path d="M${x} ${y + 9}Q${cx} ${y - 2} ${x + w} ${y + 9}L${x + w} ${y + 2}Q${cx} ${y - 8} ${x} ${y + 2}Z" fill="#fff"/>`;
    case 'stars': return `<path d="M${cx} ${y + 8}l2.4 5 5.4.6-4 3.6 1.2 5.4-5-2.8-5 2.8 1.2-5.4-4-3.6 5.4-.6z" fill="#fff59d"/>`;
    default: return '';
  }
}

function handSVG(L, skin) {
  const sd = shade(skin, -0.18);
  let s = `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">`;
  s += `<path d="M70 160Q66 280 110 296L218 296Q258 280 252 168Z" fill="${skin}" stroke="${sd}" stroke-width="2"/>`;
  FINGERS.forEach((f, i) => {
    const g = f.rot ? `transform="rotate(${f.rot} ${f.x + f.w / 2} ${f.top + f.len})"` : '';
    const nw = f.w - 10;
    const nh = Math.min(46, f.len * 0.34);
    const nx = f.x + 5;
    const ny = f.top + 6;
    const col = L.nails[i];
    s += `<g ${g}><rect x="${f.x}" y="${f.top}" width="${f.w}" height="${f.len + 20}" rx="${f.w / 2}" fill="${skin}" stroke="${sd}" stroke-width="2"/>`;
    s += `<path d="M${f.x + 8} ${f.top + nh + 22}q${f.w / 2 - 8} 6 ${f.w - 16} 0" stroke="${sd}" fill="none" stroke-width="1.5"/>`;
    s += `<g class="nail" data-nail="${i}"><rect x="${nx - 3}" y="${ny - 3}" width="${nw + 6}" height="${nh + 6}" rx="${nw / 2}" fill="transparent"/>`;
    s += `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="${nw / 2}" fill="${col || '#fde3e3'}" stroke="${col ? shade(col, -0.25) : '#f0c9c9'}" stroke-width="1.5"/>`;
    if (col) s += nailArt(L.nailArt, nx, ny, nw, nh) + `<rect x="${nx + 4}" y="${ny + 4}" width="4" height="${nh * 0.4}" rx="2" fill="#fff" opacity=".45"/>`;
    s += `</g>`;
    if (L.mehndi) s += `<g stroke="#9a3b16" fill="none" stroke-width="2" opacity=".85"><path d="M${f.x + 6} ${f.top + nh + 34}h${f.w - 12}M${f.x + 6} ${f.top + nh + 42}h${f.w - 12}"/><circle cx="${f.x + f.w / 2}" cy="${f.top + nh + 60}" r="4" fill="#9a3b16"/></g>`;
    s += `</g>`;
  });
  if (L.mehndi) {
    s += `<g stroke="#9a3b16" fill="none" stroke-width="2.4" opacity=".85"><circle cx="160" cy="232" r="26"/><circle cx="160" cy="232" r="14"/><circle cx="160" cy="232" r="5" fill="#9a3b16"/>`;
    for (let k = 0; k < 12; k++) { const a = k * 30 * Math.PI / 180; s += `<circle cx="${(160 + Math.cos(a) * 34).toFixed(1)}" cy="${(232 + Math.sin(a) * 34).toFixed(1)}" r="3" fill="#9a3b16"/>`; }
    s += `<path d="M90 200q20 -20 40 0t40 0 40 0"/></g>`;
  }
  return s + '</svg>';
}

// The dressing room has three goal modes: a trip outfit, a respectful visit to a place
// of worship, and a fashion-show theme (goals there are tips, not requirements).
function challengeFor(params) {
  if (params.visit) {
    const c = getCountry(params.visit);
    const w = c.worship;
    return {
      kind: 'visit', title: `${c.flag} Getting ready to visit ${w.place}`, goals: w.dress, scene: w.scene, season: c.season, tab: w.dress[0].tab,
      intro: RESPECT_LINE, doneLine: 'We are dressed respectfully. Let\'s go in quietly!', required: true, readyLabel: 'I\'m ready ✓',
      done: () => { store.update(() => { trip(c.id).done.visitDress = true; }); go('trip', { id: c.id, step: 'visit' }); },
      back: () => go('trip', { id: c.id, step: 'visit' }),
    };
  }
  if (params.challenge) {
    const c = getCountry(params.challenge);
    return {
      kind: 'trip', title: `${c.flag} Get ready for ${displayName(c)}!`, goals: c.goals, scene: c.id, season: c.season, tab: 'world',
      intro: c.story.dress, doneLine: c.story.done, required: true, readyLabel: 'I\'m ready ✓', country: c,
      done: () => { store.update(() => { trip(c.id).done.dress = true; }); go('trip', { id: c.id, step: 'shop' }); },
      back: () => go('trip', { id: c.id, step: 'dress' }),
    };
  }
  if (params.show) {
    const t = getTheme(params.show);
    return {
      kind: 'show', title: `🎤 ${t.e} ${t.name}`, goals: t.tips, scene: 'runway', season: null, tab: t.tab || 'dresses',
      intro: t.intro, doneLine: 'Here I go! Wish me luck!', required: false, readyLabel: 'Walk the runway 🎤',
      done: () => go('runway', { theme: t.id }), back: () => go('show'),
    };
  }
  return null;
}

export default function studio(el, params = {}) {
  const ch = challengeFor(params);
  const L = store.state.look = normalizeLook(store.state.look);
  let scene = ch ? ch.scene : store.state.scene;
  let season = ch ? ch.season : store.state.season;
  let tab = params.tab || (ch ? ch.tab : 'dresses');
  let active = null;
  let paintAll = true;
  let nailColor = NAIL_COLORS[0][1];
  let view = STAGE_VIEW;
  let lastWeather = '';
  let exprTimer = null;
  let weatherTimer = null;
  const uid = 'stage';

  const title = ch ? esc(ch.title) : `👗 ${esc(dollName())}'s Dressing Room`;
  el.innerHTML = `${topbar(title, {
    back: ch ? '' : 'home',
    extra: `${ch ? `<button class="icon-btn back-trip" aria-label="Back to trip">⬅️</button>` : ''}
      <button class="icon-btn like-me" aria-label="Look like me">👧<span class="lbl">Me</span></button>
      <button class="icon-btn surprise" aria-label="Surprise me">🎲<span class="lbl">Surprise</span></button>
      <button class="icon-btn clear" aria-label="Start over">🧽</button>
      <button class="icon-btn snap" aria-label="Take a photo">📸</button>`,
  })}
  ${ch ? `<div class="challenge"><div class="goals"></div><button class="btn white hint">💡 Hint</button><button class="btn green ready" ${ch.required ? 'disabled' : ''}>${ch.readyLabel}</button></div>` : ''}
  <div class="studio-body">
    ${stageHTML({ look: L, scene, uid })}
    <div class="panel">
      <nav class="tabs">${TABS.map(t => `<button class="tab" data-tab="${t.id}"><span class="e">${t.e}</span>${t.name}</button>`).join('')}</nav>
      <div class="panel-scroll"></div>
      <div class="colorbar" hidden></div>
    </div>
  </div>`;

  const stage = $('.stage', el);
  const panelEl = $('.panel-scroll', el);
  const colorbar = $('.colorbar', el);
  stage.insertAdjacentHTML('beforeend', `<div class="stage-tools">${ch ? '' : `<button class="pill scene-btn"><span class="e">🖼️</span>Place</button>`}<button class="pill season-btn" ${ch && !ch.season ? 'hidden' : ''}><span class="e"></span><span class="t"></span></button></div>`);

  const save = () => store.save();
  const redraw = (expr = 'smile') => {
    updateDoll(stage, L, { uid, expr, view });
    if (ch) renderGoals();
  };
  const happy = () => {
    redraw('happy');
    clearTimeout(exprTimer);
    exprTimer = setTimeout(() => redraw(currentExpr()), 1200);
  };
  const currentExpr = () => (season === 'winter' && warmth(L) < 6 ? 'cold' : 'smile');

  const checkWeather = () => {
    if (ch && ch.kind !== 'trip') return;
    clearTimeout(weatherTimer);
    weatherTimer = setTimeout(() => {
      const w = weatherLine(L, season);
      const key = w ? w.text : '';
      if (key === lastWeather) return;
      if (w) { bubble(stage, w.text); if (w.cold) { wiggle(stage, 'shiver'); redraw('cold'); } }
      else if (lastWeather) { bubble(stage, 'Ahh, that feels just right!'); redraw('smile'); }
      lastWeather = key;
    }, 900);
  };

  const setSeason = s => {
    season = s;
    if (!s) { setWeather(stage, null); return; }
    if (!ch) { store.state.season = s; save(); }
    const info = SEASONS.find(x => x.id === s);
    $('.season-btn .e', el).textContent = info.emoji;
    $('.season-btn .t', el).textContent = info.name;
    setWeather(stage, s);
  };

  // ----- Challenge -----
  function renderGoals() {
    const box = $('.goals', el);
    const status = ch.goals.map(g => !!g.test(L));
    box.innerHTML = ch.goals.map((g, i) => `<div class="goal ${status[i] ? 'ok' : ''}"><span class="ck">${status[i] ? '✓' : ''}</span>${g.icon} ${esc(g.text)}</div>`).join('');
    const ready = $('.ready', el);
    const all = status.every(Boolean);
    if (all && !ch.allDone) { sfx('sparkle'); bubble(stage, ch.required ? 'I love it! Tap "I\'m ready" when you are done.' : 'Wow, that matches the theme perfectly!'); }
    ch.allDone = all;
    if (ch.required) ready.disabled = !all;
  }

  if (ch) {
    $('.hint', el).addEventListener('click', () => {
      const g = ch.goals.find(x => !x.test(L));
      if (!g) return;
      sfx('tap');
      showTab(g.tab);
      const t = el.querySelector(`.tab[data-tab="${g.tab}"]`);
      t.classList.remove('hint'); void t.offsetWidth; t.classList.add('hint');
      t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      bubble(stage, g.text);
    });
    $('.ready', el).addEventListener('click', () => {
      sfx('success');
      if (ch.kind !== 'show') confetti();
      bubble(stage, ch.doneLine);
      redraw('happy');
      el.querySelector('.ready').disabled = true;
      setTimeout(ch.done, ch.kind === 'show' ? 900 : 2300);
    });
    $('.back-trip', el).addEventListener('click', () => ch.back());
  }

  // ----- Wearing items -----
  function wear(item) {
    if (!canWear(item)) {
      sfx('wrong');
      const msg = item.price
        ? `You can buy the ${item.name} in the Boutique for ${item.price} coins!`
        : `Get your ${displayName(getCountry(item.unlock))} passport stamp to unlock the ${item.name}!`;
      toast(`${item.price ? '🪙' : '🔒'} ${msg}`);
      narrate(msg);
      return;
    }
    const slot = item.slot;
    if (L[slot] && L[slot].id === item.id) {
      L[slot] = null;
      sfx('pop');
      active = null;
      redraw(currentExpr());
    } else {
      L[slot] = freshWorn(item);
      if (slot === 'dress') { L.top = null; L.bottom = null; }
      if (slot === 'top' || slot === 'bottom') L.dress = null;
      sfx('pop');
      active = slot;
      narrate(item.name);
      happy();
    }
    save();
    renderPanel();
    checkWeather();
  }

  function itemButton(item) {
    const worn = L[item.slot];
    const on = worn && worn.id === item.id;
    const locked = !canWear(item);
    const flag = item.from ? (COUNTRIES.find(c => (item.tags || []).includes(c.id)) || {}).flag || '' : '';
    return `<button class="item-btn ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-item="${item.id}" aria-label="${esc(item.name)}">
      ${flag ? `<span class="flagtag">${flag}</span>` : ''}${locked && item.price ? `<span class="price-tag">🪙 ${item.price}</span>` : ''}${renderItemThumb(item, worn, thumbBox(item))}<span class="nm">${esc(item.name)}</span></button>`;
  }

  // ----- Colour bar -----
  function renderColorbar() {
    const slotTabs = (TABS.find(t => t.id === tab) || {}).slots || [];
    if (!active || !slotTabs.includes(active) || !L[active]) { colorbar.hidden = true; return; }
    const w = L[active];
    const item = getItem(w.id);
    const rows = [];
    rows.push(`<div class="row"><span class="lbl">🎨 Colour</span>${PALETTE.map(([n, c]) => `<button class="swatch ${w.color === c ? 'on' : ''}" style="background:${c}" data-color="${c}" data-name="${n}" aria-label="${n}"></button>`).join('')}</div>`);
    if (!NO_PATTERN.has(active) && item.patternable !== false) {
      rows.push(`<div class="row"><span class="lbl">✨ Pattern</span>${PATTERNS.map(p => `<button class="swatch pat ${(w.pattern || 'solid') === p.id ? 'on' : ''}" data-pattern="${p.id}" data-name="${p.name}" aria-label="${p.name}">${patternSwatch(p.id, w.color)}</button>`).join('')}</div>`);
    }
    if (item.accent) {
      rows.push(`<div class="row"><span class="lbl">🎀 Trim</span>${PALETTE.map(([n, c]) => `<button class="swatch ${w.accent === c ? 'on' : ''}" style="background:${c}" data-accent="${c}" data-name="${n}" aria-label="${n}"></button>`).join('')}</div>`);
    }
    colorbar.innerHTML = rows.join('');
    colorbar.hidden = false;
  }

  colorbar.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !active || !L[active]) return;
    const w = L[active];
    if (b.dataset.color) { w.color = b.dataset.color; w.patternColor = null; }
    if (b.dataset.pattern) w.pattern = b.dataset.pattern;
    if (b.dataset.accent) w.accent = b.dataset.accent;
    sfx('pop');
    narrate(b.dataset.name);
    save();
    redraw();
    renderColorbar();
    panelEl.querySelectorAll(`[data-item="${w.id}"]`).forEach(btn => { btn.outerHTML = itemButton(getItem(w.id)); });
  });

  // ----- Panels -----
  function swatches(list, current, attr, round = true) {
    return list.map(([n, c]) => c
      ? `<button class="swatch ${current === c ? 'on' : ''}" style="background:${c}${round ? '' : ';border-radius:14px'}" ${attr}="${c}" data-name="${n}" aria-label="${n}"></button>`
      : `<button class="swatch none ${current == null ? 'on' : ''}" ${attr}="" data-name="${n}" aria-label="${n}">✕</button>`).join('');
  }
  const chips = (list, current, attr) => list.map(([v, n, e]) => `<button class="chip ${current === v ? 'on' : ''}" ${attr}="${v}" data-name="${n}"><span class="e">${e}</span>${n}</button>`).join('');

  function renderPanel() {
    let h = '';
    if (tab === 'hair') {
      h += `<div class="sec-title">💇‍♀️ Hair style</div><div class="grid">${HAIR_STYLES.map(s => `<button class="item-btn ${L.hairStyle === s.id ? 'on' : ''}" data-hairstyle="${s.id}" data-name="${s.name}">${renderHairThumb(s.id, L.hairColor, L.skin)}<span class="nm">${s.name}</span></button>`).join('')}</div>`;
      h += `<div class="sec-title">🎨 Hair colour</div><div class="chip-row">${HAIR_COLORS.map(c => `<button class="swatch ${L.hairColor === c.id ? 'on' : ''}" style="background:${c.grad ? `linear-gradient(${c.grad.join(',')})` : c.c}" data-haircolor="${c.id}" data-name="${c.name}" aria-label="${c.name}"></button>`).join('')}</div>`;
    } else if (tab === 'face') {
      const m = L.makeup;
      h += `<div class="sec-title">🙂 Skin</div><div class="chip-row">${SKIN_TONES.map(s => `<button class="swatch ${L.skin === s.id ? 'on' : ''}" style="background:${s.c}" data-skin="${s.id}" data-name="${s.name}" aria-label="${s.name}"></button>`).join('')}</div>`;
      h += `<div class="sec-title">👀 Eyes</div><div class="chip-row">${EYE_COLORS.map(s => `<button class="swatch ${L.eyes === s.id ? 'on' : ''}" style="background:${s.c}" data-eyes="${s.id}" data-name="${s.name}" aria-label="${s.name}"></button>`).join('')}</div>`;
      h += `<div class="sec-title">💋 Lipstick</div><div class="chip-row">${swatches(LIPS, m.lips, 'data-lips')}</div>`;
      h += `<div class="sec-title">✨ Eyeshadow</div><div class="chip-row">${swatches(SHADOWS, m.shadow, 'data-shadow')}</div>`;
      h += `<div class="sec-title">🌸 Blush</div><div class="chip-row">${swatches(BLUSH, m.blush, 'data-blush')}</div>`;
      h += `<div class="sec-title">😁 Smile</div><div class="chip-row">${chips([['grin', 'Gap-tooth grin', '😁'], ['soft', 'Sweet smile', '🙂']], m.smile === 'grin' ? 'grin' : 'soft', 'data-smile')}</div>`;
      h += `<div class="sec-title">🔴 Bindi <small>from India</small></div><div class="chip-row">${chips([['', 'None', '✕'], ['small', 'Little black dot', '⚫'], ['dot', 'Red dot', '🔴'], ['jewel', 'Jewel', '💎'], ['drop', 'Drop', '💧'], ['star', 'Star', '⭐']], m.bindi || '', 'data-bindi')}</div>`;
      h += `<div class="sec-title">🎨 Face paint</div><div class="chip-row">${chips([['', 'None', '✕'], ['heart', 'Heart', '💗'], ['star', 'Star', '⭐'], ['flower', 'Flower', '🌸'], ['rainbow', 'Rainbow', '🌈'], ['butterfly', 'Butterfly', '🦋']], m.art || '', 'data-art')}</div>`;
      h += `<div class="sec-title">💫 Extras</div><div class="chip-row">${chips([['kajal', 'Kajal eyeliner', '✏️'], ['lashes', 'Long lashes', '👁️'], ['glitter', 'Glitter cheeks', '✨']], '', 'data-toggle')}</div>`;
    } else if (tab === 'nails') {
      h += `<div class="sec-title">💅 Nail salon <small>${paintAll ? 'Tap a colour to paint all nails' : 'Tap a colour, then tap a nail'}</small></div>`;
      h += `<div class="nail-hand">${handSVG(L, SKIN_TONES.find(s => s.id === L.skin).c)}</div>`;
      h += `<div class="chip-row">${chips([['all', 'Paint all', '🖐️'], ['one', 'One by one', '☝️']], paintAll ? 'all' : 'one', 'data-paintmode')}</div>`;
      h += `<div class="chip-row">${swatches(NAIL_COLORS, nailColor, 'data-nailcolor')}</div>`;
      h += `<div class="sec-title">🌟 Nail art</div><div class="chip-row">${chips(NAIL_ART, L.nailArt, 'data-nailart')}</div>`;
      h += `<div class="sec-title">🌿 Mehndi (henna) <small>a pretty Indian tradition for festivals and weddings</small></div><div class="chip-row">${chips([['on', 'Mehndi on', '🌿'], ['off', 'No mehndi', '✋']], L.mehndi ? 'on' : 'off', 'data-mehndi')}</div>`;
    } else {
      const t = TABS.find(x => x.id === tab);
      for (const slot of t.slots) {
        const items = itemsForSlot(slot).filter(t.filter || (() => true));
        h += `<div class="sec-title">${tab === 'world' ? 'Outfits from around the world' : SLOT_TITLES[slot]} <small>tap again to take off</small></div><div class="grid">${items.map(itemButton).join('')}</div>`;
      }
      if (tab === 'world') h += `<p class="note">Each outfit shows the flag of the place it comes from. Tap one to hear its name!</p>`;
      if (tab === 'pets') h += `<p class="note">Earn pets by collecting passport stamps, or buy one in the Boutique with your coins 🪙.</p>`;
    }
    panelEl.innerHTML = h;
    // lashes/glitter chips show on/off state
    panelEl.querySelectorAll('[data-toggle]').forEach(b => {
      const k = b.dataset.toggle;
      const on = k === 'lashes' ? L.makeup.lashes !== false : !!L.makeup[k];
      b.classList.toggle('on', on);
    });
    renderColorbar();
  }

  function showTab(id) {
    tab = id;
    el.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === id));
    const t = TABS.find(x => x.id === id);
    if (t.slots && !(active && t.slots.includes(active))) active = t.slots.find(s => L[s]) || null;
    const newView = id === 'hair' || id === 'face' ? FACE_VIEW : STAGE_VIEW;
    if (newView !== view) { view = newView; zoomDoll(stage, view); }
    panelEl.scrollTop = 0;
    renderPanel();
  }

  el.querySelector('.tabs').addEventListener('click', e => {
    const b = e.target.closest('.tab');
    if (!b) return;
    sfx('tap');
    showTab(b.dataset.tab);
  });

  panelEl.addEventListener('click', e => {
    const b = e.target.closest('button, .nail');
    if (!b) return;
    const d = b.dataset;
    if (d.item) { wear(getItem(d.item)); return; }
    if (b.classList.contains('nail')) {
      if (!paintAll) { L.nails[+d.nail] = nailColor; sfx('pop'); save(); redraw(); renderPanel(); }
      return;
    }
    if (d.hairstyle) { L.hairStyle = d.hairstyle; happy(); }
    else if (d.haircolor) L.hairColor = d.haircolor;
    else if (d.skin) L.skin = d.skin;
    else if (d.eyes) L.eyes = d.eyes;
    else if ('lips' in d) L.makeup.lips = d.lips || null;
    else if ('shadow' in d) L.makeup.shadow = d.shadow || null;
    else if ('blush' in d) L.makeup.blush = d.blush || null;
    else if ('bindi' in d) L.makeup.bindi = d.bindi || null;
    else if ('art' in d) L.makeup.art = d.art || null;
    else if (d.toggle === 'lashes') L.makeup.lashes = L.makeup.lashes === false;
    else if (d.toggle === 'glitter') L.makeup.glitter = !L.makeup.glitter;
    else if (d.toggle === 'kajal') L.makeup.kajal = !L.makeup.kajal;
    else if (d.smile) L.makeup.smile = d.smile;
    else if (d.paintmode) paintAll = d.paintmode === 'all';
    else if ('nailcolor' in d) { nailColor = d.nailcolor || null; if (paintAll) L.nails = [0, 1, 2, 3, 4].map(() => nailColor); }
    else if (d.nailart) L.nailArt = d.nailart;
    else if (d.mehndi) L.mehndi = d.mehndi === 'on';
    else return;
    sfx('pop');
    if (d.name) narrate(d.name);
    save();
    if (!d.hairstyle) redraw();
    renderPanel();
  });

  // ----- Top bar tools -----
  $('.like-me', el).addEventListener('click', () => {
    Object.assign(L, normalizeLook(JSON.parse(JSON.stringify(MY_LOOK))));
    active = null;
    sfx('sparkle');
    save();
    happy();
    renderPanel();
    checkWeather();
    bubble(stage, 'Now we look the same! Twins!');
  });
  $('.surprise', el).addEventListener('click', () => {
    Object.assign(L, randomLook(L));
    sfx('sparkle');
    save();
    happy();
    renderPanel();
    checkWeather();
  });
  $('.clear', el).addEventListener('click', () => {
    ['top', 'bottom', 'dress', 'outer', 'scarf', 'socks', 'shoes', 'head', 'necklace', 'earrings', 'bracelet', 'ring', 'glasses', 'prop', 'back'].forEach(s => { L[s] = null; });
    L.makeup = { ...L.makeup, lips: null, shadow: null, bindi: null, art: null, glitter: false };
    L.mehndi = false;
    active = null;
    sfx('whoosh');
    save();
    redraw();
    renderPanel();
  });
  $('.snap', el).addEventListener('click', () => {
    sfx('camera');
    const f = document.createElement('div');
    f.className = 'flash';
    stage.appendChild(f);
    setTimeout(() => f.remove(), 600);
    store.update(s => {
      s.album.unshift({ look: JSON.parse(JSON.stringify(L)), scene, season, at: Date.now() });
      s.album = s.album.slice(0, 40);
      s.stats.photos = (s.stats.photos || 0) + 1;
    });
    toast('📸 Saved to your photo album!');
  });

  // ----- Scene & season pickers -----
  $('.season-btn', el).addEventListener('click', () => {
    if (ch) {
      const s = SEASONS.find(x => x.id === season);
      bubble(stage, `In ${displayName(ch)} right now it is ${s.name.toLowerCase()}: ${ch.weather.toLowerCase()}, about ${ch.temp}°C.`);
      return;
    }
    const m = modal(`<h2>🌦️ Pick a season</h2><div class="chip-row">${SEASONS.map(s => `<button class="chip ${s.id === season ? 'on' : ''}" data-season="${s.id}"><span class="e">${s.emoji}</span>${s.name}</button>`).join('')}</div>
      <p class="note">Monsoon is the big rainy season in India and other parts of Asia.</p>`);
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-season]');
      if (!b) return;
      sfx('tap');
      setSeason(b.dataset.season);
      narrate(SEASONS.find(s => s.id === b.dataset.season).name);
      closeModal();
      lastWeather = '';
      checkWeather();
    });
  });
  const sceneBtn = $('.scene-btn', el);
  if (sceneBtn) sceneBtn.addEventListener('click', () => {
    const m = modal(`<h2>🖼️ Where are we?</h2><div class="grid">${SCENE_IDS.map(id => {
      const info = sceneInfo(id);
      const locked = (info.country && !store.state.trips[info.country]?.stamp) || (info.visit && !store.state.trips[info.visit]?.done?.visit);
      return `<button class="item-btn ${id === scene ? 'on' : ''} ${locked ? 'locked' : ''}" data-scene="${id}" data-locked="${locked ? 1 : ''}">${sceneThumb(id)}<span class="nm">${info.emoji} ${esc(info.name)}</span></button>`;
    }).join('')}</div><p class="note">Visit a country on the World Tour to unlock its picture.</p>`);
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-scene]');
      if (!b) return;
      if (b.dataset.locked) { sfx('wrong'); toast('🔒 Visit this country on the World Tour first!'); return; }
      sfx('tap');
      scene = b.dataset.scene;
      store.state.scene = scene;
      save();
      setScene(stage, scene);
      closeModal();
    });
  });

  setSeason(season);
  showTab(tab);
  if (ch) { bubble(stage, ch.intro); ch.allDone = ch.goals.every(g => g.test(L)); renderGoals(); }
  else bubble(stage, `Hi ${store.state.kidName || 'friend'}! What should I wear today?`, { read: false });

  return () => { clearTimeout(exprTimer); clearTimeout(weatherTimer); };
}
