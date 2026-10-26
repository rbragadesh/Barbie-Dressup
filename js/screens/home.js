// Home menu, first-launch welcome, and grown-up settings.

import { $, esc } from '../util.js';
import { store, dollName, loadFace, clearFace } from '../store.js';
import { setFacePhoto } from '../doll.js';
import { cropFace } from './facecrop.js';
import { rankInfo, giftReady, openGift } from '../game.js';
import { nameBook } from '../data/names.js';
import { COUNTRIES } from '../data/countries.js';
import { allItems } from '../items.js';
import { sfx, speak, unlockAudio, englishVoices, canSpeak } from '../audio.js';
import { go, topbar, stageHTML, bubble, setWeather, parentGate, modal, closeModal, toast, confetti, refreshStars } from '../ui.js';

const DOLL_NAMES = ['Maya', 'Priya', 'Mina', 'Lily', 'Aria', 'Sara', 'Ananya', 'Jia', 'Dewi', 'Rose'];

export function home(el) {
  const st = store.state;
  const stamps = COUNTRIES.filter(c => st.trips[c.id]?.stamp).length;
  const words = Object.keys(st.words).length;
  const r = rankInfo();
  el.innerHTML = `${topbar('', { back: '', extra: `${giftReady() ? '<button class="icon-btn gift" aria-label="Daily gift">🎁<span class="lbl">Gift!</span></button>' : ''}<button class="icon-btn" data-act="settings" aria-label="Grown-up settings">⚙️</button>` })}
  <div class="home-body">
    ${stageHTML({ scene: st.scene, uid: 'home' })}
    <div class="home-menu">
      <div class="title-art"><h1>Dress-Up World Tour</h1><p>Dress up ${esc(dollName())}, travel the world, learn as you go!</p></div>
      ${st.kidName ? `<button class="name-banner" data-go="myname"><span class="nb-label">${esc(st.kidName)} around the world:</span> <span class="nb-name">${esc(st.kidName)}</span> <span class="nb-go">🌏 ➜</span></button>` : ''}
      <button class="rank-strip" data-go="stickers"><span class="rank-e">${r.rank.e}</span><span class="rank-t"><b>${esc(r.rank.name)}</b><span class="bar"><i style="width:${Math.round(r.progress * 100)}%"></i></span><small>${r.next ? `${r.toNext} ⭐ to ${esc(r.next.name)}` : 'Top rank!'} · 🏅 ${st.badges.length} stickers</small></span></button>
      <div class="tiles">
        <button class="tile hero" data-go="map"><span class="e">✈️</span>World Tour<small>${stamps} of ${COUNTRIES.length} passport stamps</small></button>
        <button class="tile hero alt" data-go="studio"><span class="e">👗</span>Dressing Room<small>Hair, makeup, nails & outfits</small></button>
        <button class="tile" data-go="show"><span class="e">🎤</span>Fashion Show</button>
        <button class="tile" data-go="boutique"><span class="e">🛍️</span>Boutique<small>🪙 ${st.coins}</small></button>
        <button class="tile" data-go="passport"><span class="e">🛂</span>Passport</button>
        <button class="tile" data-go="beliefs"><span class="e">🕊️</span>World Beliefs</button>
        <button class="tile" data-go="words"><span class="e">📖</span>Word Book<small>${words} words</small></button>
        <button class="tile" data-go="practice"><span class="e">🎮</span>Games & Quizzes</button>
        <button class="tile" data-go="stickers"><span class="e">🏅</span>Stickers</button>
        <button class="tile" data-go="album"><span class="e">📸</span>Photo Album<small>${st.album.length} photos</small></button>
      </div>
    </div>
  </div>`;
  const stage = $('.stage', el);
  setWeather(stage, st.season);
  const hello = giftReady() ? 'Look, a surprise gift is waiting for you! Tap the present!' : st.kidName ? `Hi ${st.kidName}! Where shall we go today?` : 'Hi! Where shall we go today?';
  bubble(stage, hello, { read: false });
  el.querySelector('[data-act="settings"]').addEventListener('click', () => { sfx('tap'); parentGate(() => go('settings')); });
  // The name banner cycles through the player's name in different scripts.
  const book = nameBook(st.kidName);
  const nb = el.querySelector('.nb-name');
  let timer = null;
  if (book && nb) {
    const scripts = [st.kidName, ...new Set(Object.values(book.forms).flat().map(f => f.script).filter(x => !/^[A-Za-z\s]+$/.test(x)))];
    let i = 0;
    timer = setInterval(() => { i = (i + 1) % scripts.length; nb.classList.remove('pop'); void nb.offsetWidth; nb.textContent = scripts[i]; nb.classList.add('pop'); }, 1800);
  }
  el.querySelector('.gift')?.addEventListener('click', e => {
    const coins = openGift();
    sfx('unlock');
    confetti();
    refreshStars();
    e.currentTarget.remove();
    modal(`<div class="result"><div class="stars-big gift-open">🎁</div><h2>Surprise! +${coins} coins 🪙</h2><p>Come back tomorrow for another gift.</p><div class="actions"><button class="btn big green" data-close>Yay!</button></div></div>`);
    speak(`Surprise! You got ${coins} coins!`);
  });
  return () => clearInterval(timer);
}

export function welcome(el) {
  el.classList.add('onboard');
  el.innerHTML = `<div class="card">
    ${stageHTML({ scene: 'studio', uid: 'welcome' })}
    <div class="form">
      <div class="title-art" style="text-align:left"><h1 style="font-size:2rem">Dress-Up World Tour</h1></div>
      <label>👧 What is your name?<input type="text" class="kid-name" maxlength="20" autocomplete="off" placeholder="Your name"></label>
      <label>🪆 What will you call your doll?<input type="text" class="doll-name" maxlength="16" autocomplete="off" placeholder="${DOLL_NAMES[0]}"></label>
      <div class="name-chips">${DOLL_NAMES.map(n => `<button data-name="${n}">${n}</button>`).join('')}</div>
      <button class="btn big start">Let's go! ✨</button>
    </div></div>`;
  const stage = $('.stage', el);
  bubble(stage, 'Hello! Will you be my travel buddy?', { read: false });
  el.querySelector('.name-chips').addEventListener('click', e => {
    const b = e.target.closest('[data-name]');
    if (!b) return;
    $('.doll-name', el).value = b.dataset.name;
  });
  $('.start', el).addEventListener('click', () => {
    unlockAudio();
    sfx('success');
    store.update(s => {
      s.kidName = $('.kid-name', el).value.trim().slice(0, 20);
      s.dollName = $('.doll-name', el).value.trim().slice(0, 16) || DOLL_NAMES[0];
      s.onboarded = true;
    });
    speak(`Yay! Hi ${store.state.kidName || 'there'}! I'm ${dollName()}. Let's go on a world tour!`);
    go('home');
  });
}

export function settings(el) {
  const st = store.state;
  const voices = englishVoices();
  el.innerHTML = `${topbar('⚙️ Grown-up settings')}
  <div class="scroll"><div class="card form" style="max-width:820px;margin:0 auto">
    <label>Child's name<input type="text" class="kid-name" maxlength="20" value="${esc(st.kidName)}"></label>
    <label>Doll's name<input type="text" class="doll-name" maxlength="16" value="${esc(st.dollName)}"></label>
    <div><b>Maths level</b><div class="seg" style="margin-top:6px">
      ${[[1, 'Easy', 'Add & take away to 20, o\'clock'], [2, 'Medium', 'To 100, ×2 ×5 ×10, half past'], [3, 'Hard', 'Times tables, sharing, quarter past']].map(([v, n, d]) => `<button data-level="${v}" class="${st.settings.level === v ? 'on' : ''}">${n}<small>${d}</small></button>`).join('')}
    </div></div>
    <div class="toggle-row">🔊 Read everything aloud<button class="switch ${st.settings.autoRead ? 'on' : ''}" data-toggle="autoRead" aria-label="Read aloud"></button></div>
    <div class="toggle-row">🎵 Sound effects<button class="switch ${st.settings.sound ? 'on' : ''}" data-toggle="sound" aria-label="Sound effects"></button></div>
    ${canSpeak() ? `<label>Reading voice<select class="voice"><option value="">Automatic</option>${voices.map(v => `<option value="${esc(v.name)}" ${st.settings.voice === v.name ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}</select></label>
    <button class="btn white test-voice">▶️ Test the voice</button>` : '<p class="note">This browser has no read-aloud voices.</p>'}
    <p class="note">Tip: on iPad, extra voices (including Indian, Australian and British English, and Hindi, Korean, Mandarin and Indonesian for the hello words) can be downloaded in Settings → Accessibility → Spoken Content → Voices.</p>
    <div class="face-photo-box"><b>📷 Photo face for the doll</b>
      <p class="note">Make the doll look just like your child: choose a photo and line up the face. The picture is saved <b>only on this iPad</b>. It is never uploaded and is not part of the website.</p>
      <div class="face-row"><div class="face-prev"></div><div class="actions" style="justify-content:flex-start;margin:0"><button class="btn choose-face">📷 Choose a photo</button><button class="btn white remove-face">Remove</button></div></div>
      <input type="file" accept="image/*" class="face-file" hidden></div>
    <hr style="border:0;border-top:2px solid #f0e8fa;width:100%">
    <button class="btn purple unlock-all">🔓 Unlock all reward items</button>
    <button class="btn white reset">🗑️ Reset all progress</button>
    <p class="note"><b>Install on the iPad:</b> open this page in Safari, tap the Share button, then "Add to Home Screen". It then opens full-screen like an app and works offline.<br>
    <b>Privacy:</b> everything (names, stars, photos) is saved only on this device. Nothing is sent anywhere.</p>
  </div></div>`;

  const save = () => store.update(s => {
    s.kidName = $('.kid-name', el).value.trim().slice(0, 20);
    s.dollName = $('.doll-name', el).value.trim().slice(0, 16);
  });
  el.querySelectorAll('input').forEach(i => i.addEventListener('change', save));
  el.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => {
    store.update(s => { s.settings.level = +b.dataset.level; });
    el.querySelectorAll('[data-level]').forEach(x => x.classList.toggle('on', x === b));
    sfx('tap');
  }));
  el.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.toggle;
    store.update(s => { s.settings[k] = !s.settings[k]; });
    b.classList.toggle('on', store.state.settings[k]);
    sfx('tap');
  }));
  const v = $('.voice', el);
  if (v) v.addEventListener('change', () => store.update(s => { s.settings.voice = v.value; }));
  const tv = $('.test-voice', el);
  if (tv) tv.addEventListener('click', () => speak(`Hello ${store.state.kidName || 'friend'}! Let's learn some new words today.`));
  const showFace = () => {
    const f = loadFace();
    $('.face-prev', el).innerHTML = f ? `<img src="${f}" alt="Photo face">` : '<span>🙂</span>';
    $('.remove-face', el).hidden = !f;
  };
  $('.choose-face', el).addEventListener('click', () => $('.face-file', el).click());
  $('.face-file', el).addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) cropFace(file, () => { store.update(s => { s.look.photoFace = true; }); showFace(); toast('📷 The doll now has the photo face!'); });
  });
  $('.remove-face', el).addEventListener('click', () => { clearFace(); setFacePhoto(null); showFace(); toast('Photo face removed'); });
  showFace();
  $('.unlock-all', el).addEventListener('click', () => {
    store.update(s => { s.unlocked = allItems().filter(i => i.unlock).map(i => i.id); });
    toast('🔓 All reward items unlocked');
  });
  $('.reset', el).addEventListener('click', () => {
    const m = modal(`<h2>Reset everything?</h2><p class="note">This deletes stars, stamps, words, photos and names on this device. It can't be undone.</p>
      <div class="actions"><button class="btn white" data-close>Cancel</button><button class="btn yes">Yes, reset</button></div>`);
    m.querySelector('.yes').addEventListener('click', () => { store.reset(); closeModal(); go('welcome'); });
  });
  return save;
}
