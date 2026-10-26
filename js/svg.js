// SVG drawing helpers shared by the doll, wardrobe items and scenes.

// Mirror across the doll's centre line (x = 200 in a 400-wide box).
export const mirror = svg => `<g transform="matrix(-1 0 0 1 400 0)">${svg}</g>`;
export const both = svg => svg + mirror(svg);

export function flower(x, y, petal, center, r = 3) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180;
    s += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.8).toFixed(1)}" fill="${petal}"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="${(r * 0.6).toFixed(1)}" fill="${center}"/>`;
}

export function star(x, y, r, fill, extra = '') {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (i * 36 - 90) * Math.PI / 180;
    d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1);
  }
  return `<path d="${d}Z" fill="${fill}" ${extra}/>`;
}

export function sparkle(x, y, r, fill) {
  return `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${fill}"/>`;
}

export function heart(x, y, s, fill, extra = '') {
  return `<path d="M${x} ${y + s * 0.9}C${x - s * 1.6} ${y - s * 0.1} ${x - s * 0.9} ${y - s * 1.3} ${x} ${y - s * 0.45}C${x + s * 0.9} ${y - s * 1.3} ${x + s * 1.6} ${y - s * 0.1} ${x} ${y + s * 0.9}Z" fill="${fill}" ${extra}/>`;
}

// Smooth curve through points (Catmull-Rom converted to cubic Beziers).
// Returns path commands without the initial M, starting from pts[0].
export function curveThrough(pts) {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

const f = n => +n.toFixed(1);
export { f as fx };
