// Shared UI: routing, top bar, doll stage, weather, modals, and the question runner.

import { $, esc, shuffle } from './util.js';
import { renderDoll } from './doll.js';
import { renderScene } from './scenes.js';
import { store, addStars } from './store.js';
import { speak, sfx, narrate, unlockAudio, stopSpeaking } from './audio.js';

// ---------- Router ----------

const screens = {};
let current = null;
export const registerScreen = (name, fn) => { screens[name] = fn; };

export function go(name, params = {}) {
  stopSpeaking();
  closeModal();
  if (current && current.cleanup) current.cleanup();
  const app = $('#app');
  app.innerHTML = '';
  const el = document.createElement('div');
  el.className = `screen scr-${name}`;
  app.appendChild(el);
  current = { name, params, el, cleanup: null };
  const res = screens[name](el, params, current);
  if (typeof res === 'function') current.cleanup = res;
}

// ---------- Small builders ----------

export const sayBtn = (text, lang = '', fallback = '') =>
  `<button class="say-btn" data-say="${esc(text)}"${lang ? ` data-lang="${esc(lang)}"` : ''}${fallback ? ` data-fallback="${esc(fallback)}"` : ''} aria-label="Read aloud">🔊</button>`;

export function topbar(title, { back = 'home', extra = '' } = {}) {
  return `<header class="topbar">
    ${back ? `<button class="icon-btn" data-go="${back}" aria-label="Back">${back === 'home' ? '🏠' : '⬅️'}</button>` : ''}
    <h1>${title}</h1>${extra}
    <span class="stars-chip" aria-label="stars">⭐ <span class="star-count">${store.state.stars}</span></span>
    <button class="stars-chip coins-chip" data-go="boutique" aria-label="coins">🪙 <span class="coin-count">${store.state.coins}</span></button>
  </header>`;
}

export function refreshStars() {
  document.querySelectorAll('.star-count').forEach(el => { el.textContent = store.state.stars; });
  document.querySelectorAll('.coin-count').forEach(el => { el.textContent = store.state.coins; });
  document.querySelectorAll('.stars-chip').forEach(el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
}

// Global taps: read-aloud buttons and simple navigation.
document.addEventListener('click', e => {
  unlockAudio();
  const say = e.target.closest('[data-say]');
  if (say) {
    e.stopPropagation();
    speak(say.dataset.say, { lang: say.dataset.lang || 'en-US', fallback: say.dataset.fallback || null });
    return;
  }
  const nav = e.target.closest('[data-go]');
  if (nav) {
    sfx('tap');
    go(nav.dataset.go, nav.dataset.param ? { id: nav.dataset.param } : {});
  }
}, true);

// ---------- Stage ----------

export const STAGE_VIEW = '-50 -40 500 850';
export const FACE_VIEW = '95 25 210 245';

export function stageHTML({ look = store.state.look, scene = 'studio', uid = 'stage', expr = 'smile', view = STAGE_VIEW } = {}) {
  return `<div class="stage" data-scene="${scene}">
    ${renderScene(scene)}
    <div class="doll-wrap">${renderDoll(look, { uid, expr, viewBox: view })}</div>
    <div class="fx"></div>
  </div>`;
}

export function updateDoll(stage, look, { uid = 'stage', expr = 'smile', view = STAGE_VIEW } = {}) {
  const wrap = stage.querySelector('.doll-wrap');
  if (!wrap) return;
  wrap.innerHTML = renderDoll(look, { uid, expr, viewBox: view });
  if (view !== STAGE_VIEW) wrap.firstElementChild.setAttribute('preserveAspectRatio', 'xMidYMid meet');
}

export function setScene(stage, scene) {
  const old = stage.querySelector('.scene');
  const tmp = document.createElement('div');
  tmp.innerHTML = renderScene(scene);
  old.replaceWith(tmp.firstElementChild);
  stage.dataset.scene = scene;
}

// Animates the doll's viewBox (zoom to face and back).
export function zoomDoll(stage, toView) {
  const svg = stage.querySelector('.doll');
  if (!svg) return;
  const from = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const to = toView.split(/\s+/).map(Number);
  stage.classList.toggle('zoom', toView !== STAGE_VIEW);
  const t0 = performance.now();
  const dur = 320;
  const step = now => {
    const k = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    const live = stage.querySelector('.doll');
    if (!live) return;
    live.setAttribute('viewBox', from.map((v, i) => (v + (to[i] - v) * e).toFixed(1)).join(' '));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function bubble(stage, text, { read = true } = {}) {
  stage.querySelector('.bubble')?.remove();
  if (!text) return;
  const b = document.createElement('div');
  b.className = 'bubble';
  b.innerHTML = `<p>${esc(text)}</p>${sayBtn(text)}`;
  b.addEventListener('click', () => b.remove());
  stage.appendChild(b);
  if (read) narrate(text);
}

export function wiggle(stage, cls = 'wiggle') {
  const w = stage.querySelector('.doll-wrap');
  if (!w) return;
  w.classList.remove('wiggle', 'shiver');
  void w.offsetWidth;
  w.classList.add(cls);
}

export const SEASONS = [
  { id: 'spring', name: 'Spring', emoji: '🌸', fx: 'petal' },
  { id: 'summer', name: 'Summer', emoji: '☀️', fx: 'sun' },
  { id: 'monsoon', name: 'Monsoon', emoji: '🌧️', fx: 'rain' },
  { id: 'autumn', name: 'Autumn', emoji: '🍂', fx: 'leaf' },
  { id: 'winter', name: 'Winter', emoji: '❄️', fx: 'snow' },
];

export function setWeather(stage, seasonId) {
  const fx = stage.querySelector('.fx');
  if (!fx) return;
  const s = SEASONS.find(x => x.id === seasonId);
  if (!s) { fx.innerHTML = ''; return; }
  const n = s.fx === 'rain' ? 46 : s.fx === 'sun' ? 14 : 26;
  let h = '';
  for (let i = 0; i < n; i++) {
    const left = Math.random() * 100;
    const delay = -Math.random() * 8;
    const dur = s.fx === 'rain' ? 0.7 + Math.random() * 0.5 : s.fx === 'sun' ? 2 + Math.random() * 3 : 5 + Math.random() * 6;
    const top = s.fx === 'sun' ? `top:${Math.random() * 60}%;` : '';
    const scale = 0.6 + Math.random() * 0.8;
    h += `<i class="p ${s.fx}" style="left:${left}%;${top}animation-duration:${dur}s;animation-delay:${delay}s;scale:${scale}"></i>`;
  }
  fx.innerHTML = h;
}

// ---------- Overlays ----------

export function modal(html, { onClose = null, dismiss = true } = {}) {
  closeModal();
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal" role="dialog">${html}</div>`;
  back.addEventListener('click', e => {
    if (e.target === back && dismiss) closeModal();
    if (e.target.closest('[data-close]')) closeModal();
  });
  back._onClose = onClose;
  document.body.appendChild(back);
  return back.firstElementChild;
}

export function closeModal() {
  document.querySelectorAll('.modal-back').forEach(m => { m.remove(); m._onClose && m._onClose(); });
}

export function toast(msg, ms = 2200) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

// Non-blocking announcement that slides in at the top (new sticker, new rank, coins…).
const banners = [];
let bannerBusy = false;
export function celebrate(b) {
  banners.push(b);
  if (!bannerBusy) nextBanner();
}
function nextBanner() {
  const b = banners.shift();
  if (!b) { bannerBusy = false; return; }
  bannerBusy = true;
  const el = document.createElement('div');
  el.className = 'banner-pop';
  el.innerHTML = `<span class="e">${b.e}</span><div><b>${esc(b.title)}</b>${b.text ? `<small>${esc(b.text)}</small>` : ''}</div>`;
  document.body.appendChild(el);
  sfx('unlock');
  refreshStars();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); nextBanner(); }, 400); }, 3200);
}

export function confetti(n = 70) {
  const box = document.createElement('div');
  box.className = 'confetti';
  const cols = ['#ff5fa2', '#ffd43b', '#8e6cff', '#4fc3f7', '#3ddc97', '#ff8a65'];
  box.innerHTML = Array.from({ length: n }, () => `<i style="left:${Math.random() * 100}%;background:${cols[Math.floor(Math.random() * cols.length)]};--dx:${(Math.random() - 0.5) * 200}px;animation-delay:${Math.random() * 0.6}s"></i>`).join('');
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3200);
}

// Grown-up gate: press and hold for ~2.5 s (hard for a young child to do by accident).
export function parentGate(onPass) {
  const m = modal(`<h2>👩‍👧 Grown-ups only</h2>
    <p class="note">Press and hold the button until it fills up.</p>
    <div class="actions"><button class="btn purple big hold-btn"><span class="fill"></span><span>Hold me ✋</span></button></div>`);
  const b = m.querySelector('.hold-btn');
  let timer = null;
  const start = e => { e.preventDefault(); b.classList.add('holding'); timer = setTimeout(() => { closeModal(); onPass(); }, 2500); };
  const stop = () => { b.classList.remove('holding'); clearTimeout(timer); };
  b.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
}

// ---------- Question runner ----------

const PRAISE = ['Great job!', 'Super!', 'You got it!', 'Brilliant!', 'Amazing!', 'Well done!', 'Fantastic!'];
const RETRY = ['Almost! Try again.', 'Oops, have another go!', 'Not quite. You can do it!'];
const pickOne = a => a[Math.floor(Math.random() * a.length)];

/**
 * Shows questions one at a time inside `box`. First-try correct answers earn a star.
 * Calls onDone({ correct, total }) after the last one.
 */
export function runQuestions(box, questions, { onDone, title = '' } = {}) {
  let i = 0;
  let correct = 0;
  const total = questions.length;

  const show = () => {
    const q = questions[i];
    let tries = 0;
    const promptSay = q.say || q.prompt;
    box.innerHTML = `<div class="q-wrap">
      <div class="q-head"><span class="q-topic">${esc(title || q.topic || '')}</span><span class="q-count">${i + 1} / ${total}</span></div>
      <div class="q-prompt"><p>${esc(q.prompt)}</p>${sayBtn(promptSay)}</div>
      ${q.visual ? `<div class="q-visual">${q.visual}</div>` : ''}
      <div class="q-answer"></div>
      <div class="q-feedback"></div>
    </div>`;
    narrate(promptSay);
    const ans = box.querySelector('.q-answer');
    const fb = box.querySelector('.q-feedback');

    const finish = (gotIt) => {
      if (gotIt && tries === 0) {
        correct++;
        const stat = { math: 'math', word: 'words', spell: 'words', quiz: 'quiz' }[q.kind];
        store.update(s => { if (stat) s.stats[stat] = (s.stats[stat] || 0) + 1; });
        addStars(1);
        refreshStars();
      }
      const text = (gotIt ? pickOne(PRAISE) + ' ' : '') + (q.explain || '');
      fb.innerHTML = `<div class="explain">${gotIt ? '🎉' : '💡'} <span style="flex:1">${esc(text)}</span>${sayBtn(text)}</div>
        <div class="actions" style="display:flex;justify-content:center;margin-top:12px"><button class="btn green big next">${i + 1 < total ? 'Next ➜' : 'Finish ✓'}</button></div>`;
      if (gotIt) narrate(text);
      fb.querySelector('.next').addEventListener('click', () => {
        sfx('tap');
        i++;
        if (i < total) show(); else onDone && onDone({ correct, total });
      });
      fb.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    };

    if (q.kind === 'spell') {
      const word = q.word.toLowerCase();
      const letters = shuffle(word.split('').map((ch, k) => ({ ch, k })));
      const typed = [];
      ans.innerHTML = `<div class="spell-slots">${word.split('').map(() => '<div class="slot"></div>').join('')}</div>
        <div class="letters" style="margin-top:12px">${letters.map((l, k) => `<button class="letter" data-k="${k}">${esc(l.ch)}</button>`).join('')}</div>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:10px"><button class="btn white undo">↩️ Undo</button>${sayBtn(q.word)}</div>`;
      const slots = ans.querySelectorAll('.slot');
      const render = () => slots.forEach((s, k) => { s.textContent = typed[k] ? typed[k].ch : ''; s.classList.toggle('filled', !!typed[k]); });
      ans.querySelectorAll('.letter').forEach(btn => btn.addEventListener('click', () => {
        if (typed.length >= word.length) return;
        sfx('pop');
        typed.push({ ch: letters[+btn.dataset.k].ch, btn });
        btn.classList.add('used');
        render();
        if (typed.length === word.length) {
          const attempt = typed.map(t => t.ch).join('');
          if (attempt === word) {
            sfx('success');
            ans.querySelectorAll('button').forEach(b => { b.disabled = true; });
            finish(true);
          } else {
            sfx('wrong');
            tries++;
            ans.querySelector('.spell-slots').animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 });
            fb.innerHTML = `<div class="explain try">🤔 <span style="flex:1">${tries >= 2 ? `It's spelled ${word.toUpperCase().split('').join(' - ')}.` : 'Not quite! Tap Undo and try again.'}</span></div>`;
            if (tries >= 2) speak(`It is spelled ${word.split('').join(', ')}`);
          }
        }
      }));
      ans.querySelector('.undo').addEventListener('click', () => {
        const t = typed.pop();
        if (t) { t.btn.classList.remove('used'); render(); }
      });
      return;
    }

    ans.innerHTML = `<div class="choices">${q.choices.map((c, k) => `<button class="choice${c.big ? ' big' : ''}" data-k="${k}">${esc(c.label)}</button>`).join('')}</div>`;
    ans.querySelectorAll('.choice').forEach(btn => btn.addEventListener('click', () => {
      const c = q.choices[+btn.dataset.k];
      if (c.value === q.answer) {
        sfx('success');
        btn.classList.add('right');
        ans.querySelectorAll('.choice').forEach(b => { b.disabled = true; });
        finish(true);
      } else {
        sfx('wrong');
        btn.classList.add('wrong');
        btn.disabled = true;
        tries++;
        if (tries >= 2) {
          const right = [...ans.querySelectorAll('.choice')].find(b => q.choices[+b.dataset.k].value === q.answer);
          right.classList.add('right');
          ans.querySelectorAll('.choice').forEach(b => { b.disabled = true; });
          finish(false);
        } else {
          const msg = pickOne(RETRY);
          fb.innerHTML = `<div class="explain try">🤔 <span style="flex:1">${msg}</span></div>`;
          narrate(msg);
        }
      }
    }));
  };
  show();
}

export function resultHTML({ correct, total }, extra = '') {
  const pct = total ? correct / total : 0;
  const stars = pct >= 0.99 ? 3 : pct >= 0.6 ? 2 : 1;
  return `<div class="result card">
    <div class="stars-big">${'⭐'.repeat(stars)}</div>
    <h2>${pct >= 0.99 ? 'Perfect!' : pct >= 0.6 ? 'Great work!' : 'Good try!'}</h2>
    <p>You got ${correct} out of ${total} on the first try.</p>${extra}</div>`;
}
