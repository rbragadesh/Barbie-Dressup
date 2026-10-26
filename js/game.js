// Rewards: stars (lifetime score that sets your traveller rank), coins (spent in the
// Boutique), sticker badges and a daily gift. Nothing is ever taken away for missing a
// day: there are no streaks to lose.

import { store } from './store.js';
import { today } from './util.js';
import { COUNTRIES, FOCUS } from './data/countries.js';
import { getItem } from './items.js';

export const RANKS = [
  { min: 0, name: 'Junior Traveller', e: '🎒' },
  { min: 20, name: 'Explorer', e: '🧭' },
  { min: 50, name: 'Adventurer', e: '🗺️' },
  { min: 100, name: 'Globetrotter', e: '🌍' },
  { min: 175, name: 'Jet Setter', e: '✈️' },
  { min: 275, name: 'World Ambassador', e: '🏅' },
  { min: 400, name: 'Legend of the World', e: '👑' },
];

export function rankInfo(stars = store.state.stars) {
  let i = 0;
  while (i + 1 < RANKS.length && stars >= RANKS[i + 1].min) i++;
  const next = RANKS[i + 1] || null;
  const progress = next ? (stars - RANKS[i].min) / (next.min - RANKS[i].min) : 1;
  return { index: i, rank: RANKS[i], next, progress, toNext: next ? next.min - stars : 0 };
}

const stamps = s => COUNTRIES.filter(c => s.trips[c.id]?.stamp).length;
const has = (s, ids) => ids.every(id => s.trips[id]?.stamp);
const visits = s => COUNTRIES.filter(c => s.trips[c.id]?.done?.visit).length;

export function discoveredBeliefs(s = store.state) {
  const set = new Set();
  for (const c of COUNTRIES) if (c.worship && s.trips[c.id]?.done?.visit) c.worship.religions.forEach(r => set.add(r));
  return set;
}

const ownsPet = s => [...s.owned, ...s.unlocked].some(id => getItem(id)?.slot === 'pet');

export const BADGES = [
  { id: 'first-stamp', e: '🛂', name: 'First Stamp', desc: 'Get your first passport stamp', test: s => stamps(s) >= 1 },
  { id: 'five-stamps', e: '🧳', name: 'Frequent Flyer', desc: 'Collect 5 passport stamps', test: s => stamps(s) >= 5 },
  { id: 'home-asia', e: '🏡', name: 'Home Sweet Asia', desc: 'Stamps from India, Korea, Taiwan, Singapore and Bali', test: s => has(s, FOCUS.map(c => c.id)) },
  { id: 'europe', e: '🏰', name: 'Euro Explorer', desc: 'Stamps from the UK, France and Spain', test: s => has(s, ['UK', 'FR', 'ES']) },
  { id: 'all-stamps', e: '🏆', name: 'World Champion', desc: 'Collect every passport stamp', test: s => stamps(s) === COUNTRIES.length },
  { id: 'words-20', e: '📚', name: 'Word Wizard', desc: 'Learn 20 words', test: s => Object.keys(s.words).length >= 20 },
  { id: 'words-50', e: '📖', name: 'Dictionary Star', desc: 'Learn 50 words', test: s => Object.keys(s.words).length >= 50 },
  { id: 'math-25', e: '🧮', name: 'Maths Whiz', desc: 'Get 25 maths questions right first time', test: s => s.stats.math >= 25 },
  { id: 'quiz-25', e: '❓', name: 'Quiz Champ', desc: 'Get 25 quiz questions right first time', test: s => s.stats.quiz >= 25 },
  { id: 'visit-1', e: '🕊️', name: 'Kind Visitor', desc: 'Visit a place of worship respectfully', test: s => visits(s) >= 1 },
  { id: 'visit-5', e: '🤝', name: 'Friend to All', desc: 'Visit 5 places of worship', test: s => visits(s) >= 5 },
  { id: 'beliefs-6', e: '☮️', name: 'Many Beliefs', desc: 'Discover 6 world beliefs', test: s => discoveredBeliefs(s).size >= 6 },
  { id: 'photo-5', e: '📸', name: 'Photographer', desc: 'Take 5 photos', test: s => s.stats.photos >= 5 },
  { id: 'show-1', e: '🎤', name: 'Runway Star', desc: 'Finish a fashion show', test: s => s.stats.shows >= 1 },
  { id: 'show-top', e: '💃', name: 'Supermodel', desc: 'Score 28 or more in a fashion show', test: s => s.stats.bestShow >= 28 },
  { id: 'shopper', e: '🛍️', name: 'Shopper', desc: 'Buy something in the Boutique', test: s => s.owned.length >= 1 },
  { id: 'pet', e: '🐾', name: 'Pet Pal', desc: 'Get a pet', test: ownsPet },
  { id: 'memory', e: '🧠', name: 'Memory Master', desc: 'Win a Memory Match game', test: s => s.stats.memory >= 1 },
  { id: 'packer', e: '🎒', name: 'Super Packer', desc: 'Finish a Suitcase Packing game', test: s => s.stats.suitcase >= 1 },
  { id: 'map', e: '🔎', name: 'Map Detective', desc: 'Finish a Map Quest', test: s => s.stats.mapquest >= 1 },
  { id: 'rainbow', e: '🦄', name: 'Rainbow Hair', desc: 'Try rainbow hair', test: s => s.look.hairColor === 'rainbow' },
  { id: 'gifts-3', e: '🎁', name: 'Lucky Day', desc: 'Open 3 daily gifts', test: s => s.stats.gifts >= 3 },
];
export const BADGE_COINS = 5;

// Anything that should be announced (a badge or a new rank) is passed to the listener.
let announce = () => {};
export const onAnnounce = fn => { announce = fn; };

let checking = false;
export function checkRewards() {
  if (checking) return;
  checking = true;
  try {
    const s = store.state;
    const fresh = BADGES.filter(b => !s.badges.includes(b.id) && b.test(s));
    const r = rankInfo(s.stars);
    const rankUp = r.index > (s.lastRank || 0);
    if (fresh.length || rankUp) {
      store.update(st => {
        fresh.forEach(b => st.badges.push(b.id));
        st.coins += fresh.length * BADGE_COINS;
        if (rankUp) st.lastRank = r.index;
      });
      if (rankUp) announce({ e: r.rank.e, title: `You're now a ${r.rank.name}!`, text: 'Keep exploring to reach the next rank.' });
      fresh.forEach(b => announce({ e: b.e, title: `New sticker: ${b.name}!`, text: `${b.desc}. +${BADGE_COINS} coins` }));
    }
  } finally {
    checking = false;
  }
}

export function addCoins(n) {
  store.update(s => { s.coins = Math.max(0, s.coins + n); });
}

export function bumpStat(key, n = 1) {
  store.update(s => { s.stats[key] = (s.stats[key] || 0) + n; });
}

export const giftReady = () => store.state.lastGift !== today();

export function openGift() {
  const coins = 5 + Math.floor(Math.random() * 8);
  store.update(s => { s.lastGift = today(); s.coins += coins; s.stats.gifts = (s.stats.gifts || 0) + 1; });
  return coins;
}

export function buy(item) {
  const s = store.state;
  if (!item.price || s.owned.includes(item.id) || s.coins < item.price) return false;
  store.update(st => { st.coins -= item.price; st.owned.push(item.id); });
  return true;
}

export const owns = id => store.state.owned.includes(id);

