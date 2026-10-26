// Tap-based mini-games: step ordering and matching (used on sacred-place visits),
// Memory Match, Suitcase Packing and Map Quest.

import { $, esc, shuffle } from '../util.js';
import { store } from '../store.js';
import { COUNTRIES, getCountry, displayName } from '../data/countries.js';
import { RELIGIONS } from '../data/religions.js';
import { PINS } from '../data/worldmap.js';
import { allWords, wordKey } from '../learn.js';
import { addCoins, bumpStat } from '../game.js';
import { sfx, narrate } from '../audio.js';
import { go, topbar, modal, toast, confetti, sayBtn, refreshStars } from '../ui.js';
import { mapSVG, VIEWS, regionOf } from './map.js';

const shake = el => el.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 });

// ---------- Put the steps in order ----------

export function orderGame(box, steps, onDone) {
  let cards = shuffle(steps.map((s, i) => ({ ...s, i })));
  if (cards.every((c, k) => c.i === k)) cards = cards.reverse();
  let next = 0;
  let misses = 0;
  box.innerHTML = `<div class="sec-title">👣 What do visitors do? <small>Tap the steps in order, starting with the first one</small></div>
    <div class="order-wrap"><div class="order-cards">${cards.map(c => `<button class="ocard" data-i="${c.i}"><span class="e">${c.e}</span><span>${esc(c.text)}</span></button>`).join('')}</div>
    <ol class="order-slots">${steps.map((_, i) => `<li class="oslot"><span class="num">${i + 1}</span><span class="txt"></span></li>`).join('')}</ol></div>`;
  box.querySelectorAll('.ocard').forEach(btn => btn.addEventListener('click', () => {
    const i = +btn.dataset.i;
    if (i === next) {
      sfx('pop');
      narrate(steps[i].text);
      const slot = box.querySelectorAll('.oslot')[i];
      slot.classList.add('filled');
      slot.querySelector('.txt').textContent = `${steps[i].e} ${steps[i].text}`;
      btn.remove();
      box.querySelectorAll('.ocard.hint').forEach(b => b.classList.remove('hint'));
      next++;
      misses = 0;
      if (next === steps.length) onDone();
    } else {
      sfx('wrong');
      shake(btn);
      misses++;
      if (misses >= 2) box.querySelector(`.ocard[data-i="${next}"]`)?.classList.add('hint');
      else narrate('Hmm, what comes before that?');
    }
  }));
}

// ---------- Match pairs ----------

export function matchGame(box, pairs, onDone) {
  const right = shuffle(pairs.map((p, i) => ({ ...p[1], i })));
  const colours = ['#ffd6ec', '#d6f5e3', '#dceeff', '#fff1c7', '#eadcff'];
  let pickedLeft = null;
  let done = 0;
  box.innerHTML = `<div class="sec-title">🔗 Match them up <small>tap a place, then the people who pray there</small></div>
    <div class="match-cols"><div class="mcol">${pairs.map((p, i) => `<button class="mitem left" data-i="${i}"><span class="e">${p[0].e}</span>${esc(p[0].text)}</button>`).join('')}</div>
    <div class="mcol">${right.map(r => `<button class="mitem right" data-i="${r.i}"><span class="e">${r.e}</span>${esc(r.text)}</button>`).join('')}</div></div>`;
  box.querySelectorAll('.mitem.left').forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('matched')) return;
    sfx('tap');
    box.querySelectorAll('.mitem.left').forEach(x => x.classList.toggle('picked', x === b));
    pickedLeft = +b.dataset.i;
    narrate(pairs[pickedLeft][0].text);
  }));
  box.querySelectorAll('.mitem.right').forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('matched')) return;
    if (pickedLeft === null) { toast('Tap a place on the left first 👈'); return; }
    const L = box.querySelector(`.mitem.left[data-i="${pickedLeft}"]`);
    if (+b.dataset.i === pickedLeft) {
      sfx('success');
      [L, b].forEach(x => { x.classList.remove('picked'); x.classList.add('matched'); x.style.background = colours[done % colours.length]; });
      narrate(`${pairs[pickedLeft][0].text}: ${pairs[pickedLeft][1].text}`);
      pickedLeft = null;
      done++;
      if (done === pairs.length) onDone();
    } else {
      sfx('wrong');
      shake(b);
    }
  }));
}

// ---------- Religion details ----------

export function religionModal(r) {
  const flags = r.where.map(id => getCountry(id)).filter(Boolean).map(c => `<span title="${esc(c.name)}">${c.flag}</span>`).join(' ');
  const rows = [
    ['🙋', 'Followers', r.people],
    [r.placeEmoji, 'Place of worship', r.place],
    ['📖', 'Holy book', r.book],
    ['🎉', 'Festivals', r.festivals.join(' · ')],
    ['👋', 'Greeting', `${r.greeting.text} (${r.greeting.meaning})`],
    ['🧳', 'When you visit', r.visit],
  ];
  modal(`<div class="country-head"><span class="flag">${r.emoji}</span><div><h2>${esc(r.name)}</h2><p>${flags}</p></div></div>
    <div class="memory" style="margin:12px 0">💭 <span style="flex:1">${esc(r.idea)}</span>${sayBtn(r.idea)}</div>
    <div class="fact-grid">${rows.map(([e, k, v]) => `<div class="fact-box"><span class="e">${e}</span><div style="flex:1"><div class="k">${k}</div><div class="v" style="font-size:1rem">${esc(v)}</div></div>${k === 'Greeting' && r.greeting.native && !/^[\p{Extended_Pictographic}\s]+$/u.test(r.greeting.native) ? sayBtn(r.greeting.native, r.greeting.lang, r.greeting.say || r.greeting.text) : sayBtn(`${k}: ${v}`)}</div>`).join('')}</div>
    <div class="explain" style="margin-top:12px">💡 <span style="flex:1">${esc(r.fact)}</span>${sayBtn(r.fact)}</div>
    <div class="actions"><button class="btn" data-close>Close</button></div>`);
  narrate(`${r.name}. ${r.idea}`);
}

// ---------- Memory Match ----------

const DECKS = {
  flags: { name: 'Flags', e: '🏳️', make: () => shuffle(COUNTRIES).slice(0, 6).map(c => [{ big: c.flag }, { text: displayName(c).replace(/^the /, '') }]) },
  words: {
    name: 'Words', e: '🔤', make: () => {
      const learned = allWords().filter(w => store.state.words[wordKey(w.cid, w)]);
      const pool = learned.length >= 6 ? learned : allWords().filter(w => getCountry(w.cid).focus);
      const seen = new Set();
      return shuffle(pool).filter(w => !seen.has(w.emoji) && seen.add(w.emoji)).slice(0, 6).map(w => [{ big: w.emoji }, { text: w.word }]);
    },
  },
  beliefs: {
    name: 'Beliefs', e: '🕊️', make: () => {
      const places = { hinduism: 'Mandir', islam: 'Mosque', christianity: 'Church', sikhism: 'Gurdwara', judaism: 'Synagogue', shinto: 'Shrine' };
      return RELIGIONS.filter(r => places[r.id]).map(r => [{ big: r.emoji, text: r.name }, { text: places[r.id] }]);
    },
  },
};

export function memory(el, params = {}) {
  const deckId = params.id && DECKS[params.id] ? params.id : null;
  if (!deckId) {
    el.innerHTML = `${topbar('🧠 Memory Match', { back: 'practice' })}<div class="scroll"><div class="practice-tiles">
      ${Object.entries(DECKS).map(([k, d]) => `<button class="tile" data-go="memory" data-param="${k}"><span class="e">${d.e}</span>${d.name}<small>Find the pairs</small></button>`).join('')}</div></div>`;
    return;
  }
  const pairs = DECKS[deckId].make();
  const cards = shuffle(pairs.flatMap((p, i) => p.map(face => ({ ...face, pair: i }))));
  let open = [];
  let moves = 0;
  let found = 0;
  el.innerHTML = `${topbar(`🧠 Memory Match: ${DECKS[deckId].name}`, { back: 'memory' })}
    <div class="memory-info"><span class="moves">Moves: 0</span><span class="found">Pairs: 0 / ${pairs.length}</span></div>
    <div class="memory-grid">${cards.map((c, k) => `<button class="mcard" data-k="${k}"><span class="inner"><span class="back">❓</span><span class="front">${c.big ? `<span class="big">${c.big}</span>` : ''}${c.text ? `<span class="t">${esc(c.text)}</span>` : ''}</span></span></button>`).join('')}</div>`;
  narrate('Find the pairs that go together!');
  const btns = [...el.querySelectorAll('.mcard')];
  btns.forEach(b => b.addEventListener('click', () => {
    const k = +b.dataset.k;
    if (b.classList.contains('up') || open.length === 2) return;
    sfx('pop');
    b.classList.add('up');
    open.push(k);
    if (cards[k].text) narrate(cards[k].text);
    if (open.length < 2) return;
    moves++;
    $('.moves', el).textContent = `Moves: ${moves}`;
    const [a, c] = open;
    if (cards[a].pair === cards[c].pair) {
      found++;
      $('.found', el).textContent = `Pairs: ${found} / ${pairs.length}`;
      setTimeout(() => { sfx('success'); btns[a].classList.add('done'); btns[c].classList.add('done'); open = []; if (found === pairs.length) win(); }, 350);
    } else {
      setTimeout(() => { btns[a].classList.remove('up'); btns[c].classList.remove('up'); open = []; }, 950);
    }
  }));
  const win = () => {
    const coins = moves <= pairs.length + 4 ? 10 : 5;
    addCoins(coins);
    bumpStat('memory');
    refreshStars();
    confetti();
    const m = modal(`<div class="result"><div class="stars-big">🧠</div><h2>You found them all!</h2><p>${moves} moves. +${coins} coins 🪙</p>
      <div class="actions"><button class="btn white" data-go="practice">More games</button><button class="btn big green again">Play again 🔁</button></div></div>`);
    narrate(`You found them all in ${moves} moves!`);
    m.querySelector('.again').addEventListener('click', () => go('memory', { id: deckId }));
  };
}

// ---------- Suitcase Packing ----------

const PACK = [
  { e: '🕶️', n: 'sunglasses', need: w => (w.hot ? true : w.cold ? false : null) },
  { e: '👒', n: 'sun hat', need: w => (w.hot ? true : w.cold ? false : null) },
  { e: '🩴', n: 'flip-flops', need: w => (w.hot ? true : w.cold ? false : null) },
  { e: '🧴', n: 'sunscreen', need: w => (w.hot ? true : null) },
  { e: '🩳', n: 'shorts', need: w => (w.hot ? true : w.cold ? false : null) },
  { e: '🧥', n: 'warm coat', need: w => (w.cold ? true : w.hot ? false : null) },
  { e: '🧤', n: 'gloves', need: w => (w.freezing ? true : w.cold ? null : false) },
  { e: '🧣', n: 'woolly scarf', need: w => (w.cold ? true : w.hot ? false : null) },
  { e: '🧶', n: 'jumper', need: w => (w.hot ? false : true) },
  { e: '☂️', n: 'umbrella', need: w => (w.rain ? true : null) },
  { e: '🛂', n: 'passport', need: () => true },
  { e: '🪥', n: 'toothbrush', need: () => true },
];

function trips() {
  const out = COUNTRIES.filter(c => c.temp >= 25 || c.temp <= 12).map(c => ({ c, label: displayName(c), temp: c.temp, rain: ['UK', 'SG'].includes(c.id) }));
  out.push({ c: getCountry('KR'), label: 'Seoul in winter', temp: -3 }, { c: getCountry('US'), label: 'New York in winter', temp: 1 }, { c: getCountry('JP'), label: 'Tokyo in winter', temp: 6 });
  return out.map(t => ({ ...t, hot: t.temp >= 25, cold: t.temp <= 12, freezing: t.temp <= 3 }));
}

export function suitcase(el) {
  const rounds = shuffle(trips()).slice(0, 3);
  let r = 0;
  let mistakes = 0;
  el.innerHTML = `${topbar('🧳 Suitcase Packing', { back: 'practice' })}<div class="scroll"><div class="pack-wrap"></div></div>`;
  const wrap = $('.pack-wrap', el);
  const show = () => {
    const t = rounds[r];
    const needed = shuffle(PACK.filter(p => p.need(t) === true));
    const wrong = shuffle(PACK.filter(p => p.need(t) === false)).slice(0, 4);
    const items = shuffle([...needed, ...wrong]);
    let packed = 0;
    const weather = t.hot ? '☀️ hot' : t.freezing ? '🥶 freezing' : '🌥️ chilly';
    const prompt = `Pack for ${t.label}! It is ${t.temp}°C${t.rain ? ' and rainy' : ''}. Tap the things you need.`;
    wrap.innerHTML = `<div class="q-prompt"><p>${t.c.flag} ${esc(prompt)}</p>${sayBtn(prompt)}</div>
      <div class="pack-row"><div class="suitcase"><span class="case">🧳</span><span class="count">0 / ${needed.length}</span><div class="packed"></div></div>
      <div class="weather-card"><div class="big-emoji">${weather.split(' ')[0]}</div><b>${t.temp}°C</b><small>${weather.split(' ')[1]}${t.rain ? ', rainy' : ''}</small></div></div>
      <div class="pack-items">${items.map((p, k) => `<button class="pitem" data-k="${k}"><span class="e">${p.e}</span>${esc(p.n)}</button>`).join('')}</div><div class="q-feedback"></div>`;
    narrate(prompt);
    wrap.querySelectorAll('.pitem').forEach(b => b.addEventListener('click', () => {
      const p = items[+b.dataset.k];
      if (p.need(t)) {
        sfx('pop');
        b.remove();
        packed++;
        wrap.querySelector('.packed').insertAdjacentHTML('beforeend', `<span>${p.e}</span>`);
        wrap.querySelector('.count').textContent = `${packed} / ${needed.length}`;
        if (packed === needed.length) roundDone();
      } else {
        sfx('wrong');
        mistakes++;
        shake(b);
        const why = t.hot ? `It's ${t.temp}°C in ${t.label}. That's too hot for ${p.n}!` : `Brrr, it's only ${t.temp}°C. No ${p.n} needed!`;
        wrap.querySelector('.q-feedback').innerHTML = `<div class="explain try">🤔 <span style="flex:1">${esc(why)}</span></div>`;
        narrate(why);
      }
    }));
  };
  const roundDone = () => {
    sfx('success');
    wrap.querySelector('.q-feedback').innerHTML = `<div class="explain">🎉 <span style="flex:1">Suitcase ready for ${esc(rounds[r].label)}!</span></div>
      <div class="actions" style="display:flex;justify-content:center;margin-top:12px"><button class="btn big green next">${r + 1 < rounds.length ? 'Next trip ➜' : 'Finish ✓'}</button></div>`;
    wrap.querySelector('.next').addEventListener('click', () => {
      r++;
      if (r < rounds.length) { show(); return; }
      const coins = mistakes <= 2 ? 10 : 5;
      addCoins(coins);
      bumpStat('suitcase');
      refreshStars();
      confetti();
      wrap.innerHTML = `<div class="result card"><div class="stars-big">🧳</div><h2>Super packer!</h2><p>${mistakes} mistake${mistakes === 1 ? '' : 's'}. +${coins} coins 🪙</p>
        <div class="actions"><button class="btn white" data-go="practice">More games</button><button class="btn big green" data-go="suitcase">Play again 🔁</button></div></div>`;
    });
  };
  show();
}

// ---------- Map Quest ----------

const SMALL = ['SG', 'BALI', 'TW', 'KR', 'AE', 'UK'];
const placeName = id => (id === 'ID' ? 'Indonesia' : displayName(getCountry(id)));

export function mapquest(el) {
  const targets = shuffle(COUNTRIES).slice(0, 6);
  let r = 0;
  let tries = 0;
  let score = 0;
  el.innerHTML = `${topbar('🔎 Map Quest', { back: 'practice' })}
    <div class="q-prompt quest-q"><p></p><button class="say-btn quest-say">🔊</button></div>
    <div class="map-wrap quest-map"><div class="map-svg"></div></div>`;
  const svgBox = $('.map-svg', el);
  const say = () => narrate($('.quest-q p', el).textContent);
  $('.quest-say', el).addEventListener('click', say);
  const show = () => {
    const c = targets[r];
    tries = 0;
    const view = VIEWS[regionOf(c.id)];
    const hits = SMALL.map(id => `<circle cx="${PINS[id][0]}" cy="${PINS[id][1]}" r="${view === VIEWS.world ? 7 : 4}" fill="transparent" data-country="${id}"/>`).join('');
    svgBox.innerHTML = mapSVG(view, hits, { plain: true });
    $('.quest-q p', el).textContent = `${r + 1}/${targets.length}: Can you find ${c.flag} ${c.isIsland ? `${c.name} (an island in ${c.countryName})` : displayName(c)}? Tap it on the map!`;
    say();
  };
  svgBox.addEventListener('click', e => {
    const hit = e.target.closest('[data-country]');
    const c = targets[r];
    if (!c) return;
    const id = hit && hit.dataset.country;
    const ok = id === c.id || (c.id === 'BALI' && id === 'ID');
    const paint = (cid, col) => svgBox.querySelectorAll(`path[data-country="${cid}"]`).forEach(p => p.setAttribute('fill', col));
    if (ok) {
      sfx('success');
      paint(c.id, '#3ddc97');
      if (tries === 0) { score++; addCoins(2); refreshStars(); }
      narrate(`Yes! That's ${placeName(c.id)}!`);
      r++;
      setTimeout(() => (r < targets.length ? show() : done()), 1300);
      return;
    }
    sfx('wrong');
    tries++;
    if (id && id !== 'ID') { paint(id, '#ffb3b3'); toast(`That's ${placeName(id)}! Keep looking 🔎`); narrate(`That's ${placeName(id)}. Keep looking!`); }
    else if (id === 'ID') { paint('ID', '#ffb3b3'); toast('That\'s Indonesia! Keep looking 🔎'); }
    else toast('Not quite! Try somewhere else 🔎');
    if (tries >= 3) {
      paint(c.id, '#ffd43b');
      narrate(`Here it is: ${placeName(c.id)}!`);
      r++;
      setTimeout(() => (r < targets.length ? show() : done()), 1800);
    }
  });
  const done = () => {
    bumpStat('mapquest');
    confetti();
    const m = modal(`<div class="result"><div class="stars-big">🔎</div><h2>Map detective!</h2><p>You found ${score} of ${targets.length} on the first try. +${score * 2} coins 🪙</p>
      <div class="actions"><button class="btn white" data-go="practice">More games</button><button class="btn big green again">Play again 🔁</button></div></div>`);
    m.querySelector('.again').addEventListener('click', () => go('mapquest'));
  };
  requestAnimationFrame(show);
}

