// Run with: npm test  (Node 18+, no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { renderDoll, DEFAULT_LOOK, HAIR_STYLES, renderItemThumb, renderHairThumb } from '../js/doll.js';
import { allItems, getItem, freshWorn, thumbBox, WEAR_SLOTS } from '../js/items.js';
import { COUNTRIES, getCountry } from '../js/data/countries.js';
import { mathProblem, mathSet, flightProblem, vocabQuestion, vocabSet, countryQuiz, flagQuiz, capitalQuiz, allWords, timeWords, money } from '../js/learn.js';
import { SCENE_IDS, renderScene } from '../js/scenes.js';
import { PINS } from '../js/data/worldmap.js';

const STUDIO_TABS = ['hair', 'face', 'nails', 'dresses', 'world', 'tops', 'bottoms', 'coats', 'shoes', 'jewelry', 'hats', 'extras'];

test('every wardrobe item draws on the doll and as a thumbnail', () => {
  const ids = new Set();
  for (const item of allItems()) {
    assert.ok(!ids.has(item.id), `duplicate item id ${item.id}`);
    ids.add(item.id);
    assert.ok(WEAR_SLOTS.includes(item.slot), `${item.id} has unknown slot ${item.slot}`);
    assert.ok(thumbBox(item), `${item.id} has no thumbnail box`);
    const look = { ...DEFAULT_LOOK, [item.slot]: { ...freshWorn(item), pattern: 'dots' } };
    const svg = renderDoll(look, { uid: 't' });
    assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
    assert.ok(!svg.includes('undefined') && !svg.includes('NaN'), `${item.id} produced undefined/NaN in SVG`);
    const thumb = renderItemThumb(item, null, thumbBox(item));
    assert.ok(!thumb.includes('undefined') && !thumb.includes('NaN'), `${item.id} thumbnail has undefined/NaN`);
  }
  for (const s of HAIR_STYLES) assert.ok(!renderHairThumb(s.id, 'rainbow').includes('NaN'));
});

test('every scene renders', () => {
  for (const id of SCENE_IDS) {
    const svg = renderScene(id);
    assert.ok(svg.length > 500 && !svg.includes('NaN') && !svg.includes('undefined'), id);
  }
});

test('destination content is complete', () => {
  for (const c of COUNTRIES) {
    for (const k of ['id', 'name', 'flag', 'capital', 'capitalQ', 'currency', 'languages', 'languageLine', 'greeting', 'thanks', 'flagColors', 'season', 'story', 'goals', 'facts', 'vocab', 'shop', 'funQ', 'reward']) {
      assert.ok(c[k], `${c.id} missing ${k}`);
    }
    assert.ok(PINS[c.id], `${c.id} has no map pin`);
    assert.ok(c.facts.length >= 4, `${c.id} needs at least 4 facts`);
    assert.ok(c.vocab.length >= 4 && c.shop.length >= 3, `${c.id} needs words and shop items`);
    for (const w of c.vocab) assert.equal(w.sentence.split('___').length, 2, `${c.id}:${w.word} sentence needs exactly one ___`);
    for (const g of c.goals) assert.ok(STUDIO_TABS.includes(g.tab), `${c.id} goal "${g.text}" has bad hint tab ${g.tab}`);
    const reward = getItem(c.reward);
    assert.ok(reward, `${c.id} reward ${c.reward} missing`);
    assert.equal(reward.unlock, c.id, `${c.reward} should unlock with ${c.id}`);
    assert.ok(!c.funQ.wrong.includes(c.funQ.a));
  }
  const focus = COUNTRIES.filter(c => c.focus).map(c => c.id);
  assert.deepEqual(focus, ['IN', 'KR', 'TW', 'SG', 'BALI']);
  const words = allWords().map(w => w.word);
  assert.equal(new Set(words).size, words.length, 'vocabulary words should be unique across countries');
});

test('every dressing challenge can be completed with available items', () => {
  const extras = [
    ...HAIR_STYLES.map(h => L => { L.hairStyle = h.id; }),
    L => { L.makeup = { ...L.makeup, bindi: 'dot' }; },
  ];
  for (const c of COUNTRIES) {
    const look = JSON.parse(JSON.stringify({ ...DEFAULT_LOOK, top: null, bottom: null, shoes: null }));
    for (const g of c.goals) {
      if (g.test(look)) continue;
      const tries = [
        ...allItems().filter(i => !i.unlock).map(i => L => {
          L[i.slot] = freshWorn(i);
          if (i.slot === 'dress') { L.top = null; L.bottom = null; }
          if (i.slot === 'top' || i.slot === 'bottom') L.dress = null;
        }),
        ...extras,
      ];
      const fix = tries.find(f => {
        const L = JSON.parse(JSON.stringify(look));
        f(L);
        return g.test(L) && c.goals.filter(x => x.test(look)).every(x => x.test(L));
      });
      assert.ok(fix, `${c.id}: no unlocked item satisfies "${g.text}"`);
      fix(look);
    }
    assert.ok(c.goals.every(g => g.test(look)), `${c.id}: goals cannot all be met together`);
  }
});

const checkQ = (q, label) => {
  if (q.kind === 'spell') { assert.match(q.word, /^[a-z]+$/i, label); return; }
  const values = q.choices.map(c => c.value);
  assert.ok(values.includes(q.answer), `${label}: answer ${q.answer} not in choices ${values}`);
  assert.equal(new Set(values).size, values.length, `${label}: duplicate choices ${values}`);
  assert.equal(new Set(q.choices.map(c => c.label)).size, values.length, `${label}: duplicate labels`);
  assert.ok(values.length >= 3, `${label}: too few choices`);
  for (const v of values) if (typeof v === 'number') assert.ok(Number.isInteger(v) && v >= 0, `${label}: bad choice ${v}`);
  assert.ok(q.prompt && !/undefined|NaN/.test(q.prompt + (q.visual || '') + (q.explain || '')), `${label}: undefined/NaN in text`);
};

test('maths questions always include the right answer', () => {
  const types = ['shopTotal', 'shopChange', 'shopMulti', 'array', 'clock', 'pattern', 'outfits', 'share', 'temperature'];
  for (const c of COUNTRIES) {
    for (const level of [1, 2, 3]) {
      for (const t of types) for (let i = 0; i < 40; i++) checkQ(mathProblem(c, level, t), `${c.id} L${level} ${t}`);
      for (let i = 0; i < 30; i++) mathSet(c, level, 3).forEach((q, k) => checkQ(q, `${c.id} L${level} set#${k}`));
      for (let i = 0; i < 20; i++) checkQ(flightProblem(c, level, getCountry('IN')), `${c.id} L${level} flight`);
    }
  }
});

test('easy level keeps sums within 20 (before currency zeros)', () => {
  for (const c of COUNTRIES) {
    for (let i = 0; i < 100; i++) {
      for (const t of ['shopTotal', 'shopChange', 'shopMulti', 'array', 'outfits']) {
        const q = mathProblem(c, 1, t);
        assert.ok(q.answer <= 20, `${c.id} ${t} easy answer ${q.answer} is above 20`);
      }
    }
  }
});

test('word games and passport quizzes include the right answer', () => {
  const pool = allWords();
  for (const w of pool) for (const t of ['picture', 'word', 'blank', 'spell']) checkQ(vocabQuestion(w, pool, t), `word ${w.word} ${t}`);
  for (const c of COUNTRIES) {
    for (let i = 0; i < 10; i++) countryQuiz(c).forEach((q, k) => checkQ(q, `${c.id} quiz#${k}`));
    vocabSet(c.vocab, pool, 4).forEach((q, k) => checkQ(q, `${c.id} vocab#${k}`));
  }
  flagQuiz(COUNTRIES, 10).forEach((q, k) => checkQ(q, `flag#${k}`));
  capitalQuiz(COUNTRIES, 10).forEach((q, k) => checkQ(q, `capital#${k}`));
});

test('clock words and money formatting', () => {
  assert.equal(timeWords(15, 0), "3 o'clock");
  assert.equal(timeWords(12, 30), 'half past 12');
  assert.equal(timeWords(0, 0), "12 o'clock");
  assert.equal(timeWords(11, 45), 'quarter to 12');
  assert.equal(timeWords(12, 45), 'quarter to 1');
  assert.equal(money(getCountry('KR'), 3), '₩3,000');
  assert.equal(money(getCountry('BALI'), 2), 'Rp 20,000');
  assert.equal(money(getCountry('SG'), 5), 'S$5');
});

test('offline cache lists every app file', () => {
  const sw = fs.readFileSync('sw.js', 'utf8');
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
  for (const f of [...walk('js'), ...walk('css'), ...walk('icons'), 'index.html', 'manifest.webmanifest']) {
    assert.ok(sw.includes(`'${f.split(path.sep).join('/')}'`), `sw.js is missing ${f}: run node scripts/build-sw.mjs`);
  }
});
