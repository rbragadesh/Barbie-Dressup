// Fashion-show themes. Each tip is a goal shown in the dressing room; the judges score
// how many tips are met, how well the colours go together, and the extra sparkle.

import { colorFamily } from '../util.js';
import { getItem } from '../items.js';

const id = (L, slot) => L[slot] && L[slot].id;
const anyOf = (L, slot, ids) => ids.includes(id(L, slot));
const CLOTHES = ['top', 'bottom', 'dress', 'outer', 'shoes', 'head', 'scarf', 'socks'];
export const wornColors = L => CLOTHES.filter(s => L[s]).map(s => colorFamily(L[s].color)).filter(Boolean);
const countFamily = (L, fams) => wornColors(L).filter(f => fams.includes(f)).length;
const hasPattern = (L, p) => CLOTHES.some(s => L[s] && L[s].pattern === p);
const warmth = L => CLOTHES.reduce((n, s) => n + ((L[s] && getItem(L[s].id)?.warmth) || 0), 0);

const tip = (tab, icon, text, test) => ({ tab, icon, text, test });

export const THEMES = [
  {
    id: 'pink', e: '🎀', name: 'Pretty in Pink', intro: 'Today\'s theme is Pretty in Pink! Pink, pink and more pink!', palette: ['pink', 'red', 'white'], tab: 'dresses',
    tips: [
      tip('dresses', '👗', 'A pink dress, or a pink top', L => ['dress', 'top'].some(s => L[s] && colorFamily(L[s].color) === 'pink')),
      tip('shoes', '👠', 'Pink shoes', L => L.shoes && colorFamily(L.shoes.color) === 'pink'),
      tip('hair', '💗', 'Pink hair or a pink bow', L => ['pink', 'ombre'].includes(L.hairColor) || (L.head && colorFamily(L.head.color) === 'pink')),
    ],
  },
  {
    id: 'rainbow', e: '🌈', name: 'Rainbow Party', intro: 'Rainbow Party! Wear as many colours as you can!', rainbow: true, tab: 'tops',
    tips: [
      tip('tops', '🎨', 'Wear 4 different colours', L => new Set(wornColors(L)).size >= 4),
      tip('hair', '🌈', 'Rainbow or mermaid hair', L => ['rainbow', 'mermaid', 'ombre'].includes(L.hairColor)),
      tip('jewelry', '📿', 'Rainbow beads', L => anyOf(L, 'necklace', ['beads'])),
    ],
  },
  {
    id: 'royal', e: '👑', name: 'Royal Ball', intro: 'You are invited to the Royal Ball! Be a princess!', palette: ['purple', 'pink', 'white', 'yellow', 'blue'], tab: 'dresses',
    tips: [
      tip('dresses', '👗', 'A ball gown or a galaxy gown', L => anyOf(L, 'dress', ['gown', 'galaxy', 'mermaid'])),
      tip('hats', '👑', 'A tiara or a crown', L => anyOf(L, 'head', ['tiara', 'crown'])),
      tip('jewelry', '💎', 'A necklace and earrings', L => !!(L.necklace && L.earrings)),
      tip('shoes', '👠', 'Sparkly heels or glass slippers', L => anyOf(L, 'shoes', ['heels', 'glassslippers'])),
    ],
  },
  {
    id: 'snow', e: '⛄', name: 'Snow Day', intro: 'Brrr, it\'s a Snow Day! Get cosy and warm!', palette: ['white', 'blue', 'red', 'purple', 'pink'], tab: 'coats',
    tips: [
      tip('coats', '🧥', 'A warm coat', L => anyOf(L, 'outer', ['puffer', 'cardigan', 'raincoat', 'denim'])),
      tip('coats', '🧣', 'A scarf', L => !!L.scarf),
      tip('hats', '🧢', 'A beanie or earmuffs', L => anyOf(L, 'head', ['beanie', 'earmuffs'])),
      tip('shoes', '🥾', 'Snow boots', L => anyOf(L, 'shoes', ['snowboots', 'rainboots'])),
      tip('tops', '🌡️', 'Lots of warm layers', L => warmth(L) >= 8),
    ],
  },
  {
    id: 'beach', e: '🏖️', name: 'Beach Day', intro: 'Beach Day! Sun, sand and sea!', palette: ['yellow', 'blue', 'orange', 'pink', 'white', 'green'], tab: 'dresses',
    tips: [
      tip('dresses', '👙', 'A sundress, or shorts', L => anyOf(L, 'dress', ['sundress']) || anyOf(L, 'bottom', ['shorts'])),
      tip('hats', '👒', 'A sun hat', L => anyOf(L, 'head', ['sunhat'])),
      tip('extras', '🕶️', 'Sunglasses', L => !!L.glasses),
      tip('shoes', '👡', 'Sandals', L => anyOf(L, 'shoes', ['sandals'])),
    ],
  },
  {
    id: 'rainy', e: '☔', name: 'Rainy Day', intro: 'Splish splash, it\'s a Rainy Day!', palette: ['yellow', 'blue', 'red', 'green'], tab: 'coats',
    tips: [
      tip('coats', '🧥', 'A raincoat', L => anyOf(L, 'outer', ['raincoat'])),
      tip('extras', '☂️', 'An umbrella', L => anyOf(L, 'prop', ['umbrella'])),
      tip('shoes', '🥾', 'Rain boots', L => anyOf(L, 'shoes', ['rainboots'])),
    ],
  },
  {
    id: 'garden', e: '🌷', name: 'Garden Party', intro: 'Garden Party! Flowers everywhere!', palette: ['pink', 'green', 'yellow', 'white', 'purple'], tab: 'dresses',
    tips: [
      tip('dresses', '🌸', 'Something with a flower pattern', L => hasPattern(L, 'floral')),
      tip('hats', '🌼', 'A flower crown or frangipani flowers', L => anyOf(L, 'head', ['flowercrown', 'frangipani', 'flamencoflower'])),
      tip('extras', '💐', 'A bouquet of flowers', L => anyOf(L, 'prop', ['bouquet'])),
    ],
  },
  {
    id: 'sparkle', e: '✨', name: 'Super Sparkly', intro: 'Super Sparkly night! Make everything shine!', palette: ['purple', 'pink', 'blue', 'white', 'yellow'], tab: 'dresses',
    tips: [
      tip('dresses', '✨', 'Something with a sparkle or star pattern', L => hasPattern(L, 'sparkle') || hasPattern(L, 'stars')),
      tip('face', '💫', 'Glitter cheeks', L => !!(L.makeup && L.makeup.glitter)),
      tip('extras', '⭐', 'Wings or a star wand', L => !!L.back || anyOf(L, 'prop', ['wand'])),
      tip('nails', '💅', 'Glitter or star nails', L => ['glitter', 'stars'].includes(L.nailArt)),
    ],
  },
  {
    id: 'ocean', e: '🌊', name: 'Under the Sea', intro: 'Under the Sea! Be as blue as the ocean!', palette: ['blue', 'green', 'purple', 'white'], tab: 'dresses',
    tips: [
      tip('dresses', '🧜‍♀️', 'A blue or green outfit', L => countFamily(L, ['blue', 'green']) >= 2),
      tip('hair', '💙', 'Blue, teal or mermaid hair', L => ['blue', 'teal', 'mermaid'].includes(L.hairColor)),
      tip('jewelry', '🐚', 'Pearls', L => anyOf(L, 'necklace', ['pearls']) || anyOf(L, 'earrings', ['pearldrops'])),
    ],
  },
  {
    id: 'world', e: '🌏', name: 'Around the World', intro: 'Around the World! Wear an outfit from a country you love!', tab: 'world',
    tips: [
      tip('world', '🌏', 'A traditional outfit', L => !!(L.dress && (getItem(L.dress.id)?.tags || []).includes('traditional'))),
      tip('jewelry', '💍', 'Jewellery to match', L => !!(L.necklace || L.earrings || L.bracelet)),
      tip('extras', '🪭', 'Something to hold', L => !!L.prop),
    ],
  },
  {
    id: 'festival', e: '🪔', name: 'Festival of Lights', intro: 'Festival of Lights! Dress up for Diwali!', palette: ['red', 'pink', 'yellow', 'orange', 'green', 'purple'], tab: 'world',
    tips: [
      tip('world', '👗', 'A saree, lehenga, pattu pavadai or anarkali', L => anyOf(L, 'dress', ['saree', 'lehenga', 'pavadai', 'anarkali'])),
      tip('jewelry', '💫', 'Bangles or jhumkas', L => anyOf(L, 'bracelet', ['bangles']) || anyOf(L, 'earrings', ['jhumka'])),
      tip('nails', '🌿', 'Mehndi on your hands', L => !!L.mehndi),
      tip('extras', '✨', 'A sparkler or a lantern', L => anyOf(L, 'prop', ['sparkler', 'lantern'])),
    ],
  },
  {
    id: 'pets', e: '🐾', name: 'Pet Parade', intro: 'Pet Parade! Bring your pet friend!', needsPet: true, tab: 'pets',
    tips: [
      tip('pets', '🐾', 'Bring a pet', L => !!L.pet),
      tip('hats', '🎀', 'A cute headband, ears or a bow', L => anyOf(L, 'head', ['bow', 'headband', 'kittyears', 'bunnyears', 'unicornband'])),
      tip('dresses', '🎨', 'Colours that match your pet', L => !!L.pet && wornColors(L).includes(colorFamily(L.pet.color))),
    ],
  },
];

export const getTheme = tid => THEMES.find(t => t.id === tid) || THEMES[0];

const sparkleCount = L => {
  let n = ['necklace', 'earrings', 'bracelet', 'ring', 'head', 'glasses', 'prop', 'back', 'pet'].filter(s => L[s]).length;
  const m = L.makeup || {};
  n += ['lips', 'shadow', 'art', 'bindi'].filter(k => m[k]).length + (m.glitter ? 1 : 0);
  if ((L.nails || []).some(Boolean)) n += 1;
  if (L.nailArt && L.nailArt !== 'plain') n += 1;
  if (L.mehndi) n += 1;
  return n;
};

// Three judges, each scoring 5 to 10 (kind judges: nobody scores below 5).
export function judge(theme, L) {
  const met = theme.tips.filter(t => t.test(L)).length;
  const themeScore = 5 + Math.round((5 * met) / theme.tips.length);
  const fams = wornColors(L);
  let colourScore;
  if (theme.rainbow) colourScore = Math.min(10, 5 + new Set(fams).size);
  else if (theme.palette && fams.length) colourScore = 5 + Math.round((5 * fams.filter(f => theme.palette.includes(f)).length) / fams.length);
  else { const d = new Set(fams).size; colourScore = d <= 3 ? 10 : d === 4 ? 8 : 7; }
  const sparkle = Math.min(10, 5 + Math.round(sparkleCount(L) / 2));
  return [
    { who: '🦄', name: 'Luna the Unicorn', what: 'Theme', score: themeScore },
    { who: '🐼', name: 'Bao the Panda', what: 'Colours', score: colourScore },
    { who: '🦊', name: 'Fifi the Fox', what: 'Sparkle', score: sparkle },
  ];
}

export const COMMENTS = {
  10: ['Perfect! A ten!', 'Absolutely fabulous!', 'Wow, wow, WOW!'],
  9: ['Gorgeous!', 'So stylish!', 'I love it!'],
  8: ['Very pretty!', 'Great look!', 'Lovely!'],
  7: ['Nice job!', 'Looking good!', 'Cute!'],
  6: ['Good try!', 'Fun look!', 'Nice!'],
  5: ['Brave choice!', 'Interesting!', 'I like your style!'],
};
