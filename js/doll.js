// SVG doll renderer. Coordinates live in a 400 x 800 box; the doll faces forward
// with arms slightly away from the body so sleeves, bangles and nails show.
// Left-side limbs are drawn once and mirrored for the right side.

import { shade } from './util.js';
import { mirror, both, flower, star, sparkle } from './svg.js';
import { getItem, WEAR_SLOTS } from './items.js';

export { mirror, both };

export const VIEW = { w: 400, h: 800 };

export const SKIN_TONES = [
  { id: 'porcelain', name: 'Porcelain', c: '#fbe3d3' },
  { id: 'peach', name: 'Peach', c: '#f6cfb2' },
  { id: 'golden', name: 'Golden', c: '#e8b48a' },
  { id: 'tan', name: 'Tan', c: '#cf9467' },
  { id: 'caramel', name: 'Caramel', c: '#b07856' },
  { id: 'brown', name: 'Brown', c: '#a86b45' },
  { id: 'deep', name: 'Deep', c: '#77452b' },
];

export const HAIR_COLORS = [
  { id: 'black', name: 'Black', c: '#221b1f' },
  { id: 'darkbrown', name: 'Dark brown', c: '#3f2619' },
  { id: 'brown', name: 'Brown', c: '#734426' },
  { id: 'auburn', name: 'Auburn', c: '#953f1d' },
  { id: 'blonde', name: 'Blonde', c: '#e9c56c' },
  { id: 'platinum', name: 'Platinum', c: '#f3e8c8' },
  { id: 'pink', name: 'Pink', c: '#f58fb6' },
  { id: 'purple', name: 'Purple', c: '#9a69d8' },
  { id: 'blue', name: 'Blue', c: '#5b9cec' },
  { id: 'teal', name: 'Teal', c: '#25b2a3' },
  { id: 'silver', name: 'Silver', c: '#c9cdd8' },
  { id: 'rainbow', name: 'Rainbow', c: '#f58fb6', grad: ['#ff6b8b', '#ffb547', '#ffe45c', '#6fdc8c', '#5bb6ff', '#a77cff'] },
  { id: 'ombre', name: 'Pink ombre', c: '#3f2619', grad: ['#3f2619', '#3f2619', '#c45f9a', '#ff9cc9'] },
  { id: 'mermaid', name: 'Mermaid', c: '#25b2a3', grad: ['#5b9cec', '#25b2a3', '#9a69d8'] },
];

export const EYE_COLORS = [
  { id: 'brown', name: 'Brown', c: '#6b3b1f' },
  { id: 'dark', name: 'Dark brown', c: '#3a2216' },
  { id: 'hazel', name: 'Hazel', c: '#8a6a2e' },
  { id: 'green', name: 'Green', c: '#3f9a5a' },
  { id: 'blue', name: 'Blue', c: '#3d82d6' },
  { id: 'gray', name: 'Gray', c: '#7d8796' },
  { id: 'violet', name: 'Violet', c: '#8a5ad6' },
];

export const HAIR_STYLES = [
  { id: 'long', name: 'Long & straight' },
  { id: 'wavy', name: 'Long & wavy' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'braids', name: 'Two braids' },
  { id: 'sidebraid', name: 'Side braid' },
  { id: 'bun', name: 'Top bun' },
  { id: 'spacebuns', name: 'Space buns' },
  { id: 'pigtails', name: 'Pigtails' },
  { id: 'curly', name: 'Curly' },
  { id: 'bob', name: 'Bob' },
  { id: 'crownbraids', name: 'Crown braids' },
];

// The doll starts out looking like the player: crown braids, kajal, a little black bindi,
// a gap-tooth grin and her favourite plum sequin jumpsuit with a bow bolero.
export const MY_LOOK = {
  skin: 'caramel',
  eyes: 'dark',
  hairStyle: 'crownbraids',
  hairColor: 'black',
  top: null,
  bottom: null,
  dress: { id: 'sequinjumpsuit', color: '#4a1e35', pattern: 'sequins', patternColor: '#c27a9e' },
  outer: { id: 'bolero', color: '#4a1e35', accent: '#7a3558', pattern: 'sequins', patternColor: '#c27a9e' },
  shoes: { id: 'maryjanes', color: '#5a2c45', accent: '#ecd9e3' },
  makeup: { lips: '#d48a95', shadow: null, blush: null, lashes: true, bindi: 'small', art: null, glitter: false, kajal: true, smile: 'grin' },
  nails: ['#f6d6df', '#f6d6df', '#f6d6df', '#f6d6df', '#f6d6df'],
  nailArt: 'plain',
  mehndi: false,
};

export const DEFAULT_LOOK = MY_LOOK;

export const skinColor = id => (SKIN_TONES.find(s => s.id === id) || SKIN_TONES[2]).c;
const hairInfo = id => HAIR_COLORS.find(h => h.id === id) || HAIR_COLORS[0];
const eyeColor = id => (EYE_COLORS.find(e => e.id === id) || EYE_COLORS[0]).c;

// ---------- Patterns ----------

export const PATTERNS = [
  { id: 'solid', name: 'Plain' },
  { id: 'dots', name: 'Polka dots' },
  { id: 'stripes', name: 'Stripes' },
  { id: 'floral', name: 'Flowers' },
  { id: 'hearts', name: 'Hearts' },
  { id: 'stars', name: 'Stars' },
  { id: 'checks', name: 'Checks' },
  { id: 'paisley', name: 'Paisley' },
  { id: 'sparkle', name: 'Sparkle' },
  { id: 'sequins', name: 'Sequins' },
];

function motifColor(c) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 165 ? shade(c, -0.35) : shade(c, 0.7);
}

function patternDef(id, pattern, c, accent) {
  const m = accent && accent !== c ? accent : motifColor(c);
  const open = (w, h) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${c}"/>`;
  switch (pattern) {
    case 'dots':
      return open(16, 16) + `<circle cx="4" cy="4" r="2.6" fill="${m}"/><circle cx="12" cy="12" r="2.6" fill="${m}"/></pattern>`;
    case 'stripes':
      return open(14, 14) + `<rect y="0" width="14" height="5" fill="${m}"/></pattern>`;
    case 'floral':
      return open(28, 28) + flower(8, 8, m, '#ffd84a') + flower(22, 21, m, '#ffd84a') + `</pattern>`;
    case 'hearts':
      return open(22, 22) + `<path d="M6 8c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z" fill="${m}"/><path d="M17 19c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z" fill="${m}"/></pattern>`;
    case 'stars':
      return open(24, 24) + star(6, 6, 4, m) + star(18, 17, 3.2, m) + `</pattern>`;
    case 'checks':
      return open(16, 16) + `<rect width="8" height="16" fill="${m}" opacity=".45"/><rect width="16" height="8" fill="${m}" opacity=".45"/></pattern>`;
    case 'paisley':
      return open(30, 30) + `<path d="M8 20c-5-3-4-12 3-12 5 0 6 7 2 9-2 1-1 4 2 5-3 1-5 0-7-2z" fill="${m}"/><circle cx="10" cy="12" r="1.6" fill="${c}"/><circle cx="23" cy="6" r="1.8" fill="${m}"/><circle cx="25" cy="24" r="1.4" fill="${m}"/></pattern>`;
    case 'sequins':
      return open(10, 10) + `<circle cx="2.5" cy="2.5" r="1.5" fill="${m}" opacity=".9"/><circle cx="7.5" cy="4.2" r="1.2" fill="${shade(m, 0.3)}" opacity=".8"/><circle cx="4.2" cy="7.8" r="1.4" fill="${m}" opacity=".7"/><circle cx="9" cy="9" r=".9" fill="${shade(m, 0.45)}"/><circle cx="2" cy="2" r=".5" fill="#fff" opacity=".8"/></pattern>`;
    case 'sparkle':
      return open(20, 20) + sparkle(5, 5, 3, '#fff') + sparkle(15, 13, 2.2, '#fff8c4') + `<circle cx="14" cy="4" r=".9" fill="#fff"/><circle cx="4" cy="16" r=".9" fill="#fff"/></pattern>`;
    default:
      return '';
  }
}

// ---------- Body ----------

const P = {
  torso: 'M186 246C172 254 152 254 141 262C132 270 134 292 138 316C143 348 158 372 161 398C158 420 149 438 148 460L252 460C251 438 242 420 239 398C242 372 257 348 262 316C266 292 268 270 259 262C248 254 228 254 214 246Z',
  neck: 'M184 200L184 252Q200 259 216 252L216 200Z',
  legL: 'M150 452C149 520 157 580 163 625C167 670 169 710 171 746L187 746C187 705 189 665 192 625C197 580 201 520 201 462Z',
  footL: 'M170 744C165 754 164 764 170 768C176 771 186 770 189 766C191 758 189 750 187 744Z',
  armL: 'M146 258C132 262 126 280 124 304C121 340 116 400 109 462L127 465C133 410 140 360 144 330C146 316 150 304 153 296Z',
  palmL: 'M107 458C104 470 104 480 106 489L130 489C132 480 132 470 129 459Z',
  thumbL: 'M127 466C134 470 137 478 136 486C135 489 131 489 130 486C130 481 128 477 125 475Z',
  face: 'M142 138C142 100 168 80 200 80C232 80 258 100 258 138C258 178 241 205 223 215C212 222 188 222 177 215C159 205 142 178 142 138Z',
};

// Fingers of the left hand (viewer's left): [x, y, w, h], pinky to index.
export const FINGERS_L = [[105.4, 484, 5.4, 12], [110.8, 485, 5.6, 15], [116.4, 486, 5.6, 16.5], [122, 485, 5.6, 14.5]];
export const THUMB_NAIL_L = [133.4, 483.6];

function handL(skin, nails, art, mehndi) {
  const sd = shade(skin, -0.18);
  let s = `<path d="${P.palmL}" fill="${skin}"/>`;
  s += FINGERS_L.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${skin}" stroke="${sd}" stroke-width=".5"/>`).join('');
  s += `<path d="${P.thumbL}" fill="${skin}" stroke="${sd}" stroke-width=".5"/>`;
  if (mehndi) {
    const hn = '#9a3b16';
    s += `<g fill="none" stroke="${hn}" stroke-width=".7" opacity=".85"><circle cx="117" cy="472" r="4.2"/><circle cx="117" cy="472" r="1.6" fill="${hn}"/><path d="M109 463q8 3 16 0M110 481q7 3 14 0"/></g>`;
    s += FINGERS_L.map(([x, y, w]) => `<path d="M${x + 1} ${y + 3}h${w - 2}M${x + 1} ${y + 6}h${w - 2}" stroke="${hn}" stroke-width=".6"/>`).join('');
  }
  if (nails) {
    const tips = FINGERS_L.map(([x, y, w, h]) => [x + w / 2, y + h - 3]);
    tips.push(THUMB_NAIL_L);
    // nails[] is ordered thumb, index, middle, ring, pinky (as on the nail-studio hand)
    const order = [4, 3, 2, 1, 0];
    s += tips.map(([cx, cy], i) => {
      const col = nails[order[i]] || null;
      if (!col) return '';
      return `<ellipse cx="${cx}" cy="${cy}" rx="2.1" ry="2.6" fill="${col}"/>` + (art && art !== 'plain' ? `<circle cx="${cx}" cy="${cy}" r=".8" fill="#fff" opacity=".9"/>` : '');
    }).join('');
  }
  return s;
}

function body(skin, look) {
  const sd = shade(skin, -0.15);
  const legs = both(`<path d="${P.legL}" fill="${skin}"/><path d="${P.footL}" fill="${skin}"/><path d="M178 628q6 4 10 0" stroke="${sd}" stroke-width="1.2" fill="none"/>`);
  return legs +
    `<path d="${P.torso}" fill="${skin}"/>` +
    `<path d="${P.neck}" fill="${skin}"/>` +
    `<path d="M184 212Q200 232 216 212L216 226Q200 238 184 226Z" fill="${sd}" opacity=".55"/>` +
    // simple camisole + shorts so the doll is always dressed underneath
    `<path d="M150 300C160 294 170 292 176 300C186 306 214 306 224 300C230 292 240 294 250 300C252 340 244 372 240 398L160 398C156 372 148 340 150 300Z" fill="#fdf4fb" stroke="#f1d9ea" stroke-width="1.5"/>` +
    `<path d="M164 300L170 266M236 300L230 266" stroke="#f1d9ea" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M160 396L240 396C246 420 252 446 254 482L206 486L200 470L194 486L146 482C148 446 154 420 160 396Z" fill="#f6e9f6" stroke="#ead3ea" stroke-width="1.5"/>`;
}

function arms(skin, look) {
  const nailCols = look.nails;
  const handsL = handL(skin, nailCols, look.nailArt, look.mehndi);
  return both(`<path d="${P.armL}" fill="${skin}"/><path d="M128 368q-3 6 0 10" stroke="${shade(skin, -0.12)}" stroke-width="1" fill="none"/>${handsL}`);
}

// ---------- Face ----------

function face(skin, look, expr, hairC) {
  const m = look.makeup || {};
  const sd = shade(skin, -0.2);
  const eye = eyeColor(look.eyes);
  const brow = shade(hairC, -0.15);
  let s = both(`<ellipse cx="141" cy="150" rx="8" ry="13" fill="${skin}"/><path d="M139 144q-4 6 1 12" stroke="${sd}" stroke-width="1.3" fill="none"/>`);
  s += `<path d="${P.face}" fill="${skin}"/>`;

  // eyeshadow sits under the eye whites
  if (m.shadow) s += both(`<path d="M163 147Q178 125 194 146Q178 136 163 147Z" fill="${m.shadow}" opacity=".75"/>`);

  const shut = expr === 'blink';
  const oneEye = shut
    ? `<path d="M166 151Q178 158 190 151" stroke="#3a2a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="178" cy="151" rx="11.5" ry="13" fill="#fff"/>` +
      `<circle cx="178" cy="153" r="9" fill="${eye}"/>` +
      `<circle cx="178" cy="153" r="9" fill="none" stroke="${shade(eye, -0.35)}" stroke-width="1.6"/>` +
      `<circle cx="178" cy="154" r="4.6" fill="#1a1414"/>` +
      `<circle cx="181" cy="149" r="2.9" fill="#fff"/><circle cx="175" cy="157" r="1.3" fill="#fff"/>` +
      `<path d="M165.5 148Q178 134 190.5 148" stroke="#2a1e1e" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
      (m.lashes !== false ? `<path d="M166 147l-5-3M168 143.5l-4-4.5M171 140.8l-2.5-5" stroke="#2a1e1e" stroke-width="1.8" stroke-linecap="round"/>` : '') +
      // kajal: a thick lined eye with a little wing, popular in India
      (m.kajal ? `<path d="M165 148Q178 133.5 191 148" stroke="#111" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M166 148.5L158.5 145" stroke="#111" stroke-width="2.6" stroke-linecap="round"/><path d="M167.5 159Q178 166 189 159" stroke="#1d1416" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : '');
  // eyelid used for the blink animation (scaled from the top in CSS)
  const lid = shut ? '' : `<ellipse class="lid" cx="178" cy="151" rx="12.5" ry="14" fill="${skin}" style="transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)"/>`;
  s += both(oneEye + lid);
  s += both(`<path d="M164 127Q177 119 192 125" stroke="${brow}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`);
  s += `<path d="M199 166Q201 174 204 172" stroke="${sd}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;

  if (m.blush) s += both(`<ellipse cx="164" cy="178" rx="11" ry="7" fill="${m.blush}" opacity=".45"/>`);
  if (expr === 'cold') s += both(`<ellipse cx="164" cy="178" rx="11" ry="7" fill="#7fb6ff" opacity=".45"/>`);

  const lip = m.lips || shade(skin, -0.28).replace(/^#/, '#');
  if (m.smile === 'grin' && (expr === 'smile' || expr === 'happy')) {
    // big grin with the two top front teeth missing
    s += `<path d="M185 186Q200 189 215 186Q213 202 200 203Q187 202 185 186Z" fill="#6d2433"/>` +
      `<path d="M187.5 187.4Q200 190 212.5 187.4L211.8 191.6Q200 193.6 188.2 191.6Z" fill="#fff"/>` +
      `<path d="M197.3 188.6H202.7V192.6H197.3Z" fill="#6d2433"/>` +
      `<path d="M193 188.6v3.4M207 188.6v3.4" stroke="#e6dada" stroke-width=".7"/>` +
      `<path d="M192 199Q200 195.5 208 199Q200 202.5 192 199Z" fill="#e8738a"/>` +
      `<path d="M185 186Q200 189 215 186Q213 202 200 203Q187 202 185 186Z" fill="none" stroke="${lip}" stroke-width="2.2" stroke-linejoin="round"/>`;
  } else if (expr === 'wow') {
    s += `<ellipse cx="200" cy="193" rx="7" ry="8.5" fill="#7a2d3a"/><ellipse cx="200" cy="193" rx="7" ry="8.5" fill="none" stroke="${lip}" stroke-width="3"/>`;
  } else if (expr === 'happy') {
    s += `<path d="M184 186Q200 186 216 186Q214 204 200 205Q186 204 184 186Z" fill="#7a2d3a"/><path d="M186 187Q200 188 214 187L213 191Q200 193 187 191Z" fill="#fff"/><path d="M184 186Q200 186 216 186Q214 204 200 205Q186 204 184 186Z" fill="none" stroke="${lip}" stroke-width="2.6" stroke-linejoin="round"/>`;
  } else if (expr === 'cold') {
    s += `<path d="M186 192q3.5-4 7 0t7 0 7 0 7 0" stroke="${lip}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  } else {
    s += `<path d="M188 188Q194 185 200 187.5Q206 185 212 188Q200 191 188 188Z" fill="${lip}"/>`;
    s += `<path d="M187 188.5Q200 191.5 213 188.5Q200 202 187 188.5Z" fill="${lip}"/>`;
    s += `<path d="M190 195Q200 198 210 195" stroke="#fff" stroke-width="1" opacity=".35" fill="none"/>`;
  }

  if (m.bindi) s += bindi(m.bindi);
  if (m.art) s += faceArt(m.art);
  if (m.glitter) s += both(`<circle cx="160" cy="170" r="1.1" fill="#fff"/><circle cx="166" cy="166" r=".9" fill="#ffe68a"/><circle cx="170" cy="172" r="1" fill="#fff"/><circle cx="156" cy="176" r=".8" fill="#ffe68a"/>`);
  return s;
}

function bindi(kind) {
  switch (kind) {
    case 'small':
      return `<circle cx="200" cy="131" r="2.3" fill="#1a1416"/>`;
    case 'jewel':
      return `<circle cx="200" cy="129" r="3.8" fill="#d6224f"/><circle cx="200" cy="129" r="3.8" fill="none" stroke="#f2c14e" stroke-width="1.2"/><circle cx="199" cy="128" r="1" fill="#fff"/>`;
    case 'drop':
      return `<path d="M200 123Q204 130 200 134Q196 130 200 123Z" fill="#c2185b"/><circle cx="200" cy="121" r="1.1" fill="#f2c14e"/>`;
    case 'star':
      return star(200, 129, 4, '#f2c14e');
    default:
      return `<circle cx="200" cy="129" r="3.2" fill="#c8102e"/>`;
  }
}

function faceArt(kind) {
  const x = 238, y = 180;
  switch (kind) {
    case 'heart': return `<path d="M${x} ${y + 4}l-5-5c-3-3 1-7 5-3 4-4 8 0 5 3z" fill="#ff4f8b"/>`;
    case 'star': return star(x, y, 6, '#ffc93c');
    case 'flower': return flower(x, y, '#ff8fc8', '#ffe066', 3.2);
    case 'rainbow': return `<g fill="none" stroke-width="2"><path d="M${x - 8} ${y + 4}a8 8 0 0 1 16 0" stroke="#ff5a5a"/><path d="M${x - 5.8} ${y + 4}a5.8 5.8 0 0 1 11.6 0" stroke="#ffc93c"/><path d="M${x - 3.6} ${y + 4}a3.6 3.6 0 0 1 7.2 0" stroke="#4fc3f7"/></g>`;
    case 'butterfly': return `<g fill="#b388ff"><ellipse cx="${x - 3.5}" cy="${y - 2}" rx="4" ry="5" transform="rotate(-25 ${x - 3.5} ${y - 2})"/><ellipse cx="${x + 3.5}" cy="${y - 2}" rx="4" ry="5" transform="rotate(25 ${x + 3.5} ${y - 2})"/><ellipse cx="${x - 2.5}" cy="${y + 3.5}" rx="2.6" ry="3" fill="#ff8fc8"/><ellipse cx="${x + 2.5}" cy="${y + 3.5}" rx="2.6" ry="3" fill="#ff8fc8"/></g><rect x="${x - .7}" y="${y - 5}" width="1.4" height="11" rx=".7" fill="#5b3a29"/>`;
    default: return '';
  }
}

// ---------- Hair ----------

function braid(x, y0, y1, w, fill, line) {
  let s = '';
  const step = w * 0.85;
  for (let y = y0, i = 0; y < y1; y += step, i++) {
    const off = i % 2 ? 1.5 : -1.5;
    s += `<ellipse cx="${x + off}" cy="${y}" rx="${w / 2}" ry="${step * 0.68}" fill="${fill}" stroke="${line}" stroke-width="1.2"/>`;
  }
  return s;
}

function hair(style, fill, base) {
  const line = shade(base, -0.28);
  const hl = shade(base, 0.25);
  const cap = `<path d="M137 152C126 96 160 62 200 62C240 62 274 96 263 152C258 128 250 112 238 102C226 116 196 120 172 106C158 118 146 132 137 152Z" fill="${fill}"/>`;
  const capPart = `<path d="M137 150C127 96 160 62 200 62C240 62 273 96 263 150C258 124 248 106 232 96C220 104 210 100 200 84C190 100 180 104 168 96C152 106 142 124 137 150Z" fill="${fill}"/>`;
  const shine = `<path d="M168 76Q200 64 228 74" stroke="${hl}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>`;
  const strands = `<path d="M172 106Q160 116 150 136M238 102Q252 114 258 136" stroke="${line}" stroke-width="1.4" fill="none" opacity=".6"/>`;
  switch (style) {
    case 'wavy':
      return {
        back: `<path d="M140 110C112 170 128 210 114 260C102 310 126 340 116 390C136 420 170 420 186 412L214 412C232 420 266 420 284 390C274 340 298 310 286 260C272 210 288 170 260 110Z" fill="${fill}"/><path d="M128 300q12 30 0 60M272 300q-12 30 0 60" stroke="${line}" stroke-width="1.5" fill="none" opacity=".6"/>`,
        front: cap + shine + strands + both(`<path d="M139 140C126 180 140 210 130 250C124 280 140 300 136 330L154 322C156 296 146 274 150 246C156 210 146 176 152 140Z" fill="${fill}"/>`),
      };
    case 'ponytail':
      return {
        back: `<path d="M226 74C292 84 302 190 276 300C270 330 256 344 252 330C266 260 264 160 214 96Z" fill="${fill}"/><path d="M262 140q12 70 0 150" stroke="${line}" stroke-width="1.5" fill="none" opacity=".6"/>`,
        front: `<path d="M138 150C128 96 160 62 200 62C240 62 272 96 262 150C258 118 238 92 200 90C164 92 144 116 138 150Z" fill="${fill}"/>` + shine +
          `<path d="M150 104Q176 90 200 90M250 104Q226 90 200 90" stroke="${line}" stroke-width="1.3" fill="none" opacity=".6"/><ellipse cx="228" cy="76" rx="9" ry="6" fill="#ff5fa2" transform="rotate(25 228 76)"/>`,
      };
    case 'braids':
      return {
        back: `<path d="M140 120C132 160 134 190 142 210L258 210C266 190 268 160 260 120Z" fill="${fill}"/>`,
        front: capPart + shine + both(`<path d="M138 146C136 170 142 186 152 196L160 186C150 176 146 162 148 144Z" fill="${fill}"/>` + braid(152, 204, 392, 20, fill, line) + `<path d="M144 396l8 6 8-6-8-4z" fill="#ff5fa2"/><path d="M150 400q-4 14 -2 22M154 400q4 14 2 22" stroke="${fill}" stroke-width="3" stroke-linecap="round"/>`),
      };
    case 'sidebraid':
      return {
        back: `<path d="M140 120C132 160 134 190 142 210L258 210C266 190 268 160 260 120Z" fill="${fill}"/>`,
        front: cap + shine + strands + `<path d="M138 146C134 172 140 188 150 198L162 190C150 178 146 162 150 142Z" fill="${fill}"/>` + braid(156, 206, 400, 22, fill, line) + `<circle cx="156" cy="404" r="6" fill="#ffd84a"/>`,
      };
    case 'bun':
      return {
        back: '',
        front: `<circle cx="200" cy="58" r="30" fill="${fill}"/><path d="M180 52q20-18 40 0q-20 10-40 0" stroke="${line}" stroke-width="1.6" fill="none" opacity=".6"/>` +
          `<path d="M138 150C128 96 160 72 200 72C240 72 272 96 262 150C258 118 238 96 200 94C164 96 144 116 138 150Z" fill="${fill}"/>` +
          `<path d="M140 142q-6 18 2 30M260 142q6 18 -2 30" stroke="${fill}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
          `<path d="M152 104Q176 92 200 94M248 104Q224 92 200 94" stroke="${line}" stroke-width="1.3" fill="none" opacity=".6"/><rect x="176" y="80" width="48" height="7" rx="3.5" fill="#ff5fa2"/>`,
      };
    case 'spacebuns':
      return {
        back: '',
        front: both(`<circle cx="160" cy="76" r="24" fill="${fill}"/><path d="M146 72q14-14 28 0" stroke="${line}" stroke-width="1.5" fill="none" opacity=".6"/>`) + capPart + shine,
      };
    case 'pigtails':
      return {
        back: both(`<path d="M146 112C110 110 92 150 98 200C102 232 112 262 126 270C118 236 118 206 128 180C136 160 146 146 150 136Z" fill="${fill}"/><path d="M110 170q-4 40 12 80" stroke="${line}" stroke-width="1.5" fill="none" opacity=".6"/>`),
        front: capPart + shine + both(`<circle cx="146" cy="116" r="7" fill="#7ed957"/><circle cx="146" cy="116" r="3" fill="#fff" opacity=".6"/>`),
      };
    case 'curly': {
      let back = '';
      const ring = [[150, 110, 30], [250, 110, 30], [130, 160, 28], [270, 160, 28], [124, 210, 26], [276, 210, 26], [132, 254, 24], [268, 254, 24], [150, 286, 22], [250, 286, 22], [200, 80, 40], [168, 86, 30], [232, 86, 30]];
      back = ring.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('') + ring.map(([x, y, r]) => `<path d="M${x - r * 0.4} ${y}a${r * 0.4} ${r * 0.4} 0 1 1 ${r * 0.5} ${r * 0.3}" stroke="${line}" stroke-width="1.4" fill="none" opacity=".5"/>`).join('');
      const bangs = [[158, 98, 16], [180, 90, 17], [204, 88, 18], [228, 92, 17], [248, 104, 15], [146, 118, 13], [256, 122, 12]];
      const front = bangs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('') + bangs.map(([x, y, r]) => `<path d="M${x - r * 0.4} ${y}a${r * 0.4} ${r * 0.4} 0 1 1 ${r * 0.5} ${r * 0.3}" stroke="${line}" stroke-width="1.3" fill="none" opacity=".5"/>`).join('');
      return { back, front };
    }
    case 'crownbraids': {
      // Two braids run back from a centre parting along the hairline, with loose wisps by the face.
      const bez = (p0, p1, p2, p3, n) => Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n;
        const u = 1 - t;
        return [0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
      });
      const braidFill = shade(base, 0.07);
      const along = (pts, w) => pts.slice(0, -1).map(([x1, y1], i) => {
        const [x2, y2] = pts[i + 1];
        const cx = ((x1 + x2) / 2).toFixed(1);
        const cy = ((y1 + y2) / 2).toFixed(1);
        const ang = (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + (i % 2 ? 22 : -22)).toFixed(1);
        const rx = (Math.hypot(x2 - x1, y2 - y1) * 0.72).toFixed(1);
        return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${w / 2}" transform="rotate(${ang} ${cx} ${cy})" fill="${braidFill}" stroke="${line}" stroke-width="1.1"/>`;
      }).join('');
      const cap = `<path d="M137 150C127 96 160 62 200 62C240 62 273 96 263 150C258 120 246 98 226 90C214 86 206 84 200 82C194 84 186 86 174 90C154 98 142 120 137 150Z" fill="${fill}"/>`;
      const wisp = `<g fill="none" stroke="${fill}" stroke-width="2.2" stroke-linecap="round"><path d="M146 130C139 152 151 170 145 190C142 202 150 210 146 222"/><path d="M152 126C148 142 156 154 152 170"/></g>`;
      return {
        back: `<path d="M140 128C132 150 136 172 146 184L254 184C264 172 268 150 260 128Z" fill="${fill}"/>`,
        front: cap + `<path d="M200 64V82" stroke="${line}" stroke-width="1.6" opacity=".7"/>` + both(along(bez([197, 66], [176, 60], [150, 72], [140, 120], 9), 9)) + wisp + mirror(`<g fill="none" stroke="${fill}" stroke-width="2" stroke-linecap="round"><path d="M147 132C142 150 149 162 146 178"/></g>`),
      };
    }
    case 'bob':
      return {
        back: `<path d="M134 120C126 160 128 200 132 222L268 222C272 200 274 160 266 120Z" fill="${fill}"/>`,
        front: `<path d="M136 160C124 96 160 62 200 62C240 62 276 96 264 160L264 222L246 222C252 196 254 166 250 140C246 126 240 118 236 116L164 116C160 118 154 126 150 140C146 166 148 196 154 222L136 222Z" fill="${fill}"/>` + shine +
          `<path d="M170 116v-8M190 116v-10M210 116v-10M230 116v-8" stroke="${line}" stroke-width="1.2" opacity=".5"/>`,
      };
    case 'long':
    default:
      return {
        back: `<path d="M140 110C118 170 122 300 126 420C150 434 250 434 274 420C278 300 282 170 260 110Z" fill="${fill}"/><path d="M140 300v100M260 300v100" stroke="${line}" stroke-width="1.5" opacity=".5"/>`,
        front: cap + shine + strands + both(`<path d="M139 140C128 190 132 260 138 330L156 324C150 260 148 190 153 140Z" fill="${fill}"/>`),
      };
  }
}

// ---------- Compose ----------

function paintCtx(uid, slot, worn, item, defs) {
  const c = worn.color || item.color || '#ff8fc8';
  const a = worn.accent || item.accent || '#f2c14e';
  const pat = worn.pattern || 'solid';
  let fill = c;
  if (pat !== 'solid' && item.patternable !== false) {
    const id = `${uid}-p-${slot}`;
    defs.push(patternDef(id, pat, c, worn.patternColor));
    fill = `url(#${id})`;
  }
  return { fill, c, a, d: shade(c, -0.22), dd: shade(c, -0.4), l: shade(c, 0.35), ad: shade(a, -0.25), al: shade(a, 0.4) };
}

export function normalizeLook(look) {
  const L = { ...DEFAULT_LOOK, ...(look || {}) };
  L.makeup = { ...DEFAULT_LOOK.makeup, ...(look && look.makeup) };
  L.nails = (look && Array.isArray(look.nails) ? look.nails : DEFAULT_LOOK.nails).slice(0, 5);
  return L;
}

// Collects the drawable parts of every worn item, keyed by layer name.
function collectParts(L, uid, defs) {
  const parts = {};
  const add = (layer, svg) => { if (svg) (parts[layer] = parts[layer] || []).push(svg); };
  for (const slot of WEAR_SLOTS) {
    const worn = L[slot];
    if (!worn || !worn.id) continue;
    const item = getItem(worn.id);
    if (!item) continue;
    const ctx = paintCtx(uid, slot, worn, item, defs);
    ctx.skin = skinColor(L.skin);
    const out = item.draw(ctx) || {};
    for (const [layer, svg] of Object.entries(out)) add(`${slot}.${layer}`, svg);
  }
  return parts;
}

export function renderDoll(look, opts = {}) {
  const { uid = 'doll', expr = 'smile', viewBox = `0 0 ${VIEW.w} ${VIEW.h}`, cls = '', extra = '' } = opts;
  const L = normalizeLook(look);
  const skin = skinColor(L.skin);
  const hi = hairInfo(L.hairColor);
  const defs = [];
  let hairFill = hi.c;
  if (hi.grad) {
    const id = `${uid}-hairgrad`;
    const stops = hi.grad.map((c, i) => `<stop offset="${(i / (hi.grad.length - 1)) * 100}%" stop-color="${c}"/>`).join('');
    defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">${stops}</linearGradient>`);
    hairFill = `url(#${id})`;
  }
  const hairBase = hi.grad ? hi.grad[Math.floor(hi.grad.length / 2)] : hi.c;
  const H = hair(L.hairStyle, hairFill, hairBase);
  const parts = collectParts(L, uid, defs);
  const g = (...keys) => keys.map(k => (parts[k] || []).join('')).join('');

  // A headscarf covers all the hair (and the ears, so earrings are hidden too).
  const covered = !!(L.head && getItem(L.head.id)?.hidesHair);
  const svg = [
    g('back.back'),
    covered ? '' : `<g class="hair-back">${H.back}</g>`,
    g('outer.back', 'dress.back', 'top.back', 'head.back', 'scarf.back'),
    body(skin, L),
    g('socks.main', 'shoes.main', 'bottom.main', 'top.main', 'dress.main', 'outer.main', 'necklace.main'),
    arms(skin, L),
    g('top.sleeves', 'dress.sleeves', 'outer.sleeves', 'bracelet.main', 'ring.main', 'prop.main', 'scarf.main', 'dress.front', 'outer.front', 'top.front'),
    `<g class="face">${face(skin, L, expr, hairBase)}</g>`,
    g('head.under'),
    covered ? '' : `<g class="hair-front">${H.front}</g>`,
    g('head.main', 'glasses.main', ...(covered ? [] : ['earrings.main']), 'necklace.front', 'prop.front'),
    parts['pet.main'] ? `<g transform="translate(330 776) scale(1.3) translate(-330 -776)">${g('pet.main')}</g>` : '',
    extra,
  ].join('');
  return `<svg class="doll ${cls}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Doll"><defs>${defs.join('')}</defs>${svg}</svg>`;
}

// Faint body outline behind wardrobe thumbnails.
const MANNEQUIN = `<g fill="#f3ebf8">${both(`<path d="${P.legL}"/><path d="${P.footL}"/><path d="${P.armL}"/><path d="${P.palmL}"/>`)}<path d="${P.torso}"/><path d="${P.neck}"/><path d="${P.face}"/></g>`;

export function renderItemThumb(item, worn = null, viewBox = '0 0 400 800') {
  const defs = [];
  const w = worn && worn.id === item.id ? worn : { id: item.id, color: item.color, accent: item.accent, pattern: item.pattern || 'solid', patternColor: item.patternColor };
  const ctx = paintCtx(`t-${item.id}`, item.slot, w, item, defs);
  ctx.skin = '#f3ebf8';
  const out = item.draw(ctx) || {};
  const body = ['back', 'main', 'sleeves', 'front', 'under'].map(k => out[k] || '').join('');
  return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><defs>${defs.join('')}</defs>${MANNEQUIN}${body}</svg>`;
}

export function patternSwatch(pattern, color) {
  const defs = [];
  const fill = pattern === 'solid' ? color : `url(#sw-${pattern})`;
  if (pattern !== 'solid') defs.push(patternDef(`sw-${pattern}`, pattern, color));
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><defs>${defs.join('')}</defs><rect width="40" height="40" fill="${fill}"/></svg>`;
}

// Head-only preview used for hair style buttons.
export function renderHairThumb(style, colorId, skinId = 'golden') {
  const hi = hairInfo(colorId);
  const fill = hi.grad ? hi.grad[0] : hi.c;
  const H = hair(style, fill, fill);
  const skin = skinColor(skinId);
  return `<svg viewBox="90 30 220 230" xmlns="http://www.w3.org/2000/svg">${H.back}<path d="${P.neck}" fill="${skin}"/>` +
    both(`<ellipse cx="141" cy="150" rx="8" ry="13" fill="${skin}"/>`) + `<path d="${P.face}" fill="${skin}"/>` +
    both(`<circle cx="178" cy="153" r="7" fill="#3a2216"/><circle cx="180" cy="150" r="2.2" fill="#fff"/>`) +
    `<path d="M188 190Q200 200 212 190" stroke="#c0606a" stroke-width="3" fill="none" stroke-linecap="round"/>${H.front}</svg>`;
}
