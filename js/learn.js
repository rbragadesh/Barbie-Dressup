// Question generators: story maths, English vocabulary games and passport quizzes.
// Every generator returns { kind, prompt, visual?, choices: [{label, value}], answer, explain? }
// (or a { kind: 'spell' } question) for the shared question runner in ui.js.

import { rand, pick, shuffle, fmtNum, esc } from './util.js';
import { COUNTRIES, getCountry, displayName } from './data/countries.js';

// ---------- Money ----------

export function money(c, units) {
  const { symbol, scale } = c.currency;
  const n = fmtNum(units * scale);
  return /^[A-Za-z]+$/.test(symbol) ? `${symbol} ${n}` : `${symbol}${n}`;
}

// Spoken form, e.g. "3,000 won" rather than "₩3,000".
export function moneySay(c, units) {
  return `${fmtNum(units * c.currency.scale)} ${c.currency.short}`;
}

function zerosTip(c) {
  const s = c.currency.scale;
  if (s < 10) return '';
  const z = String(s).length - 1;
  return ` Tip: in ${c.currency.short}, prices have lots of zeros. Do the sum with the small numbers, then add ${z} zero${z > 1 ? 's' : ''} back!`;
}

// Four unique answer options around the right one.
function numberChoices(answer, { min = 0, spread = 3, step = 1, extra = [] } = {}) {
  const set = new Set([answer]);
  const cands = shuffle([...extra, answer + step, answer - step, answer + 2 * step, answer - 2 * step, answer + spread * step, answer - spread * step, answer + 10, answer - 10]);
  for (const v of cands) {
    if (set.size >= 4) break;
    if (Number.isInteger(v) && v >= min && v !== answer) set.add(v);
  }
  let k = 3;
  while (set.size < 4) set.add(answer + k++);
  return shuffle([...set]);
}

// ---------- Clock ----------

export function clockSVG(h, m = 0, size = 150) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    return `<text x="${50 + Math.cos(a) * 36}" y="${50 + Math.sin(a) * 36 + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#5b4b8a">${i === 0 ? 12 : i}</text>`;
  }).join('');
  const ma = (m * 6 - 90) * Math.PI / 180;
  const ha = (((h % 12) + m / 60) * 30 - 90) * Math.PI / 180;
  return `<svg class="clock" width="${size}" height="${size}" viewBox="0 0 100 100" aria-label="clock">
    <circle cx="50" cy="50" r="47" fill="#fff" stroke="#b39ddb" stroke-width="5"/>${ticks}
    <line x1="50" y1="50" x2="${50 + Math.cos(ha) * 21}" y2="${50 + Math.sin(ha) * 21}" stroke="#e91e63" stroke-width="5" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${50 + Math.cos(ma) * 31}" y2="${50 + Math.sin(ma) * 31}" stroke="#3f51b5" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="3.5" fill="#5b4b8a"/></svg>`;
}

const hour12 = h => ((h - 1 + 120) % 12) + 1;
export function timeWords(h, m) {
  h = hour12(h);
  if (m === 0) return `${h} o'clock`;
  if (m === 30) return `half past ${h}`;
  if (m === 15) return `quarter past ${h}`;
  if (m === 45) return `quarter to ${hour12(h + 1)}`;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function timeChoices(h, m, level) {
  const opts = new Map();
  const add = (hh, mm) => opts.set(timeWords(hh, mm), true);
  add(h, m);
  const mins = level === 1 ? [0] : level === 2 ? [0, 30] : [0, 15, 30, 45];
  const cands = shuffle([[h + 1, m], [h - 1, m], [h, mins[(mins.indexOf(m) + 1) % mins.length]], [m / 5 || 12, 0], [h + 2, m], [h - 2, m]]);
  for (const [hh, mm] of cands) { if (opts.size >= 4) break; add(hh, mm); }
  let k = 3;
  while (opts.size < 4) add(h + k++, m);
  return shuffle([...opts.keys()]).map(label => ({ label, value: label }));
}

// ---------- Maths ----------

const emojiRow = (e, n) => `<div class="emoji-row">${Array.from({ length: n }, () => `<span>${e}</span>`).join('')}</div>`;
const priceTag = (c, it, units) => `<div class="price-card"><div class="big-emoji">${it.emoji}</div><div class="pc-name">${esc(it.name)}</div><div class="tag">${money(c, units)}</div></div>`;
const moneyChoices = (c, units, opts) => numberChoices(units, opts).map(v => ({ label: money(c, v), value: v }));
const fitPrice = (it, lo, hi) => { const a = Math.max(lo, it.price[0]); const b = Math.min(hi, it.price[1]); return a <= b ? rand(a, b) : rand(lo, hi); };

const MATH = {
  shopTotal(c, level) {
    const [a, b] = shuffle(c.shop).slice(0, 2);
    const cap = level === 1 ? 10 : level === 2 ? 45 : 90;
    const pa = level === 1 ? fitPrice(a, 1, 9) : rand(11, cap);
    const pb = level === 1 ? fitPrice(b, 1, Math.min(9, 20 - pa)) : rand(5, Math.min(cap, 99 - pa));
    const ans = pa + pb;
    return {
      kind: 'math', topic: 'Adding',
      prompt: `You buy ${a.name} for ${money(c, pa)} and ${b.name} for ${money(c, pb)}. How much is that altogether?`,
      say: `You buy ${a.name} for ${moneySay(c, pa)} and ${b.name} for ${moneySay(c, pb)}. How much is that altogether?`,
      visual: `<div class="price-row">${priceTag(c, a, pa)}<div class="op">+</div>${priceTag(c, b, pb)}</div>`,
      choices: moneyChoices(c, ans, { min: 1, step: level === 1 ? 1 : pick([1, 10]) }), answer: ans,
      explain: `${money(c, pa)} + ${money(c, pb)} = ${money(c, ans)}.${zerosTip(c)}`,
    };
  },
  shopChange(c, level) {
    const it = pick(c.shop);
    const note = level === 1 ? pick([10, 20]) : level === 2 ? pick([20, 50]) : pick([50, 100]);
    const p = level === 1 ? fitPrice(it, 1, note - 1) : rand(Math.ceil(note / 5), note - 1);
    const ans = note - p;
    return {
      kind: 'math', topic: 'Change',
      prompt: `The ${it.name} costs ${money(c, p)}. You pay with ${money(c, note)}. How much change do you get back?`,
      say: `The ${it.name} costs ${moneySay(c, p)}. You pay with ${moneySay(c, note)}. How much change do you get back?`,
      visual: `<div class="price-row">${priceTag(c, it, p)}<div class="op">💵</div><div class="price-card note"><div class="big-emoji">💵</div><div class="pc-name">You pay</div><div class="tag">${money(c, note)}</div></div></div>`,
      choices: moneyChoices(c, ans, { min: 0 }), answer: ans,
      explain: `${money(c, note)} − ${money(c, p)} = ${money(c, ans)}.${zerosTip(c)}`,
    };
  },
  shopMulti(c, level) {
    const it = pick(c.shop);
    const q = level === 1 ? rand(2, 3) : level === 2 ? rand(2, 5) : rand(3, 9);
    const p = level === 1 ? rand(1, 5) : level === 2 ? pick([2, 5, 10]) : rand(3, 10);
    const ans = p * q;
    return {
      kind: 'math', topic: level === 1 ? 'Adding' : 'Times',
      prompt: `One ${it.name} costs ${money(c, p)}. How much do ${q} cost?`,
      say: `One ${it.name} costs ${moneySay(c, p)}. How much do ${q} cost?`,
      visual: `<div class="price-row">${priceTag(c, it, p)}<div class="op">× ${q}</div></div>` + emojiRow(it.emoji, q),
      choices: moneyChoices(c, ans, { min: 1, step: p > 2 ? p : 1 }), answer: ans,
      explain: `${Array(q).fill(money(c, p)).join(' + ')} = ${money(c, ans)}` + (level > 1 ? ` (${q} × ${p} = ${ans})` : '') + `.${zerosTip(c)}`,
    };
  },
  array(c, level) {
    const it = pick(c.shop);
    const r = level === 1 ? rand(2, 3) : level === 2 ? rand(2, 5) : rand(3, 6);
    const k = level === 1 ? rand(2, 4) : level === 2 ? pick([2, 5, 10]) : rand(3, 8);
    const rows = Array.from({ length: r }, () => emojiRow(it.emoji, k)).join('');
    const ans = r * k;
    return {
      kind: 'math', topic: 'Groups',
      prompt: `There are ${r} rows of ${it.name}. Each row has ${k}. How many are there in all?`,
      visual: `<div class="grid-visual">${rows}</div>`,
      choices: numberChoices(ans, { min: 1, step: level === 1 ? 1 : Math.min(k, 5) }).map(v => ({ label: String(v), value: v })), answer: ans,
      explain: `${r} rows of ${k} is ${Array(r).fill(k).join(' + ')} = ${ans}` + (level > 1 ? `, or ${r} × ${k} = ${ans}` : '') + '.',
    };
  },
  clock(c, level) {
    const h = rand(1, 12);
    const m = level === 1 ? 0 : level === 2 ? pick([0, 30]) : pick([0, 15, 30, 45]);
    const ans = timeWords(h, m);
    return {
      kind: 'math', topic: 'Time',
      prompt: `Our tour bus leaves at this time. What time does the clock say?`,
      visual: clockSVG(h, m),
      choices: timeChoices(h, m, level), answer: ans,
      explain: `The short hand points to the hour and the long hand shows the minutes. It is ${ans}.`,
    };
  },
  flight(c, level, from) {
    const d = level === 1 ? rand(1, 4) : rand(2, 7);
    const h = level === 1 ? rand(1, 12 - d) : rand(1, 12);
    const m = level === 3 ? pick([0, 30]) : 0;
    const ans = timeWords(h + d, m);
    const route = from ? `from ${displayName(from)} to ${displayName(c)}` : `to ${displayName(c)}`;
    return {
      kind: 'math', topic: 'Time',
      prompt: `Our plane ${route} takes off at ${timeWords(h, m)}. The flight takes ${d} hour${d > 1 ? 's' : ''}. What time do we land?`,
      visual: `<div class="flight-visual">${clockSVG(h, m, 120)}<div class="op">✈️ + ${d} h</div><div class="clock-q">?</div></div>`,
      choices: (() => {
        const set = new Set([ans]);
        for (const dd of shuffle([1, -1, 2, -2, 3])) { if (set.size >= 4) break; set.add(timeWords(h + d + dd, m)); }
        return shuffle([...set]).map(label => ({ label, value: label }));
      })(),
      answer: ans,
      explain: `Count on ${d} hour${d > 1 ? 's' : ''} from ${timeWords(h, m)}: we land at ${ans}.`,
    };
  },
  pattern(c, level) {
    if (level === 1) {
      const [a, b, x] = shuffle(c.shop).slice(0, 3);
      const seq = [a, b, a, b, a];
      return {
        kind: 'math', topic: 'Patterns',
        prompt: 'What comes next in the pattern?',
        visual: `<div class="emoji-row seq">${seq.map(s => `<span>${s.emoji}</span>`).join('')}<span class="q">?</span></div>`,
        choices: shuffle([a, b, x]).map(s => ({ label: s.emoji, value: s.emoji, big: true })), answer: b.emoji,
        explain: `The pattern goes ${a.emoji} ${b.emoji}, ${a.emoji} ${b.emoji}... so next is ${b.emoji}.`,
      };
    }
    const step = level === 2 ? pick([2, 5, 10]) : pick([3, 4, 6, 25]);
    const start = step * rand(0, 4);
    const seq = [0, 1, 2, 3].map(i => start + i * step);
    const ans = start + 4 * step;
    return {
      kind: 'math', topic: 'Skip counting',
      prompt: `Count by ${step}s. What number comes next?`,
      visual: `<div class="num-seq">${seq.map(n => `<span>${n}</span>`).join('')}<span class="q">?</span></div>`,
      choices: numberChoices(ans, { min: 0, step }).map(v => ({ label: String(v), value: v })), answer: ans,
      explain: `${seq.join(', ')}, ${ans}: each number is ${step} more.`,
    };
  },
  outfits(c, level) {
    const t = level === 1 ? rand(2, 5) : rand(2, level === 2 ? 3 : 5);
    const b = level === 1 ? rand(2, 5) : rand(2, level === 2 ? 3 : 4);
    const vis = `<div class="price-row"><div>${emojiRow('👚', t)}<div class="pc-name">${t} tops</div></div><div class="op">${level === 1 ? '+' : '×'}</div><div>${emojiRow('👗', b)}<div class="pc-name">${b} skirts</div></div></div>`;
    if (level === 1) {
      return {
        kind: 'math', topic: 'Adding', prompt: `You pack ${t} tops and ${b} skirts for ${displayName(c)}. How many clothes did you pack?`, visual: vis,
        choices: numberChoices(t + b, { min: 2 }).map(v => ({ label: String(v), value: v })), answer: t + b, explain: `${t} + ${b} = ${t + b} clothes.`,
      };
    }
    return {
      kind: 'math', topic: 'Outfits', prompt: `You have ${t} tops and ${b} skirts. How many different outfits can you make (one top with one skirt)?`, visual: vis,
      choices: numberChoices(t * b, { min: 2, extra: [t + b] }).map(v => ({ label: String(v), value: v })), answer: t * b,
      explain: `Each of the ${t} tops can go with ${b} skirts: ${t} × ${b} = ${t * b} outfits!`,
    };
  },
  share(c, level) {
    const it = pick(c.shop);
    const k = level === 2 ? 2 : rand(2, 5);
    const each = level === 2 ? rand(2, 8) : rand(2, 6);
    const n = k * each;
    return {
      kind: 'math', topic: 'Sharing',
      prompt: `${n} pieces of ${it.name} are shared equally between ${k} friends. How many does each friend get?`,
      visual: emojiRow(it.emoji, n) + `<div class="emoji-row">${'🧒'.repeat(k)}</div>`,
      choices: numberChoices(each, { min: 1 }).map(v => ({ label: String(v), value: v })), answer: each,
      explain: `${n} ÷ ${k} = ${each}, because ${k} × ${each} = ${n}.`,
    };
  },
  temperature(c, level) {
    const other = pick(COUNTRIES.filter(x => x.id !== c.id && x.temp !== c.temp));
    const [hot, cold] = c.temp > other.temp ? [c, other] : [other, c];
    const ans = hot.temp - cold.temp;
    return {
      kind: 'math', topic: 'Taking away',
      prompt: `On our trip it is ${c.temp}°C in ${displayName(c)} and ${other.temp}°C in ${displayName(other)}. How many degrees warmer is ${displayName(hot)}?`,
      say: `On our trip it is ${c.temp} degrees in ${displayName(c)} and ${other.temp} degrees in ${displayName(other)}. How many degrees warmer is ${displayName(hot)}?`,
      visual: `<div class="price-row"><div class="price-card"><div class="big-emoji">${c.temp >= 25 ? '☀️' : '🌤️'}</div><div class="pc-name">${displayName(c)}</div><div class="tag">${c.temp}°C</div></div><div class="price-card"><div class="big-emoji">${other.temp >= 25 ? '☀️' : '🌥️'}</div><div class="pc-name">${displayName(other)}</div><div class="tag">${other.temp}°C</div></div></div>`,
      choices: numberChoices(ans, { min: 1 }).map(v => ({ label: `${v}°`, value: v })), answer: ans,
      explain: `${hot.temp} − ${cold.temp} = ${ans} degrees warmer.`,
    };
  },
};

// Number facts tied to each destination: (level) => question or null.
const FACT_MATH = {
  IN: [
    lv => lv >= 2 && { prompt: 'The wheel on India\'s flag has 24 spokes. If you colour half of them, how many is that?', ans: 12, visual: '<div class="big-emoji">🇮🇳</div>', explain: 'Half of 24 is 12, because 12 + 12 = 24.' },
    lv => ({ prompt: 'A peacock shows 8 blue feathers and 7 green feathers. How many feathers is that?', ans: 15, visual: emojiRow('🪶', 15), explain: '8 + 7 = 15.' }),
  ],
  KR: [
    () => ({ prompt: 'Hangul has 14 consonants and 10 vowels. How many basic letters is that?', ans: 24, visual: '<div class="hangul">ㄱ ㄴ ㄷ ㅏ ㅑ ㅓ</div>', explain: '14 + 10 = 24 letters.' }),
    () => ({ prompt: 'Hangul has 10 basic vowels. You have learned 4 of them. How many more are there to learn?', ans: 6, visual: '<div class="hangul">ㅏ ㅑ ㅓ ㅕ</div>', explain: '10 − 4 = 6 vowels left to learn.' }),
  ],
  TW: [
    lv => lv >= 2 && { prompt: 'Taipei 101 has 101 floors. The lookout is on floor 89. How many floors are above the lookout?', ans: 12, visual: '<div class="big-emoji">🏙️</div>', explain: '101 − 89 = 12 floors.' },
    () => ({ prompt: 'You release 6 sky lanterns and your friend releases 5. How many lanterns float up?', ans: 11, visual: emojiRow('🏮', 11), explain: '6 + 5 = 11 lanterns.' }),
  ],
  SG: [
    () => ({ prompt: 'Singapore\'s flag has 5 stars. How many stars are on 2 flags?', ans: 10, visual: '<div class="big-emoji">🇸🇬 🇸🇬</div>', explain: '5 + 5 = 10 stars.' }),
    () => ({ prompt: 'Singapore has 4 official languages. You learn hello in 2 of them. How many are left to learn?', ans: 2, visual: '<div class="emoji-row"><span>🇬🇧</span><span>🇲🇾</span><span>🇨🇳</span><span>🇮🇳</span></div>', explain: '4 − 2 = 2 languages left.' }),
  ],
  BALI: [
    lv => ({ prompt: lv === 1 ? 'You make 2 flower offerings. Each one has 4 flowers. How many flowers do you need?' : 'You make 5 canang sari offerings. Each one has 4 flowers. How many flowers do you need?', ans: lv === 1 ? 8 : 20, visual: emojiRow('🌼', lv === 1 ? 8 : 20), explain: lv === 1 ? '4 + 4 = 8 flowers.' : '5 × 4 = 20 flowers.' }),
    () => ({ prompt: 'You see 9 monkeys in the forest. 3 run up a tree. How many are still on the ground?', ans: 6, visual: emojiRow('🐒', 9), explain: '9 − 3 = 6 monkeys.' }),
  ],
};

function factMath(c, level) {
  const list = (FACT_MATH[c.id] || []).map(f => f(level)).filter(Boolean);
  if (!list.length) return null;
  const f = pick(list);
  return {
    kind: 'math', topic: 'Fun facts', prompt: f.prompt, visual: f.visual,
    choices: numberChoices(f.ans, { min: 0 }).map(v => ({ label: String(v), value: v })), answer: f.ans, explain: f.explain,
  };
}

const TYPES_BY_LEVEL = {
  1: ['shopTotal', 'shopChange', 'shopMulti', 'array', 'clock', 'pattern', 'outfits'],
  2: ['shopTotal', 'shopChange', 'shopMulti', 'array', 'clock', 'pattern', 'outfits', 'share', 'temperature'],
  3: ['shopTotal', 'shopChange', 'shopMulti', 'array', 'clock', 'pattern', 'outfits', 'share', 'temperature'],
};

export function mathProblem(c, level, type = null, from = null) {
  const t = type || pick(TYPES_BY_LEVEL[level] || TYPES_BY_LEVEL[1]);
  return MATH[t](c, level, from);
}

// A shopping-themed set of `n` problems for a destination, with one number fact when available.
export function mathSet(c, level, n = 3) {
  const types = shuffle(['shopTotal', 'shopChange', 'shopMulti']).slice(0, Math.max(1, n - 1));
  const qs = types.map(t => MATH[t](c, level));
  const fm = factMath(c, level);
  qs.push(fm || MATH[pick(['array', 'outfits', 'pattern'])](c, level));
  return qs.slice(0, n);
}

export function flightProblem(c, level, from) {
  return from ? MATH.flight(c, level, from) : MATH.clock(c, level);
}

export function mixedMath(countries, level, n = 8) {
  return Array.from({ length: n }, () => {
    const c = pick(countries);
    return Math.random() < 0.2 && FACT_MATH[c.id] ? (factMath(c, level) || mathProblem(c, level)) : mathProblem(c, level);
  });
}

// ---------- Vocabulary ----------

export const wordKey = (cid, w) => `${cid}:${w.word}`;
export const allWords = () => COUNTRIES.flatMap(c => c.vocab.map(v => ({ ...v, cid: c.id })));

export function vocabQuestion(w, pool, type = null) {
  const others = shuffle(pool.filter(o => o.word !== w.word));
  const t = type || pick(w.word.length <= 8 ? ['picture', 'word', 'blank', 'spell'] : ['picture', 'word', 'blank']);
  if (t === 'spell') {
    return { kind: 'spell', topic: 'Spelling', word: w.word, prompt: `Spell the word for this picture: ${w.meaning}.`, visual: `<div class="huge-emoji">${w.emoji}</div>`, explain: `${w.word}: ${w.meaning}.` };
  }
  // Distractors must differ from the answer and from each other in both word and picture.
  const seen = new Set([w.emoji, w.word]);
  const three = others.filter(o => !seen.has(o.emoji) && !seen.has(o.word) && seen.add(o.emoji) && seen.add(o.word)).slice(0, 3);
  if (t === 'picture') {
    return {
      kind: 'word', topic: 'Words', prompt: `Which picture shows "${w.word}"?`, say: `Which picture shows ${w.word}?`,
      visual: `<div class="word-big">${esc(w.word)}</div>`,
      choices: shuffle([w, ...three]).map(o => ({ label: o.emoji, value: o.word, big: true })), answer: w.word,
      explain: `${w.word} means ${w.meaning}.`,
    };
  }
  if (t === 'blank') {
    return {
      kind: 'word', topic: 'Sentences', prompt: w.sentence.replace('___', '_____'), say: w.sentence.replace('___', 'blank'),
      visual: `<div class="huge-emoji">${w.emoji}</div>`,
      choices: shuffle([w, ...three]).map(o => ({ label: o.word, value: o.word })), answer: w.word,
      explain: w.sentence.replace('___', w.word.toUpperCase()),
    };
  }
  return {
    kind: 'word', topic: 'Meanings', prompt: `Which word means: ${w.meaning}?`,
    visual: `<div class="huge-emoji">${w.emoji}</div>`,
    choices: shuffle([w, ...three]).map(o => ({ label: o.word, value: o.word })), answer: w.word,
    explain: `${w.word}: ${w.meaning}.`,
  };
}

export function vocabSet(words, pool, n = 4) {
  const types = shuffle(['picture', 'blank', 'word', 'spell']);
  return shuffle(words).slice(0, n).map((w, i) => vocabQuestion(w, pool.length >= 4 ? pool : allWords(), w.word.length <= 8 ? types[i % 4] : pick(['picture', 'blank', 'word'])));
}

// ---------- Passport quiz ----------

const LANG_POOL = ['French', 'Portuguese', 'Japanese', 'Arabic', 'Korean', 'Hindi', 'Spanish', 'German', 'Russian', 'Italian', 'Swahili', 'Dutch'];

export function countryQuiz(c) {
  const others = COUNTRIES.filter(o => o.id !== c.id);
  const qs = [];
  const capWrong = shuffle(others.map(o => o.capital).filter(x => x !== c.capital));
  if (c.capitalTrap) capWrong.unshift(c.capitalTrap);
  if (c.nationalCapital) capWrong.unshift(c.nationalCapital);
  qs.push({
    kind: 'quiz', topic: 'Capital', prompt: c.capitalQ,
    choices: shuffle([c.capital, ...[...new Set(capWrong)].slice(0, 3)]).map(x => ({ label: x, value: x })), answer: c.capital,
    explain: c.nationalCapital ? `Bali's capital is ${c.capital}. The capital of the whole country, Indonesia, is ${c.nationalCapital}.` : `The capital of ${displayName(c)} is ${c.capital}.`,
  });
  if (c.countryName) {
    qs.push({
      kind: 'quiz', topic: 'Geography', prompt: `${c.name} is an island. Which country is it part of?`,
      choices: shuffle([c.countryName, 'India', 'Thailand', 'Malaysia']).map(x => ({ label: x, value: x })), answer: c.countryName,
      explain: `${c.name} is one of more than 17,000 islands in ${c.countryName}.`,
    });
  }
  qs.push({
    kind: 'quiz', topic: 'Money', prompt: `What money do people use in ${displayName(c)}?`,
    choices: shuffle([c.currency.name, ...shuffle(others.filter(o => o.currency.name !== c.currency.name).map(o => o.currency.name)).slice(0, 3)]).map(x => ({ label: x, value: x })), answer: c.currency.name,
    explain: `In ${displayName(c)} people pay with the ${c.currency.name} (${c.currency.symbol}).`,
  });
  const lang = c.languages[0];
  qs.push({
    kind: 'quiz', topic: 'Language', prompt: `Which language do many people speak in ${displayName(c)}?`,
    choices: shuffle([lang, ...shuffle(LANG_POOL.filter(l => !c.languages.includes(l))).slice(0, 3)]).map(x => ({ label: x, value: x })), answer: lang,
    explain: c.languageLine,
  });
  qs.push({
    kind: 'quiz', topic: 'Flag', prompt: `Which flag belongs to ${c.countryName || displayName(c)}?`,
    choices: shuffle([c, ...shuffle(others.filter(o => o.flag !== c.flag)).slice(0, 3)]).map(o => ({ label: o.flag, value: o.flag, big: true })), answer: c.flag,
    explain: `The flag is ${c.flagColors}.`,
  });
  qs.push({
    kind: 'quiz', topic: 'Hello', prompt: `How do you say hello in ${displayName(c)}?`,
    choices: shuffle([c.greeting.text, ...shuffle(others.map(o => o.greeting.text).filter(g => g !== c.greeting.text)).slice(0, 3)]).map(x => ({ label: x, value: x })), answer: c.greeting.text,
    explain: `${c.greeting.text} (${c.greeting.native}) means ${c.greeting.meaning.toLowerCase()}.`,
  });
  qs.push({
    kind: 'quiz', topic: 'Fun fact', prompt: c.funQ.q,
    choices: shuffle([c.funQ.a, ...c.funQ.wrong]).map(x => ({ label: x, value: x })), answer: c.funQ.a,
  });
  return qs;
}

export function flagQuiz(countries, n = 6) {
  return shuffle(countries).slice(0, n).map(c => ({
    kind: 'quiz', topic: 'Flags', prompt: `Which country has this flag?`, visual: `<div class="huge-emoji">${c.flag}</div>`,
    choices: shuffle([c, ...shuffle(COUNTRIES.filter(o => o.id !== c.id && o.flag !== c.flag)).slice(0, 3)]).map(o => ({ label: o.countryName ? `${o.countryName} (${o.name})` : o.name, value: o.id })),
    answer: c.id, explain: `That is the flag of ${c.countryName || c.name}: ${c.flagColors}.`,
  }));
}

export function capitalQuiz(countries, n = 6) {
  return shuffle(countries).slice(0, n).map(c => countryQuiz(c)[0]);
}

export { getCountry };
