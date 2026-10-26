// A visit to one destination: fly → arrive → dress → market maths → words → facts → passport quiz.

import { $, esc, shuffle } from '../util.js';
import { getReligion, RESPECT_LINE } from '../data/religions.js';
import { nameFor } from '../data/names.js';
import { orderGame, matchGame, religionModal } from './minigames.js';
import { store, trip, isUnlocked } from '../store.js';
import { getCountry, displayName } from '../data/countries.js';
import { PINS } from '../data/worldmap.js';
import { getItem, freshWorn, thumbBox } from '../items.js';
import { renderItemThumb } from '../doll.js';
import { mathSet, flightProblem, vocabSet, countryQuiz, wordKey, allWords } from '../learn.js';
import { sfx, narrate } from '../audio.js';
import { go, topbar, stageHTML, updateDoll, setScene, bubble, setWeather, runQuestions, resultHTML, modal, closeModal, confetti, toast, sayBtn, refreshStars } from '../ui.js';
import { mapSVG, VIEWS, project, regionOf } from './map.js';
import { scenePhoto } from '../scenes.js';

export const STEPS = [
  { id: 'fly', e: '✈️', name: 'Fly' },
  { id: 'arrive', e: '🛬', name: 'Arrive' },
  { id: 'dress', e: '👗', name: 'Dress up' },
  { id: 'shop', e: '🛍️', name: 'Market' },
  { id: 'words', e: '📖', name: 'Words' },
  { id: 'facts', e: '💡', name: 'Fun facts' },
  { id: 'stamp', e: '🛂', name: 'Passport' },
];

const VISIT_STEP = { id: 'visit', e: '🕊️', name: 'Sacred place' };
// The sacred-place step only appears for destinations that have one.
// A real photo of the place, shown whole (the stage background is cropped and has the doll in front).
const postcard = id => {
  const p = scenePhoto(id);
  return p ? `<figure class="postcard"><img src="${p.src}" alt="${esc(p.what)}"><figcaption><b>📷 A real photo: ${esc(p.what)}</b><span>Photo: ${esc(p.author)} · ${esc(p.licence)}</span></figcaption></figure>` : '';
};

export const stepsFor = c => (c.worship ? [...STEPS.slice(0, 5), VISIT_STEP, ...STEPS.slice(5)] : STEPS);

export default function tripScreen(el, params) {
  const c = getCountry(params.id);
  const T = trip(c.id);
  const STEPS = stepsFor(c);
  const nextStep = id => STEPS[STEPS.findIndex(s => s.id === id) + 1]?.id;
  let step = params.step || (T.stamp ? 'arrive' : (STEPS.find(s => !T.done[s.id]) || STEPS[0]).id);
  let alive = true;

  el.innerHTML = `${topbar(`${c.flag} ${esc(c.name)}`, { back: 'map' })}
    <div class="steps"></div>
    <div class="trip-body">${stageHTML({ scene: c.id, uid: 'trip' })}<div class="trip-main"></div></div>`;
  const stage = $('.stage', el);
  const main = $('.trip-main', el);
  setWeather(stage, c.season);
  const myName = nameFor(store.state.kidName, c.id);
  const badgeForm = myName.forms.find(f => !/^[A-Za-z\s]+$/.test(f.script));
  if (badgeForm) stage.insertAdjacentHTML('beforeend', `<button class="name-badge" data-say="${esc(badgeForm.script)}" data-lang="${badgeForm.tts}" data-fallback="${esc(badgeForm.say || store.state.kidName)}"><b>${esc(badgeForm.script)}</b><small>your name in ${esc(badgeForm.lang)} 🔊</small></button>`);

  const markDone = id => store.update(() => { T.done[id] = true; });
  const goStep = id => { step = id; sfx('tap'); render(); };

  function renderSteps() {
    $('.steps', el).innerHTML = STEPS.map(s => `<button class="step ${T.done[s.id] ? 'done' : ''} ${s.id === step ? 'cur' : ''}" data-step="${s.id}"><span class="e">${T.done[s.id] && s.id !== step ? '✅' : s.e}</span>${s.name}</button>`).join('');
  }
  $('.steps', el).addEventListener('click', e => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const idx = STEPS.findIndex(s => s.id === b.dataset.step);
    // Steps open in order the first time; any finished step can be replayed.
    const firstOpen = STEPS.findIndex(s => !T.done[s.id]);
    if (T.stamp || T.done[b.dataset.step] || idx <= firstOpen) goStep(b.dataset.step);
    else { sfx('wrong'); toast('Finish the steps in order first! ✨'); }
  });

  const nextBtn = (label = 'Next') => {
    const n = nextStep(step);
    const s = STEPS.find(x => x.id === n);
    return n ? `<div class="actions"><button class="btn big green next-step">${label}: ${s.e} ${s.name} ➜</button></div>` : '';
  };
  const wireNext = () => main.querySelector('.next-step')?.addEventListener('click', () => goStep(nextStep(step)));

  // ---------- Steps ----------

  function fly() {
    const fromId = store.state.lastStop && store.state.lastStop !== c.id ? store.state.lastStop : null;
    const from = fromId ? getCountry(fromId) : null;
    const region = regionOf(c.id);
    const view = region !== 'world' && (!from || regionOf(from.id) === region) ? VIEWS[region] : VIEWS.world;
    main.innerHTML = `<div class="card" style="padding:10px"><div class="map-wrap fly-map" style="height:clamp(150px, 24vh, 240px);flex:none">${mapSVG(view)}<div class="plane">✈️</div></div></div><div class="qbox"></div>`;
    bubble(stage, from ? `Fasten your seatbelt! We are flying from ${displayName(from)} to ${displayName(c)}!` : `Fasten your seatbelt! We are flying to ${displayName(c)}!`);
    const box = main.querySelector('.fly-map');
    const plane = main.querySelector('.plane');
    const end = PINS[c.id];
    const start = from ? PINS[from.id] : [end[0] - (view === VIEWS.world ? 200 : 60), end[1] + 30];
    sfx('whoosh');
    const t0 = performance.now();
    const anim = now => {
      if (!alive || !plane.isConnected) return;
      const k = Math.min(1, (now - t0) / 2600);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const mid = [(start[0] + end[0]) / 2, Math.min(start[1], end[1]) - 30];
      const x = (1 - e) ** 2 * start[0] + 2 * (1 - e) * e * mid[0] + e * e * end[0];
      const y = (1 - e) ** 2 * start[1] + 2 * (1 - e) * e * mid[1] + e * e * end[1];
      const [px, py] = project(box, view, [x, y]);
      plane.style.left = `${px}px`;
      plane.style.top = `${py}px`;
      plane.style.transform = `translate(-50%,-50%) scaleX(${end[0] >= start[0] ? 1 : -1})`;
      if (k < 1) requestAnimationFrame(anim);
      else plane.textContent = c.flag;
    };
    requestAnimationFrame(anim);
    const q = flightProblem(c, store.state.settings.level, from);
    runQuestions(main.querySelector('.qbox'), [q], {
      title: from ? 'Flight time' : 'Clock time',
      onDone: () => {
        markDone('fly');
        store.update(s => { s.lastStop = c.id; });
        bubble(stage, `We landed in ${displayName(c)}! ${c.greeting.text}!`);
        main.querySelector('.qbox').innerHTML = nextBtn('Next');
        wireNext();
      },
    });
  }

  function arrive() {
    const g = c.greeting;
    const t = c.thanks;
    const extra = (c.extraGreetings || []).map(x => `<div class="fact-box"><span class="e">👋</span><div style="flex:1"><div class="k">Hello in ${esc(x.label)}</div><div class="v">${esc(x.text)} ${x.native && x.native !== x.text ? `<span class="sub">${esc(x.native)}</span>` : ''}</div>${x.say ? `<div class="sub">say: ${esc(x.say)}</div>` : ''}</div>${sayBtn(x.native || x.text, x.lang, x.say || x.text)}</div>`).join('');
    main.innerHTML = `<div class="country-head"><span class="flag">${c.flag}</span><div><h2>${esc(c.name)}</h2><p>${esc(c.story.title)}${c.isIsland ? ` · an island in ${esc(c.countryName)}` : ''}</p></div></div>
      ${postcard(c.id)}
      <div class="fact-grid">
        <div class="fact-box"><span class="e">🏙️</span><div style="flex:1"><div class="k">${c.isIsland ? 'Capital of Bali' : 'Capital city'}</div><div class="v">${esc(c.capital)}</div>${c.nationalCapital ? `<div class="sub">Indonesia's capital: ${esc(c.nationalCapital)}</div>` : ''}${c.id === 'SG' ? '<div class="sub">A city that is also a country!</div>' : ''}</div>${sayBtn(c.nationalCapital ? `Bali's capital is ${c.capital}. Indonesia's capital is ${c.nationalCapital}.` : `The capital city of ${displayName(c)} is ${c.capital}.`)}</div>
        <div class="fact-box"><span class="e">💰</span><div style="flex:1"><div class="k">Money</div><div class="v">${esc(c.currency.name)}</div><div class="sub">Symbol: ${esc(c.currency.symbol)}</div></div>${sayBtn(`In ${displayName(c)}, people pay with the ${c.currency.name}.`)}</div>
        <div class="fact-box"><span class="e">🗣️</span><div style="flex:1"><div class="k">Language</div><div class="v" style="font-size:1rem">${esc(c.languageLine)}</div></div>${sayBtn(c.languageLine)}</div>
        <div class="fact-box"><span class="e">🌡️</span><div style="flex:1"><div class="k">Weather</div><div class="v" style="font-size:1rem">${esc(c.weather)}</div><div class="sub">About ${c.temp}°C</div></div>${sayBtn(`The weather: ${c.weather}. About ${c.temp} degrees.`)}</div>
        <div class="fact-box"><span class="e">👋</span><div style="flex:1"><div class="k">Say hello</div><div class="v">${esc(g.text)} <span class="sub">${esc(g.native !== g.text ? g.native : '')}</span></div><div class="sub">say: ${esc(g.say || g.text)} · ${esc(g.meaning)}</div></div>${sayBtn(g.native, g.lang, g.say || g.text)}</div>
        <div class="fact-box"><span class="e">🙏</span><div style="flex:1"><div class="k">Say thank you</div><div class="v">${esc(t.text)} <span class="sub">${esc(t.native !== t.text ? t.native : '')}</span></div>${t.say ? `<div class="sub">say: ${esc(t.say)}</div>` : ''}</div>${sayBtn(t.native, t.lang, t.say || t.text)}</div>
        ${extra}
        ${myName.forms.map(f => `<div class="fact-box name-box"><span class="e">✍️</span><div style="flex:1"><div class="k">Your name in ${esc(f.lang)}</div><div class="v name-v">${esc(f.script)}</div>${f.say ? `<div class="sub">say: ${esc(f.say)}</div>` : ''}${f.note ? `<div class="sub">${esc(f.note)}</div>` : ''}</div>${sayBtn(f.script, f.tts, f.say || store.state.kidName)}</div>`).join('')}
        ${myName.greeting ? `<div class="fact-box name-box"><span class="e">💬</span><div style="flex:1"><div class="k">${esc(myName.greeting.lang)} hello, just for you</div><div class="v">${esc(myName.greeting.text)}</div></div>${sayBtn(myName.greeting.text, myName.greeting.tts)}</div>` : ''}
        <div class="fact-box"><span class="e">🏳️</span><div style="flex:1"><div class="k">Flag</div><div class="v" style="font-size:1rem">${esc(c.flagColors)}</div></div>${sayBtn(`The flag is ${c.flagColors}.`)}</div>
      </div>
      ${c.story.memory ? `<div class="memory">💭 <span style="flex:1">${esc(c.story.memory)}</span>${sayBtn(c.story.memory)}</div>` : ''}
      ${nextBtn('Next')}`;
    bubble(stage, c.story.intro);
    markDone('arrive');
    wireNext();
  }

  function dress() {
    const done = T.done.dress;
    main.classList.add('center');
    main.innerHTML = `<div class="card" style="text-align:center">
      <div class="huge-emoji">👗</div>
      <h2 style="margin:6px 0">${done ? 'Outfit ready!' : 'Dressing challenge'}</h2>
      <ul style="text-align:left;font-weight:800;font-size:1.1rem;line-height:1.6;margin:8px auto;max-width:520px">${c.goals.map(g => `<li>${g.icon} ${esc(g.text)} ${g.test(store.state.look) ? '✅' : ''}</li>`).join('')}</ul>
      <div class="actions"><button class="btn big ${done ? 'white' : ''} open-studio">${done ? '✏️ Change outfit' : '🚪 Open the dressing room'}</button></div></div>
      ${done ? nextBtn('Next') : ''}`;
    bubble(stage, c.story.dress);
    main.querySelector('.open-studio').addEventListener('click', () => go('studio', { challenge: c.id }));
    wireNext();
  }

  function shop() {
    main.innerHTML = `<div class="memory">🛍️ <span style="flex:1">Market time! In ${esc(displayName(c))} you pay with the ${esc(c.currency.name)} (${esc(c.currency.symbol)}).</span></div><div class="qbox"></div>`;
    bubble(stage, `Let's go shopping! Can you help me with the money?`);
    const qs = mathSet(c, store.state.settings.level, 3);
    runQuestions(main.querySelector('.qbox'), qs, {
      onDone: r => {
        markDone('shop');
        main.querySelector('.qbox').innerHTML = resultHTML(r) + nextBtn('Next');
        sfx('success');
        bubble(stage, 'Thank you for helping me with the shopping!');
        wireNext();
      },
    });
  }

  function words() {
    let i = 0;
    const list = c.vocab;
    const show = () => {
      const w = list[i];
      const sentence = esc(w.sentence).replace('___', `<b>${esc(w.word)}</b>`);
      main.innerHTML = `<div class="memory">📖 <span style="flex:1">New words from ${esc(displayName(c))}: ${i + 1} of ${list.length}</span></div>
        <div class="word-card"><div class="e">${w.emoji}</div><div class="w">${esc(w.word)} ${sayBtn(w.word)}</div><div class="m">${esc(w.meaning)}</div><div class="s">${sentence}</div>${sayBtn(`${w.word}. ${w.meaning}. ${w.sentence.replace('___', w.word)}`)}</div>
        <div class="dots">${list.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="actions">${i > 0 ? '<button class="btn white prev">⬅️ Back</button>' : ''}<button class="btn big green fwd">${i + 1 < list.length ? 'Next word ➜' : 'Play the word game! 🎮'}</button></div>`;
      narrate(`${w.word}. ${w.meaning}.`);
      store.update(s => { s.words[wordKey(c.id, w)] = true; });
      main.querySelector('.prev')?.addEventListener('click', () => { i--; sfx('tap'); show(); });
      main.querySelector('.fwd').addEventListener('click', () => {
        sfx('tap');
        if (i + 1 < list.length) { i++; show(); return; }
        game();
      });
    };
    const game = () => {
      main.innerHTML = '<div class="qbox"></div>';
      const pool = allWords().filter(w => store.state.words[wordKey(w.cid, w)]);
      runQuestions(main.querySelector('.qbox'), vocabSet(list, pool.length >= 8 ? pool : allWords(), 4), {
        onDone: r => {
          markDone('words');
          main.querySelector('.qbox').innerHTML = resultHTML(r, '<p>New words are saved in your Word Book 📖</p>') + nextBtn('Next');
          wireNext();
        },
      });
    };
    bubble(stage, 'Let\'s learn some new English words!');
    show();
  }

  function visit() {
    const w = c.worship;
    const rels = w.religions.map(getReligion);
    main.innerHTML = `<div class="country-head"><span class="flag">${rels[0].emoji}</span><div><h2>${esc(w.place)}</h2><p>${esc(w.where)}</p></div></div>
      ${postcard(w.scene)}
      <div class="memory">🕊️ <span style="flex:1">${esc(w.intro)}</span>${sayBtn(w.intro)}</div>
      <div class="chip-row">${rels.map(r => `<button class="chip religion-chip" data-rel="${r.id}"><span class="e">${r.emoji}</span>${esc(r.name)}</button>`).join('')}</div>
      <div class="vbox"></div>`;
    main.querySelectorAll('.religion-chip').forEach(b => b.addEventListener('click', () => { sfx('pop'); religionModal(getReligion(b.dataset.rel)); }));
    const box = main.querySelector('.vbox');
    const dressed = !w.dress || T.done.visitDress;
    if (!dressed) {
      box.innerHTML = `<div class="card" style="text-align:center"><h2 style="margin:4px 0">Dress respectfully</h2>
        <p class="note" style="font-size:1rem">${esc(RESPECT_LINE)}</p>
        <ul style="text-align:left;font-weight:800;font-size:1.05rem;line-height:1.6;margin:8px auto;max-width:520px">${w.dress.map(g => `<li>${g.icon} ${esc(g.text)}</li>`).join('')}</ul>
        <div class="actions"><button class="btn big dress-visit">👗 Get dressed for the visit</button></div></div>`;
      bubble(stage, RESPECT_LINE);
      box.querySelector('.dress-visit').addEventListener('click', () => go('studio', { visit: c.id }));
      return;
    }
    if (!w.dress) box.innerHTML = `<div class="memory">👗 <span style="flex:1">${esc(w.note)}</span></div>`;
    const gbox = document.createElement('div');
    box.appendChild(gbox);
    bubble(stage, w.game.type === 'order' ? 'What do visitors do here? Tap the steps in the right order!' : 'Can you match each place to the people who pray there?');
    const finish = () => {
      const first = !T.done.visit;
      store.update(s => { T.done.visit = true; if (first) s.coins += 3; });
      refreshStars();
      sfx('success');
      confetti(40);
      gbox.insertAdjacentHTML('beforeend', `<div class="explain" style="margin-top:12px">💡 <span style="flex:1">${esc(w.fact)}</span>${sayBtn(w.fact)}</div>${nextBtn('Next')}`);
      narrate(w.fact);
      wireNext();
    };
    if (w.game.type === 'order') orderGame(gbox, w.game.steps, finish);
    else matchGame(gbox, w.game.pairs, finish);
  }

  function facts() {
    const list = shuffle(c.facts).slice(0, 4);
    let i = 0;
    const show = () => {
      const f = list[i];
      main.classList.add('center');
      main.innerHTML = `<div class="didyouknow"><div class="q-topic">Did you know?</div><div class="e">${f.emoji}</div><p>${esc(f.text)}</p>${sayBtn(f.text)}</div>
        <div class="dots">${list.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="actions"><button class="btn big green fwd">${i + 1 < list.length ? 'Tell me more ➜' : 'Done ✓'}</button></div>`;
      narrate(f.text);
      main.querySelector('.fwd').addEventListener('click', () => {
        sfx('tap');
        if (i + 1 < list.length) { i++; show(); return; }
        markDone('facts');
        goStep(nextStep('facts'));
      });
    };
    bubble(stage, 'I know some amazing facts about this place!', { read: false });
    show();
  }

  function stamp() {
    const all = countryQuiz(c);
    const qs = [all[0], ...shuffle(all.slice(1)).slice(0, 4)];
    main.innerHTML = `<div class="memory">🛂 <span style="flex:1">Passport check! Answer the officer's questions to get your ${esc(displayName(c))} stamp.</span></div><div class="qbox"></div>`;
    bubble(stage, 'Passport check! I hope we remember everything!');
    runQuestions(main.querySelector('.qbox'), qs, {
      title: 'Passport check',
      onDone: r => {
        const first = !T.stamp;
        store.update(s => {
          T.done.stamp = true;
          T.stamp = true;
          T.quizBest = Math.max(T.quizBest || 0, r.correct);
          if (first) { T.stampedOn = new Date().toISOString().slice(0, 10); s.stars += 5; s.coins += 10; }
        });
        refreshStars();
        sfx('stamp');
        confetti();
        main.querySelector('.qbox').innerHTML = `<div class="card result">
          <div class="stamp new" style="--c:${c.color};width:170px"><span class="f">${c.flag}</span><span class="n">${esc(displayName(c))}</span><span class="d">${esc(T.stampedOn)}</span></div>
          <h2>${first ? 'You got the stamp!' : 'Great review!'}</h2>
          <p>${r.correct} of ${r.total} right first time.${first ? ' +5 stars ⭐ +10 coins 🪙' : ''}</p>
          <div class="actions"><button class="btn white snap-here">📸 Take a photo here</button><button class="btn big green done">🗺️ Back to the map</button></div></div>`;
        bubble(stage, first ? `Hooray! Our ${displayName(c)} stamp! Thank you, ${store.state.kidName || 'friend'}!` : 'We know so much about this place now!');
        main.querySelector('.done').addEventListener('click', () => go('map'));
        main.querySelector('.snap-here').addEventListener('click', () => {
          sfx('camera');
          store.update(s => { s.album.unshift({ look: JSON.parse(JSON.stringify(s.look)), scene: c.id, season: c.season, at: Date.now() }); s.album = s.album.slice(0, 40); });
          toast('📸 Saved to your photo album!');
        });
        if (first) setTimeout(() => alive && reward(), 1600);
      },
    });
  }

  function reward() {
    const item = getItem(c.reward);
    if (!item || isUnlocked(item.id)) return;
    store.update(s => { s.unlocked.push(item.id); });
    sfx('unlock');
    const m = modal(`<div style="text-align:center"><h2>🎁 You unlocked a surprise!</h2>
      <div style="width:220px;height:220px;margin:0 auto">${renderItemThumb(item, null, thumbBox(item))}</div>
      <p style="font-size:1.4rem;font-weight:900;margin:6px 0">${esc(item.name)}</p>
      <p class="note">The ${esc(displayName(c))} picture is now in the dressing room too.</p>
      <div class="actions"><button class="btn white" data-close>Later</button><button class="btn big wear">Wear it now ✨</button></div></div>`);
    narrate(`You unlocked the ${item.name}!`);
    m.querySelector('.wear').addEventListener('click', () => {
      store.update(s => {
        s.look[item.slot] = freshWorn(item);
        if (item.slot === 'dress') { s.look.top = null; s.look.bottom = null; }
      });
      closeModal();
      updateDoll(stage, store.state.look, { uid: 'trip', expr: 'happy' });
    });
  }

  function render() {
    const scene = step === 'visit' && c.worship ? c.worship.scene : c.id;
    if (stage.dataset.scene !== scene) setScene(stage, scene);
    main.classList.remove('center');
    main.scrollTop = 0;
    renderSteps();
    ({ fly, arrive, dress, shop, words, visit, facts, stamp })[step]();
  }

  render();
  return () => { alive = false; };
}
