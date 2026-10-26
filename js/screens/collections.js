// Passport, Word Book, Brain Games and Photo Album.

import { $, esc, shuffle } from '../util.js';
import { store } from '../store.js';
import { COUNTRIES, getCountry, displayName } from '../data/countries.js';
import { renderDoll } from '../doll.js';
import { renderScene } from '../scenes.js';
import { mixedMath, mathProblem, vocabSet, allWords, wordKey, flagQuiz, capitalQuiz, beliefsQuiz, nameQuiz } from '../learn.js';
import { nameBook } from '../data/names.js';
import { sfx } from '../audio.js';
import { go, topbar, modal, closeModal, toast, runQuestions, resultHTML, sayBtn } from '../ui.js';

// ---------- Passport ----------

export function passport(el) {
  const st = store.state;
  const got = COUNTRIES.filter(c => st.trips[c.id]?.stamp).length;
  el.innerHTML = `${topbar('🛂 My Passport')}
  <div class="passport"><div class="passport-book">
    <h2>✦ PASSPORT ✦ ${esc((st.kidName || st.dollName || 'Maya').toUpperCase())} ✦</h2>
    ${nameBook(st.kidName) ? `<p class="passport-names">${['IN', 'KR', 'JP', 'TH', 'AE', 'TW'].map(id => nameBook(st.kidName).forms[id][0].script).join(' · ')}</p>` : ''}
    <div class="stamp-grid">${COUNTRIES.map((c, i) => {
      const t = st.trips[c.id];
      return t?.stamp
        ? `<button class="stamp" style="--c:${c.color};--r:${(i % 3 - 1) * 9}deg" data-id="${c.id}"><span class="f">${c.flag}</span><span class="n">${esc(displayName(c))}</span><span class="d">${esc(t.stampedOn || '')}</span><span class="st">${'⭐'.repeat(Math.max(1, Math.min(3, Math.round((t.quizBest || 0) / 5 * 3))))}</span></button>`
        : `<button class="stamp empty" data-id="${c.id}" style="--r:${(i % 3 - 1) * 6}deg"><span class="f">${c.flag}</span><span class="n">${esc(displayName(c))}</span><span class="d">not yet</span></button>`;
    }).join('')}</div>
    <p style="text-align:center;font-weight:800;margin:12px 0 0">${got} of ${COUNTRIES.length} stamps collected</p>
  </div></div>`;
  el.querySelectorAll('.stamp').forEach(b => b.addEventListener('click', () => {
    const c = getCountry(b.dataset.id);
    sfx('pop');
    if (!st.trips[c.id]?.stamp) {
      const m = modal(`<h2>${c.flag} ${esc(c.name)}</h2><p class="note">You don't have this stamp yet. Fly there on the World Tour!</p><div class="actions"><button class="btn white" data-close>OK</button><button class="btn go-trip">Fly there ✈️</button></div>`);
      m.querySelector('.go-trip').addEventListener('click', () => go('trip', { id: c.id }));
      return;
    }
    const lines = [
      ['🏙️', c.isIsland ? 'Capital of Bali' : 'Capital', c.capital],
      ['💰', 'Money', `${c.currency.name} (${c.currency.symbol})`],
      ['🗣️', 'Language', c.languageLine],
      ['👋', 'Hello', `${c.greeting.text}${c.greeting.native !== c.greeting.text ? ` (${c.greeting.native})` : ''}`],
      ['🙏', 'Thank you', c.thanks.text],
    ];
    modal(`<div class="country-head"><span class="flag">${c.flag}</span><div><h2>${esc(c.name)}</h2><p>${esc(c.story.title)}</p></div></div>
      <div class="fact-grid" style="margin-top:12px">${lines.map(([e, k, v]) => `<div class="fact-box"><span class="e">${e}</span><div style="flex:1"><div class="k">${k}</div><div class="v" style="font-size:1rem">${esc(v)}</div></div>${sayBtn(`${k}: ${v}`)}</div>`).join('')}</div>
      <div class="actions"><button class="btn white" data-close>Close</button><button class="btn" data-go="trip" data-param="${c.id}">Visit again ✈️</button></div>`);
  }));
}

// ---------- Word Book ----------

export function words(el) {
  let cid = 'all';
  el.innerHTML = `${topbar('📖 Word Book', { extra: '<button class="icon-btn practice-words">🎮<span class="lbl">Play</span></button>' })}
    <div class="ctabs"><button class="chip" data-c="all"><span class="e">🌏</span>All</button>${COUNTRIES.map(c => `<button class="chip" data-c="${c.id}"><span class="e">${c.flag}</span>${esc(displayName(c))}</button>`).join('')}</div>
    <div class="scroll"></div>`;
  const box = $('.scroll', el);
  const show = () => {
    el.querySelectorAll('[data-c]').forEach(b => b.classList.toggle('on', b.dataset.c === cid));
    const list = allWords().filter(w => cid === 'all' || w.cid === cid);
    const learned = list.filter(w => store.state.words[wordKey(w.cid, w)]);
    box.innerHTML = `<p class="note" style="margin:0 4px 10px">You have learned ${learned.length} of ${list.length} words here. Visit more places to fill your Word Book!</p>
      <div class="word-list">${list.map(w => {
        const ok = store.state.words[wordKey(w.cid, w)];
        return ok
          ? `<div class="wl"><span class="e">${w.emoji}</span><div style="flex:1"><div class="w">${esc(w.word)}</div><div class="m">${esc(w.meaning)}</div></div>${sayBtn(`${w.word}. ${w.meaning}.`)}</div>`
          : `<div class="wl locked"><span class="e">❔</span><div style="flex:1"><div class="w">secret</div><div class="m">Visit ${esc(displayName(getCountry(w.cid)))} to learn this word</div></div></div>`;
      }).join('')}</div>`;
  };
  el.querySelector('.ctabs').addEventListener('click', e => {
    const b = e.target.closest('[data-c]');
    if (!b) return;
    sfx('tap');
    cid = b.dataset.c;
    show();
  });
  $('.practice-words', el).addEventListener('click', () => go('quiz', { id: 'words' }));
  show();
}

// ---------- Brain Games ----------

const ARCADE = [
  { go: 'show', e: '🎤', name: 'Fashion Show', sub: 'Dress to a theme, win coins' },
  { go: 'memory', e: '🧠', name: 'Memory Match', sub: 'Flip cards, find pairs' },
  { go: 'suitcase', e: '🧳', name: 'Suitcase Packing', sub: 'Pack for the weather' },
  { go: 'mapquest', e: '🔎', name: 'Map Quest', sub: 'Find countries on the map' },
];

const GAMES = [
  { id: 'math', e: '🧮', name: 'Maths Gym', sub: '8 mixed problems' },
  { id: 'clock', e: '⏰', name: 'Clock Time', sub: 'Read the clock' },
  { id: 'words', e: '🔤', name: 'Word Games', sub: 'Your Word Book words' },
  { id: 'flags', e: '🏳️', name: 'Flag Match', sub: 'Whose flag is it?' },
  { id: 'capitals', e: '🏙️', name: 'Capital Cities', sub: 'Big city names' },
  { id: 'beliefs', e: '🕊️', name: 'Beliefs Quiz', sub: 'Religions of the world' },
  { id: 'names', e: '✍️', name: 'My Name Quiz', sub: 'Your name in other scripts', needsName: true },
];

export function practice(el) {
  el.innerHTML = `${topbar('🎮 Games & Quizzes')}
    <div class="scroll"><div class="sec-title">🎮 Games</div><div class="practice-tiles">${ARCADE.map(g => `<button class="tile arcade" data-go="${g.go}"><span class="e">${g.e}</span>${g.name}<small>${g.sub}</small></button>`).join('')}</div>
    <div class="sec-title" style="margin-top:18px">🧠 Quizzes</div><div class="practice-tiles">${GAMES.filter(g => !g.needsName || nameBook(store.state.kidName)).map(g => `<button class="tile" data-go="quiz" data-param="${g.id}"><span class="e">${g.e}</span>${g.name}<small>${g.sub}</small></button>`).join('')}</div>
    <p class="note" style="text-align:center;margin-top:18px">Maths level: ${['', 'Easy', 'Medium', 'Hard'][store.state.settings.level]} (a grown-up can change this in ⚙️ settings).</p></div>`;
}

export function quiz(el, params) {
  const g = GAMES.find(x => x.id === params.id) || GAMES[0];
  const level = store.state.settings.level;
  const visited = COUNTRIES.filter(c => store.state.trips[c.id]?.stamp);
  const pool = visited.length >= 2 ? visited : COUNTRIES.filter(c => c.focus);
  let qs;
  if (g.id === 'math') qs = mixedMath(pool, level, 8);
  else if (g.id === 'clock') qs = Array.from({ length: 6 }, () => mathProblem(pool[0], level, 'clock'));
  else if (g.id === 'flags') qs = flagQuiz(COUNTRIES, 6);
  else if (g.id === 'capitals') qs = capitalQuiz(pool.length >= 4 ? pool : COUNTRIES, 6);
  else if (g.id === 'beliefs') qs = beliefsQuiz(6);
  else if (g.id === 'names') qs = nameQuiz(store.state.kidName, 6);
  else {
    const learned = allWords().filter(w => store.state.words[wordKey(w.cid, w)]);
    const src = learned.length >= 4 ? learned : allWords().filter(w => getCountry(w.cid).focus);
    qs = vocabSet(shuffle(src), src.length >= 4 ? src : allWords(), 6);
  }
  el.innerHTML = `${topbar(`${g.e} ${g.name}`, { back: { words: 'words', beliefs: 'beliefs', names: 'myname' }[params.id] || 'practice' })}<div class="scroll"><div style="max-width:860px;margin:0 auto" class="qbox"></div></div>`;
  const box = $('.qbox', el);
  runQuestions(box, qs, {
    title: g.name,
    onDone: r => {
      sfx('success');
      box.innerHTML = resultHTML(r, `<div class="actions"><button class="btn white" data-go="practice">More games</button><button class="btn big green again">Play again 🔁</button></div>`);
      box.querySelector('.again').addEventListener('click', () => go('quiz', { id: g.id }));
    },
  });
}

// ---------- Photo Album ----------

export function photoSVG(p, uid) {
  // Scene and doll combined into one picture (also used for saving as an image).
  const doll = renderDoll(p.look, { uid, viewBox: '-50 -40 500 850' }).replace('<svg ', '<svg x="300" y="40" width="600" height="840" ');
  return renderScene(p.scene).replace('</svg>', `${doll}</svg>`);
}

async function savePicture(p) {
  const svg = photoSVG(p, 'export').replace('preserveAspectRatio="xMidYMax slice"', 'width="1200" height="900"');
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    canvas.getContext('2d').drawImage(img, 0, 0, 1200, 900);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const file = new File([blob], 'dress-up-photo.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My Dress-Up photo' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'dress-up-photo.png';
      a.click();
    }
  } catch (e) {
    if (e && e.name !== 'AbortError') toast('Sorry, the picture could not be saved.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function album(el) {
  const draw = () => {
    const list = store.state.album;
    el.innerHTML = `${topbar('📸 Photo Album')}<div class="scroll">${list.length
      ? `<div class="album-grid">${list.map((p, i) => `<button class="photo" data-i="${i}">${photoSVG(p, `al${i}`)}</button>`).join('')}</div>`
      : `<div class="empty-state"><span class="e">📷</span>No photos yet! Tap 📸 in the dressing room to take one.</div>`}</div>`;
    el.querySelectorAll('.photo').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      const p = store.state.album[i];
      sfx('pop');
      const m = modal(`<div class="photo" style="width:min(420px,100%);margin:0 auto">${photoSVG(p, 'big')}</div>
        <p class="note" style="text-align:center">${new Date(p.at).toLocaleDateString()}</p>
        <div class="actions"><button class="btn white del">🗑️ Delete</button><button class="btn purple save">💾 Save picture</button><button class="btn wear">👗 Wear this again</button></div>`);
      m.querySelector('.wear').addEventListener('click', () => {
        store.update(s => { s.look = JSON.parse(JSON.stringify(p.look)); });
        closeModal();
        go('studio');
      });
      m.querySelector('.save').addEventListener('click', () => savePicture(p));
      m.querySelector('.del').addEventListener('click', () => {
        store.update(s => { s.album.splice(i, 1); });
        closeModal();
        draw();
      });
    }));
  };
  draw();
}
