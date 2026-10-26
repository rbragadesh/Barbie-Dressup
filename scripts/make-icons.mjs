// Writes icons/icon.svg from the doll artwork and, when Playwright is available,
// renders the PNG sizes iOS and Android need. Run: node scripts/make-icons.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { renderHairThumb } from '../js/doll.js';

const head = renderHairThumb('long', 'black', 'golden')
  .replace(/^<svg[^>]*>/, '<g transform="translate(46 70) scale(1.9)"><g transform="translate(-90 -30)">')
  .replace(/<\/svg>$/, '</g></g>');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8fc8"/><stop offset="1" stop-color="#9b7bff"/></linearGradient></defs>
<rect width="512" height="512" rx="112" fill="url(#bg)"/>
<circle cx="256" cy="300" r="190" fill="#fff" opacity=".22"/>
${head}
<g transform="translate(372 372)"><circle r="78" fill="#4fc3f7" stroke="#fff" stroke-width="10"/><path d="M-50 -30c20 10 30 -10 50 0s10 30 30 20 20 10 20 10M-60 20c20 -6 40 10 50 0s30 -10 40 6" stroke="#7ed957" stroke-width="18" fill="none" stroke-linecap="round"/></g>
<path d="M330 120l40 -14 34 -40 14 6 -18 44 36 12 8 -8 10 4 -8 22 -24 4 -40 -4 -28 26 -14 -4 14 -32 -30 -10z" fill="#fff"/>
</svg>`;
fs.mkdirSync('icons', { recursive: true });
fs.writeFileSync('icons/icon.svg', svg);

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { console.log('icons/icon.svg written; install Playwright to render PNGs'); process.exit(0); }
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [['apple-touch-icon.png', 180, false], ['icon-192.png', 192, false], ['icon-512.png', 512, false]]) {
  await page.setViewportSize({ width: size, height: size });
  // iOS rounds the corners itself, so the PNGs are full squares.
  const square = svg.replace('rx="112"', pad ? 'rx="112"' : 'rx="0"');
  await page.setContent(`<body style="margin:0">${square.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  await page.screenshot({ path: `icons/${name}`, omitBackground: true });
}
await browser.close();
console.log('icons written');
