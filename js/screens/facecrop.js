// Grown-up tool: pick a photo on this iPad, line the face up with the doll's face shape,
// and save a small crop. The crop is stored only in this browser (store.saveFace).

import { FACE_BOX, setFacePhoto } from '../doll.js';
import { saveFace } from '../store.js';
import { modal, closeModal, toast } from '../ui.js';
import { sfx } from '../audio.js';

// Same outline as the doll's face (P.face in doll.js), in face-box coordinates.
const FACE_PATH = 'M142 138C142 100 168 80 200 80C232 80 258 100 258 138C258 178 241 205 223 215C212 222 188 222 177 215C159 205 142 178 142 138Z';
const SCALE = 2.4;
const W = Math.round(FACE_BOX.w * SCALE);
const H = Math.round(FACE_BOX.h * SCALE);

function readImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => res({ img, url });
    img.onerror = rej;
    img.src = url;
  });
}

export async function cropFace(file, onSaved) {
  let loaded;
  try { loaded = await readImage(file); } catch { toast('Sorry, that photo could not be opened.'); return; }
  const { img, url } = loaded;
  const PAD = 40;
  const m = modal(`<h2>📷 Line up the face</h2>
    <p class="note">Pinch or use the slider to zoom, and drag so the face fills the shape from forehead to chin. The game draws the hair on top. This picture stays on this iPad only.</p>
    <div class="crop-wrap"><canvas class="crop" width="${W + PAD * 2}" height="${H + PAD * 2}"></canvas></div>
    <label class="note" style="display:flex;align-items:center;gap:10px;justify-content:center">🔍 Zoom <input type="range" class="zoom" min="1" max="12" step="0.01" value="2" style="flex:1;max-width:320px"></label>
    <div class="actions"><button class="btn white" data-close>Cancel</button><button class="btn big green use">Use this face ✓</button></div>`, { onClose: () => URL.revokeObjectURL(url) });
  const canvas = m.querySelector('.crop');
  const ctx = canvas.getContext('2d');
  const face = new Path2D();
  face.addPath(new Path2D(FACE_PATH), new DOMMatrix().translate(PAD, PAD).scale(SCALE).translate(-FACE_BOX.x, -FACE_BOX.y));
  const cover = Math.max(W / img.width, H / img.height);
  let zoom = 2;
  let ox = 0;
  let oy = 0;
  const draw = () => {
    const s = cover * zoom;
    const iw = img.width * s;
    const ih = img.height * s;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, PAD + (W - iw) / 2 + ox, PAD + (H - ih) / 2 + oy, iw, ih);
    ctx.save();
    ctx.fillStyle = 'rgba(30, 20, 50, .55)';
    const mask = new Path2D();
    mask.rect(0, 0, canvas.width, canvas.height);
    mask.addPath(face);
    ctx.fill(mask, 'evenodd');
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ff5fa2';
    ctx.stroke(face);
  };
  // One finger drags; two fingers pinch to zoom.
  const slider = m.querySelector('.zoom');
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  const pos = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height]; };
  const dist = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, pos(e));
    if (pointers.size === 2) { pinch = { d: dist(), zoom, ox, oy }; drag = null; } else drag = { p: pos(e), ox, oy };
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, pos(e));
    if (pinch && pointers.size === 2) {
      const k = dist() / pinch.d;
      zoom = Math.min(12, Math.max(1, pinch.zoom * k));
      ox = pinch.ox * (zoom / pinch.zoom);
      oy = pinch.oy * (zoom / pinch.zoom);
      slider.value = zoom;
    } else if (drag) {
      const [x, y] = pos(e);
      ox = drag.ox + x - drag.p[0];
      oy = drag.oy + y - drag.p[1];
    }
    draw();
  });
  ['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, e => { pointers.delete(e.pointerId); pinch = null; drag = null; }));
  slider.addEventListener('input', e => { const z = +e.target.value; ox *= z / zoom; oy *= z / zoom; zoom = z; draw(); });
  m.querySelector('.use').addEventListener('click', () => {
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const s = cover * zoom;
    const iw = img.width * s;
    const ih = img.height * s;
    out.getContext('2d').drawImage(img, (W - iw) / 2 + ox, (H - ih) / 2 + oy, iw, ih);
    const data = out.toDataURL('image/jpeg', 0.86);
    if (!saveFace(data)) { toast('Sorry, there is not enough space to save the photo.'); return; }
    setFacePhoto(data);
    sfx('success');
    closeModal();
    onSaved && onSaved();
  });
  draw();
}
