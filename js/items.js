// Wardrobe catalogue. Every item draws itself onto the 400 x 800 doll and returns
// SVG strings keyed by layer: back (behind body), main (on torso/legs), sleeves (over
// arms), front (drapes over everything), under (just under hair), etc.
// Paint context: fill (colour or pattern), c (main), a (accent), d/dd (darker), l (lighter).

import { shade } from './util.js';
import { both, flower, star, sparkle, heart, curveThrough, fx } from './svg.js';

export const WEAR_SLOTS = ['back', 'socks', 'shoes', 'bottom', 'top', 'dress', 'outer', 'scarf', 'necklace', 'bracelet', 'ring', 'prop', 'head', 'glasses', 'earrings', 'pet'];

// ---------- Geometry helpers ----------

// Body outline (left edge) as [y, x] samples taken from the torso path in doll.js.
const EDGE = [[256, 146], [262, 141], [270, 136], [280, 134.2], [290, 134.5], [300, 135.5], [316, 138], [330, 140.5], [340, 142.5], [350, 146], [360, 150], [370, 153.5], [380, 157], [390, 159.5], [398, 161], [410, 159.5], [420, 157], [430, 154], [440, 151], [450, 149], [460, 148], [480, 148]];

export function bx(y) {
  if (y <= EDGE[0][0]) return EDGE[0][1];
  for (let i = 1; i < EDGE.length; i++) {
    const [y1, x1] = EDGE[i];
    if (y <= y1) {
      const [y0, x0] = EDGE[i - 1];
      return x0 + (x1 - x0) * (y - y0) / (y1 - y0);
    }
  }
  return EDGE[EDGE.length - 1][1];
}

// Left side points from y0 to y1 (inclusive) pushed out by `off`; below 470 flares by `flare` per 100px.
function sidePts(y0, y1, off = 3, flare = 0) {
  const ys = [y0, ...EDGE.map(e => e[0]).filter(y => y > y0 && y < y1 && y <= 470)];
  for (let y = 500; y < y1; y += 40) ys.push(y);
  ys.push(y1);
  return ys.map(y => [fx(bx(y) - off - (y > 470 ? (y - 470) * flare / 100 : 0)), y]);
}

const mx = pts => pts.map(([x, y]) => [fx(400 - x), y]).reverse();
const pt = p => `${p[0]} ${p[1]}`;

const NECKS = {
  crew: { nl: [177, 249], sh: [139, 259], d: 'Q200 266 177 249' },
  scoop: { nl: [168, 253], sh: [139, 259], d: 'C224 292 176 292 168 253' },
  v: { nl: [176, 250], sh: [139, 259], d: 'L200 304Z' },
  square: { nl: [166, 255], sh: [139, 259], d: 'L234 290L166 290Z' },
  boat: { nl: [164, 254], sh: [139, 259], d: 'Q200 262 164 254' },
  high: { nl: [184, 238], sh: [139, 259], d: 'Q200 242 184 238', collar: true },
  tank: { nl: [172, 256], sh: [158, 257], start: 300, d: 'C226 290 174 290 172 256' },
};

// Fitted top / bodice from the neckline to `bottom`.
function bodice(neck, bottom, off = 3, dip = 6, flare = 6) {
  const N = NECKS[neck];
  const nr = [400 - N.nl[0], N.nl[1]];
  const left = [N.sh, ...sidePts(N.start || 272, bottom, off, flare)];
  const right = mx(left);
  let d = `M${pt(N.nl)}`;
  if (neck === 'high') d += `L184 252`;
  d += `L${pt(left[0])}${curveThrough(left)}Q200 ${bottom + dip} ${pt(right[0])}${curveThrough(right)}`;
  if (neck === 'high') d += `L216 252L${pt(nr)}`; else d += `L${pt(nr)}`;
  const close = N.d.endsWith('Z') ? N.d.replace(/Z$/, '') + `L${pt(N.nl)}Z` : N.d + 'Z';
  return d + close;
}

// Strapless sweetheart bodice.
function sweetheart(bottom, off = 3) {
  const left = sidePts(298, bottom, off);
  const right = mx(left);
  return `M${pt(left[0])}${curveThrough(left)}Q200 ${bottom + 6} ${pt(right[0])}${curveThrough(right)}C252 284 214 282 200 302C186 282 148 284 ${pt(left[0])}Z`;
}

// Skirt from the waist (`top`) to `hem`, `half` = half-width at hem.
function skirt(top, hem, half, opts = {}) {
  const { bulge = 14, wave = 0, waist = bx(top) - 3, dip = 12 } = opts;
  const wl = 200 - (200 - waist);
  const hl = 200 - half;
  const h = hem - top;
  let d = `M${fx(wl)} ${top}C${fx(wl - bulge)} ${fx(top + h * 0.25)} ${fx(hl + bulge * 0.2)} ${fx(hem - h * 0.35)} ${fx(hl)} ${hem}`;
  if (wave) {
    const n = Math.max(3, Math.round(half / wave));
    const step = (half * 2) / n;
    for (let i = 0; i < n; i++) {
      const x0 = hl + i * step;
      const mid = Math.abs(i + 0.5 - n / 2) / (n / 2);
      const yy = hem + dip * (1 - mid * mid);
      d += `Q${fx(x0 + step / 2)} ${fx(yy + 10)} ${fx(x0 + step)} ${fx(yy)}`;
    }
  } else {
    d += `Q200 ${hem + dip * 2} ${fx(400 - hl)} ${hem}`;
  }
  d += `C${fx(400 - hl - bulge * 0.2)} ${fx(hem - h * 0.35)} ${fx(400 - wl + bulge)} ${fx(top + h * 0.25)} ${fx(400 - wl)} ${top}Z`;
  return d;
}

function folds(top, hem, half, n, stroke, w = 1.4, waist = 40) {
  let s = '';
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x0 = 200 - waist + t * waist * 2;
    const x1 = 200 - half + t * half * 2;
    s += `<path d="M${fx(x0)} ${top + 8}Q${fx((x0 + x1) / 2)} ${fx((top + hem) / 2)} ${fx(x1)} ${hem - 4}" stroke="${stroke}" stroke-width="${w}" fill="none" opacity=".45"/>`;
  }
  return s;
}

const SLEEVE = {
  cap: 'M160 254C140 253 126 264 122 284L120 298Q134 305 148 299L152 288C153 278 156 270 163 264Z',
  short: 'M159 253C138 255 124 270 120 296L116 324Q131 331 146 325L150 300C151 290 154 278 161 266Z',
  puff: 'M161 255C130 242 106 268 113 307Q128 323 149 310C150 294 154 278 165 266Z',
  three: 'M159 253C138 255 124 270 120 296C118 330 116 370 112 404Q127 411 139 404C141 380 144 350 147 326L150 300C151 290 154 278 161 266Z',
  long: 'M159 253C138 255 124 270 120 296C118 340 113 400 106 458Q118 465 131 459C136 410 142 360 146 330L150 300C151 290 154 278 161 266Z',
  bell: 'M159 253C138 255 124 270 120 296C118 340 110 390 96 442Q118 458 141 446C141 400 144 350 147 326L150 300C151 290 154 278 161 266Z',
  kimono: 'M159 253C138 255 124 270 120 296C117 350 110 410 104 456Q112 470 132 470L160 470Q168 462 164 440L157 330C155 310 155 290 161 266Z',
  hanbok: 'M159 253C138 255 124 270 120 296C117 350 111 410 105 457L131 461C140 430 154 396 154 366C154 336 151 316 150 300C151 290 154 278 161 266Z',
};
const CUFF = {
  long: 'M107 448Q119 455 132 450L131 459Q118 465 106 458Z',
  three: 'M113 396Q127 403 140 396L139 404Q127 411 112 404Z',
  short: 'M117 316Q131 323 147 317L146 325Q131 331 116 324Z',
  hanbok: 'M106 444L132 448L131 461L105 457Z',
};

const sleeves = (kind, fill, stroke, cuff) =>
  both(`<path d="${SLEEVE[kind]}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>` + (cuff && CUFF[kind] ? `<path d="${CUFF[kind]}" fill="${cuff}"/>` : ''));

const outline = (d, fill, stroke, w = 1.4, extra = '') => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${extra}/>`;

// Pants from the waist to `hem` (y). Legs follow the body with `ease` extra room.
function pants(hem, ease = 4, waist = 396) {
  const t = (hem - 470) / (746 - 470);
  const lo = fx(150 - ease + (171 - 150) * t - 2);
  const li = fx(201 + ease * 0.5 - (201 - 187) * t + 2);
  return `M157 ${waist}L243 ${waist}C251 420 255 440 255 462C${fx(400 - 150 + ease)} 520 ${fx(400 - lo - 6)} ${fx(hem - 60)} ${fx(400 - lo)} ${hem}L${fx(400 - li)} ${hem}C${fx(400 - li + 2)} ${fx(hem - 120)} 203 540 201 490L200 486L199 490C197 540 ${fx(li - 2)} ${fx(hem - 120)} ${li} ${hem}L${lo} ${hem}C${fx(lo - 6 + 6)} ${fx(hem - 60)} ${fx(150 - ease)} 520 145 462C145 440 149 420 157 ${waist}Z`;
}

const gold = '#f2c14e';
const goldD = '#c8961e';

// ---------- Catalogue ----------

const ITEMS = [];
const def = (slot, id, name, props, draw) => ITEMS.push({ slot, id, name, ...props, draw });

// ===== Tops =====
def('top', 'tee', 'T-shirt', { color: '#ff8fc8', warmth: 1 }, p => ({
  main: outline(bodice('crew', 418), p.fill, p.d) + `<path d="M177 249Q200 266 223 249" stroke="${p.d}" stroke-width="3" fill="none"/>`,
  sleeves: sleeves('short', p.fill, p.d, p.d),
}));
def('top', 'blouse', 'Puff blouse', { color: '#fff4d6', accent: '#ffffff', warmth: 1 }, p => ({
  main: outline(bodice('crew', 410), p.fill, p.d) + both(`<path d="M177 249Q172 266 186 272Q196 268 200 258Q190 256 177 249Z" fill="${p.a}" stroke="${p.d}" stroke-width="1"/>`) +
    [290, 320, 350, 380].map(y => `<circle cx="200" cy="${y}" r="2.6" fill="${p.d}"/>`).join(''),
  sleeves: sleeves('puff', p.fill, p.d) + both(`<path d="M128 296q8 6 16 2" stroke="${p.d}" stroke-width="1" fill="none"/>`),
}));
def('top', 'tank', 'Tank top', { color: '#7ee0c3', warmth: 0 }, p => ({
  main: outline(bodice('tank', 414), p.fill, p.d),
}));
def('top', 'sweater', 'Cozy sweater', { color: '#c9a7ff', accent: '#ffffff', warmth: 3 }, p => ({
  main: outline(bodice('crew', 424, 4), p.fill, p.d) + `<path d="M154 410Q200 420 246 410L247 424Q200 434 153 424Z" fill="${p.d}" opacity=".5"/>` +
    `<path d="M177 249Q200 268 223 249" stroke="${p.d}" stroke-width="5" fill="none"/>` +
    [180, 200, 220].map(x => `<path d="M${x} 290v100" stroke="${p.d}" stroke-width="1.2" stroke-dasharray="3 4" opacity=".6"/>`).join('') + heart(200, 330, 9, p.a, 'opacity=".9"'),
  sleeves: sleeves('long', p.fill, p.d, p.d),
}));
def('top', 'hoodie', 'Hoodie', { color: '#ffb347', accent: '#ffffff', warmth: 3 }, p => ({
  back: `<path d="M160 250C150 220 170 200 200 204C230 200 250 220 240 250Z" fill="${p.d}"/>`,
  main: outline(bodice('crew', 428, 5), p.fill, p.d) + `<path d="M168 250C176 268 224 268 232 250" stroke="${p.d}" stroke-width="6" fill="none"/>` +
    `<path d="M168 372L232 372L240 414L160 414Z" fill="${p.d}" opacity=".35"/>` +
    `<path d="M192 262v34M208 262v34" stroke="${p.a}" stroke-width="2.4" stroke-linecap="round"/>`,
  sleeves: sleeves('long', p.fill, p.d, p.d),
}));
def('top', 'kurti', 'Kurti', { color: '#ffd166', accent: '#e63973', warmth: 1, tags: ['IN'] }, p => ({
  main: outline(bodice('v', 560, 3, 4, 10), p.fill, p.d) +
    `<path d="M176 250L200 304L224 250" stroke="${p.a}" stroke-width="6" fill="none" stroke-linejoin="round"/>` +
    `<path d="M137 548Q200 562 263 548" stroke="${p.a}" stroke-width="6" fill="none"/>` +
    both(`<path d="M145 486L142 556" stroke="${p.d}" stroke-width="1.6"/>`) +
    [320, 340, 360].map(y => flower(200, y, p.a, gold, 2.6)).join(''),
  sleeves: sleeves('three', p.fill, p.d, p.a),
}));
def('top', 'breton', 'Striped top', { color: '#ffffff', patternColor: '#1f3a8a', pattern: 'stripes', warmth: 1, tags: ['FR'] }, p => ({
  main: outline(bodice('boat', 418), p.fill, '#9aa6c8'),
  sleeves: sleeves('three', p.fill, '#9aa6c8'),
}));

// ===== Bottoms =====
def('bottom', 'skirt', 'Skater skirt', { color: '#7ec8ff', warmth: 0 }, p => ({
  main: outline(skirt(396, 560, 84, { bulge: 18 }), p.fill, p.d) + `<rect x="156" y="394" width="88" height="10" rx="4" fill="${p.d}"/>` + folds(404, 566, 84, 6, p.d),
}));
def('bottom', 'pleated', 'Pleated skirt', { color: '#ff7aa8', pattern: 'checks', warmth: 0 }, p => ({
  main: outline(skirt(396, 540, 74, { bulge: 12, dip: 4 }), p.fill, p.d) + `<rect x="156" y="394" width="88" height="10" rx="3" fill="${p.d}"/>` + folds(404, 544, 74, 9, p.dd, 1.6),
}));
def('bottom', 'tutu', 'Tutu', { color: '#ffb3d9', warmth: 0 }, p => ({
  main: outline(skirt(400, 500, 104, { bulge: 30, wave: 14, dip: 4 }), p.l, p.d, 1, 'opacity=".95"') +
    outline(skirt(396, 480, 92, { bulge: 26, wave: 12, dip: 4 }), p.fill, p.d, 1) +
    `<rect x="156" y="392" width="88" height="10" rx="5" fill="${p.d}"/>` + [170, 196, 222, 240].map((x, i) => sparkle(x, 430 + (i % 2) * 22, 4, '#fff')).join(''),
}));
def('bottom', 'maxi', 'Long skirt', { color: '#a0e7e5', pattern: 'floral', warmth: 1 }, p => ({
  main: outline(skirt(396, 752, 86, { bulge: 12, wave: 18, dip: 6 }), p.fill, p.d) + `<rect x="156" y="394" width="88" height="10" rx="4" fill="${p.d}"/>` + folds(404, 752, 86, 7, p.d),
}));
def('bottom', 'jeans', 'Jeans', { color: '#4f7cc9', accent: '#f2c14e', patternable: true, warmth: 2 }, p => ({
  main: outline(pants(742), p.fill, p.dd) + `<rect x="156" y="394" width="88" height="11" rx="3" fill="${p.d}"/>` +
    `<path d="M200 405v60" stroke="${p.dd}" stroke-width="1.2"/><circle cx="200" cy="400" r="2.4" fill="${p.a}"/>` +
    both(`<path d="M160 410Q168 432 186 430" stroke="${p.a}" stroke-width="1.2" fill="none" stroke-dasharray="3 2"/><path d="M168 736L188 736" stroke="${p.a}" stroke-width="1.2" stroke-dasharray="3 2"/>`),
}));
def('bottom', 'shorts', 'Shorts', { color: '#5fb8e8', accent: '#ffffff', warmth: 0 }, p => ({
  main: outline(pants(530, 5), p.fill, p.d) + `<rect x="156" y="394" width="88" height="10" rx="3" fill="${p.d}"/>` + both(`<path d="M146 520L196 524" stroke="${p.a}" stroke-width="3"/>`),
}));
def('bottom', 'leggings', 'Leggings', { color: '#2d2d4a', warmth: 2 }, p => ({
  main: outline(pants(744, 0), p.fill, shade(p.c, -0.3)) + `<rect x="156" y="394" width="88" height="8" rx="3" fill="${p.d}"/>`,
}));

// ===== Dresses =====
def('dress', 'sundress', 'Sundress', { color: '#ffe066', accent: '#ff7aa8', pattern: 'floral', warmth: 0 }, p => ({
  main: outline(skirt(396, 586, 92, { bulge: 18, wave: 16, dip: 6 }), p.fill, p.d) +
    outline(bodice('tank', 402, 3, 0), p.fill, p.d) + `<path d="M159 392Q200 402 241 392L242 406Q200 416 158 406Z" fill="${p.a}"/>` +
    `<path d="M236 398l16-8 2 14z" fill="${p.a}"/>` + folds(408, 590, 92, 6, p.d),
}));
def('dress', 'gown', 'Ball gown', { color: '#b388ff', accent: '#ffffff', pattern: 'sparkle', warmth: 1 }, p => ({
  main: outline(skirt(394, 770, 158, { bulge: 64, wave: 26, dip: 4 }), p.fill, p.d) + folds(404, 770, 158, 9, p.d, 1.6, 44) +
    outline(sweetheart(400), p.fill, p.d) + `<path d="M159 392Q200 402 241 392L242 404Q200 414 158 404Z" fill="${p.a}" opacity=".9"/>` + flower(232, 398, p.a, gold, 5),
  sleeves: both(`<path d="M150 290C132 280 116 292 118 312Q130 326 148 316Q154 304 150 290Z" fill="${p.l}" stroke="${p.d}" stroke-width="1.2"/>`),
}));
def('dress', 'party', 'Party dress', { color: '#ff5fa2', accent: '#fff3a0', pattern: 'sparkle', warmth: 0 }, p => ({
  main: outline(skirt(400, 566, 104, { bulge: 32, wave: 13, dip: 2 }), p.l, p.d, 1) + outline(skirt(396, 548, 92, { bulge: 26, wave: 12, dip: 2 }), p.fill, p.d, 1) +
    outline(bodice('v', 404, 3, 0), p.fill, p.d) + `<path d="M159 394Q200 404 241 394L242 406Q200 416 158 406Z" fill="${p.a}"/>` + star(200, 401, 7, p.a),
}));
def('dress', 'mermaid', 'Mermaid gown', { color: '#3fd0c9', accent: '#b388ff', pattern: 'sparkle', warmth: 0, unlock: 'BALI' }, p => {
  const body = `M148 302C152 360 158 380 160 398C154 440 146 470 150 540C154 600 166 640 168 660C150 700 120 740 112 772Q156 760 200 772Q244 760 288 772C280 740 250 700 232 660C234 640 246 600 250 540C254 470 246 440 240 398C242 380 248 360 252 302C232 286 214 284 200 302C186 284 168 286 148 302Z`;
  return {
    main: outline(body, p.fill, p.d) + `<path d="M168 660Q200 676 232 660" stroke="${p.a}" stroke-width="4" fill="none"/>` +
      `<path d="M130 740Q150 716 168 670M270 740Q250 716 232 670M200 676V768" stroke="${p.d}" stroke-width="1.4" fill="none"/>` + [[176, 340], [222, 360], [190, 470], [214, 560]].map(([x, y]) => sparkle(x, y, 5, '#fff')).join(''),
  };
});
def('dress', 'maxidress', 'Flowy maxi', { color: '#ff9e80', accent: '#ffffff', pattern: 'floral', warmth: 1 }, p => ({
  main: outline(skirt(396, 756, 100, { bulge: 16, wave: 20, dip: 6 }), p.fill, p.d) + folds(404, 756, 100, 7, p.d) + outline(bodice('v', 404, 3, 0), p.fill, p.d) + `<path d="M160 396Q200 406 240 396" stroke="${p.a}" stroke-width="5" fill="none"/>`,
  sleeves: both(`<path d="M160 254C138 252 120 268 112 300Q128 312 150 304C152 290 156 274 165 264Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.2"/><path d="M114 298q6 6 12 2q6 6 12 0q6 4 12 0" stroke="${p.d}" fill="none"/>`),
}));
def('dress', 'ballerina', 'Ballerina tutu', { color: '#ffc6e0', accent: '#ffffff', warmth: 0 }, p => ({
  main: outline(bodice('scoop', 470, 1, 0), p.c, p.d) +
    outline(skirt(404, 492, 124, { bulge: 40, wave: 12, dip: 2 }), p.l, p.d, 1, 'opacity=".9"') + outline(skirt(400, 474, 108, { bulge: 34, wave: 11, dip: 2 }), p.fill, p.d, 1) +
    [160, 186, 214, 240].map((x, i) => sparkle(x, 440 + (i % 2) * 14, 4, '#fff')).join('') + flower(200, 300, p.a, gold, 4),
}));

// ===== Traditional outfits =====
def('dress', 'saree', 'Saree', { color: '#e63973', accent: '#f2c14e', pattern: 'solid', warmth: 1, tags: ['IN', 'traditional'], from: 'India' }, p => {
  const blouse = outline(bodice('scoop', 400, 3, 0), p.a, p.ad);
  const sk = skirt(396, 754, 76, { bulge: 10, dip: 4 });
  const pleats = [186, 192, 198, 204, 210].map(x => `<path d="M${x} 430L${x - 1} 754" stroke="${p.d}" stroke-width="1.2" opacity=".6"/>`).join('');
  const pallu = 'M156 404L196 424L270 296L262 256L230 254Z';
  return {
    back: `<path d="M244 256L276 262L298 560L266 566Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1"/><path d="M276 262L298 560" stroke="${p.a}" stroke-width="5"/>`,
    main: outline(sk, p.fill, p.d) + `<path d="M126 742Q200 770 274 742" stroke="${p.a}" stroke-width="8" fill="none"/>` + pleats +
      `<path d="M180 470L220 470L224 756L176 756Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1"/>` + pleats + blouse,
    sleeves: sleeves('short', p.a, p.ad),
    front: outline(pallu, p.fill, p.d) + `<path d="M196 424L270 296" stroke="${p.a}" stroke-width="6"/>` + `<path d="M156 404L230 254" stroke="${p.a}" stroke-width="3"/>` +
      [[205, 360], [222, 330], [238, 300]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${p.a}"/>`).join(''),
  };
});
def('dress', 'lehenga', 'Lehenga choli', { color: '#d81b60', accent: '#f2c14e', pattern: 'solid', warmth: 1, tags: ['IN', 'traditional'], from: 'India' }, p => ({
  back: both(`<path d="M150 258C116 300 98 430 94 600L122 606C124 470 134 340 160 268Z" fill="${p.l}" opacity=".85" stroke="${p.d}" stroke-width="1"/><path d="M94 600L122 606" stroke="${gold}" stroke-width="6"/><path d="M95 586L122 592" stroke="${gold}" stroke-width="2"/>`),
  main: outline(skirt(396, 762, 150, { bulge: 52, dip: 6 }), p.fill, p.d) + folds(404, 762, 150, 10, p.d, 1.4, 44) +
    `<path d="M50 748Q200 790 350 748" stroke="${gold}" stroke-width="12" fill="none"/><path d="M53 734Q200 774 347 734" stroke="${p.a}" stroke-width="3" fill="none"/>` +
    [[150, 520], [200, 540], [250, 520], [120, 640], [170, 660], [230, 660], [280, 640], [200, 610]].map(([x, y]) => flower(x, y, gold, '#fff', 3.2)).join('') +
    outline(bodice('scoop', 400, 3, 0), p.fill, p.d) + `<path d="M168 253C176 292 224 292 232 253" stroke="${gold}" stroke-width="3" fill="none"/>` +
    [[176, 320], [224, 320], [200, 350]].map(([x, y]) => flower(x, y, gold, '#fff', 3)).join('') +
    `<rect x="158" y="392" width="84" height="10" rx="3" fill="${gold}"/>`,
  sleeves: sleeves('short', p.fill, p.d, gold),
}));
def('dress', 'pavadai', 'Pattu pavadai', { color: '#2e7d32', accent: '#ad1457', pattern: 'solid', warmth: 1, tags: ['IN', 'traditional'], from: 'South India' }, p => ({
  main: outline(skirt(396, 758, 104, { bulge: 22, dip: 6 }), p.fill, p.d) + folds(404, 700, 98, 9, p.d, 1.4, 42) +
    `<path d="M98 698Q200 724 302 698L304 742Q200 774 96 742Z" fill="${gold}"/>` + `<path d="M98 710Q200 736 302 710" stroke="${p.a}" stroke-width="6" fill="none"/>` +
    [110, 140, 170, 200, 230, 260, 290].map(x => `<path d="M${x} 726l5 -8 5 8z" fill="${goldD}"/>`).join('') +
    [[160, 500], [240, 500], [200, 560], [140, 620], [260, 620]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${gold}"/>`).join('') +
    outline(bodice('scoop', 400, 3, 0), p.a, p.ad) + `<rect x="158" y="392" width="84" height="10" rx="3" fill="${gold}"/>`,
  sleeves: sleeves('puff', p.a, p.ad) + both(`<path d="M114 300Q130 316 149 306" stroke="${gold}" stroke-width="4" fill="none"/>`),
}));
def('dress', 'anarkali', 'Anarkali suit', { color: '#5e35b1', accent: '#ffcc80', pattern: 'solid', warmth: 2, tags: ['IN', 'traditional'], from: 'India' }, p => ({
  main: outline(pants(744, 0), p.a, p.ad) + both(`<path d="M168 700q10 4 20 0M169 712q10 4 20 0M170 724q10 4 20 0" stroke="${p.ad}" fill="none"/>`) +
    outline(skirt(392, 650, 120, { bulge: 34, wave: 15, dip: 4 }), p.fill, p.d) + folds(400, 650, 120, 12, p.d, 1.2, 40) +
    `<path d="M82 636Q200 680 318 636" stroke="${gold}" stroke-width="6" fill="none"/>` +
    outline(bodice('v', 398, 3, 0), p.fill, p.d) + `<path d="M176 250L200 304L224 250" stroke="${gold}" stroke-width="4" fill="none"/>` +
    `<path d="M159 392Q200 400 241 392" stroke="${gold}" stroke-width="5" fill="none"/>`,
  sleeves: sleeves('long', p.fill, p.d, gold),
  back: both(`<path d="M150 258C116 300 98 430 94 600L122 606C124 470 134 340 160 268Z" fill="${p.a}" opacity=".85"/><path d="M94 600L122 606" stroke="${gold}" stroke-width="6"/>`),
}));
def('dress', 'hanbok', 'Hanbok', { color: '#ff4f81', accent: '#fff3b0', pattern: 'solid', warmth: 2, tags: ['KR', 'traditional'], from: 'Korea' }, p => ({
  main: outline(skirt(300, 768, 150, { bulge: 46, dip: 4, waist: 148 }), p.fill, p.d) + folds(312, 768, 150, 10, p.d, 1.4, 52) +
    `<path d="M140 252C150 248 170 248 186 250L200 286L214 250C230 248 250 248 260 252C266 270 266 296 262 312Q200 326 138 312C134 296 134 270 140 252Z" fill="${p.a}" stroke="${shade(p.a, -0.25)}" stroke-width="1.2"/>` +
    `<path d="M176 250L200 290L232 256" stroke="#ffffff" stroke-width="7" fill="none" stroke-linejoin="round"/><path d="M176 250L200 290L232 256" stroke="${shade(p.a, -0.2)}" stroke-width="1" fill="none"/>` +
    `<path d="M210 300c-14-10-20 2-8 6c-8 6 4 12 8-2c4 14 16 8 8 2c12-4 6-16-8-6z" fill="${p.d}"/><path d="M208 306C200 360 196 400 192 450L200 452C204 400 208 360 212 306Z" fill="${p.d}"/><path d="M212 306C222 360 228 400 232 430L224 434C220 400 214 360 210 306Z" fill="${p.d}"/>`,
  sleeves: both(`<path d="${SLEEVE.hanbok}" fill="${p.a}" stroke="${shade(p.a, -0.25)}" stroke-width="1.2"/>` + ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff'].map((c, i) => `<path d="M${fx(120 - i * 2.5)} ${376 + i * 14}L${fx(150 - i * 1.5)} ${380 + i * 14}L${fx(150 - i * 1.5)} ${390 + i * 14}L${fx(119 - i * 2.5)} ${386 + i * 14}Z" fill="${c}" opacity=".85"/>`).join('') + `<path d="${CUFF.hanbok}" fill="${p.fill}"/>`),
}));
def('dress', 'qipao', 'Qipao', { color: '#d32f2f', accent: '#f2c14e', pattern: 'floral', warmth: 1, tags: ['TW', 'traditional'], from: 'Taiwan' }, p => {
  const left = [[139, 259], ...sidePts(272, 640, 3, 4)];
  const d = `M184 238L184 252L${pt(left[0])}${curveThrough(left)}Q200 650 ${pt(mx(left)[0])}${curveThrough(mx(left))}L216 252L216 238Q200 242 184 238Z`;
  return {
    main: outline(d, p.fill, p.d) + `<path d="M184 236Q200 242 216 236L216 252Q200 256 184 252Z" fill="${p.a}"/>` +
      `<path d="M200 252C214 262 232 272 254 284" stroke="${p.a}" stroke-width="3" fill="none"/>` +
      [[214, 262], [232, 272], [250, 282]].map(([x, y]) => `<path d="M${x - 5} ${y}h10" stroke="${p.a}" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="2.4" fill="${p.a}"/>`).join('') +
      `<path d="M247 560L244 646" stroke="${p.d}" stroke-width="2"/>` + `<path d="M136 638Q200 652 264 638" stroke="${p.a}" stroke-width="3" fill="none"/>`,
    sleeves: sleeves('cap', p.fill, p.d) + both(`<path d="M120 296Q134 303 149 298" stroke="${p.a}" stroke-width="3" fill="none"/>`),
  };
});
def('dress', 'kebaya', 'Sarong kebaya', { color: '#2a7f9e', accent: '#ffe4ef', pattern: 'paisley', warmth: 1, tags: ['SG', 'traditional'], from: 'Singapore' }, p => {
  const top = `M176 250L139 259${curveThrough([[139, 259], ...sidePts(272, 470, 4, 6)])}L192 452L200 330L208 452L${pt(mx(sidePts(272, 470, 4, 6))[0])}${curveThrough(mx([[139, 259], ...sidePts(272, 470, 4, 6)]))}L224 250L200 300Z`;
  const ed = shade(p.a, -0.3);
  return {
    main: outline(skirt(396, 756, 80, { bulge: 12, dip: 4 }), p.fill, p.d) + `<path d="M232 420L224 756" stroke="${p.d}" stroke-width="2"/>` + `<path d="M124 742Q200 766 276 742" stroke="${p.d}" stroke-width="6" fill="none"/>` +
      outline(top, p.a, ed, 1.4, 'opacity=".96"') +
      `<path d="M176 250L200 300L192 452M224 250L200 300L208 452" stroke="${ed}" stroke-width="3" fill="none" stroke-dasharray="1 4" stroke-linecap="round"/>` +
      [flower(156, 440, '#ff8fb1', '#ffd84a', 4), flower(244, 440, '#ff8fb1', '#ffd84a', 4), flower(166, 300, '#8fd3ff', '#ffd84a', 3), flower(234, 300, '#8fd3ff', '#ffd84a', 3)].join('') +
      [318, 350, 382].map(y => `<circle cx="200" cy="${y}" r="5" fill="${gold}" stroke="${goldD}"/><circle cx="200" cy="${y}" r="2" fill="#fff"/>`).join('') + `<path d="M200 323v22M200 355v22" stroke="${goldD}" stroke-width="1.2"/>`,
    sleeves: sleeves('long', p.a, ed) + both(`<path d="M108 444Q119 452 132 446" stroke="${ed}" stroke-width="2" stroke-dasharray="1 3" fill="none"/>`),
  };
});
def('dress', 'balinese', 'Balinese kebaya', { color: '#7b3fa0', accent: '#fff7f0', pattern: 'paisley', patternColor: '#f2c14e', warmth: 1, tags: ['BALI', 'traditional'], from: 'Bali' }, p => {
  const ed = shade(p.a, -0.25);
  return {
    main: outline(skirt(400, 756, 78, { bulge: 12, dip: 4 }), p.fill, p.d) +
      `<path d="M124 744Q200 768 276 744" stroke="${gold}" stroke-width="6" fill="none"/>` +
      `<path d="M168 420L196 420L206 756L178 756Z" fill="${p.d}" opacity=".5"/>` + [434, 470, 506, 542, 578, 614, 650, 686, 722].map(y => `<path d="M${fx(170 + (y - 420) * 0.03)} ${y}h28" stroke="${p.dd}" stroke-width="1.2" opacity=".6"/>`).join('') +
      outline(bodice('v', 452, 4, 4, 6), p.a, ed, 1.4, 'opacity=".97"') +
      [[166, 300], [234, 300], [158, 360], [242, 360], [166, 420], [234, 420]].map(([x, y]) => flower(x, y, '#fff', ed, 3)).join('') +
      `<path d="M152 392Q200 410 248 392L252 420Q200 438 148 420Z" fill="${gold}" stroke="${goldD}"/><path d="M244 404l18 30-12 4z" fill="${gold}" stroke="${goldD}"/>`,
    sleeves: sleeves('long', p.a, ed) + both(`<path d="M114 380Q126 386 140 380M110 420Q124 426 136 420" stroke="${ed}" stroke-dasharray="2 3" fill="none"/>`),
  };
});
def('dress', 'kimono', 'Kimono', { color: '#ec407a', accent: '#ffd54f', pattern: 'floral', warmth: 2, tags: ['JP', 'traditional'], from: 'Japan' }, p => {
  const left = [[139, 259], ...sidePts(272, 470, 4, 0)];
  const d = `M178 250L${pt(left[0])}${curveThrough(left)}C146 560 150 680 150 758Q200 770 250 758C250 680 254 560 ${pt(mx(left)[0])}${curveThrough(mx(left))}L222 250Z`;
  return {
    main: outline(d, p.fill, p.d) + `<path d="M178 250L210 300L222 250" fill="#fff"/>` + `<path d="M222 250L168 420L158 758" stroke="${p.d}" stroke-width="2.4" fill="none"/>` + `<path d="M178 250L200 284" stroke="${p.d}" stroke-width="2"/>` +
      `<path d="M150 336Q200 344 250 336L248 400Q200 408 152 400Z" fill="${p.a}" stroke="${shade(p.a, -0.3)}"/>` + `<path d="M151 366Q200 374 249 366" stroke="${shade(p.a, -0.35)}" stroke-width="3" fill="none"/>` + flower(200, 368, '#fff', '#ff6f91', 3),
    sleeves: sleeves('kimono', p.fill, p.d),
  };
});

// ===== Outerwear =====
def('outer', 'denim', 'Denim jacket', { color: '#5b8bd6', accent: '#f2c14e', warmth: 2 }, p => {
  const panel = `M178 250L139 259${curveThrough([[139, 259], ...sidePts(272, 424, 6)])}L188 426L188 300Z`;
  return {
    main: both(outline(panel, p.fill, p.dd) + `<path d="M178 250L170 286L186 298Z" fill="${p.d}"/><path d="M150 330h24v16h-24z" fill="none" stroke="${p.a}" stroke-dasharray="2 2"/><circle cx="182" cy="340" r="2" fill="${p.a}"/><circle cx="182" cy="380" r="2" fill="${p.a}"/>`),
    sleeves: sleeves('long', p.fill, p.dd, p.d),
  };
});
def('outer', 'puffer', 'Puffer coat', { color: '#ff6f91', accent: '#ffffff', warmth: 4 }, p => {
  const left = [[136, 258], ...sidePts(272, 510, 9, 6)];
  const d = `M172 244L${pt(left[0])}${curveThrough(left)}Q200 518 ${pt(mx(left)[0])}${curveThrough(mx(left))}L228 244Q200 262 172 244Z`;
  return {
    main: outline(d, p.fill, p.dd) + [300, 350, 400, 450].map(y => `<path d="M${fx(bx(y) - 8)} ${y}Q200 ${y + 8} ${fx(400 - bx(y) + 8)} ${y}" stroke="${p.d}" stroke-width="2" fill="none"/>`).join('') +
      `<path d="M200 262V512" stroke="${p.dd}" stroke-width="2.4"/>` + `<path d="M166 246C170 270 230 270 234 246C230 230 170 230 166 246Z" fill="${p.a}"/>`,
    sleeves: both(`<path d="M160 252C134 252 118 270 114 300C110 350 104 410 100 460Q118 470 136 462C142 410 148 360 150 328Z" fill="${p.fill}" stroke="${p.dd}" stroke-width="1.4"/><path d="M116 330q16 6 32 0M110 380q18 6 36 0M104 430q18 6 36 0" stroke="${p.d}" stroke-width="2" fill="none"/><path d="M101 452Q118 462 136 456L136 466Q118 474 100 464Z" fill="${p.a}"/>`),
  };
});
def('outer', 'raincoat', 'Raincoat', { color: '#ffd43b', accent: '#1e88e5', warmth: 2 }, p => {
  const left = [[137, 258], ...sidePts(272, 600, 7, 12)];
  const d = `M174 246L${pt(left[0])}${curveThrough(left)}Q200 608 ${pt(mx(left)[0])}${curveThrough(mx(left))}L226 246Q200 258 174 246Z`;
  return {
    back: `<path d="M156 252C146 214 168 196 200 198C232 196 254 214 244 252Z" fill="${p.d}"/>`,
    main: outline(d, p.fill, p.dd) + `<path d="M204 258V604" stroke="${p.dd}" stroke-width="2"/>` + [300, 360, 420, 480, 540].map(y => `<circle cx="214" cy="${y}" r="4" fill="${p.a}"/>`).join('') +
      both(`<path d="M150 470h28v8h-28z" fill="${p.d}"/>`) + `<path d="M174 246L190 274L200 256L210 274L226 246" fill="${p.d}"/>`,
    sleeves: sleeves('long', p.fill, p.dd, p.d),
  };
});
def('outer', 'cardigan', 'Cardigan', { color: '#a5d6a7', accent: '#ffffff', warmth: 2 }, p => {
  const panel = `M176 250L139 259${curveThrough([[139, 259], ...sidePts(272, 436, 5)])}L190 440L190 330Z`;
  return {
    main: both(outline(panel, p.fill, p.d) + `<path d="M176 250L190 330L190 440" stroke="${p.d}" stroke-width="4" fill="none"/>` + [350, 380, 410].map(y => `<circle cx="184" cy="${y}" r="3" fill="${p.a}" stroke="${p.d}"/>`).join('') + `<path d="M150 424Q170 432 188 430" stroke="${p.d}" stroke-width="4" fill="none"/>`),
    sleeves: sleeves('long', p.fill, p.d, p.d),
  };
});
def('outer', 'cape', 'Royal cape', { color: '#c2185b', accent: '#ffffff', pattern: 'solid', warmth: 2, unlock: 'FR' }, p => ({
  back: `<path d="M150 256C120 360 90 560 70 770Q200 790 330 770C310 560 280 360 250 256Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.5"/><path d="M70 770Q200 790 330 770" stroke="${p.a}" stroke-width="8" fill="none" stroke-dasharray="2 10" stroke-linecap="round"/>`,
  front: `<path d="M150 254C170 272 230 272 250 254C256 244 240 238 230 240C214 254 186 254 170 240C160 238 144 244 150 254Z" fill="#fff"/>` + [160, 176, 192, 208, 224, 240].map(x => `<circle cx="${x}" cy="${x < 200 ? 252 - (x - 160) * 0.1 : 252 - (240 - x) * 0.1}" r="1.6" fill="#222"/>`).join('') + `<circle cx="200" cy="262" r="6" fill="${gold}" stroke="${goldD}"/>`,
}));
def('outer', 'dupatta', 'Dupatta', { color: '#ff80ab', accent: '#f2c14e', pattern: 'solid', warmth: 1, tags: ['IN'] }, p => ({
  back: `<path d="M140 262C150 300 250 300 260 262L264 330C240 380 160 380 136 330Z" fill="${p.c}" opacity=".5"/>`,
  front: both(`<path d="M142 262C128 300 114 420 112 600L140 604C140 470 148 350 162 270Z" fill="${p.c}" opacity=".62"/><path d="M112 600L140 604" stroke="${p.a}" stroke-width="5"/><path d="M114 560L140 564" stroke="${p.a}" stroke-width="2"/>`),
}));

// ===== Socks =====
def('socks', 'kneesocks', 'Knee socks', { color: '#ffffff', accent: '#ff7aa8', pattern: 'stripes', patternColor: '#ff7aa8', warmth: 1 }, p => ({
  main: both(`<path d="M159 598L193 598C191 640 189 700 188 748L170 748C168 700 165 650 159 598Z" fill="${p.fill}" stroke="${p.d}"/><path d="M159 598L193 598L193 608L160 608Z" fill="${p.a}"/>`),
}));
def('socks', 'tights', 'Tights', { color: '#f8bbd0', warmth: 2 }, p => ({
  main: outline(pants(752, -1, 440), p.fill, p.d, 1, 'opacity=".85"'),
}));

// ===== Shoes =====
const footShoe = (d, fill, stroke, extra = '') => both(`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/>${extra}`);
def('shoes', 'flats', 'Ballet flats', { color: '#ff5fa2', warmth: 0 }, p => ({
  main: footShoe('M166 752C163 760 164 768 171 771C178 773 187 772 190 768C192 762 191 756 189 751Q178 758 166 752Z', p.fill, p.d, `<path d="M173 757l5 3 5-3-5-2z" fill="${p.l}"/>`),
}));
def('shoes', 'sneakers', 'Sneakers', { color: '#ffffff', accent: '#ff5fa2', warmth: 1 }, p => ({
  main: footShoe('M166 740C160 752 160 766 166 772C176 776 190 776 194 770C196 760 194 748 190 738Q178 744 166 740Z', p.fill, '#9aa', `<path d="M161 766Q178 774 195 766L195 772Q178 780 162 772Z" fill="${p.a}"/><path d="M172 748l12 0M171 754l14 0" stroke="${p.a}" stroke-width="2"/>`),
}));
def('shoes', 'heels', 'Sparkly heels', { color: '#e040fb', accent: '#ffffff', warmth: 0 }, p => ({
  main: footShoe('M167 750C163 758 164 766 170 770C177 772 186 771 189 767L190 750Q178 757 167 750Z', p.fill, p.d, `<path d="M186 760L190 776L193 776L191 758Z" fill="${p.d}"/>` + sparkle(176, 762, 3, p.a)),
}));
def('shoes', 'rainboots', 'Rain boots', { color: '#ffd43b', accent: '#1e88e5', warmth: 2 }, p => ({
  main: footShoe('M160 640L194 640C192 690 192 730 194 756C196 770 188 776 178 776C166 776 160 772 160 762C162 730 162 690 160 640Z', p.fill, p.dd, `<path d="M159 640L195 640L195 652L159 652Z" fill="${p.d}"/><path d="M160 766Q178 772 195 766" stroke="${p.a}" stroke-width="4" fill="none"/>`),
}));
def('shoes', 'snowboots', 'Snow boots', { color: '#8d6e63', accent: '#ffffff', warmth: 4 }, p => ({
  main: footShoe('M161 690L194 690C193 720 194 740 196 758C197 772 188 778 178 778C165 778 158 772 159 762C161 740 162 720 161 690Z', p.fill, p.dd, `<path d="M156 684Q178 672 199 684Q202 698 196 702Q178 694 158 702Q152 696 156 684Z" fill="${p.a}"/><path d="M160 770Q178 776 197 770" stroke="${p.dd}" stroke-width="4" fill="none"/>`),
}));
def('shoes', 'sandals', 'Sandals', { color: '#c58b4e', warmth: 0 }, p => ({
  main: both(`<path d="M164 770Q178 776 192 770L192 774Q178 780 164 774Z" fill="${p.d}"/><path d="M168 752Q178 748 188 752M167 761Q178 757 189 761" stroke="${p.fill}" stroke-width="3.5" fill="none" stroke-linecap="round"/>${flower(178, 751, '#ff8fb1', '#ffd84a', 2.4)}`),
}));
def('shoes', 'juttis', 'Juttis', { color: '#c62828', accent: '#f2c14e', warmth: 0, tags: ['IN'] }, p => ({
  main: footShoe('M166 752C160 760 160 768 168 772C178 775 188 773 191 768C193 762 192 756 189 751Q178 758 166 752Z', p.fill, p.d, `<path d="M166 754q-6 -2 -6 -8" stroke="${p.a}" stroke-width="2" fill="none"/><path d="M168 760q10 6 20 0" stroke="${p.a}" stroke-width="2.4" fill="none" stroke-dasharray="2 2"/>`),
}));
def('shoes', 'ballet', 'Ballet slippers', { color: '#ffc1d9', warmth: 0 }, p => ({
  main: footShoe('M167 752C163 760 164 768 171 771C178 773 187 772 190 768C192 762 191 756 189 751Q178 758 167 752Z', p.fill, p.d, `<path d="M170 752L186 724M186 752L170 724M172 720L186 700M186 720L172 700" stroke="${p.d}" stroke-width="1.6"/>`),
}));

// ===== Scarf =====
def('scarf', 'scarf', 'Winter scarf', { color: '#e53935', accent: '#ffffff', pattern: 'stripes', patternColor: '#ffffff', warmth: 2 }, p => ({
  main: `<path d="M168 236C176 262 224 262 232 236C240 244 242 258 236 268C224 284 176 284 164 268C158 258 160 244 168 236Z" fill="${p.fill}" stroke="${p.d}"/>` +
    `<path d="M206 270L232 270L236 380L210 382Z" fill="${p.fill}" stroke="${p.d}"/><path d="M210 382l2 10M218 381l1 10M226 381l1 10M234 380l1 10" stroke="${p.d}" stroke-width="2"/>`,
}));

// ===== Head =====
def('head', 'tiara', 'Tiara', { color: '#e0e0e0', accent: '#ff4f8b', warmth: 0 }, p => ({
  main: `<path d="M160 84Q200 64 240 84L236 72L224 74L218 56L206 66L200 46L194 66L182 56L176 74L164 72Z" fill="${gold}" stroke="${goldD}" stroke-width="1.2"/><circle cx="200" cy="62" r="4.6" fill="${p.a}"/><circle cx="182" cy="70" r="2.8" fill="#64b5f6"/><circle cx="218" cy="70" r="2.8" fill="#64b5f6"/>`,
}));
def('head', 'crown', 'Royal crown', { color: '#f2c14e', accent: '#e53935', warmth: 0, unlock: 'IN' }, p => ({
  main: `<path d="M158 88L152 40L176 60L200 30L224 60L248 40L242 88Q200 76 158 88Z" fill="${p.c}" stroke="${shade(p.c, -0.3)}" stroke-width="1.5"/><path d="M158 88Q200 76 242 88L242 78Q200 66 158 78Z" fill="${shade(p.c, -0.15)}"/>` +
    `<circle cx="200" cy="58" r="6" fill="${p.a}"/><circle cx="176" cy="70" r="4" fill="#43a047"/><circle cx="224" cy="70" r="4" fill="#1e88e5"/><circle cx="152" cy="40" r="4" fill="#fff"/><circle cx="248" cy="40" r="4" fill="#fff"/><circle cx="200" cy="30" r="4" fill="#fff"/>`,
}));
def('head', 'flowercrown', 'Flower crown', { color: '#ff8fb1', accent: '#fff59d', warmth: 0 }, p => ({
  main: `<path d="M140 110Q200 70 260 110" stroke="#66bb6a" stroke-width="4" fill="none"/>` + [[146, 104, p.c], [164, 92, p.a], [184, 84, '#b39ddb'], [204, 82, p.c], [224, 86, p.a], [242, 94, '#b39ddb'], [256, 106, p.c]].map(([x, y, c]) => flower(x, y, c, '#ffb300', 5)).join(''),
}));
def('head', 'beanie', 'Beanie', { color: '#5c6bc0', accent: '#ffffff', warmth: 2 }, p => ({
  main: `<path d="M134 122C130 70 164 50 200 50C236 50 270 70 266 122Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.2"/><path d="M130 112Q200 96 270 112L270 132Q200 116 130 132Z" fill="${p.d}"/>` +
    [150, 165, 180, 195, 210, 225, 240, 255].map(x => `<path d="M${x} 108v18" stroke="${p.dd}" stroke-width="1.4" opacity=".6"/>`).join('') + `<circle cx="200" cy="44" r="14" fill="${p.a}"/>`,
}));
def('head', 'sunhat', 'Sun hat', { color: '#f5deb3', accent: '#ff7aa8', warmth: 0 }, p => ({
  main: `<ellipse cx="200" cy="100" rx="112" ry="22" fill="${p.c}" stroke="${p.d}" stroke-width="1.4"/><path d="M146 100C146 54 170 42 200 42C230 42 254 54 254 100Z" fill="${p.c}" stroke="${p.d}" stroke-width="1.4"/><path d="M147 86Q200 96 253 86L254 100Q200 110 146 100Z" fill="${p.a}"/>` + flower(238, 92, '#fff', '#ffd84a', 5),
}));
def('head', 'beret', 'Beret', { color: '#d32f2f', warmth: 1, tags: ['FR'] }, p => ({
  main: `<path d="M136 104C130 72 170 56 214 58C254 62 274 84 262 100C244 110 160 116 136 104Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.2"/><path d="M214 58l4 -8" stroke="${p.d}" stroke-width="3" stroke-linecap="round"/>`,
}));
def('head', 'bow', 'Big bow', { color: '#ff4f8b', warmth: 0 }, p => ({
  main: `<path d="M226 78C236 56 268 52 266 76C266 92 240 92 230 86Z" fill="${p.fill}" stroke="${p.d}"/><path d="M226 78C210 64 186 72 196 92C204 102 224 92 230 86Z" fill="${p.fill}" stroke="${p.d}"/><circle cx="228" cy="82" r="7" fill="${p.d}"/>`,
}));
def('head', 'headband', 'Headband', { color: '#29b6f6', warmth: 0 }, p => ({
  main: `<path d="M140 120C140 76 170 60 200 60C230 60 260 76 260 120" stroke="${p.c}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M140 120C140 76 170 60 200 60C230 60 260 76 260 120" stroke="#fff" stroke-width="2" fill="none" stroke-dasharray="2 8" opacity=".7"/>`,
}));
def('head', 'tikka', 'Maang tikka', { color: '#f2c14e', accent: '#e53935', warmth: 0, tags: ['IN'] }, p => ({
  main: `<path d="M200 62C200 80 200 96 200 108" stroke="${p.c}" stroke-width="2" stroke-dasharray="2 1.5"/><circle cx="200" cy="114" r="7" fill="${p.c}" stroke="${shade(p.c, -0.3)}"/><circle cx="200" cy="114" r="3.4" fill="${p.a}"/>` +
    [-6, 0, 6].map(dx => `<circle cx="${200 + dx}" cy="${124 - Math.abs(dx) * 0.3}" r="1.6" fill="#fff"/>`).join(''),
}));
def('head', 'frangipani', 'Frangipani flowers', { color: '#ffffff', accent: '#ffd54f', warmth: 0, tags: ['BALI'] }, p => {
  const fr = (x, y, s) => { let o = ''; for (let i = 0; i < 5; i++) o += `<ellipse cx="${x}" cy="${y - 7 * s}" rx="${4.5 * s}" ry="${8 * s}" fill="${p.c}" stroke="#e0d0b0" stroke-width=".8" transform="rotate(${i * 72 + 15} ${x} ${y})"/>`; return o + `<circle cx="${x}" cy="${y}" r="${4 * s}" fill="${p.a}"/>`; };
  return { main: fr(152, 112, 1.1) + fr(140, 132, 0.85) + fr(166, 96, 0.7) };
});
def('head', 'carnival', 'Carnival feathers', { color: '#ff3d7f', accent: '#ffd54f', warmth: 0, unlock: 'BR' }, p => ({
  back: [-60, -36, -12, 12, 36, 60].map((a, i) => `<ellipse cx="200" cy="10" rx="13" ry="46" fill="${i % 2 ? p.a : p.c}" transform="rotate(${a} 200 86)"/>`).join(''),
  main: `<path d="M150 98Q200 72 250 98L250 86Q200 60 150 86Z" fill="${gold}" stroke="${goldD}"/>` + [170, 200, 230].map(x => `<circle cx="${x}" cy="${x === 200 ? 74 : 82}" r="5" fill="#00e5ff"/>`).join(''),
}));
def('head', 'earmuffs', 'Earmuffs', { color: '#f48fb1', accent: '#ffffff', warmth: 2 }, p => ({
  main: `<path d="M140 146C132 70 268 70 260 146" stroke="${p.d}" stroke-width="5" fill="none"/>` + both(`<circle cx="140" cy="150" r="17" fill="${p.a}"/><circle cx="140" cy="150" r="12" fill="${p.c}"/>`),
}));
def('head', 'kittyears', 'Kitty ears', { color: '#ffffff', accent: '#ff9ec7', warmth: 0, unlock: 'JP' }, p => ({
  main: `<path d="M144 116C150 70 186 64 200 62C214 64 250 70 256 116" stroke="#333" stroke-width="5" fill="none"/>` + both(`<path d="M150 90L156 48L184 76Z" fill="${p.c}" stroke="#333" stroke-width="2"/><path d="M158 82L160 60L176 76Z" fill="${p.a}"/>`),
}));

// ===== Necklaces =====
def('necklace', 'pearls', 'Pearl necklace', { color: '#fffdf5', warmth: 0 }, p => {
  let s = '';
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = 176 + 48 * t;
    const y = 252 + Math.sin(t * Math.PI) * 26;
    s += `<circle cx="${fx(x)}" cy="${fx(y)}" r="3.6" fill="${p.c}" stroke="#d9d0bf" stroke-width=".8"/>`;
  }
  return { main: s };
});
def('necklace', 'heartpendant', 'Heart pendant', { color: '#f2c14e', accent: '#ff4f8b', warmth: 0 }, p => ({
  main: `<path d="M178 250Q200 296 222 250" stroke="${p.c}" stroke-width="1.6" fill="none"/>` + heart(200, 280, 7, p.a, `stroke="${p.c}" stroke-width="1.6"`),
}));
def('necklace', 'temple', 'Temple necklace', { color: '#f2c14e', accent: '#c2185b', warmth: 0, tags: ['IN'] }, p => {
  let s = `<path d="M170 252C176 300 224 300 230 252" stroke="${p.c}" stroke-width="9" fill="none"/>`;
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const x = 172 + 56 * t;
    const y = 258 + Math.sin(t * Math.PI) * 30;
    s += `<circle cx="${fx(x)}" cy="${fx(y)}" r="3.2" fill="${i % 2 ? p.a : '#2e7d32'}"/><path d="M${fx(x)} ${fx(y + 4)}v6" stroke="${p.c}" stroke-width="1.2"/><circle cx="${fx(x)}" cy="${fx(y + 12)}" r="2.2" fill="${p.c}"/>`;
  }
  return { main: s + `<circle cx="200" cy="300" r="7" fill="${p.c}" stroke="${shade(p.c, -0.3)}"/><circle cx="200" cy="300" r="3.6" fill="${p.a}"/>` };
});
def('necklace', 'choker', 'Choker', { color: '#212121', accent: '#ff4f8b', warmth: 0 }, p => ({
  main: `<path d="M184 236Q200 244 216 236" stroke="${p.c}" stroke-width="6" fill="none"/>` + heart(200, 246, 3.4, p.a),
}));
def('necklace', 'beads', 'Rainbow beads', { color: '#ff5252', warmth: 0 }, p => {
  const cols = ['#ff5252', '#ffb74d', '#fff176', '#81c784', '#64b5f6', '#ba68c8'];
  let s = '';
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    s += `<circle cx="${fx(172 + 56 * t)}" cy="${fx(252 + Math.sin(t * Math.PI) * 34)}" r="3.4" fill="${cols[i % 6]}"/>`;
  }
  return { main: s };
});
def('necklace', 'starpendant', 'Star pendant', { color: '#e0e0e0', accent: '#64b5f6', warmth: 0 }, p => ({
  main: `<path d="M178 250Q200 292 222 250" stroke="${p.c}" stroke-width="1.6" fill="none"/>` + star(200, 278, 8, p.a, `stroke="${p.c}" stroke-width="1.4"`),
}));
def('necklace', 'goldcollar', 'Golden collar', { color: '#f2c14e', accent: '#1e88e5', warmth: 0, unlock: 'EG' }, p => ({
  main: [0, 1, 2].map(i => `<path d="M${168 - i * 6} ${252 + i * 2}C${172 - i * 6} ${300 + i * 12} ${228 + i * 6} ${300 + i * 12} ${232 + i * 6} ${252 + i * 2}" stroke="${[p.c, p.a, '#e53935'][i]}" stroke-width="7" fill="none"/>`).join(''),
}));

// ===== Earrings =====
const ear = svg => ({ main: both(svg) });
def('earrings', 'studs', 'Sparkle studs', { color: '#e3f2fd', warmth: 0 }, p => ear(sparkle(141, 163, 4.5, p.c) + `<circle cx="141" cy="163" r="1.6" fill="#90caf9"/>`));
def('earrings', 'hoops', 'Gold hoops', { color: '#f2c14e', warmth: 0 }, p => ear(`<circle cx="140" cy="174" r="10" fill="none" stroke="${p.c}" stroke-width="2.6"/>`));
def('earrings', 'jhumka', 'Jhumkas', { color: '#f2c14e', accent: '#c2185b', warmth: 0, tags: ['IN'] }, p => ear(`<circle cx="141" cy="164" r="3.4" fill="${p.a}"/><path d="M141 167v4" stroke="${p.c}" stroke-width="1.4"/><path d="M132 186Q132 172 141 171Q150 172 150 186Z" fill="${p.c}" stroke="${shade(p.c, -0.3)}"/>` + [133, 137, 141, 145, 149].map(x => `<circle cx="${x}" cy="189" r="1.5" fill="#fff"/>`).join('')));
def('earrings', 'pearldrops', 'Pearl drops', { color: '#fffdf5', warmth: 0 }, p => ear(`<path d="M141 164v8" stroke="${gold}" stroke-width="1.4"/><ellipse cx="141" cy="178" rx="4.4" ry="6" fill="${p.c}" stroke="#d9d0bf"/>`));
def('earrings', 'starearrings', 'Star earrings', { color: '#ffd54f', warmth: 0 }, p => ear(`<path d="M141 164v6" stroke="${p.c}" stroke-width="1.4"/>` + star(141, 177, 7, p.c)));
def('earrings', 'heartearrings', 'Heart earrings', { color: '#ff4f8b', warmth: 0 }, p => ear(`<path d="M141 164v6" stroke="${gold}" stroke-width="1.4"/>` + heart(141, 176, 5, p.c)));

// ===== Rings =====
const ringOn = gem => ({ main: both(`<rect x="110.3" y="488" width="6.6" height="2.6" rx="1.2" fill="${gold}"/>${gem}`) });
def('ring', 'diamondring', 'Diamond ring', { color: '#e3f2fd', warmth: 0 }, p => ringOn(`<path d="M113.6 483.5l2.6 3-2.6 3-2.6-3z" fill="${p.c}" stroke="#90caf9" stroke-width=".6"/>`));
def('ring', 'rubyring', 'Ruby ring', { color: '#e53935', warmth: 0 }, p => ringOn(`<circle cx="113.6" cy="487" r="2.6" fill="${p.c}"/>`));
def('ring', 'emeraldring', 'Emerald ring', { color: '#2e7d32', warmth: 0 }, p => ringOn(`<rect x="111.4" y="484.6" width="4.4" height="4.4" rx=".8" fill="${p.c}"/>`));
def('ring', 'heartring', 'Heart ring', { color: '#ff4f8b', warmth: 0 }, p => ringOn(heart(113.6, 487, 2.6, p.c)));

// ===== Bracelets =====
def('bracelet', 'bangles', 'Bangles', { color: '#f2c14e', accent: '#e53935', warmth: 0, tags: ['IN'] }, p => ({
  main: both([0, 1, 2, 3, 4].map(i => `<ellipse cx="${fx(118.5 - i * 0.6)}" cy="${438 + i * 4.4}" rx="12" ry="3" fill="none" stroke="${[p.c, p.a, p.c, '#43a047', p.c][i]}" stroke-width="2.6"/>`).join('')),
}));
def('bracelet', 'charm', 'Charm bracelet', { color: '#e0e0e0', accent: '#ff4f8b', warmth: 0 }, p => ({
  main: both(`<ellipse cx="117.5" cy="452" rx="11" ry="3" fill="none" stroke="${p.c}" stroke-width="2"/>${heart(112, 459, 2.6, p.a)}${star(122, 459, 3, '#ffd54f')}`),
}));
def('bracelet', 'watch', 'Watch', { color: '#ff80ab', accent: '#ffffff', warmth: 0 }, p => ({
  main: `<path d="M106 448Q118 454 130 448L129 456Q118 462 107 456Z" fill="${p.c}"/><circle cx="118" cy="452" r="6" fill="${p.a}" stroke="${p.c}" stroke-width="2"/><path d="M118 452v-3.4M118 452h2.6" stroke="#333" stroke-width="1"/>`,
}));
def('bracelet', 'pearlbracelet', 'Pearl bracelet', { color: '#fffdf5', warmth: 0 }, p => ({
  main: both([0, 1, 2, 3, 4, 5].map(i => `<circle cx="${107 + i * 4.4}" cy="${452 + Math.sin(i / 5 * Math.PI) * 3}" r="2.4" fill="${p.c}" stroke="#d9d0bf" stroke-width=".6"/>`).join('')),
}));

// ===== Glasses =====
def('glasses', 'sunglasses', 'Sunglasses', { color: '#212121', accent: '#ff4f8b', warmth: 0 }, p => ({
  main: both(`<path d="M163 142Q178 138 192 142L192 156Q178 168 164 156Z" fill="${p.c}" opacity=".88" stroke="${p.a}" stroke-width="2.4"/><path d="M168 146l6 0" stroke="#fff" stroke-width="2" opacity=".6"/>`) + `<path d="M192 146Q200 142 208 146" stroke="${p.a}" stroke-width="2.4" fill="none"/>`,
}));
def('glasses', 'heartglasses', 'Heart glasses', { color: '#ff4f8b', warmth: 0 }, p => ({
  main: both(heart(178, 151, 13, p.c, `opacity=".55" stroke="${p.c}" stroke-width="2.4"`)) + `<path d="M190 146Q200 142 210 146" stroke="${p.c}" stroke-width="2.4" fill="none"/>`,
}));
def('glasses', 'roundglasses', 'Round glasses', { color: '#8d6e63', warmth: 0 }, p => ({
  main: both(`<circle cx="178" cy="152" r="14" fill="#e3f2fd" fill-opacity=".25" stroke="${p.c}" stroke-width="2.4"/>`) + `<path d="M192 150Q200 146 208 150" stroke="${p.c}" stroke-width="2.4" fill="none"/>`,
}));
def('glasses', 'starglasses', 'Star glasses', { color: '#ffd54f', warmth: 0, unlock: 'AU' }, p => ({
  main: both(star(178, 152, 17, p.c, `opacity=".7" stroke="${shade(p.c, -0.3)}" stroke-width="2"`)) + `<path d="M192 148Q200 144 208 148" stroke="${shade(p.c, -0.3)}" stroke-width="2.4" fill="none"/>`,
}));

// ===== Things to hold (right hand, around x 282) =====
def('prop', 'handbag', 'Handbag', { color: '#ff7aa8', accent: '#f2c14e', warmth: 0 }, p => ({
  main: `<path d="M272 484Q286 452 300 484" stroke="${p.d}" stroke-width="3" fill="none"/><path d="M262 486L310 486L316 530Q286 538 256 530Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.4"/><path d="M262 486L310 486L286 504Z" fill="${p.d}" opacity=".5"/><circle cx="286" cy="504" r="3.4" fill="${p.a}"/>`,
}));
def('prop', 'umbrella', 'Umbrella', { color: '#4fc3f7', accent: '#ffffff', pattern: 'dots', warmth: 0 }, p => ({
  main: `<path d="M286 484L318 150" stroke="#6d4c41" stroke-width="3.4"/><path d="M286 484q-2 12 -10 10" stroke="#6d4c41" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M222 160C226 96 270 64 320 66C370 68 410 106 412 166C398 152 382 152 370 166C356 152 338 152 322 166C306 152 288 152 272 166C258 152 238 150 222 160Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.6"/>` +
    `<path d="M320 66C300 100 296 130 296 160M320 66C340 100 346 130 346 160" stroke="${p.d}" stroke-width="1.4" fill="none"/>`,
}));
def('prop', 'fan', 'Fan', { color: '#ff80ab', accent: '#ffffff', pattern: 'floral', warmth: 0, tags: ['KR', 'JP', 'ES'] }, p => ({
  main: `<path d="M284 482L250 420A70 70 0 0 1 330 404Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.6"/>` + [0, 1, 2, 3, 4].map(i => { const a = (-118 + i * 14) * Math.PI / 180; return `<path d="M284 482L${fx(284 + Math.cos(a) * 80)} ${fx(482 + Math.sin(a) * 80)}" stroke="${p.d}" stroke-width=".8"/>`; }).join('') + `<circle cx="284" cy="482" r="3" fill="${gold}"/>`,
}));
def('prop', 'lantern', 'Lantern', { color: '#e53935', accent: '#f2c14e', warmth: 0, tags: ['TW'] }, p => ({
  main: `<path d="M284 482L330 400" stroke="#6d4c41" stroke-width="3" stroke-linecap="round"/><path d="M330 400v14" stroke="${p.a}" stroke-width="1.4"/>` +
    `<rect x="318" y="412" width="24" height="5" rx="2" fill="${p.a}"/><ellipse cx="330" cy="440" rx="22" ry="24" fill="${p.c}" stroke="${p.d}"/><path d="M322 418q-8 22 0 44M338 418q8 22 0 44M330 416v48" stroke="${p.d}" stroke-width="1.2" fill="none"/>` +
    `<rect x="318" y="462" width="24" height="5" rx="2" fill="${p.a}"/><path d="M326 468v14M330 468v16M334 468v14" stroke="${p.a}" stroke-width="1.4"/><ellipse cx="330" cy="440" rx="10" ry="12" fill="#fff59d" opacity=".35"/>`,
}));
def('prop', 'sparkler', 'Diwali sparkler', { color: '#ffd54f', warmth: 0, tags: ['IN'] }, p => ({
  main: `<path d="M286 484L322 404" stroke="#757575" stroke-width="2.4"/>` + [[322, 400, 7], [334, 392, 4], [312, 390, 4], [330, 412, 3.4], [318, 382, 3], [342, 404, 3], [326, 380, 2.6]].map(([x, y, r]) => sparkle(x, y, r * 1.6, p.c)).join('') + `<circle cx="322" cy="402" r="4" fill="#fff"/>`,
}));
def('prop', 'bouquet', 'Flower bouquet', { color: '#ff8fb1', accent: '#fff59d', warmth: 0 }, p => ({
  main: `<path d="M276 488L296 488L290 530L282 530Z" fill="#66bb6a"/>` + [[274, 470, p.c], [292, 466, p.a], [284, 454, '#b39ddb'], [268, 456, p.a], [300, 452, p.c], [286, 440, '#ff7043']].map(([x, y, c]) => flower(x, y, c, '#ffb300', 6)).join(''),
}));
def('prop', 'balloon', 'Balloon', { color: '#ff5252', warmth: 0 }, p => ({
  main: `<path d="M284 480C300 420 290 360 312 300" stroke="#999" stroke-width="1.2" fill="none"/><ellipse cx="318" cy="258" rx="32" ry="40" fill="${p.c}"/><path d="M314 298l4 6 4-6z" fill="${p.c}"/><ellipse cx="306" cy="242" rx="7" ry="12" fill="#fff" opacity=".35"/>`,
}));
def('prop', 'wand', 'Star wand', { color: '#ffd54f', accent: '#ff80ab', warmth: 0, unlock: 'TW' }, p => ({
  main: `<path d="M284 482L326 396" stroke="${p.a}" stroke-width="4" stroke-linecap="round"/>` + star(330, 384, 20, p.c, `stroke="${shade(p.c, -0.3)}" stroke-width="2"`) + sparkle(356, 366, 6, '#fff') + sparkle(306, 362, 4, '#fff'),
}));

// ===== Wings =====
def('back', 'fairywings', 'Fairy wings', { color: '#b3e5fc', accent: '#f8bbd0', warmth: 0, unlock: 'KR' }, p => ({
  back: both(`<path d="M190 300C140 200 50 160 40 230C34 280 90 320 180 320Z" fill="${p.c}" opacity=".75" stroke="#fff" stroke-width="2"/><path d="M186 330C120 340 70 400 100 440C130 470 170 410 190 350Z" fill="${p.a}" opacity=".75" stroke="#fff" stroke-width="2"/>`),
}));
def('back', 'butterflywings', 'Butterfly wings', { color: '#ffb74d', accent: '#7e57c2', warmth: 0, unlock: 'SG' }, p => ({
  back: both(`<path d="M190 300C150 190 40 150 30 240C26 300 100 330 186 322Z" fill="${p.c}" stroke="${p.a}" stroke-width="5"/><circle cx="90" cy="240" r="14" fill="${p.a}"/><circle cx="90" cy="240" r="6" fill="#fff"/><path d="M186 330C120 340 60 410 96 450C130 480 172 410 190 350Z" fill="${p.c}" stroke="${p.a}" stroke-width="5"/>`),
}));

// ===== Modest wear and visiting clothes =====
def('head', 'headscarf', 'Headscarf', { color: '#9575cd', accent: '#ffffff', warmth: 1, hidesHair: true, tags: ['AE', 'EG'] }, p => ({
  back: `<path d="M126 150C118 60 282 60 274 150C282 220 294 280 304 318Q200 334 96 318C106 280 118 220 126 150Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.2"/>`,
  main: `<path fill-rule="evenodd" d="M132 152C126 74 160 58 200 58C240 58 274 74 268 152C270 202 258 236 240 258C262 272 272 292 274 318Q200 340 126 318C128 292 138 272 160 258C142 236 130 202 132 152ZM150 142C150 104 174 90 200 90C226 90 250 104 250 142C250 178 236 202 222 212C210 218 190 218 178 212C164 202 150 178 150 142Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.4"/>` +
    `<path d="M160 262Q200 288 240 262M146 292Q200 316 254 292M140 120Q146 96 166 84" stroke="${p.d}" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="236" cy="246" r="4" fill="${p.a}" stroke="${p.d}"/>`,
}));
def('head', 'chunni', 'Chunni (head drape)', { color: '#ff80ab', accent: '#f2c14e', warmth: 0, tags: ['IN'] }, p => ({
  main: `<path d="M126 180C116 90 160 56 200 56C240 56 284 90 274 180C278 260 290 330 296 400L270 404C262 330 256 260 252 190C250 120 228 94 200 94C172 94 150 120 148 190C144 260 138 330 130 404L104 400C110 330 122 260 126 180Z" fill="${p.fill}" opacity=".85" stroke="${p.d}" stroke-width="1"/>` +
    `<path d="M148 190C150 120 172 94 200 94C228 94 250 120 252 190" stroke="${p.a}" stroke-width="3" fill="none"/>` + both(`<path d="M104 400L130 404" stroke="${p.a}" stroke-width="5"/><path d="M108 404l-2 10M116 405l-1 10M124 406l0 10" stroke="${p.a}" stroke-width="2"/>`),
}));
def('outer', 'abaya', 'Abaya', { color: '#24203a', accent: '#f2c14e', warmth: 1, patternable: true, tags: ['AE'] }, p => ({
  main: outline('M172 246L134 258C124 300 126 360 128 420C124 520 110 640 96 766Q200 782 304 766C290 640 276 520 272 420C274 360 276 300 266 258L228 246Q200 262 172 246Z', p.fill, p.dd) +
    `<path d="M200 262V774M172 246Q200 262 228 246M98 754Q200 770 302 754" stroke="${p.a}" stroke-width="3" fill="none"/>` + [320, 380, 440, 500, 560, 620, 680].map(y => `<circle cx="200" cy="${y}" r="2.6" fill="${p.a}"/>`).join(''),
  sleeves: both(`<path d="${SLEEVE.bell}" fill="${p.fill}" stroke="${p.dd}" stroke-width="1.2"/><path d="M98 440Q118 456 141 446" stroke="${p.a}" stroke-width="3" fill="none"/>`),
}));
def('outer', 'shawl', 'Shawl', { color: '#ffb74d', accent: '#ffffff', warmth: 2 }, p => ({
  front: both(`<path d="M198 252C170 248 142 254 128 268C114 290 110 330 110 374Q128 386 150 380C152 344 162 314 182 300L200 320Z" fill="${p.fill}" stroke="${p.d}" stroke-width="1.2"/><path d="M112 378l-2 9M120 382l-1 9M128 384l0 9M136 384l1 9M144 383l2 9" stroke="${p.d}" stroke-width="2"/>`) +
    `<circle cx="200" cy="316" r="6" fill="${gold}" stroke="${goldD}"/>`,
}));
def('bottom', 'sarong', 'Sarong & sash', { color: '#2a7f9e', accent: '#f2c14e', pattern: 'paisley', warmth: 1, tags: ['BALI', 'TH'] }, p => ({
  main: outline(skirt(400, 756, 78, { bulge: 12, dip: 4 }), p.fill, p.d) + `<path d="M226 420L218 756" stroke="${p.dd}" stroke-width="2"/>` +
    `<path d="M154 392Q200 410 246 392L250 418Q200 436 150 418Z" fill="${p.a}" stroke="${p.ad}"/><path d="M242 404l16 34-12 4z" fill="${p.a}" stroke="${p.ad}"/>`,
}));

// ===== More traditional outfits =====
def('dress', 'flamenco', 'Flamenco dress', { color: '#e53935', accent: '#ffffff', pattern: 'dots', patternColor: '#ffffff', warmth: 1, tags: ['ES', 'traditional'], from: 'Spain' }, p => {
  const tiers = [[716, 778, 158, 86], [664, 736, 128, 112], [604, 684, 98, 158]];
  const ruffles = tiers.map(([t, h, half, w]) => outline(skirt(t, h, half, { bulge: 6, wave: 13, dip: 2, waist: w }), p.fill, p.d, 1.2) +
    `<path d="M${200 - half} ${h}Q200 ${h + 14} ${200 + half} ${h}" stroke="${p.a}" stroke-width="3" fill="none" opacity=".8"/>`).join('');
  return {
    main: ruffles + outline('M146 462C148 540 156 590 160 622L240 622C244 590 252 540 254 462Z', p.fill, p.d) + outline(bodice('scoop', 470, 3, 0, 0), p.fill, p.d) +
      `<path d="M168 253C176 292 224 292 232 253" stroke="${p.a}" stroke-width="3" fill="none"/>`,
    sleeves: sleeves('puff', p.fill, p.d) + both(`<path d="M113 306q6 6 12 2q6 6 12 1q6 5 12-1" stroke="${p.a}" stroke-width="2.4" fill="none"/>`),
  };
});
def('dress', 'thai', 'Thai dress', { color: '#7b1fa2', accent: '#ff80ab', pattern: 'solid', warmth: 1, tags: ['TH', 'traditional'], from: 'Thailand' }, p => ({
  back: `<path d="M244 258L272 264L288 520L262 524Z" fill="${p.a}" stroke="${shade(p.a, -0.25)}"/>`,
  main: outline(skirt(400, 758, 72, { bulge: 8, dip: 2 }), p.fill, p.d) +
    `<path d="M180 420L220 420L222 758L178 758Z" fill="${p.d}" opacity=".45"/>` + [188, 196, 204, 212].map(x => `<path d="M${x} 424V754" stroke="${p.dd}" stroke-width="1" opacity=".6"/>`).join('') +
    `<path d="M128 744Q200 768 272 744" stroke="${gold}" stroke-width="9" fill="none"/>` + outline(sweetheart(402), p.fill, p.d) +
    `<path d="M154 394Q200 404 246 394L246 410Q200 420 154 410Z" fill="${gold}" stroke="${goldD}"/><rect x="190" y="394" width="20" height="18" rx="3" fill="${gold}" stroke="${goldD}"/>`,
  front: outline('M150 396L186 406L264 272L256 256L232 258Z', p.a, shade(p.a, -0.25)) + `<path d="M186 406L264 272M150 396L232 258" stroke="${gold}" stroke-width="3"/>` +
    [[196, 360], [214, 330], [232, 300], [178, 372]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${gold}"/>`).join(''),
}));

// ===== Destination extras =====
def('head', 'fascinator', 'Fascinator hat', { color: '#1f3a8a', accent: '#ff8fc8', warmth: 0, tags: ['UK'] }, p => ({
  main: `<g transform="rotate(-15 236 92)"><path d="M232 90C228 62 238 40 254 30C244 50 242 70 242 90Z" fill="${p.a}"/><path d="M236 92C244 60 262 44 276 40C262 56 254 72 246 92Z" fill="${p.c}" opacity=".85"/><ellipse cx="236" cy="94" rx="24" ry="9" fill="${p.c}"/>` +
    `<path d="M212 94Q218 112 236 114Q252 112 260 96" fill="none" stroke="${p.d}" stroke-dasharray="2 2"/>${flower(224, 92, p.a, '#fff', 3.4)}</g>`,
}));
def('head', 'libertycrown', 'Liberty crown', { color: '#7fc8a9', warmth: 0, unlock: 'US' }, p => {
  let spikes = '';
  for (let i = 0; i < 7; i++) {
    const a = (-150 + i * 20) * Math.PI / 180;
    const pt2 = r => `${fx(200 + Math.cos(a) * r)} ${fx(150 + Math.sin(a) * r)}`;
    const side = (r, da) => `${fx(200 + Math.cos(a + da) * r)} ${fx(150 + Math.sin(a + da) * r)}`;
    spikes += `<path d="M${side(70, -0.07)}L${pt2(122)}L${side(70, 0.07)}Z" fill="${p.c}" stroke="${shade(p.c, -0.3)}" stroke-width="1.2"/>`;
  }
  return { main: spikes + `<path d="M144 112Q200 82 256 112L256 98Q200 68 144 98Z" fill="${p.c}" stroke="${shade(p.c, -0.3)}" stroke-width="1.2"/>` + [170, 185, 200, 215, 230].map(x => `<circle cx="${x}" cy="${x === 200 ? 86 : 90}" r="2.6" fill="${shade(p.c, 0.5)}"/>`).join('') };
});
def('head', 'flamencoflower', 'Flamenco rose', { color: '#e53935', warmth: 0, tags: ['ES'] }, p => ({
  back: `<path d="M176 74Q200 14 224 74Z" fill="#3e2723"/><path d="M188 60q12-24 24 0" stroke="#6d4c41" stroke-width="3" fill="none"/>`,
  main: `<path d="M226 104l-14 10 6-14zM252 104l14 8-14 0z" fill="#43a047"/><circle cx="240" cy="96" r="15" fill="${p.c}"/><circle cx="240" cy="96" r="10" fill="${shade(p.c, -0.15)}"/><path d="M234 96a6 6 0 1 1 6 6a3 3 0 1 1-3-3" stroke="${shade(p.c, -0.4)}" stroke-width="1.6" fill="none"/>`,
}));
def('prop', 'castanets', 'Castanets', { color: '#6d4c41', accent: '#e53935', warmth: 0, unlock: 'ES' }, p => ({
  main: `<path d="M282 478q-6-10 4-14q10 2 6 14" stroke="${p.a}" stroke-width="2" fill="none"/><ellipse cx="282" cy="490" rx="10" ry="12" fill="${p.c}"/><ellipse cx="294" cy="494" rx="10" ry="12" fill="${shade(p.c, 0.15)}"/><ellipse cx="292" cy="490" rx="4" ry="5" fill="${shade(p.c, 0.35)}" opacity=".5"/>`,
}));

// ===== Boutique (bought with coins) =====
def('head', 'unicornband', 'Unicorn headband', { color: '#ffffff', accent: '#f2c14e', warmth: 0, price: 25 }, p => ({
  main: `<path d="M140 120C140 76 170 60 200 60C230 60 260 76 260 120" stroke="#ff9ec7" stroke-width="7" fill="none" stroke-linecap="round"/>` + both(`<path d="M158 82L150 54L176 72Z" fill="${p.c}" stroke="#e0c6d6" stroke-width="1.5"/><path d="M160 76L156 62L170 72Z" fill="#ffc6e0"/>`) +
    `<path d="M190 66L200 14L210 66Z" fill="${p.a}" stroke="${shade(p.a, -0.3)}" stroke-width="1.2"/><path d="M193 54l14-4M195 42l10-3M197 30l6-2" stroke="${shade(p.a, -0.3)}" stroke-width="1.4"/>` + flower(178, 68, '#b39ddb', '#fff59d', 4) + flower(222, 68, '#80deea', '#fff59d', 4),
}));
def('head', 'bunnyears', 'Bunny ears', { color: '#ffffff', accent: '#ffb3d1', warmth: 0, price: 20 }, p => ({
  main: `<path d="M140 120C140 76 170 60 200 60C230 60 260 76 260 120" stroke="${shade(p.c, -0.1)}" stroke-width="6" fill="none"/>` +
    both(`<ellipse cx="176" cy="34" rx="12" ry="34" fill="${p.c}" stroke="#ddd" transform="rotate(-12 176 34)"/><ellipse cx="176" cy="38" rx="6" ry="24" fill="${p.a}" transform="rotate(-12 176 38)"/>`),
}));
def('dress', 'galaxy', 'Galaxy gown', { color: '#2c2a6b', accent: '#b388ff', pattern: 'stars', patternColor: '#fff59d', warmth: 1, price: 40 }, p => ({
  main: outline(skirt(396, 768, 132, { bulge: 40, wave: 22, dip: 4 }), p.fill, p.dd) + folds(404, 768, 132, 8, p.l, 1.2, 44) + outline(bodice('v', 402, 3, 0), p.fill, p.dd) +
    `<path d="M159 394Q200 404 241 394L242 406Q200 416 158 406Z" fill="${p.a}"/>` + star(200, 400, 8, '#fff59d'),
  sleeves: sleeves('puff', p.fill, p.dd),
}));
def('shoes', 'glassslippers', 'Glass slippers', { color: '#d6f0ff', warmth: 0, price: 25 }, p => ({
  main: footShoe('M166 752C163 760 164 768 171 771C178 773 187 772 190 768C192 762 191 756 189 751Q178 758 166 752Z', p.c, '#90caf9', `<path d="M168 754Q178 762 188 754" stroke="#fff" stroke-width="2" fill="none"/>` + sparkle(182, 762, 4, '#fff')),
}));
def('prop', 'heartpurse', 'Heart purse', { color: '#ff4f8b', warmth: 0, price: 15 }, p => ({
  main: `<path d="M276 480Q286 456 296 480" stroke="${p.d}" stroke-width="3" fill="none"/>` + heart(286, 506, 22, p.c, `stroke="${p.d}" stroke-width="1.6"`) + `<circle cx="286" cy="496" r="3" fill="${gold}"/>`,
}));

// ===== Pets (stand by the doll's feet) =====
const eyes2 = (x1, x2, y, r = 2.6) => [x1, x2].map(x => `<circle cx="${x}" cy="${y}" r="${r}" fill="#222"/><circle cx="${x + 0.9}" cy="${y - 0.9}" r="${r * 0.35}" fill="#fff"/>`).join('');
const dog = (p, pointy) => ({
  main: `<path d="M360 736q14-6 12-22" stroke="${p.c}" stroke-width="${pointy ? 10 : 6}" fill="none" stroke-linecap="round"/>` +
    [304, 318, 340, 354].map(x => `<rect x="${x}" y="752" width="9" height="20" rx="4.5" fill="${p.c}"/><ellipse cx="${x + 4.5}" cy="772" rx="5.5" ry="3.4" fill="${p.a}"/>`).join('') +
    `<ellipse cx="332" cy="744" rx="34" ry="19" fill="${p.c}"/><ellipse cx="310" cy="748" rx="13" ry="14" fill="${p.a}"/>` +
    (pointy ? `<path d="M290 704L286 680L302 696ZM318 704L324 680L310 696Z" fill="${p.c}"/><path d="M291 700L289 688L298 697ZM317 700L320 688L313 697Z" fill="#ffb3c6"/>` : '') +
    `<circle cx="304" cy="716" r="20" fill="${p.c}"/><ellipse cx="302" cy="726" rx="11" ry="8" fill="${p.a}"/>` +
    (pointy ? '' : `<ellipse cx="286" cy="718" rx="6" ry="13" fill="${p.d}" transform="rotate(15 286 718)"/><ellipse cx="322" cy="718" rx="6" ry="13" fill="${p.d}" transform="rotate(-15 322 718)"/>`) +
    eyes2(296, 312, 712) + `<ellipse cx="303" cy="720" rx="3.6" ry="2.6" fill="#333"/><path d="M299 726q4 4 8 0" stroke="#333" stroke-width="1.2" fill="none"/><path d="M302 728q2 6 4 0" fill="#ff7a9a"/><path d="M290 734Q304 742 318 734" stroke="#e53935" stroke-width="4" fill="none"/><circle cx="304" cy="740" r="3" fill="${gold}"/>`,
});
def('pet', 'corgi', 'Corgi', { color: '#e8984a', accent: '#ffffff', warmth: 0, unlock: 'UK', patternable: false }, p => dog(p, true));
def('pet', 'puppy', 'Puppy', { color: '#a1704b', accent: '#fff3e0', warmth: 0, price: 30, patternable: false }, p => dog(p, false));
def('pet', 'kitten', 'Kitten', { color: '#b0bec5', accent: '#ffffff', warmth: 0, price: 30, patternable: false }, p => ({
  main: `<path d="M346 766C372 762 376 730 360 724" stroke="${p.c}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
    `<path d="M308 774C294 772 294 742 310 730C326 720 348 730 350 752C352 770 344 774 330 774Z" fill="${p.c}"/><ellipse cx="322" cy="758" rx="12" ry="14" fill="${p.a}"/>` +
    `<path d="M304 700L300 678L316 692ZM334 700L340 678L324 692Z" fill="${p.c}"/><path d="M305 696L303 684L312 692ZM333 696L336 684L328 692Z" fill="#ffb3c6"/>` +
    `<circle cx="320" cy="710" r="18" fill="${p.c}"/><path d="M316 694v6M320 693v7M324 694v6" stroke="${p.d}" stroke-width="1.6"/>` +
    [[313, 708], [327, 708]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="3.6" fill="#43a047"/><ellipse cx="${x}" cy="${y}" rx="1" ry="2.6" fill="#111"/>`).join('') +
    `<path d="M318 716l2 2 2-2z" fill="#ff7a9a"/><path d="M296 716h12M296 720l12-2M332 716h12M332 718l12 2" stroke="#666" stroke-width=".8"/>`,
}));
def('pet', 'bunny', 'Bunny', { color: '#ffffff', accent: '#ffb3c6', warmth: 0, price: 30, patternable: false }, p => ({
  main: `<circle cx="356" cy="752" r="8" fill="#fff" stroke="#eee"/><ellipse cx="332" cy="750" rx="26" ry="22" fill="${p.c}" stroke="#eee"/>` +
    `<ellipse cx="310" cy="690" rx="6" ry="20" fill="${p.c}" stroke="#eee" transform="rotate(-10 310 690)"/><ellipse cx="310" cy="692" rx="3" ry="14" fill="${p.a}" transform="rotate(-10 310 692)"/>` +
    `<ellipse cx="328" cy="688" rx="6" ry="20" fill="${p.c}" stroke="#eee" transform="rotate(10 328 688)"/><ellipse cx="328" cy="690" rx="3" ry="14" fill="${p.a}" transform="rotate(10 328 690)"/>` +
    `<circle cx="318" cy="718" r="17" fill="${p.c}" stroke="#eee"/>` + eyes2(311, 325, 715, 2.4) + `<path d="M316 722l2 2 2-2z" fill="${p.a}"/><ellipse cx="318" cy="770" rx="10" ry="4" fill="${p.c}" stroke="#eee"/>`,
}));
def('pet', 'unicorn', 'Unicorn plush', { color: '#ffffff', accent: '#f2c14e', warmth: 0, price: 50, patternable: false }, p => {
  const mane = ['#ff8fb1', '#ffd54f', '#81d4fa', '#b39ddb'];
  return {
    main: `<path d="M362 738q16 6 12 26" stroke="#b39ddb" stroke-width="8" fill="none" stroke-linecap="round"/>` + [306, 318, 342, 354].map(x => `<rect x="${x}" y="748" width="9" height="24" rx="4.5" fill="${p.c}" stroke="#e8e0f0"/><rect x="${x}" y="766" width="9" height="6" rx="2" fill="#f8bbd0"/>`).join('') +
      `<ellipse cx="332" cy="744" rx="32" ry="18" fill="${p.c}" stroke="#e8e0f0"/><path d="M308 734L302 708L318 704L324 734Z" fill="${p.c}" stroke="#e8e0f0"/>` +
      `<ellipse cx="302" cy="702" rx="16" ry="12" fill="${p.c}" stroke="#e8e0f0" transform="rotate(-20 302 702)"/>` + mane.map((c, i) => `<circle cx="${318 + i * 3}" cy="${694 + i * 9}" r="6" fill="${c}"/>`).join('') +
      `<path d="M300 690L306 664L312 690Z" fill="${p.a}"/><circle cx="296" cy="700" r="2.4" fill="#222"/><ellipse cx="290" cy="708" rx="4" ry="3" fill="#ffc6e0"/>`,
  };
});
def('pet', 'falcon', 'Falcon', { color: '#8d6e63', accent: '#fff3e0', warmth: 0, unlock: 'AE', patternable: false }, p => ({
  main: `<rect x="326" y="690" width="8" height="82" fill="#6d4c41"/><rect x="306" y="768" width="48" height="8" rx="3" fill="#5d4037"/><rect x="304" y="686" width="52" height="7" rx="3" fill="#795548"/>` +
    `<path d="M322 682L316 700L330 700L326 682ZM336 682L332 700L344 700L340 682Z" fill="${p.d}"/>` +
    `<ellipse cx="330" cy="654" rx="17" ry="28" fill="${p.c}"/><ellipse cx="330" cy="660" rx="10" ry="20" fill="${p.a}"/>` + [[326, 652], [334, 660], [327, 668], [333, 646]].map(([x, y]) => `<path d="M${x - 2} ${y}l2 3 2-3" stroke="${p.d}" stroke-width="1.2" fill="none"/>`).join('') +
    `<path d="M314 640C306 670 312 690 320 698L318 650Z" fill="${p.d}"/><path d="M346 640C354 670 348 690 340 698L342 650Z" fill="${p.d}"/>` +
    `<circle cx="330" cy="624" r="13" fill="${p.c}"/><path d="M322 620Q330 612 338 620Q330 618 322 620Z" fill="${p.d}"/><circle cx="325" cy="623" r="2.4" fill="#222"/><circle cx="335" cy="623" r="2.4" fill="#222"/>` +
    `<path d="M327 628L333 628L330 636Z" fill="#ffca28" stroke="#5d4037" stroke-width=".8"/><path d="M322 686h6M334 686h6" stroke="#ffca28" stroke-width="3" stroke-linecap="round"/>`,
}));
def('pet', 'elephant', 'Baby elephant', { color: '#9e9e9e', accent: '#e53935', warmth: 0, unlock: 'TH', patternable: false }, p => ({
  main: [306, 320, 344, 358].map(x => `<rect x="${x}" y="748" width="12" height="24" rx="5" fill="${p.c}"/>`).join('') +
    `<ellipse cx="336" cy="736" rx="36" ry="26" fill="${p.c}"/><path d="M322 712H354L358 740H318Z" fill="${p.a}"/><path d="M318 740H358" stroke="${gold}" stroke-width="3"/><path d="M322 712H354" stroke="${gold}" stroke-width="3"/>` +
    `<path d="M290 732C276 728 270 712 276 700" stroke="${p.c}" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="302" cy="720" r="20" fill="${p.c}"/>` +
    `<ellipse cx="316" cy="720" rx="13" ry="17" fill="${shade(p.c, -0.1)}"/><ellipse cx="316" cy="720" rx="8" ry="11" fill="#f8bbd0" opacity=".6"/>` + eyes2(296, 296, 714, 2.4) + `<path d="M290 734q-4 4-8 2" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
}));

// ---------- Coverage (for visiting places of worship) ----------

// sh = shoulders, ar = arms to the wrist, kn = knees, lg = legs to the ankle, hr = hair.
const COVER = {
  tee: 'sh', blouse: 'sh', sweater: 'sh ar', hoodie: 'sh ar', kurti: 'sh', breton: 'sh',
  maxi: 'kn lg', jeans: 'kn lg', leggings: 'kn lg', sarong: 'kn lg',
  gown: 'kn lg', mermaid: 'kn lg', maxidress: 'sh kn lg', galaxy: 'sh kn lg',
  saree: 'sh kn lg', lehenga: 'sh kn lg', pavadai: 'sh kn lg', anarkali: 'sh ar kn lg', hanbok: 'sh ar kn lg', qipao: 'sh kn',
  kebaya: 'sh ar kn lg', balinese: 'sh ar kn lg', kimono: 'sh ar kn lg', flamenco: 'sh kn lg', thai: 'kn lg',
  denim: 'sh ar', puffer: 'sh ar', raincoat: 'sh ar', cardigan: 'sh ar', dupatta: 'sh', shawl: 'sh', abaya: 'sh ar kn lg',
  headscarf: 'hr', chunni: 'hr',
};
for (const item of ITEMS) item.cover = (COVER[item.id] || '').split(' ').filter(Boolean);

export function coverage(L) {
  const c = new Set();
  for (const slot of ['top', 'bottom', 'dress', 'outer', 'head']) {
    const item = L[slot] && getItem(L[slot].id);
    if (item) item.cover.forEach(t => c.add(t));
  }
  if (c.has('ar')) c.add('sh');
  if (c.has('lg')) c.add('kn');
  return c;
}

// ---------- Lookups ----------

const BY_ID = new Map(ITEMS.map(i => [i.id, i]));
export const getItem = id => BY_ID.get(id);
export const allItems = () => ITEMS.slice();
export const itemsForSlot = slot => ITEMS.filter(i => i.slot === slot);

// Starting colours/pattern for an item that is put on fresh.
export function freshWorn(item) {
  return { id: item.id, color: item.color, accent: item.accent, pattern: item.pattern || 'solid', patternColor: item.patternColor };
}

// Thumbnail view boxes per slot (and per-item overrides) for wardrobe buttons.
const THUMB = {
  top: '100 230 200 220', bottom: '90 380 220 380', dress: '40 220 320 560', outer: '80 210 240 420', socks: '140 580 120 200', shoes: '150 630 100 150',
  scarf: '140 220 120 180', head: '110 20 180 140', necklace: '150 230 100 100', earrings: '120 140 60 60', ring: '102 474 24 24', bracelet: '96 430 44 40',
  glasses: '150 120 100 60', prop: '210 50 210 500', back: '20 140 360 340', pet: '240 560 170 230',
};
const THUMB_ITEM = { umbrella: '210 50 210 460', handbag: '240 440 90 100', fan: '240 390 100 100', lantern: '270 380 90 110', sparkler: '270 360 90 130', bouquet: '250 420 70 120', balloon: '250 200 100 290', wand: '270 340 110 150', carnival: '90 -40 220 200', cape: '50 220 300 570', abaya: '70 220 260 570', headscarf: '90 40 220 300', chunni: '90 40 220 380', libertycrown: '80 20 240 150', flamencoflower: '150 20 120 110', fascinator: '170 20 120 110', unicornband: '120 0 160 130', bunnyears: '120 -10 160 140', castanets: '262 460 46 50', heartpurse: '250 450 72 90', galaxy: '50 230 300 560', flamenco: '40 230 320 560', mermaid: '90 260 220 520', gown: '40 250 320 540', lehenga: '40 230 320 560' };
export const thumbBox = item => THUMB_ITEM[item.id] || THUMB[item.slot];
