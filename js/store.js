// App state, saved to this device's localStorage. Storage can be unavailable
// (private browsing, blocked site data), so every access is guarded and the app
// keeps working in memory.

import { DEFAULT_LOOK } from './doll.js';

const KEY = 'dressup-world-tour-v1';

const fresh = () => ({
  kidName: '',
  dollName: '',
  look: JSON.parse(JSON.stringify(DEFAULT_LOOK)),
  scene: 'studio',
  season: 'spring',
  stars: 0,
  trips: {},        // countryId -> { step, done: {stepId: true}, stamp, quizBest, stampedOn }
  words: {},        // 'IN:festival' -> true once learned
  album: [],        // [{ look, scene, season, at }]
  unlocked: [],     // reward item ids
  settings: { level: 1, autoRead: true, sound: true, voice: '' },
  onboarded: false,
  lastStop: null,   // last country flown to (start of the next flight)
  seenMapIntro: false,
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const saved = JSON.parse(raw);
    const base = fresh();
    return { ...base, ...saved, settings: { ...base.settings, ...(saved.settings || {}) } };
  } catch {
    return fresh();
  }
}

const listeners = new Set();

export const store = {
  state: load(),
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* storage full or blocked */ }
    listeners.forEach(fn => fn(this.state));
  },
  update(fn) {
    fn(this.state);
    this.save();
  },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  reset() {
    this.state = fresh();
    this.save();
  },
};

export const addStars = n => store.update(s => { s.stars = Math.max(0, s.stars + n); });
export const trip = id => (store.state.trips[id] = store.state.trips[id] || { done: {} });
export const isUnlocked = itemId => store.state.unlocked.includes(itemId);
export const dollName = () => store.state.dollName || 'Maya';
export const kidName = () => store.state.kidName || 'friend';
