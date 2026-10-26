// Fashion Show (theme picker + runway), Boutique, World Beliefs and Sticker Book.

import { $, esc, shuffle } from '../util.js';
import { store, dollName } from '../store.js';
import { THEMES, getTheme, judge, COMMENTS } from '../data/themes.js';
import { RELIGIONS, BELIEFS_INTRO } from '../data/religions.js';
import { nameBook, nameFor, NAME_COUNTRIES } from '../data/names.js';
import { getCountry, displayName } from '../data/countries.js';
import { allItems, freshWorn, thumbBox, getItem } from '../items.js';
import { renderItemThumb } from '../doll.js';
import { RANKS, BADGES, rankInfo, discoveredBeliefs, buy, owns, addCoins, bumpStat } from '../game.js';
import { sfx, narrate } from '../audio.js';
import { go, topbar, stageHTML, bubble, modal, closeModal, confetti, sayBtn, refreshStars } from '../ui.js';
import { religionModal } from './minigames.js';

// ---------- Fashion show ----------

const hasPet = () => [...store.state.owned, ...store.state.unlocked].some(id => getItem(id)?.slot === 'pet');

export function show(el) {
  const pool = THEMES.filter(t => !t.needsPet || hasPet());
  const draw = () => {
    const three = shuffle(pool).slice(0, 3);
    el.innerHTML = `${topbar('🎤 Fashion Show', { back: 'home' })}
      <div class="scroll"><p class="note" style="text-align:center;font-size:1.1rem">Pick a theme, dress up to match it, then walk the runway! Three judges give you points and you win coins 🪙</p>
      <div class="theme-cards">${three.map(t => `<button class="theme-card" data-theme="${t.id}"><span class="e">${t.e}</span><b>${esc(t.name)}</b><small>${t.tips.map(x => x.icon).join(' ')}</small></button>`).join('')}</div>
      <div class="actions" style="display:flex;justify-content:center;margin-top:16px"><button class="btn white reroll">🔀 Show me other themes</button></div>
      <p class="note" style="text-align:center">Best score so far: ${store.state.stats.bestShow || 0} / 30</p></div>`;
    el.querySelectorAll('.theme-card').forEach(b => b.addEventListener('click', () => { sfx('pop'); go('studio', { show: b.dataset.theme }); }));
    $('.reroll', el).addEventListener('click', () => { sfx('whoosh'); draw(); });
    narrate('Pick a theme for the fashion show!');
  };
  draw();
}

export function runway(el, params) {
  const theme = getTheme(params.theme);
  const L = store.state.look;
  const scores = judge(theme, L);
  const total = scores.reduce((n, s) => n + s.score, 0);
  el.innerHTML = `${topbar(`🎤 ${theme.e} ${esc(theme.name)}`, { back: 'show' })}
    <div class="runway-body">${stageHTML({ look: L, scene: 'runway', uid: 'runway' })}
      <div class="judges">${scores.map((s, i) => `<div class="judge" data-i="${i}"><span class="who">${s.who}</span><span class="jn">${esc(s.name)}</span><span class="jw">${s.what}</span><span class="card-score">?</span><span class="jc"></span></div>`).join('')}
      <div class="total card" hidden></div></div></div>`;
  const stage = $('.stage', el);
  stage.querySelector('.doll-wrap').classList.add('walk');
  sfx('whoosh');
  bubble(stage, `Here comes ${dollName()}!`);
  const reveal = i => {
    if (i >= scores.length) return finish();
    const j = el.querySelectorAll('.judge')[i];
    const s = scores[i];
    const line = COMMENTS[s.score][Math.floor(Math.random() * 3)];
    j.classList.add('show');
    j.querySelector('.card-score').textContent = s.score;
    j.querySelector('.jc').textContent = line;
    sfx(s.score >= 8 ? 'sparkle' : 'pop');
    narrate(`${s.name} gives ${s.score}! ${line}`);
    setTimeout(() => reveal(i + 1), 1900);
  };
  const finish = () => {
    const coins = Math.max(3, total - 15);
    const first = total > (store.state.stats.bestShow || 0);
    addCoins(coins);
    bumpStat('shows');
    store.update(s => {
      s.stats.bestShow = Math.max(s.stats.bestShow || 0, total);
      s.album.unshift({ look: JSON.parse(JSON.stringify(L)), scene: 'runway', season: null, at: Date.now() });
      s.album = s.album.slice(0, 40);
      s.stats.photos = (s.stats.photos || 0) + 1;
    });
    refreshStars();
    if (total >= 24) confetti();
    sfx('success');
    const box = el.querySelector('.total');
    box.hidden = false;
    box.innerHTML = `<div class="result"><div class="stars-big">${total >= 27 ? '🏆' : total >= 22 ? '🥇' : '🎀'}</div><h2>${total} / 30 points!</h2>
      <p>${first ? 'A new best score! ' : ''}+${coins} coins 🪙. Your runway photo is in the album 📸</p>
      <p class="note">${theme.tips.filter(t => !t.test(L)).length ? `Tip for next time: ${esc(theme.tips.find(t => !t.test(L)).text)}` : 'You matched every part of the theme!'}</p>
      <div class="actions"><button class="btn white" data-go="home">🏠 Home</button><button class="btn big green" data-go="show">Another show 🔁</button></div></div>`;
    narrate(`${total} points! You won ${coins} coins!`);
  };
  setTimeout(() => reveal(0), 3200);
}

// ---------- Boutique ----------

export function boutique(el) {
  const draw = () => {
    const items = allItems().filter(i => i.price).sort((a, b) => a.price - b.price);
    el.innerHTML = `${topbar('🛍️ Boutique')}
      <div class="scroll"><div class="memory" style="margin-bottom:12px">🪙 <span style="flex:1">You have <b>${store.state.coins}</b> coins. Earn more by answering questions, collecting stamps, playing games, fashion shows and the daily gift!</span></div>
      <div class="grid shop-grid">${items.map(i => {
        const mine = owns(i.id);
        return `<button class="item-btn shop-item ${mine ? 'on' : ''}" data-item="${i.id}">${renderItemThumb(i, null, thumbBox(i))}<span class="nm">${esc(i.name)}</span><span class="buy">${mine ? '✓ Yours' : `🪙 ${i.price}`}</span></button>`;
      }).join('')}</div>
      <p class="note" style="text-align:center">Reward items (like the crown and the falcon) come from passport stamps, not the shop.</p></div>`;
    el.querySelectorAll('.shop-item').forEach(b => b.addEventListener('click', () => {
      const item = getItem(b.dataset.item);
      sfx('pop');
      narrate(item.name);
      const mine = owns(item.id);
      const short = item.price - store.state.coins;
      const m = modal(`<div style="text-align:center"><div style="width:220px;height:220px;margin:0 auto">${renderItemThumb(item, null, thumbBox(item))}</div>
        <h2>${esc(item.name)}</h2>
        <p class="note" style="font-size:1.05rem">${mine ? 'This is already yours!' : short > 0 ? `You need ${short} more coin${short === 1 ? '' : 's'}. Play games or visit a country to earn them!` : `Buy it for ${item.price} coins?`}</p>
        <div class="actions"><button class="btn white" data-close>Close</button>${mine ? '<button class="btn wear">Wear it ✨</button>' : short > 0 ? '' : `<button class="btn big green yes">Buy for 🪙 ${item.price}</button>`}</div></div>`);
      m.querySelector('.yes')?.addEventListener('click', () => {
        if (!buy(item)) return;
        sfx('unlock');
        confetti();
        closeModal();
        draw();
        const m2 = modal(`<div style="text-align:center"><h2>🎉 The ${esc(item.name)} is yours!</h2><div class="actions"><button class="btn white" data-close>Keep shopping</button><button class="btn big wear">Wear it now ✨</button></div></div>`);
        narrate(`The ${item.name} is yours!`);
        m2.querySelector('.wear').addEventListener('click', () => wearAndGo(item));
      });
      m.querySelector('.wear')?.addEventListener('click', () => wearAndGo(item));
    }));
  };
  draw();
}

function wearAndGo(item) {
  store.update(s => {
    s.look[item.slot] = freshWorn(item);
    if (item.slot === 'dress') { s.look.top = null; s.look.bottom = null; }
  });
  closeModal();
  go('studio', { tab: item.slot === 'pet' ? 'pets' : undefined });
}

// ---------- World Beliefs ----------

export function beliefs(el) {
  const found = discoveredBeliefs();
  el.innerHTML = `${topbar('🕊️ World Beliefs')}
    <div class="scroll"><div class="memory" style="margin-bottom:14px">🤝 <span style="flex:1">${esc(BELIEFS_INTRO)}</span>${sayBtn(BELIEFS_INTRO)}</div>
    <div class="belief-grid">${RELIGIONS.map(r => `<button class="belief ${found.has(r.id) ? 'found' : ''}" data-rel="${r.id}"><span class="e">${r.emoji}</span><b>${esc(r.name)}</b><small>${esc(r.people)} · ${esc(r.place)}</small>${found.has(r.id) ? '<span class="seal">✓ visited</span>' : ''}</button>`).join('')}</div>
    <p class="note" style="text-align:center">Visit sacred places on the World Tour to tick them off. ${found.size} of ${RELIGIONS.length} visited.</p>
    <div class="actions" style="display:flex;justify-content:center"><button class="btn big purple" data-go="quiz" data-param="beliefs">🕊️ Beliefs quiz</button></div></div>`;
  el.querySelectorAll('.belief').forEach(b => b.addEventListener('click', () => { sfx('pop'); religionModal(RELIGIONS.find(r => r.id === b.dataset.rel)); }));
  narrate(BELIEFS_INTRO);
}

// ---------- Sticker book ----------

export function stickers(el) {
  const st = store.state;
  const r = rankInfo();
  el.innerHTML = `${topbar('🏅 Stickers & Rank')}
    <div class="scroll">
      <div class="card rank-card"><span class="rank-e">${r.rank.e}</span><div style="flex:1"><b>${esc(r.rank.name)}</b>
        <div class="bar"><i style="width:${Math.round(r.progress * 100)}%"></i></div>
        <small>${r.next ? `${r.toNext} more ⭐ to become ${r.next.e} ${esc(r.next.name)}` : 'You reached the top rank!'}</small></div></div>
      <div class="rank-ladder">${RANKS.map((k, i) => `<span class="${i <= r.index ? 'on' : ''}" title="${esc(k.name)}">${k.e}<small>${k.min}⭐</small></span>`).join('')}</div>
      <div class="sec-title">🏅 Stickers <small>${st.badges.length} of ${BADGES.length}</small></div>
      <div class="sticker-grid">${BADGES.map(b => {
        const got = st.badges.includes(b.id);
        return `<div class="sticker ${got ? 'got' : ''}"><span class="e">${got ? b.e : '❔'}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`;
      }).join('')}</div></div>`;
}


// ---------- My name around the world ----------

export function myname(el) {
  const name = store.state.kidName;
  const book = nameBook(name);
  const cards = NAME_COUNTRIES.map(id => {
    const c = getCountry(id);
    const n = nameFor(name, id);
    const rows = n.forms.filter(f => !/^[A-Za-z\s]+$/.test(f.script)).map(f => `<div class="nm-row"><span class="nm-script">${esc(f.script)}</span><span class="nm-lang">${esc(f.lang)}${f.say ? ` · say "${esc(f.say)}"` : ''}</span>${sayBtn(f.script, f.tts, f.say || name)}</div>`).join('');
    const greet = n.greeting ? `<div class="nm-row"><span class="nm-greet">${esc(n.greeting.text)}</span><span class="nm-lang">${esc(n.greeting.lang)}</span>${sayBtn(n.greeting.text, n.greeting.tts)}</div>` : '';
    if (!rows && !greet) return '';
    return `<div class="nm-card"><div class="nm-head"><span class="flag">${c.flag}</span><b>${esc(displayName(c).replace(/^the /, 'The '))}</b></div>${rows}${greet}</div>`;
  }).join('');
  el.innerHTML = `${topbar('🌏 My Name Around the World')}
    <div class="scroll">
      ${name ? `<div class="memory" style="margin-bottom:12px">✨ <span style="flex:1">${book ? esc(book.meaning) + ' ' : ''}Tap 🔊 to hear your name the way people say it in each country.</span>${book ? sayBtn(book.meaning) : ''}</div>`
        : `<div class="memory">✨ <span style="flex:1">Ask a grown-up to type your name in ⚙️ settings, then come back!</span></div>`}
      <div class="nm-grid">${cards}</div>
      ${book ? `<div class="actions" style="display:flex;justify-content:center;margin-top:14px"><button class="btn big purple" data-go="quiz" data-param="names">✍️ Name quiz: which language?</button></div>` : ''}
    </div>`;
  if (book) narrate(`${name}! ${book.meaning}`);
}
