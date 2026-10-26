// World map with destination pins: zoom levels for Asia, Europe & the Middle East, and the world.

import { $, esc } from '../util.js';
import { store, dollName } from '../store.js';
import { COUNTRIES, FOCUS, getCountry, displayName } from '../data/countries.js';
import { MAP_W, MAP_H, SPHERE, WORLD, COUNTRY_SHAPES, PINS, VIEWS as MAP_VIEWS } from '../data/worldmap.js';
import { sfx, narrate } from '../audio.js';
import { go, topbar, modal, closeModal, sayBtn } from '../ui.js';

export const VIEWS = { ...MAP_VIEWS, world: [0, 0, MAP_W, MAP_H] };

export const REGIONS = {
  asia: { name: 'My Asia', emoji: '🏡', ids: ['IN', 'KR', 'TW', 'SG', 'BALI', 'JP', 'TH'], at: [790, 200] },
  europe: { name: 'Europe & Middle East', emoji: '🏰', ids: ['UK', 'FR', 'ES', 'EG', 'AE'], at: [560, 130] },
};
export const regionOf = id => Object.keys(REGIONS).find(r => REGIONS[r].ids.includes(id)) || 'world';

export const CONTINENT = {
  IN: 'Asia', KR: 'Asia', TW: 'Asia', SG: 'Asia', BALI: 'Asia', JP: 'Asia', TH: 'Asia', AE: 'Asia, in the Middle East',
  FR: 'Europe', UK: 'Europe', ES: 'Europe', EG: 'Africa', AU: 'Oceania', BR: 'South America', US: 'North America',
};

// `plain` draws every country the same colour (used by Map Quest so the answer isn't given away).
export function mapSVG(view, extra = '', { plain = false } = {}) {
  const shapes = Object.entries(COUNTRY_SHAPES).filter(([k]) => k !== 'ID').map(([k, d]) => {
    const c = getCountry(k);
    const done = c && store.state.trips[k]?.stamp;
    const col = plain ? '#d9f2c4' : done ? '#8be3b5' : k === 'BALI' ? '#ff8fc8' : c && c.focus ? '#c9a7ff' : '#ffd166';
    return `<path d="${d}" fill="${col}" stroke="${plain ? '#9bc98f' : '#7a5aa6'}" stroke-width="${plain ? 0.35 : 0.4}" data-country="${k}"/>`;
  }).join('');
  return `<svg viewBox="${view.join(' ')}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path d="${SPHERE}" fill="#9fdcff"/>
    <path d="${WORLD}" fill="#d9f2c4" stroke="#9bc98f" stroke-width=".35"/>
    <path d="${COUNTRY_SHAPES.ID}" fill="${plain ? '#d9f2c4' : '#f4ddb0'}" stroke="${plain ? '#9bc98f' : '#c9a86a'}" stroke-width=".3" data-country="ID"/>
    ${shapes}${extra}</svg>`;
}

// Converts map coordinates to pixel positions inside a box showing `view` with "meet".
export function project(box, view, [x, y]) {
  const [vx, vy, vw, vh] = view;
  const bw = box.clientWidth;
  const bh = box.clientHeight;
  const s = Math.min(bw / vw, bh / vh);
  return [(bw - vw * s) / 2 + (x - vx) * s, (bh - vh * s) / 2 + (y - vy) * s];
}

export default function mapScreen(el, params = {}) {
  let mode = params.mode || 'asia';
  el.innerHTML = `${topbar('✈️ World Tour')}
  <div class="map-wrap">
    <div class="map-svg"></div>
    <div class="map-toggle">${[['asia', '🏡', 'My Asia'], ['europe', '🏰', 'Europe & Middle East'], ['world', '🌍', 'Whole world']].map(([m, e, n]) => `<button class="pill" data-mode="${m}"><span class="e">${e}</span>${n}</button>`).join('')}</div>
    ${COUNTRIES.map(c => `<button class="pin ${c.focus ? 'focus' : ''} ${store.state.trips[c.id]?.stamp ? 'done' : ''}" data-id="${c.id}"><span class="head"><span>${c.flag}</span></span><span class="nm">${esc(displayName(c))}</span></button>`).join('')}
  </div>`;
  const wrap = $('.map-wrap', el);
  const svgBox = $('.map-svg', el);

  const route = () => {
    const pts = FOCUS.map(c => PINS[c.id]);
    return mode === 'asia' ? `<path d="M${pts.map(p => p.join(' ')).join('L')}" stroke="#ff5fa2" stroke-width=".7" stroke-dasharray="2 2" fill="none"/>` : '';
  };

  const layout = () => {
    const view = VIEWS[mode];
    svgBox.innerHTML = mapSVG(view, route());
    el.querySelectorAll('.pin').forEach(p => {
      const id = p.dataset.id;
      const [x, y] = project(wrap, view, PINS[id]);
      const inside = x > 0 && y > 0 && x < wrap.clientWidth && y < wrap.clientHeight;
      const clustered = mode === 'world' && regionOf(id) !== 'world';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.classList.toggle('hidden', !inside || clustered || (mode !== 'world' && regionOf(id) !== mode));
      p.classList.toggle('small', mode !== 'asia');
    });
    // In the world view the pins overlap, so one button per region zooms in instead.
    el.querySelectorAll('.cluster').forEach(b => b.remove());
    if (mode === 'world') {
      for (const [key, r] of Object.entries(REGIONS)) {
        const [x, y] = project(wrap, view, r.at);
        wrap.insertAdjacentHTML('beforeend', `<button class="cluster pill" data-region="${key}" style="left:${x}px;top:${y}px"><span class="e">${r.emoji}</span>${r.name}</button>`);
      }
      el.querySelectorAll('.cluster').forEach(b => b.addEventListener('click', () => setMode(b.dataset.region)));
    }
    el.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
  };
  const setMode = m => { mode = m; sfx('whoosh'); layout(); };

  el.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  el.querySelectorAll('.pin').forEach(p => p.addEventListener('click', () => {
    sfx('pop');
    const c = getCountry(p.dataset.id);
    const t = store.state.trips[c.id];
    const status = t?.stamp ? '✅ You have this stamp! Visit again any time.' : t && Object.keys(t.done || {}).length ? '🧳 Trip in progress' : '✨ New adventure!';
    const intro = c.isIsland ? `${c.name} is an island in ${c.countryName}.` : `${displayName(c)} is in ${CONTINENT[c.id]}.`;
    const m = modal(`<div class="country-head"><span class="flag">${c.flag}</span><div><h2>${esc(c.name)}</h2><p>${esc(c.story.title)}</p></div></div>
      <p style="font-weight:800;font-size:1.15rem">${esc(intro)} ${sayBtn(intro)}</p>
      <p class="note">${status}</p>
      <div class="actions"><button class="btn white" data-close>Not now</button><button class="btn big go-btn">Fly there ✈️</button></div>`);
    narrate(`${displayName(c)}! ${c.story.title}.`);
    m.querySelector('.go-btn').addEventListener('click', () => {
      closeModal();
      go('trip', { id: c.id });
    });
  }));

  requestAnimationFrame(layout);
  const onResize = () => layout();
  window.addEventListener('resize', onResize);
  if (!store.state.seenMapIntro) {
    store.update(s => { s.seenMapIntro = true; });
    setTimeout(() => narrate(`${dollName()} wants to fill her passport with stamps! Start with the places you know: India, Korea, Taiwan, Singapore and Bali. Tap a pin!`), 400);
  }
  return () => window.removeEventListener('resize', onResize);
}
