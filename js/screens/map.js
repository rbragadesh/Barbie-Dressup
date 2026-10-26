// World map with destination pins. Starts zoomed on the five home places in Asia.

import { $, esc } from '../util.js';
import { store, dollName } from '../store.js';
import { COUNTRIES, FOCUS, getCountry, displayName } from '../data/countries.js';
import { MAP_W, MAP_H, SPHERE, WORLD, COUNTRY_SHAPES, PINS } from '../data/worldmap.js';
import { sfx, narrate } from '../audio.js';
import { go, topbar, modal, closeModal, sayBtn } from '../ui.js';

export const VIEWS = {
  asia: [668, 110, 222, 190],
  world: [0, 0, MAP_W, MAP_H],
};

export function mapSVG(view, extra = '') {
  const shapes = Object.entries(COUNTRY_SHAPES).filter(([k]) => k !== 'ID').map(([k, d]) => {
    const c = getCountry(k);
    const done = c && store.state.trips[k]?.stamp;
    const col = k === 'BALI' ? '#ff8fc8' : c && c.focus ? '#c9a7ff' : '#ffd166';
    return `<path d="${d}" fill="${done ? '#8be3b5' : col}" stroke="#7a5aa6" stroke-width=".4"/>`;
  }).join('');
  return `<svg viewBox="${view.join(' ')}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path d="${SPHERE}" fill="#9fdcff"/>
    <path d="${WORLD}" fill="#d9f2c4" stroke="#9bc98f" stroke-width=".35"/>
    <path d="${COUNTRY_SHAPES.ID}" fill="#f4ddb0" stroke="#c9a86a" stroke-width=".3"/>
    ${shapes}${extra}</svg>`;
}

// Converts map coordinates to % positions inside a box showing `view` with "meet".
export function project(box, view, [x, y]) {
  const [vx, vy, vw, vh] = view;
  const bw = box.clientWidth;
  const bh = box.clientHeight;
  const s = Math.min(bw / vw, bh / vh);
  const ox = (bw - vw * s) / 2;
  const oy = (bh - vh * s) / 2;
  return [ox + (x - vx) * s, oy + (y - vy) * s];
}

export default function mapScreen(el) {
  let mode = 'asia';
  el.innerHTML = `${topbar('✈️ World Tour')}
  <div class="map-wrap">
    <div class="map-svg"></div>
    <div class="map-toggle"><button class="pill" data-mode="asia"><span class="e">🏡</span>My Asia</button><button class="pill" data-mode="world"><span class="e">🌍</span>Whole world</button></div>
    ${COUNTRIES.map(c => `<button class="pin ${c.focus ? 'focus' : ''} ${store.state.trips[c.id]?.stamp ? 'done' : ''}" data-id="${c.id}"><span class="head"><span>${c.flag}</span></span><span class="nm">${esc(displayName(c))}</span></button>`).join('')}
  </div>`;
  const wrap = $('.map-wrap', el);
  const svgBox = $('.map-svg', el);

  const route = () => {
    const pts = FOCUS.map(c => PINS[c.id]);
    return `<path d="M${pts.map(p => p.join(' ')).join('L')}" stroke="#ff5fa2" stroke-width="${mode === 'asia' ? 0.7 : 1.4}" stroke-dasharray="${mode === 'asia' ? '2 2' : '4 4'}" fill="none"/>`;
  };

  const layout = () => {
    const view = VIEWS[mode];
    svgBox.innerHTML = mapSVG(view, route());
    el.querySelectorAll('.pin').forEach(p => {
      const c = getCountry(p.dataset.id);
      const [x, y] = project(wrap, view, PINS[c.id]);
      const inside = x > 0 && y > 0 && x < wrap.clientWidth && y < wrap.clientHeight;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.classList.toggle('hidden', !inside || (mode === 'world' && c.focus && c.id !== 'IN'));
      p.classList.toggle('small', mode === 'world');
    });
    // In the world view the Asian pins overlap, so one button zooms in instead.
    el.querySelector('.cluster')?.remove();
    if (mode === 'world') {
      const [x, y] = project(wrap, view, [810, 190]);
      wrap.insertAdjacentHTML('beforeend', `<button class="cluster pill" style="left:${x}px;top:${y}px"><span class="e">🏡</span>My Asia</button>`);
      el.querySelector('.cluster').addEventListener('click', () => setMode('asia'));
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
    const intro = c.isIsland ? `${c.name} is an island in ${c.countryName}.` : `${displayName(c)} is in ${c.focus || c.id === 'JP' ? 'Asia' : { FR: 'Europe', EG: 'Africa', AU: 'Oceania', BR: 'South America' }[c.id]}.`;
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
