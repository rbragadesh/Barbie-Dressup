// Sound effects (synthesised with Web Audio, so there are no sound files to load)
// and read-aloud via the browser's built-in speech synthesis.

import { store } from './store.js';

let ctx = null;

// iOS only allows audio after a user gesture; call this from the first tap.
export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    // A silent utterance primes speech synthesis on iOS Safari.
    if ('speechSynthesis' in window && !unlockAudio.primed) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
      unlockAudio.primed = true;
    }
  } catch { /* audio is optional */ }
}

function tone(freq, start, dur, { type = 'sine', vol = 0.18, slide = 0 } = {}) {
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(start, dur, vol = 0.12, hp = 1200) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  f.type = 'highpass';
  f.frequency.value = hp;
  g.gain.value = vol;
  src.buffer = buf;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(ctx.currentTime + start);
}

const SFX = {
  tap: () => tone(660, 0, 0.07, { type: 'triangle', vol: 0.12 }),
  pop: () => tone(520, 0, 0.12, { type: 'sine', slide: 1.8, vol: 0.16 }),
  success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, { type: 'triangle', vol: 0.16 })),
  wrong: () => { tone(300, 0, 0.18, { type: 'sine', vol: 0.14 }); tone(240, 0.16, 0.26, { type: 'sine', vol: 0.12 }); },
  sparkle: () => [1319, 1568, 1760, 2093, 2637].forEach((f, i) => tone(f, i * 0.05, 0.16, { type: 'sine', vol: 0.08 })),
  stamp: () => { tone(110, 0, 0.18, { type: 'square', vol: 0.12, slide: 0.5 }); noise(0, 0.12, 0.2, 300); },
  camera: () => { noise(0, 0.06, 0.25, 2000); noise(0.09, 0.05, 0.18, 2500); },
  whoosh: () => noise(0, 0.7, 0.08, 600),
  unlock: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.11, 0.3, { type: 'triangle', vol: 0.14 })),
};

export function sfx(name) {
  if (!store.state.settings.sound) return;
  try {
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    SFX[name] && SFX[name]();
  } catch { /* ignore */ }
}

// ---------- Speech ----------

let voices = [];
function loadVoices() {
  try { voices = speechSynthesis.getVoices() || []; } catch { voices = []; }
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

export function englishVoices() {
  loadVoices();
  return voices.filter(v => /^en[-_]/i.test(v.lang));
}

function pickVoice(lang) {
  if (!voices.length) loadVoices();
  const want = store.state.settings.voice;
  if (!lang || lang.startsWith('en')) {
    const named = want && voices.find(v => v.name === want);
    if (named) return named;
    const en = englishVoices();
    const pref = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Daniel', 'Rishi'];
    for (const n of pref) { const v = en.find(x => x.name.startsWith(n)); if (v) return v; }
    return en.find(v => v.localService) || en[0] || null;
  }
  const base = lang.split('-')[0].toLowerCase();
  return voices.find(v => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) ||
    voices.find(v => v.lang.toLowerCase().startsWith(base)) || null;
}

export const canSpeak = () => 'speechSynthesis' in window;

const stripEmoji = s => String(s).replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/\s+/g, ' ').trim();

// speak('Hello'), or speak a foreign phrase: speak('안녕하세요', { lang: 'ko-KR', fallback: 'ahn-nyong-ha-say-yo' })
export function speak(text, { lang = 'en-US', fallback = null, rate = 0.92, onend = null } = {}) {
  if (!canSpeak()) { onend && onend(); return; }
  try {
    speechSynthesis.cancel();
    let voice = pickVoice(lang);
    let say = stripEmoji(text);
    if (!voice && lang && !lang.startsWith('en')) {
      voice = pickVoice('en-US');
      if (fallback) say = fallback;
      lang = 'en-US';
    }
    if (!say) { onend && onend(); return; }
    const u = new SpeechSynthesisUtterance(say);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : lang;
    u.rate = rate;
    u.pitch = 1.08;
    if (onend) u.onend = onend;
    // WebKit can drop an utterance queued in the same tick as cancel(), so wait briefly.
    if (speechSynthesis.speaking || speechSynthesis.pending) setTimeout(() => speechSynthesis.speak(u), 80);
    else speechSynthesis.speak(u);
  } catch { onend && onend(); }
}

export function stopSpeaking() {
  try { speechSynthesis.cancel(); } catch { /* ignore */ }
}

// Reads text only when the grown-up has left auto read-aloud on.
export function narrate(text) {
  if (store.state.settings.autoRead) speak(text);
}
