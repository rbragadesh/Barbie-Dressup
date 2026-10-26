// Background scenes, drawn in a 1200 x 900 box. The doll stands in the middle, so
// landmarks sit left or right of centre. Rendered with "slice" so the scene fills
// both landscape and portrait stages.

import { flower } from './svg.js';

const sky = (id, top, bottom) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="1200" height="900" fill="url(#${id})"/>`;
const cloud = (x, y, s = 1, o = 0.9) => `<g opacity="${o}" fill="#fff"><ellipse cx="${x}" cy="${y}" rx="${60 * s}" ry="${26 * s}"/><ellipse cx="${x - 40 * s}" cy="${y + 8 * s}" rx="${40 * s}" ry="${20 * s}"/><ellipse cx="${x + 44 * s}" cy="${y + 6 * s}" rx="${44 * s}" ry="${20 * s}"/></g>`;
const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0C-6 -80 4 -160 18 -230" stroke="#8d6e63" stroke-width="16" fill="none" stroke-linecap="round"/><g fill="#2e9e5b"><path d="M18 -230C-30 -260 -90 -240 -110 -200C-60 -230 -20 -228 18 -230Z"/><path d="M18 -230C60 -270 120 -250 140 -210C90 -238 50 -232 18 -230Z"/><path d="M18 -230C0 -280 30 -320 70 -320C40 -296 26 -262 18 -230Z"/><path d="M18 -230C-40 -220 -70 -180 -70 -150C-40 -190 -10 -214 18 -230Z"/><path d="M18 -230C70 -224 100 -186 100 -156C76 -196 44 -216 18 -230Z"/></g><circle cx="12" cy="-226" r="9" fill="#795548"/><circle cx="26" cy="-222" r="8" fill="#795548"/></g>`;
const blossomTree = (x, y, s = 1, c = '#ffb7d0') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0L-6 -120M-4 -80L-50 -150M-2 -100L40 -170" stroke="#6d4c41" stroke-width="14" stroke-linecap="round"/>${[[-60, -170, 60], [10, -200, 70], [60, -170, 55], [-20, -150, 55], [40, -130, 45], [-70, -120, 40]].map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`).join('')}${[[-50, -190], [20, -220], [70, -160], [-10, -130], [-80, -140]].map(([cx, cy]) => flower(cx, cy, '#fff', '#ff80ab', 5)).join('')}</g>`;
const pine = (x, y, s = 1, snow = false) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-8" y="-30" width="16" height="30" fill="#6d4c41"/><path d="M0 -200L-60 -90L-30 -90L-80 -30L80 -30L30 -90L60 -90Z" fill="#2e7d32"/>${snow ? '<path d="M0 -200L-30 -145L-10 -150L0 -140L12 -152L30 -145Z M-58 -92L-30 -92L-46 -80Z M58 -92L30 -92L46 -80Z" fill="#fff"/>' : ''}</g>`;
const diya = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-18 0Q0 18 18 0Z" fill="#bf5b2c"/><path d="M-18 0L18 0" stroke="#8d3a14" stroke-width="3"/><path d="M0 -4C-6 -14 -2 -24 0 -30C2 -24 6 -14 0 -4Z" fill="#ffca28"/><circle cx="0" cy="-12" r="16" fill="#ffd54f" opacity=".25"/></g>`;
const lantern = (x, y, s = 1, c = '#e53935') => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="22" ry="26" fill="${c}"/><rect x="-12" y="-30" width="24" height="6" rx="2" fill="#f2c14e"/><rect x="-12" y="24" width="24" height="6" rx="2" fill="#f2c14e"/><ellipse cx="0" cy="0" rx="10" ry="16" fill="#fff59d" opacity=".4"/><circle cx="0" cy="0" r="40" fill="#ffca28" opacity=".12"/></g>`;

const SCENES = {
  studio: {
    name: 'Dressing room', emoji: '🪞',
    draw: () => `${sky('st', '#ffe3f1', '#f7d6ff')}
      <g opacity=".35">${Array.from({ length: 12 }, (_, i) => Array.from({ length: 9 }, (_, j) => `<circle cx="${i * 100 + (j % 2) * 50 + 25}" cy="${j * 70 + 30}" r="5" fill="#fff"/>`).join('')).join('')}</g>
      <rect x="120" y="140" width="250" height="300" rx="20" fill="#bfe9ff" stroke="#fff" stroke-width="14"/>${cloud(220, 230, 0.8)}<path d="M120 140h250v40H120z" fill="#ff9ec7"/><path d="M110 150Q150 300 130 450L176 450Q160 300 196 150Z" fill="#ff7aa8"/><path d="M380 150Q340 300 360 450L314 450Q330 300 294 150Z" fill="#ff7aa8"/>
      <rect x="850" y="110" width="230" height="420" rx="115" fill="#e9f6ff" stroke="#f2c14e" stroke-width="16"/>${Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI; return `<circle cx="${965 - Math.cos(a) * 130}" cy="${225 - Math.sin(a) * 120}" r="9" fill="#fff7b0" stroke="#f2c14e" stroke-width="3"/>`; }).join('')}
      <path d="M0 640H1200V900H0Z" fill="#f3c5d9"/><ellipse cx="600" cy="790" rx="420" ry="70" fill="#ffd6ec" stroke="#fff" stroke-width="6"/><ellipse cx="600" cy="790" rx="330" ry="48" fill="none" stroke="#ff9ec7" stroke-width="4" stroke-dasharray="14 10"/>
      <path d="M40 200H300" stroke="#b39ddb" stroke-width="8"/><path d="M60 200V640M280 200V640" stroke="#b39ddb" stroke-width="8"/>`,
    floorY: 640,
  },
  beach: {
    name: 'Beach', emoji: '🏖️',
    draw: () => `${sky('bs', '#7fd3ff', '#d6f3ff')}<circle cx="980" cy="140" r="70" fill="#ffe066"/>${cloud(250, 150)}${cloud(700, 110, 0.7)}
      <path d="M0 520H1200V650H0Z" fill="#2ab0e6"/><path d="M0 560Q150 545 300 560T600 560T900 560T1200 560" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/>
      <path d="M0 640Q300 600 600 630T1200 620V900H0Z" fill="#ffe0a3"/>${palm(170, 720, 1.1)}${palm(1080, 700, 0.9)}
      <path d="M880 760L920 560" stroke="#8d6e63" stroke-width="6"/><path d="M800 590Q920 480 1040 590Z" fill="#ff7aa8"/><path d="M860 590Q920 500 980 590" fill="#fff" opacity=".6"/>
      <circle cx="320" cy="800" r="16" fill="#ff8a65"/><path d="M300 820l40 0" stroke="#e0a96d" stroke-width="3"/>`,
    floorY: 640,
  },
  snow: {
    name: 'Snowy park', emoji: '⛄',
    draw: () => `${sky('sn', '#b3d4ff', '#eef6ff')}${cloud(300, 120, 0.9)}${cloud(900, 160, 1.1)}
      <path d="M0 520Q300 440 600 520T1200 500V900H0Z" fill="#e3f0ff"/>${pine(140, 640, 1.2, true)}${pine(260, 600, 0.9, true)}${pine(1040, 640, 1.3, true)}${pine(940, 590, 0.8, true)}
      <path d="M0 640Q300 610 600 640T1200 630V900H0Z" fill="#fff"/>
      <g transform="translate(860 700)"><circle r="56" fill="#fff" stroke="#cfe0f5" stroke-width="3"/><circle cy="-82" r="38" fill="#fff" stroke="#cfe0f5" stroke-width="3"/><circle cx="-12" cy="-90" r="4"/><circle cx="12" cy="-90" r="4"/><path d="M0 -80l26 6-26 4z" fill="#ff8a00"/><path d="M-36 -54Q0 -40 36 -54" stroke="#e53935" stroke-width="10" fill="none"/></g>`,
    floorY: 640,
  },
  garden: {
    name: 'Flower garden', emoji: '🌷',
    draw: () => `${sky('gd', '#9ee0ff', '#e3f8ff')}<circle cx="1050" cy="120" r="60" fill="#ffe066"/>${cloud(300, 140)}${cloud(780, 110, 0.8)}
      <path d="M0 520Q300 440 600 500T1200 480V900H0Z" fill="#a5d66f"/><path d="M0 640Q300 600 600 630T1200 620V900H0Z" fill="#8bc34a"/>
      ${blossomTree(170, 650, 1.2, '#c5e1a5')}${blossomTree(1060, 650, 1.1, '#ffcdd2')}
      ${Array.from({ length: 28 }, (_, i) => flower(40 + i * 42 + (i % 3) * 8, 690 + (i % 4) * 40, ['#ff80ab', '#ffd54f', '#ce93d8', '#ff8a65'][i % 4], '#fff59d', 9)).join('')}
      <path d="M0 610H1200" stroke="#fff" stroke-width="6"/>${Array.from({ length: 25 }, (_, i) => `<rect x="${i * 50}" y="580" width="12" height="60" rx="5" fill="#fff"/>`).join('')}`,
    floorY: 640,
  },
  rain: {
    name: 'Rainy street', emoji: '🌧️',
    draw: () => `${sky('rn', '#8fa3bf', '#cfd8e3')}${cloud(250, 120, 1.4, 0.8)}${cloud(800, 100, 1.6, 0.8)}
      ${[[80, 300, '#ffab91'], [260, 260, '#ce93d8'], [880, 280, '#90caf9'], [1040, 240, '#ffe082']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="160" height="${640 - y}" fill="${c}"/><path d="M${x - 10} ${y}L${x + 80} ${y - 60}L${x + 170} ${y}Z" fill="#8d6e63"/>${[0, 1].map(i => `<rect x="${x + 25 + i * 70}" y="${y + 40}" width="40" height="50" rx="4" fill="#fff59d"/>`).join('')}`).join('')}
      <path d="M0 640H1200V900H0Z" fill="#78909c"/><ellipse cx="300" cy="760" rx="120" ry="18" fill="#b0bec5"/><ellipse cx="960" cy="820" rx="90" ry="14" fill="#b0bec5"/>`,
    floorY: 640,
  },
  IN: {
    name: 'Taj Mahal, India', emoji: '🕌', country: 'IN',
    draw: () => `${sky('in', '#5e3c99', '#ff9e5e')}${Array.from({ length: 20 }, (_, i) => `<circle cx="${(i * 137) % 1200}" cy="${(i * 71) % 260 + 20}" r="2" fill="#fff" opacity=".7"/>`).join('')}
      <g transform="translate(0 0)"><rect x="40" y="430" width="420" height="200" fill="#f3ecff"/><path d="M150 430C150 330 350 330 350 430Z" fill="#fbf7ff"/><path d="M250 330V300" stroke="#f2c14e" stroke-width="5"/><circle cx="250" cy="296" r="6" fill="#f2c14e"/>
        <path d="M200 630V520Q250 470 300 520V630Z" fill="#d1c4e9"/>${[60, 400].map(x => `<path d="M${x} 630V500Q${x + 20} 470 ${x + 40} 500V630Z" fill="#e1d5f5"/>`).join('')}${[110, 360].map(x => `<path d="M${x} 430C${x} 400 ${x + 30} 400 ${x + 30} 430Z" fill="#fbf7ff"/>`).join('')}
        ${[-10, 490].map(x => `<rect x="${x}" y="380" width="22" height="250" fill="#f8f3ff"/><path d="M${x - 4} 380C${x - 4} 360 ${x + 26} 360 ${x + 26} 380Z" fill="#fbf7ff"/>`).join('')}</g>
      <path d="M0 630H1200V900H0Z" fill="#7cb342"/><path d="M180 640H320V900H180Z" fill="#81d4fa" opacity=".7"/>
      ${[110, 210, 450, 900, 1000, 1100].map((x, i) => diya(x, 860 - (i % 2) * 20)).join('')}
      <g transform="translate(980 740)">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<ellipse rx="70" ry="16" fill="${['#e91e63', '#ffc107', '#4caf50', '#03a9f4'][i % 4]}" transform="rotate(${i * 22.5})" opacity=".85"/>`).join('')}<circle r="22" fill="#fff59d"/></g>`,
    floorY: 630,
  },
  KR: {
    name: 'Palace gate, Seoul', emoji: '🏯', country: 'KR',
    draw: () => `${sky('kr', '#8fd3ff', '#e8f7ff')}${cloud(220, 120)}${cloud(1000, 150, 0.8)}
      <path d="M760 520Q900 380 1080 520Z" fill="#7cb342"/><rect x="928" y="250" width="14" height="200" fill="#eceff1"/><path d="M910 300h50l-6 30h-38z" fill="#b0bec5"/><path d="M935 250v-60" stroke="#90a4ae" stroke-width="4"/>
      <g transform="translate(40 0)"><rect x="40" y="470" width="420" height="160" fill="#c8b8a6"/>${[110, 230, 350].map(x => `<path d="M${x} 630V560Q${x + 30} 520 ${x + 60} 560V630Z" fill="#5d4037"/>`).join('')}
        <rect x="80" y="400" width="340" height="70" fill="#c62828"/>${[100, 160, 220, 280, 340, 390].map(x => `<rect x="${x}" y="400" width="10" height="70" fill="#8e1b1b"/>`).join('')}
        <path d="M20 410Q250 370 480 410L440 370Q250 340 60 370Z" fill="#37474f"/><path d="M80 360Q250 320 420 360L390 320Q250 300 110 320Z" fill="#455a64"/><path d="M110 320H390V340H110Z" fill="#2e7d32"/><path d="M20 410Q0 400 -6 386M480 410Q500 400 506 386" stroke="#37474f" stroke-width="10" fill="none"/></g>
      <path d="M0 630H1200V900H0Z" fill="#d7ccc8"/><path d="M0 640H1200" stroke="#bcaaa4" stroke-width="6"/>
      ${blossomTree(980, 700, 1.3)}${blossomTree(1150, 680, 0.9)}${Array.from({ length: 14 }, (_, i) => `<ellipse cx="${(i * 97) % 1200}" cy="${700 + (i * 37) % 180}" rx="6" ry="4" fill="#ffb7d0"/>`).join('')}`,
    floorY: 630,
  },
  TW: {
    name: 'Taipei 101 at night', emoji: '🏮', country: 'TW',
    draw: () => `${sky('tw', '#141b4d', '#3b2f7a')}${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 89) % 1200}" cy="${(i * 53) % 400}" r="2" fill="#fff" opacity=".8"/>`).join('')}<circle cx="1050" cy="110" r="44" fill="#fff8e1"/>
      ${[[0, 520, 120], [130, 480, 90], [700, 500, 110], [830, 460, 80], [930, 520, 130], [1080, 490, 120]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${640 - y}" fill="#262a5c"/>${Array.from({ length: 6 }, (_, k) => `<rect x="${x + 12 + (k % 3) * (w / 3.5)}" y="${y + 20 + Math.floor(k / 3) * 40}" width="12" height="16" fill="#ffe082" opacity=".7"/>`).join('')}`).join('')}
      <g transform="translate(330 0)"><path d="M0 630V560H80V630Z" fill="#4db6ac"/>${Array.from({ length: 8 }, (_, i) => `<path d="M2 ${560 - i * 46}L-8 ${514 - i * 46}H88L78 ${560 - i * 46}Z" fill="${i % 2 ? '#4fc3b5' : '#26a69a'}" stroke="#80cbc4" stroke-width="2"/>`).join('')}<path d="M14 192L24 160H56L66 192Z" fill="#26a69a"/><path d="M40 160V70" stroke="#b2dfdb" stroke-width="5"/><circle cx="40" cy="400" r="5" fill="#ffd54f"/></g>
      <path d="M0 630H1200V900H0Z" fill="#37305e"/>${[[120, 300, 1], [220, 200, 0.8], [520, 140, 0.7], [700, 260, 0.9], [880, 180, 0.75], [1100, 300, 1.1], [620, 380, 0.6]].map(([x, y, s]) => lantern(x, y, s, '#ff7043')).join('')}
      ${[100, 260, 940, 1100].map(x => lantern(x, 760, 1.2, '#e53935')).join('')}`,
    floorY: 630,
  },
  SG: {
    name: 'Marina Bay, Singapore', emoji: '🦁', country: 'SG',
    draw: () => `${sky('sg', '#ff8a65', '#ffd180')}<circle cx="980" cy="420" r="80" fill="#ffecb3" opacity=".8"/>
      <g fill="#6d6875">${[60, 170, 280].map(x => `<path d="M${x} 640L${x + 20} 360H${x + 70}L${x + 80} 640Z"/>`).join('')}<path d="M40 350Q200 330 380 340L380 362Q200 352 40 372Z" fill="#4a4e69"/></g>
      ${[760, 860, 960, 1080].map((x, i) => `<g transform="translate(${x} 640)"><path d="M-10 0L-8 -${180 + i * 30}H8L10 0Z" fill="#5c6bc0"/><path d="M-60 -${200 + i * 30}Q0 -${150 + i * 30} 60 -${200 + i * 30}Q0 -${170 + i * 30} -60 -${200 + i * 30}Z" fill="#7e57c2"/>${[-40, -15, 15, 40].map(dx => `<circle cx="${dx}" cy="-${195 + i * 30}" r="4" fill="#fff59d"/>`).join('')}</g>`).join('')}
      <path d="M0 600H1200V700H0Z" fill="#4fc3f7"/><path d="M0 620Q300 610 600 620T1200 620" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>
      <g transform="translate(392 600)"><path d="M0 0V-60Q0 -90 30 -90Q60 -90 56 -60L50 0Z" fill="#eceff1"/><circle cx="30" cy="-96" r="22" fill="#eceff1"/><path d="M50 -96Q90 -110 120 -70" stroke="#81d4fa" stroke-width="6" fill="none"/></g>
      <path d="M0 690H1200V900H0Z" fill="#b0bec5"/><path d="M0 690H1200" stroke="#90a4ae" stroke-width="8"/>
      ${[80, 1120].map(x => `<g transform="translate(${x} 860)">${flower(0, -40, '#ce93d8', '#ffd54f', 16)}<path d="M0 -20V0" stroke="#43a047" stroke-width="6"/></g>`).join('')}`,
    floorY: 690,
  },
  BALI: {
    name: 'Rice terraces, Bali', emoji: '🌾', country: 'BALI',
    draw: () => `${sky('bl', '#7fd3ff', '#e0f7fa')}${cloud(260, 120)}${cloud(1000, 90, 0.7)}
      <path d="M720 420L900 220Q930 200 960 220L1160 420Z" fill="#78909c"/><path d="M880 240Q930 200 980 240L960 270Q930 250 900 270Z" fill="#eceff1"/>
      ${[0, 1, 2, 3, 4].map(i => `<path d="M0 ${420 + i * 50}Q300 ${400 + i * 50} 600 ${430 + i * 50}T1200 ${420 + i * 50}V${470 + i * 50}Q900 ${460 + i * 50} 600 ${480 + i * 50}T0 ${470 + i * 50}Z" fill="${['#9ccc65', '#8bc34a', '#7cb342', '#689f38', '#558b2f'][i]}"/>`).join('')}
      <g transform="translate(110 0)">${[0, 1].map(k => `<g transform="${k ? 'translate(420 0) scale(-1 1)' : ''}"><path d="M60 640V440H90V380H120V320H150V260H170V640Z" fill="#a1887f"/><path d="M60 440H170M90 380H170M120 320H170M150 260H170" stroke="#6d4c41" stroke-width="4"/><path d="M150 260L160 230L170 260" fill="#8d6e63"/></g>`).join('')}</g>
      <path d="M0 640H1200V900H0Z" fill="#c5a880"/>${palm(1060, 720, 1)}${palm(60, 760, 0.8)}
      ${[[900, 800], [980, 840]].map(([x, y]) => `<g transform="translate(${x} ${y})"><rect x="-26" y="-10" width="52" height="16" rx="3" fill="#8bc34a"/>${flower(-12, -12, '#fff', '#ffd54f', 7)}${flower(12, -12, '#ff80ab', '#ffd54f', 7)}</g>`).join('')}`,
    floorY: 640,
  },
  JP: {
    name: 'Mount Fuji, Japan', emoji: '🗻', country: 'JP',
    draw: () => `${sky('jp', '#9fd8ff', '#fff0f5')}<circle cx="1040" cy="120" r="56" fill="#ff7043" opacity=".85"/>
      <path d="M560 560L820 220Q850 196 880 220L1160 560Z" fill="#7986cb"/><path d="M780 270L820 220Q850 196 880 220L920 270L890 260L870 280L850 258L830 282L810 260Z" fill="#fff"/>
      <path d="M0 560Q300 520 600 560T1200 550V900H0Z" fill="#aed581"/><path d="M0 640H1200V900H0Z" fill="#c5e1a5"/>
      <g transform="translate(150 0)"><rect x="40" y="380" width="22" height="260" fill="#e53935"/><rect x="238" y="380" width="22" height="260" fill="#e53935"/><path d="M0 360Q150 340 300 360L296 380Q150 362 4 380Z" fill="#c62828"/><rect x="20" y="410" width="260" height="16" fill="#e53935"/><path d="M-10 350Q150 326 310 350" stroke="#263238" stroke-width="10" fill="none"/></g>
      ${blossomTree(1000, 720, 1.2)}${Array.from({ length: 16 }, (_, i) => `<ellipse cx="${(i * 83) % 1200}" cy="${660 + (i * 31) % 200}" rx="6" ry="4" fill="#ffb7d0"/>`).join('')}`,
    floorY: 640,
  },
  FR: {
    name: 'Eiffel Tower, Paris', emoji: '🗼', country: 'FR',
    draw: () => `${sky('fr', '#a7c7e7', '#f3e5f5')}${cloud(700, 120)}${cloud(1050, 170, 0.7)}
      <g transform="translate(260 0)" fill="none" stroke="#6d4c41" stroke-width="6"><path d="M-100 640Q-30 420 -8 160M100 640Q30 420 8 160"/><path d="M-70 520H70M-44 400H44M-24 270H24" stroke-width="10"/><path d="M-100 640Q0 560 100 640" stroke-width="8"/><path d="M0 160V90" stroke-width="5"/>${[-60, -30, 0, 30, 60].map(x => `<path d="M${x * 1.1} 630L${-x * 0.6} 530"/>`).join('')}${[-30, 0, 30].map(x => `<path d="M${x} 510L${-x * 0.6} 410"/>`).join('')}</g>
      ${[[620, 520, '#efebe9'], [760, 480, '#d7ccc8'], [900, 500, '#efebe9'], [1040, 470, '#d7ccc8']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="130" height="${640 - y}" fill="${c}"/><path d="M${x - 6} ${y}L${x + 20} ${y - 40}H${x + 110}L${x + 136} ${y}Z" fill="#78909c"/>${[0, 1, 2].map(i => `<rect x="${x + 16 + i * 38}" y="${y + 30}" width="22" height="34" fill="#90caf9"/>`).join('')}`).join('')}
      <path d="M0 640H1200V900H0Z" fill="#bcaaa4"/>${[60, 1150].map(x => `<g transform="translate(${x} 700)"><path d="M0 0V-120" stroke="#6d4c41" stroke-width="12"/><circle cy="-150" r="70" fill="#ff8a50"/><circle cx="-30" cy="-120" r="40" fill="#ffb74d"/></g>`).join('')}
      ${Array.from({ length: 12 }, (_, i) => `<ellipse cx="${(i * 103) % 1200}" cy="${700 + (i * 29) % 180}" rx="10" ry="5" fill="${i % 2 ? '#ff8a50' : '#ffb74d'}" transform="rotate(${i * 30} ${(i * 103) % 1200} ${700 + (i * 29) % 180})"/>`).join('')}`,
    floorY: 640,
  },
  EG: {
    name: 'Pyramids of Giza', emoji: '🐪', country: 'EG',
    draw: () => `${sky('eg', '#ffcc80', '#fff3e0')}<circle cx="980" cy="150" r="80" fill="#fff59d"/>
      <path d="M40 620L260 300L480 620Z" fill="#e0a85c"/><path d="M260 300L480 620H340Z" fill="#c98f45"/><path d="M380 620L520 410L660 620Z" fill="#e6b06a"/><path d="M520 410L660 620H580Z" fill="#c98f45"/>
      <path d="M0 600Q300 570 600 600T1200 590V900H0Z" fill="#f2c27b"/><path d="M0 720Q400 680 800 720T1200 710V900H0Z" fill="#eab36a" opacity=".7"/>
      <g transform="translate(940 700)" fill="#8d6e63"><ellipse cx="0" cy="-60" rx="70" ry="34"/><ellipse cx="-10" cy="-96" rx="26" ry="20"/><path d="M60 -70Q100 -110 110 -140" stroke="#8d6e63" stroke-width="18" fill="none"/><ellipse cx="116" cy="-146" rx="20" ry="12"/>${[-50, -20, 20, 50].map(x => `<rect x="${x}" y="-40" width="12" height="70" rx="5"/>`).join('')}</g>
      ${palm(1140, 680, 0.8)}`,
    floorY: 640,
  },
  AU: {
    name: 'Sydney Harbour', emoji: '🦘', country: 'AU',
    draw: () => `${sky('au', '#4fc3f7', '#e1f5fe')}<circle cx="1060" cy="110" r="60" fill="#ffe066"/>${cloud(500, 120, 0.8)}
      <path d="M700 520Q900 300 1100 520" stroke="#78909c" stroke-width="22" fill="none"/><path d="M640 520H1180" stroke="#607d8b" stroke-width="16"/>${[760, 820, 880, 940, 1000, 1060].map(x => `<path d="M${x} 520V${520 - Math.sin((x - 700) / 400 * Math.PI) * 170}" stroke="#90a4ae" stroke-width="4"/>`).join('')}
      <path d="M0 540H1200V640H0Z" fill="#039be5"/>
      <g transform="translate(60 0)"><rect x="20" y="500" width="400" height="50" fill="#d7ccc8"/>${[[60, 500, 120, 150], [150, 500, 130, 190], [250, 500, 110, 140], [320, 500, 90, 110]].map(([x, y, w, h]) => `<path d="M${x} ${y}Q${x + w * 0.2} ${y - h} ${x + w} ${y - h * 0.9}Q${x + w * 0.6} ${y - h * 0.4} ${x + w * 0.7} ${y}Z" fill="#fafafa" stroke="#cfd8dc" stroke-width="3"/>`).join('')}</g>
      <path d="M0 640Q300 610 600 630T1200 620V900H0Z" fill="#ffe0a3"/>${palm(1100, 740, 0.8)}
      <text x="160" y="820" font-size="70">🦘</text>`,
    floorY: 640,
  },
  BR: {
    name: 'Rio de Janeiro', emoji: '🎭', country: 'BR',
    draw: () => `${sky('br', '#40c4ff', '#e1f5fe')}<circle cx="160" cy="120" r="60" fill="#ffeb3b"/>${cloud(600, 100, 0.8)}
      <path d="M760 560C780 400 830 260 900 240C960 230 990 330 1000 560Z" fill="#558b2f"/><path d="M960 560C980 470 1020 420 1060 420C1100 420 1120 480 1140 560Z" fill="#689f38"/><path d="M900 260L1040 430" stroke="#9e9e9e" stroke-width="2"/>
      <path d="M0 540H1200V640H0Z" fill="#00b0ff"/>${palm(120, 760, 1)}${palm(260, 720, 0.8)}
      <path d="M0 640Q300 610 600 630T1200 620V900H0Z" fill="#ffe082"/><path d="M0 760Q200 740 400 760T800 760T1200 760" stroke="#000" stroke-width="10" fill="none" stroke-dasharray="30 30" opacity=".25"/>
      ${Array.from({ length: 40 }, (_, i) => `<rect x="${(i * 61) % 1200}" y="${(i * 47) % 560}" width="10" height="6" fill="${['#ff4081', '#ffd740', '#69f0ae', '#40c4ff', '#e040fb'][i % 5]}" transform="rotate(${i * 37} ${(i * 61) % 1200} ${(i * 47) % 560})"/>`).join('')}`,
    floorY: 640,
  },
  US: {
    name: 'New York City', emoji: '🗽', country: 'US',
    draw: () => `${sky('us', '#1a237e', '#7e57c2')}${Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 131) % 1200}" cy="${(i * 67) % 300}" r="2" fill="#fff" opacity=".7"/>`).join('')}
      ${[[680, 260, 90], [780, 200, 70], [860, 300, 100], [970, 230, 80], [1060, 320, 140], [600, 340, 70]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${640 - y}" fill="#283593"/>${Array.from({ length: 8 }, (_, k) => `<rect x="${x + 10 + (k % 3) * (w / 3.4)}" y="${y + 18 + Math.floor(k / 3) * 36}" width="10" height="14" fill="#fff59d" opacity=".75"/>`).join('')}`).join('')}
      <path d="M780 200L815 120L850 200Z" fill="#283593"/><path d="M815 120V80" stroke="#9fa8da" stroke-width="4"/>
      <g transform="translate(250 0)"><path d="M-60 640L-40 520H40L60 640Z" fill="#8d6e63"/><path d="M-30 520L-24 380Q0 360 24 380L30 520Z" fill="#4db6ac"/><circle cx="0" cy="350" r="22" fill="#4db6ac"/>${[-60, -30, 0, 30, 60].map(a => `<path d="M0 340L${(Math.sin(a * Math.PI / 180) * 42).toFixed(1)} ${(340 - Math.cos(a * Math.PI / 180) * 42).toFixed(1)}" stroke="#4db6ac" stroke-width="6"/>`).join('')}<path d="M18 370L40 280" stroke="#4db6ac" stroke-width="12" stroke-linecap="round"/><path d="M36 280L44 250L52 280Z" fill="#ffca28"/><rect x="-36" y="420" width="18" height="40" rx="4" fill="#26a69a"/></g>
      ${[[200, 160, '#ff4081'], [420, 110, '#ffd740'], [560, 190, '#69f0ae'], [960, 120, '#40c4ff']].map(([x, y, c]) => Array.from({ length: 12 }, (_, k) => { const a = k * 30 * Math.PI / 180; return `<path d="M${x} ${y}L${(x + Math.cos(a) * 50).toFixed(1)} ${(y + Math.sin(a) * 50).toFixed(1)}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`; }).join('')).join('')}
      <path d="M0 600H1200V660H0Z" fill="#3949ab"/><path d="M0 640H1200V900H0Z" fill="#9e9e9e"/><path d="M0 700H1200" stroke="#fff" stroke-width="6" stroke-dasharray="40 30"/>`,
    floorY: 640,
  },
  UK: {
    name: 'London', emoji: '💂', country: 'UK',
    draw: () => `${sky('uk', '#90a4ae', '#cfd8dc')}${cloud(300, 110, 1.4, 0.85)}${cloud(900, 90, 1.6, 0.85)}
      <g transform="translate(260 0)"><rect x="-40" y="200" width="80" height="440" fill="#bcaaa4"/><rect x="-46" y="300" width="92" height="92" fill="#d7ccc8"/><circle cx="0" cy="346" r="34" fill="#fffde7" stroke="#5d4037" stroke-width="5"/><path d="M0 346V322M0 346L18 352" stroke="#3e2723" stroke-width="4"/><path d="M-46 200L0 110L46 200Z" fill="#455a64"/><path d="M0 110V80" stroke="#455a64" stroke-width="5"/>${[230, 420, 470, 520, 570].map(y => `<rect x="-30" y="${y}" width="16" height="30" fill="#8d6e63"/><rect x="14" y="${y}" width="16" height="30" fill="#8d6e63"/>`).join('')}</g>
      <rect x="760" y="430" width="300" height="210" fill="#efebe9"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${780 + i * 46}" y="470" width="22" height="40" fill="#90a4ae"/><rect x="${780 + i * 46}" y="540" width="22" height="40" fill="#90a4ae"/>`).join('')}<path d="M760 430H1060" stroke="#d7ccc8" stroke-width="10"/>
      <path d="M0 640H1200V900H0Z" fill="#78909c"/>
      <g transform="translate(860 620)"><rect x="-120" y="-120" width="240" height="120" rx="14" fill="#d32f2f"/><rect x="-110" y="-110" width="220" height="40" fill="#ffcdd2"/><rect x="-110" y="-56" width="220" height="34" fill="#ffcdd2"/><circle cx="-70" cy="0" r="18" fill="#263238"/><circle cx="70" cy="0" r="18" fill="#263238"/></g>
      ${Array.from({ length: 30 }, (_, i) => `<path d="M${(i * 41) % 1200} ${(i * 29) % 600}l-6 18" stroke="#fff" stroke-width="2" opacity=".6"/>`).join('')}`,
    floorY: 640,
  },
  ES: {
    name: 'Sagrada Família, Spain', emoji: '💃', country: 'ES',
    draw: () => `${sky('es', '#4fc3f7', '#fff3e0')}<circle cx="1060" cy="120" r="60" fill="#ffe066"/>${cloud(600, 110, 0.8)}
      <g transform="translate(140 0)" fill="#d7b98e" stroke="#a1887f" stroke-width="2">${[[0, 260, 34], [60, 200, 38], [130, 150, 44], [200, 210, 38], [260, 270, 34]].map(([x, top, w]) => `<path d="M${x} 640V${top + 60}Q${x + w / 2} ${top - 40} ${x + w} ${top + 60}V640Z"/>${Array.from({ length: 6 }, (_, k) => `<circle cx="${x + w / 2}" cy="${top + 80 + k * 40}" r="5" fill="#8d6e63" stroke="none"/>`).join('')}<circle cx="${x + w / 2}" cy="${top - 8}" r="9" fill="#ffca28"/>`).join('')}<path d="M-20 480H330V640H-20Z"/></g>
      <path d="M0 640H1200V900H0Z" fill="#e0c097"/>${[[860, 300], [960, 280], [1060, 310]].map(([x, y]) => `<path d="M${x} 640V${y}" stroke="#795548" stroke-width="10"/><circle cx="${x}" cy="${y}" r="46" fill="#66bb6a"/>${[[-20, -10], [16, 8], [-4, 20], [22, -20]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="7" fill="#ff9800"/>`).join('')}`).join('')}
      ${[200, 330, 900, 1030].map((x, i) => `<path d="M${x} 0V${60 + (i % 2) * 30}" stroke="#555" stroke-width="1"/><ellipse cx="${x}" cy="${80 + (i % 2) * 30}" rx="18" ry="22" fill="${['#e53935', '#ffeb3b', '#4caf50', '#e53935'][i]}"/>`).join('')}`,
    floorY: 640,
  },
  AE: {
    name: 'Dubai desert', emoji: '🏙️', country: 'AE',
    draw: () => `${sky('ae', '#4fc3f7', '#fff8e1')}<circle cx="160" cy="120" r="70" fill="#fff176"/>
      <g transform="translate(900 0)"><path d="M-14 640L-10 120L0 30L10 120L14 640Z" fill="#b0bec5"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${-40 + i * 4} ${640 - i * 70}L${-14 + i * 1.5} ${600 - i * 70}" stroke="#90a4ae" stroke-width="16"/><path d="M${40 - i * 4} ${640 - i * 70}L${14 - i * 1.5} ${600 - i * 70}" stroke="#90a4ae" stroke-width="16"/>`).join('')}</g>
      ${[[700, 420, 60], [780, 470, 50], [1040, 440, 70], [1120, 500, 60]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${640 - y}" fill="#90a4ae"/>`).join('')}
      <path d="M0 560Q200 500 420 560T900 580T1200 560V900H0Z" fill="#f6c27a"/><path d="M0 640Q300 600 600 640T1200 630V900H0Z" fill="#f2b05e"/>
      <g transform="translate(260 650)" fill="#8d6e63"><ellipse cx="0" cy="-60" rx="60" ry="30"/><ellipse cx="-8" cy="-92" rx="22" ry="18"/><path d="M50 -70Q86 -106 94 -132" stroke="#8d6e63" stroke-width="16" fill="none"/><ellipse cx="100" cy="-138" rx="18" ry="11"/>${[-44, -16, 16, 44].map(x => `<rect x="${x}" y="-40" width="10" height="64" rx="4"/>`).join('')}</g>
      ${palm(520, 640, 0.7)}`,
    floorY: 640,
  },
  TH: {
    name: 'Grand Palace, Bangkok', emoji: '🐘', country: 'TH',
    draw: () => `${sky('th', '#64b5f6', '#e3f2fd')}${cloud(700, 100, 0.8)}
      <g transform="translate(240 0)"><path d="M-6 120L0 40L6 120Z" fill="#ffca28"/>${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="0" cy="${130 + i * 34}" rx="${14 + i * 9}" ry="18" fill="#ffca28" stroke="#f9a825" stroke-width="2"/>`).join('')}<rect x="-70" y="320" width="140" height="40" fill="#ffca28"/><rect x="-80" y="360" width="160" height="280" fill="#fff8e1"/></g>
      <g transform="translate(980 0)"><path d="M-170 420L0 300L170 420Z" fill="#c62828"/><path d="M-130 470L0 370L130 470Z" fill="#2e7d32"/><path d="M-170 420L0 300L170 420" fill="none" stroke="#ffca28" stroke-width="8"/><path d="M-130 470L0 370L130 470" fill="none" stroke="#ffca28" stroke-width="7"/><path d="M-170 420q-14-26-4-40M170 420q14-26 4-40" stroke="#ffca28" stroke-width="8" fill="none"/><rect x="-120" y="470" width="240" height="170" fill="#fff8e1"/>${[-90, -40, 10, 60].map(x => `<rect x="${x}" y="500" width="30" height="80" fill="#ffca28"/>`).join('')}</g>
      <path d="M0 640H1200V900H0Z" fill="#e0e0e0"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 79) % 1200}" cy="${(i * 53) % 560}" r="${3 + (i % 3)}" fill="#81d4fa" opacity=".7"/>`).join('')}
      <g transform="translate(120 780)"><rect x="-50" y="-60" width="100" height="50" rx="8" fill="#43a047"/><path d="M-60 -60H60V-74H-60Z" fill="#ffca28"/><circle cx="-34" cy="0" r="14" fill="#263238"/><circle cx="34" cy="0" r="14" fill="#263238"/><circle cx="0" cy="-4" r="14" fill="#263238"/></g>`,
    floorY: 640,
  },
  gurdwara: {
    name: 'Golden Temple, Amritsar', emoji: '🪯', visit: 'IN',
    draw: () => `${sky('gw', '#81d4fa', '#e1f5fe')}${cloud(250, 110, 0.9)}
      <path d="M0 470H1200V640H0Z" fill="#eceff1"/>${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 100} 470V420Q${i * 100 + 25} 400 ${i * 100 + 50} 420V470Z" fill="#fafafa" stroke="#cfd8dc"/>`).join('')}
      <path d="M0 520H1200V640H0Z" fill="#4fc3f7"/><path d="M80 540H1120" stroke="#fff" stroke-width="3" opacity=".5"/>
      <g transform="translate(240 -130) scale(1.25)"><rect x="-90" y="400" width="180" height="140" fill="#ffca28" stroke="#f9a825" stroke-width="4"/>${[-60, -20, 20, 60].map(x => `<path d="M${x - 12} 540V470Q${x} 450 ${x + 12} 470V540Z" fill="#ffb300"/>`).join('')}<path d="M-50 400C-50 330 50 330 50 400Z" fill="#ffd54f" stroke="#f9a825" stroke-width="4"/><path d="M0 334V300" stroke="#ffca28" stroke-width="5"/>${[-80, 80].map(x => `<path d="M${x - 14} 400C${x - 14} 380 ${x + 14} 380 ${x + 14} 400Z" fill="#ffd54f"/>`).join('')}<path d="M-90 600H90" stroke="#ffca28" stroke-width="0"/></g>
      <path d="M240 545V640" stroke="#fafafa" stroke-width="40"/><path d="M120 590Q240 610 360 590" stroke="#fff59d" stroke-width="4" fill="none" opacity=".6"/>
      <path d="M0 640H1200V900H0Z" fill="#fafafa"/><path d="M0 700H1200M0 780H1200" stroke="#e0e0e0" stroke-width="3"/>`,
    floorY: 640,
  },
  jogyesa: {
    name: 'Jogyesa Temple, Seoul', emoji: '🏮', visit: 'KR',
    draw: () => `${sky('jg', '#81d4fa', '#e3f2fd')}
      <g transform="translate(330 0)"><rect x="-210" y="420" width="420" height="220" fill="#8d6e63"/>${[-170, -90, -10, 70, 150].map(x => `<rect x="${x}" y="440" width="40" height="200" fill="#a1887f"/>`).join('')}<path d="M-260 430Q0 380 260 430L230 380Q0 340 -230 380Z" fill="#37474f"/><path d="M-200 380H200V400H-200Z" fill="#2e7d32"/><path d="M-200 400H200V412H-200Z" fill="#c62828"/><path d="M-260 430q-20-10-24-30M260 430q20-10 24-30" stroke="#37474f" stroke-width="10" fill="none"/></g>
      ${[90, 160, 230].map((y, r) => `<path d="M0 ${y}Q600 ${y + 40} 1200 ${y}" stroke="#555" stroke-width="1.5" fill="none"/>${Array.from({ length: 14 }, (_, i) => { const x = 40 + i * 85 + r * 20; const yy = y + 40 * (1 - Math.pow((x - 600) / 600, 2)) + 20; return `<path d="M${x} ${yy - 22}v4" stroke="#555"/><ellipse cx="${x}" cy="${yy}" rx="20" ry="18" fill="${['#ff80ab', '#fff176', '#80deea', '#c5e1a5', '#ce93d8'][(i + r) % 5]}"/><path d="M${x - 12} ${yy}q12 -16 24 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`; }).join('')}`).join('')}
      <path d="M0 640H1200V900H0Z" fill="#d7ccc8"/>${blossomTree(1060, 680, 1)}`,
    floorY: 640,
  },
  longshan: {
    name: 'Longshan Temple, Taipei', emoji: '🐉', visit: 'TW',
    draw: () => `${sky('ls', '#ffcc80', '#fff3e0')}
      <g transform="translate(600 0)"><rect x="-380" y="420" width="760" height="220" fill="#b71c1c"/>${[-320, -200, -80, 40, 160, 280].map(x => `<rect x="${x}" y="440" width="40" height="200" fill="#8e1b1b"/>`).join('')}
        <path d="M-440 430Q0 380 440 430L400 380Q0 350 -400 380Z" fill="#e65100"/><path d="M-440 430Q-480 420 -500 360M440 430Q480 420 500 360" stroke="#e65100" stroke-width="14" fill="none"/>
        <path d="M-160 370Q0 340 160 370L140 330Q0 310 -140 330Z" fill="#ff8f00"/><path d="M-160 370Q-200 360 -210 320M160 370Q200 360 210 320" stroke="#ff8f00" stroke-width="10" fill="none"/>
        <path d="M-90 330q30-30 60-10t60 -10 60 10" stroke="#43a047" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="0" cy="306" r="12" fill="#ffd54f"/></g>
      ${[160, 300, 900, 1040].map(x => `<g transform="translate(${x} 470)"><ellipse rx="26" ry="30" fill="#e53935"/><rect x="-14" y="-34" width="28" height="7" fill="#ffca28"/><rect x="-14" y="28" width="28" height="7" fill="#ffca28"/></g>`).join('')}
      <path d="M0 640H1200V900H0Z" fill="#bcaaa4"/><g transform="translate(940 760)"><rect x="-60" y="-40" width="120" height="50" rx="6" fill="#6d4c41"/>${[-30, -10, 10, 30].map(x => `<path d="M${x} -40V-120" stroke="#8d6e63" stroke-width="3"/><circle cx="${x}" cy="-122" r="3" fill="#ff7043"/><path d="M${x} -126q-8 -20 4 -40" stroke="#cfd8dc" stroke-width="3" fill="none" opacity=".7"/>`).join('')}</g>`,
    floorY: 640,
  },
  harmony: {
    name: 'Harmony Street, Singapore', emoji: '🤝', visit: 'SG',
    draw: () => `${sky('hm', '#81d4fa', '#fff8e1')}${cloud(600, 90, 0.8)}
      <g transform="translate(120 0)"><rect x="-80" y="500" width="160" height="140" fill="#fff59d"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${-70 + i * 10}" y="${480 - i * 50}" width="${140 - i * 20}" height="52" fill="${['#ef9a9a', '#90caf9', '#a5d6a7', '#ffcc80', '#ce93d8'][i]}" stroke="#fff" stroke-width="3"/>`).join('')}<path d="M-20 640V560Q0 540 20 560V640Z" fill="#6d4c41"/></g>
      <g transform="translate(370 0)"><rect x="-90" y="460" width="180" height="180" fill="#e8f5e9"/><path d="M-60 460C-60 380 60 380 60 460Z" fill="#a5d6a7"/>${[-100, 100].map(x => `<rect x="${x - 12}" y="330" width="24" height="310" fill="#c8e6c9"/><path d="M${x - 16} 330L${x} 290L${x + 16} 330Z" fill="#66bb6a"/>`).join('')}<path d="M-26 640V560Q0 530 26 560V640Z" fill="#2e7d32"/></g>
      <g transform="translate(1020 0)"><rect x="-120" y="440" width="240" height="200" fill="#c62828"/><path d="M-160 450Q0 400 160 450L140 410Q0 380 -140 410Z" fill="#ffb300"/><path d="M-120 400Q0 370 120 400L110 370Q0 350 -110 370Z" fill="#ffb300"/>${[-80, 0, 80].map(x => `<rect x="${x - 18}" y="500" width="36" height="60" fill="#ffca28"/>`).join('')}</g>
      <path d="M0 640H1200V900H0Z" fill="#b0bec5"/><path d="M0 700H1200" stroke="#fff" stroke-width="5" stroke-dasharray="30 30"/>`,
    floorY: 640,
  },
  mosque: {
    name: 'Sheikh Zayed Grand Mosque', emoji: '🕌', visit: 'AE',
    draw: () => `${sky('mq', '#4fc3f7', '#e1f5fe')}
      <g transform="translate(600 0)"><rect x="-440" y="420" width="880" height="220" fill="#fafafa" stroke="#e0e0e0" stroke-width="3"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${-420 + i * 80} 640V520Q${-400 + i * 80} 480 ${-380 + i * 80} 520V640Z" fill="#e3f2fd"/>`).join('')}
        <path d="M-120 420C-120 300 120 300 120 420Z" fill="#fff" stroke="#e0e0e0" stroke-width="3"/><path d="M0 312V270" stroke="#ffca28" stroke-width="5"/><circle cx="0" cy="266" r="6" fill="#ffca28"/>
        ${[-300, -200, 200, 300].map(x => `<path d="M${x - 50} 420C${x - 50} 350 ${x + 50} 350 ${x + 50} 420Z" fill="#fff" stroke="#e0e0e0" stroke-width="3"/><path d="M${x} 362V340" stroke="#ffca28" stroke-width="4"/>`).join('')}
        ${[-470, 470].map(x => `<rect x="${x - 16}" y="200" width="32" height="440" fill="#fff" stroke="#e0e0e0" stroke-width="3"/><path d="M${x - 20} 200C${x - 20} 170 ${x + 20} 170 ${x + 20} 200Z" fill="#fff" stroke="#e0e0e0"/><path d="M${x} 172V150" stroke="#ffca28" stroke-width="4"/><rect x="${x - 22}" y="300" width="44" height="12" fill="#ffd54f"/>`).join('')}</g>
      <path d="M0 640H1200V900H0Z" fill="#eceff1"/><path d="M200 660H1000V720H200Z" fill="#81d4fa" opacity=".8"/>${palm(80, 760, 0.8)}${palm(1130, 760, 0.8)}`,
    floorY: 640,
  },
  cairo: {
    name: 'Old Cairo', emoji: '🕍', visit: 'EG',
    draw: () => `${sky('cr', '#ffcc80', '#fff3e0')}<circle cx="1080" cy="120" r="56" fill="#fff59d"/>
      <g transform="translate(130 0)"><rect x="-90" y="440" width="180" height="200" fill="#d7ccc8"/><path d="M-60 440C-60 380 60 380 60 440Z" fill="#bcaaa4"/><rect x="70" y="240" width="30" height="400" fill="#d7ccc8"/><path d="M66 240L85 190L104 240Z" fill="#a1887f"/><rect x="64" y="320" width="42" height="10" fill="#a1887f"/></g>
      <g transform="translate(410 0)"><rect x="-110" y="430" width="220" height="210" fill="#efebe9"/>${[-60, 60].map(x => `<rect x="${x - 26}" y="330" width="52" height="100" fill="#efebe9"/><path d="M${x - 30} 330L${x} 290L${x + 30} 330Z" fill="#8d6e63"/><path d="M${x} 290V260M${x - 10} 272H${x + 10}" stroke="#5d4037" stroke-width="4"/>`).join('')}<path d="M-30 640V560Q0 530 30 560V640Z" fill="#6d4c41"/><circle cx="0" cy="480" r="22" fill="#90caf9" stroke="#8d6e63" stroke-width="4"/></g>
      <g transform="translate(860 0)"><rect x="-100" y="450" width="200" height="190" fill="#e0c9a6"/><path d="M-100 450L0 400L100 450Z" fill="#c9a77c"/><circle cx="0" cy="510" r="30" fill="#90caf9" stroke="#8d6e63" stroke-width="4"/><path d="M0 486L21 522H-21ZM0 534L-21 498H21Z" fill="none" stroke="#1565c0" stroke-width="3"/><path d="M-24 640V580Q0 556 24 580V640Z" fill="#6d4c41"/></g>
      <path d="M0 640H1200V900H0Z" fill="#e6cfa7"/>${palm(1100, 720, 0.8)}`,
    floorY: 640,
  },
  synagogue: {
    name: 'Central Synagogue, New York', emoji: '✡️', visit: 'US',
    draw: () => `${sky('sy', '#90caf9', '#e3f2fd')}${cloud(600, 100, 0.9)}
      <g transform="translate(330 0)"><rect x="-170" y="380" width="340" height="260" fill="#c8a27a"/>${[-130, 130].map(x => `<rect x="${x - 40}" y="250" width="80" height="390" fill="#b98d64"/><path d="M${x - 44} 250C${x - 44} 190 ${x - 20} 160 ${x} 140C${x + 20} 160 ${x + 44} 190 ${x + 44} 250Z" fill="#2e7d32"/><path d="M${x} 140V112" stroke="#ffca28" stroke-width="4"/>${[290, 360, 430].map(y => `<path d="M${x - 14} ${y + 34}V${y + 10}Q${x} ${y - 4} ${x + 14} ${y + 10}V${y + 34}Z" fill="#5d4037"/>`).join('')}`).join('')}
        <circle cx="0" cy="450" r="44" fill="#64b5f6" stroke="#8d6e63" stroke-width="6"/><path d="M0 418L28 466H-28ZM0 482L-28 434H28Z" fill="none" stroke="#fff" stroke-width="4"/><path d="M-40 640V560Q0 520 40 560V640Z" fill="#5d4037"/></g>
      ${[[760, 300, 120], [900, 240, 110], [1030, 320, 140]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${640 - y}" fill="#b0bec5"/>${Array.from({ length: 6 }, (_, k) => `<rect x="${x + 14 + (k % 3) * (w / 3.4)}" y="${y + 20 + Math.floor(k / 3) * 40}" width="14" height="20" fill="#e3f2fd"/>`).join('')}`).join('')}
      <path d="M0 640H1200V900H0Z" fill="#9e9e9e"/>`,
    floorY: 640,
  },
  abbey: {
    name: 'Westminster Abbey, London', emoji: '⛪', visit: 'UK',
    draw: () => `${sky('ab', '#b0bec5', '#eceff1')}${cloud(800, 100, 1.2, 0.8)}
      <g transform="translate(340 0)" fill="#d7ccc8" stroke="#a1887f" stroke-width="2"><rect x="-160" y="380" width="320" height="260"/>${[-130, 130].map(x => `<rect x="${x - 50}" y="200" width="100" height="440"/><path d="M${x - 54} 200H${x + 54}" stroke-width="8"/>${[-40, -14, 14, 40].map(d => `<path d="M${x + d} 200V172" stroke-width="6"/>`).join('')}<path d="M${x - 20} 330V280Q${x} 256 ${x + 20} 280V330Z" fill="#78909c"/>`).join('')}
        <circle cx="0" cy="450" r="50" fill="#90caf9"/>${Array.from({ length: 8 }, (_, i) => { const a = i * 45 * Math.PI / 180; return `<path d="M0 450L${(Math.cos(a) * 50).toFixed(1)} ${(450 + Math.sin(a) * 50).toFixed(1)}" stroke="#ef5350" stroke-width="3"/>`; }).join('')}<path d="M-46 640V560Q0 500 46 560V640Z" fill="#6d4c41"/></g>
      <path d="M0 640H1200V900H0Z" fill="#a5d6a7"/><path d="M0 660H1200" stroke="#81c784" stroke-width="10"/>`,
    floorY: 640,
  },
  runway: {
    name: 'Fashion show', emoji: '🎤',
    draw: () => `<rect width="1200" height="900" fill="#2a1b3d"/>${[150, 450, 750, 1050].map(x => `<path d="M${x} 0L${x - 150} 900H${x + 150}Z" fill="#fff59d" opacity=".08"/>`).join('')}
      <path d="M0 0H220Q160 300 220 640H0Z" fill="#b71c1c"/><path d="M1200 0H980Q1040 300 980 640H1200Z" fill="#b71c1c"/><path d="M0 0H1200V60Q600 110 0 60Z" fill="#c62828"/>
      ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 1200}" cy="${(i * 37) % 240 + 30}" r="${2 + (i % 3)}" fill="#fff" opacity="${0.3 + (i % 4) * 0.15}"/>`).join('')}
      <path d="M380 640L820 640L1100 900H100Z" fill="#f8bbd0"/><path d="M380 640H820" stroke="#ff80ab" stroke-width="6"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="${430 + i * 85}" cy="${700 + (i % 2) * 40}" r="5" fill="#fff" opacity=".7"/>`).join('')}
      ${Array.from({ length: 16 }, (_, i) => `<circle cx="${(i < 8 ? 40 + i * 40 : 840 + (i - 8) * 45)}" cy="${800 + (i % 3) * 30}" r="22" fill="#1a1028"/><rect x="${(i < 8 ? 18 + i * 40 : 818 + (i - 8) * 45)}" y="${820 + (i % 3) * 30}" width="44" height="60" rx="18" fill="#1a1028"/>`).join('')}`,
    floorY: 640,
  },
};

export const SCENE_IDS = Object.keys(SCENES);
export const sceneInfo = id => SCENES[id] || SCENES.studio;

export function renderScene(id, cls = 'scene') {
  const s = sceneInfo(id);
  return `<svg class="${cls}" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s.draw()}</svg>`;
}

export function sceneThumb(id) {
  return `<svg viewBox="200 100 800 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${sceneInfo(id).draw()}</svg>`;
}
