// Shared drawing kit for the trailers: maths, colour grading, sprites, text, the code-drawn Hollowfern panorama,
// the painted interiors, film grain and asset loading. Each page sets DURATION and window.draw.
const W = 1080, H = 1920;
const ASSETS = '../../../apps/web/public/';
const cv = document.getElementById('c');
let ctx = cv.getContext('2d');
const IMG = {}, GREY = {};
const SHEETS = {
  puff_walk_down: [6, 144, 168], puff_walk_right: [4, 144, 168], puff_walk_up: [4, 144, 168],
  puff_idle_down: [6, 144, 168], puff_blink_down: [2, 144, 168],
  grumble_dust_grumpy: [4, 96, 90], grumble_dust_bright: [4, 96, 90], mess_dust: [8, 64, 64],
  item_book: [1, 64, 64], item_cup: [1, 64, 64], item_pin: [1, 64, 64], item_sock: [1, 64, 64], item_tray: [1, 64, 64],
};

// ---------- maths ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = k => 1 - Math.pow(1 - k, 3);
const easeIn = k => k * k * k;
const easeInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const smooth = k => k * k * (3 - 2 * k);
const backOut = k => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
function rng(seed) { let s = (seed * 2654435761) % 4294967296; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const fade = (t, a, b, f = .6) => Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b));

// ---------- colour grading: every town colour goes through C() ----------
const LOOK = { sat: 1, bright: 1, night: 0, warm: 0 };
const hexCache = {};
function rgbOf(hex) { return hexCache[hex] || (hexCache[hex] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16))); }
function C(hex, a = 1) {
  let [r, g, b] = rgbOf(hex);
  const l = .3 * r + .59 * g + .11 * b;
  r = lerp(l * .95, r, LOOK.sat); g = lerp(l * .97, g, LOOK.sat); b = lerp(l * 1.04, b, LOOK.sat);
  r = lerp(r, r * .32 + 8, LOOK.night); g = lerp(g, g * .36 + 12, LOOK.night); b = lerp(b, b * .55 + 40, LOOK.night);
  r = lerp(r, r * 1.08 + 10, LOOK.warm); g = lerp(g, g * 1.0 + 4, LOOK.warm); b = lerp(b, b * .85, LOOK.warm);
  return `rgba(${r * LOOK.bright | 0},${g * LOOK.bright | 0},${b * LOOK.bright | 0},${a})`;
}
function mix(a, b, k) { const pa = rgbOf(a), pb = rgbOf(b); return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`; }

// ---------- primitives ----------
function star(x, y, r, color, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .25 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function heart(x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 32, s / 32); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.bezierCurveTo(-30, -12, -12, -34, 0, -16); ctx.bezierCurveTo(12, -34, 30, -12, 0, 10); ctx.fill(); ctx.restore();
}
function glow(x, y, r, color, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace('A', a)); g.addColorStop(.4, color.replace('A', a * .35)); g.addColorStop(1, color.replace('A', 0));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
const WARM = 'rgba(255,214,140,A)', GOLD = 'rgba(255,236,170,A)', PINK = 'rgba(255,170,200,A)', CYAN = 'rgba(150,230,255,A)';
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// sprites drawn at the current transform, anchored bottom-centre
function spr(name, frame, x, y, scale, o = {}) {
  const [n, fw, fh] = SHEETS[name];
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  ctx.scale((o.flip ? -1 : 1) * scale * (o.sqx || 1), scale * (o.sqy || 1));
  ctx.imageSmoothingEnabled = false;
  if (o.filter) ctx.filter = o.filter;
  ctx.drawImage(o.grey ? GREY[name] : IMG[name], (frame % n) * fw, 0, fw, fh, -fw / 2, -fh, fw, fh);
  ctx.restore();
}
function puffFrame(state, t) {
  if (state === 'walk') return ['puff_walk_right', Math.floor(t * 10)];
  if (state === 'walkL') return ['puff_walk_right', Math.floor(t * 10), true];
  if (state === 'up') return ['puff_walk_up', 0];
  if (state === 'closed') return ['puff_blink_down', 1];
  if ((t % 2.6) < .13) return ['puff_blink_down', 1];
  return ['puff_idle_down', Math.floor(t * 7)];
}
function puff(state, x, y, scale, t, o = {}) {
  if (scale <= 0) return;
  const [name, f, flip] = puffFrame(state, t);
  let hop = 0, sqx = 1, sqy = 1;
  for (const h of [].concat(o.hop ?? [])) {
    const d = t - h;
    if (d > -.1 && d < 0) { const k = (d + .1) / .1; sqx = 1 + .2 * k; sqy = 1 - .16 * k; }
    if (d >= 0 && d < .42) { const k = Math.sin(d / .42 * Math.PI); hop = k * 55 * (o.hopH ?? 1); sqx = 1 - .1 * k; sqy = 1 + .12 * k; }
  }
  ctx.save(); ctx.globalAlpha = .25 * (o.alpha ?? 1) * (1 - hop / 200); ctx.fillStyle = '#20140e';
  ctx.beginPath(); ctx.ellipse(x, y, 52 * scale, 15 * scale, 0, 0, 7); ctx.fill(); ctx.restore();
  spr(name, f, x, y - hop * scale, scale, { flip, sqx, sqy, alpha: o.alpha, filter: o.filter });
}

// ---------- text ----------
function scrim(a, top = true) {
  const g = ctx.createLinearGradient(0, top ? 0 : H, 0, top ? 700 : H - 700);
  g.addColorStop(0, `rgba(20,12,24,${a})`); g.addColorStop(1, 'rgba(20,12,24,0)');
  ctx.fillStyle = g; ctx.fillRect(0, top ? 0 : H - 700, W, 700);
}
function cine(str, x, y, size, a, o = {}) {
  if (a <= 0) return;
  ctx.save();
  ctx.font = `600 ${size}px ${o.italic === false ? 'Cormorant' : 'CormorantI'}`;
  ctx.letterSpacing = (o.track ?? 1) + 'px';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = a;
  ctx.filter = `blur(${(1 - a) * 8}px)`;
  ctx.shadowColor = o.glow || 'rgba(255,220,160,.55)'; ctx.shadowBlur = 28;
  ctx.fillStyle = o.color || '#fff4dc';
  ctx.fillText(str, x, y + (1 - a) * 14);
  ctx.restore();
}
function bold(str, x, y, size, o = {}) {
  ctx.save(); ctx.font = `700 ${size}px Fredoka`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.globalAlpha = o.alpha ?? 1; ctx.translate(x, y); if (o.scale !== undefined) ctx.scale(o.scale, o.scale); if (o.rot) ctx.rotate(o.rot);
  if (o.lw !== 0) { ctx.strokeStyle = o.stroke || '#3d2219'; ctx.lineWidth = o.lw || size * .2; ctx.strokeText(str, 0, 0); }
  ctx.fillStyle = o.color || '#fff'; ctx.fillText(str, 0, 0); ctx.restore();
}

// ================= THE TOWN (code-drawn panorama) =================
// Panorama space: x 0–2600, y 0–1920. Layers move with parallax p (0 = sky, 1 = the square).
const PX = 1300, PY = 960;
let cam = { x: 1300, y: 960, z: 1 };
function layer(p, fn) {
  const z = 1 + (cam.z - 1) * p;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z);
  ctx.translate(-(PX + (cam.x - PX) * p), -(PY + (cam.y - PY) * p));
  fn(); ctx.restore();
}
const HOUSES = [
  { x: 330, w: 300, h: 330, wall: '#f3d9b1', roof: '#c8664a', sign: 'bread', name: 'Hazel', kind: 'hedgehog' },
  { x: 690, w: 260, h: 290, wall: '#fff1c9', roof: '#e7a93b', sign: 'flower', name: 'Bea', kind: 'bee' },
  { x: 1000, w: 230, h: 360, wall: '#dbe7f4', roof: '#5d7fb3', sign: 'toy', name: 'Pip', kind: 'mouse' },
  { x: 1600, w: 270, h: 310, wall: '#d3ecdf', roof: '#3f8f7a', sign: 'wave', name: 'Otto', kind: 'otter' },
  { x: 1960, w: 290, h: 380, wall: '#ead9f2', roof: '#7a5a9a', sign: 'book', name: 'Moss', kind: 'mole' },
];
const SEASON_TREES = { spring: ['#f6b6cc', '#f9d3df', '#e98fb0'], summer: ['#6fb36a', '#8ccf73', '#4f9a5a'], autumn: ['#e8833a', '#f2b13a', '#c95a2c'], winter: ['#dfe9ef', '#ffffff', '#b8c8d4'] };

function mixHex(a, b, k) { return '#' + rgbOf(a).map((v, i) => Math.round(lerp(v, rgbOf(b)[i], k)).toString(16).padStart(2, '0')).join(''); }
function sky(T) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  // T.night blends smoothly from day (0) to night (1)
  const n = clamp(T.night), top = mixHex('#7fb6e6', '#0f1330', n), mid = mixHex('#ffd6a8', '#2a2f5c', n), low = mixHex('#ffb7a8', '#3b3a63', n);
  g.addColorStop(0, C(top)); g.addColorStop(.42, C(mid)); g.addColorStop(.6, C(low)); g.addColorStop(1, C(low));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function drawTown(t, T) {
  // T: { night, lights[6], fountain, lighthouse, season, rain, smoke, orbs, focus }
  sky(T);
  // stars + moon / sun
  layer(.04, () => {
    // T.sunArc (0–1 across the day) moves the sun and moon along an arc; without it they sit still
    const arc = T.sunArc, sunAt = arc === undefined ? [1500, 700] : [lerp(200, 2400, arc), 820 - Math.sin(arc * Math.PI) * 620];
    const moonAt = arc === undefined ? [1820, 360] : [lerp(2400, 200, arc), 820 - Math.sin(arc * Math.PI) * 600];
    const n = clamp(T.night);
    if (n > 0) {
      const r = rng(4);
      for (let i = 0; i < 90; i++) { const x = r() * 2600, y = r() * 820, tw = .5 + .5 * Math.sin(t * (1 + r() * 3) + i); ctx.fillStyle = C('#ffffff', n * (.25 + .6 * tw * LOOK.sat + .2)); ctx.fillRect(x, y, 3, 3); }
      ctx.globalAlpha = n;
      ctx.fillStyle = C('#fff3d0'); ctx.beginPath(); ctx.arc(moonAt[0], moonAt[1], 70, 0, 7); ctx.fill();
      ctx.fillStyle = C('#2a2f5c'); ctx.beginPath(); ctx.arc(moonAt[0] + 30, moonAt[1] - 20, 62, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      glow(moonAt[0], moonAt[1], 260, 'rgba(255,240,200,A)', n * (.25 * LOOK.sat + .05));
    }
    if (n < 1) {
      ctx.globalAlpha = 1 - n;
      glow(sunAt[0], sunAt[1], 520, 'rgba(255,230,170,A)', .6 * LOOK.sat * (1 - n));
      ctx.fillStyle = C('#fff1c8'); ctx.beginPath(); ctx.arc(sunAt[0], sunAt[1], 90, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
  // clouds
  layer(.1, () => {
    const r = rng(9);
    for (let i = 0; i < 7; i++) {
      const x = ((r() * 3000 + t * (12 + r() * 10)) % 3200) - 300, y = 180 + r() * 420, s = .7 + r() * .8;
      ctx.fillStyle = C(mixHex('#fff6ea', '#3c4372', clamp(T.night)), .8);
      [[0, 0, 90], [80, 10, 70], [-80, 14, 64], [30, -40, 70]].forEach(([dx, dy, rad]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, rad * s, 0, 7); ctx.fill(); });
    }
  });
  // sea, cliff and lighthouse
  layer(.25, () => {
    ctx.fillStyle = C(mixHex('#5fb3d1', '#283f6b', clamp(T.night))); ctx.fillRect(-400, 830, 3400, 140);
    for (let i = 0; i < 40; i++) { const x = (i * 97 + t * 20) % 3200 - 300; ctx.fillStyle = C('#ffffff', .25); ctx.fillRect(x, 850 + (i % 5) * 22, 50, 3); }
    ctx.fillStyle = C('#8a7a6a'); ctx.beginPath(); ctx.moveTo(2050, 960); ctx.quadraticCurveTo(2150, 780, 2400, 790); ctx.lineTo(2700, 960); ctx.fill();
    // lighthouse
    const lx = 2290, ly = 800;
    ctx.fillStyle = C('#f4efe6'); ctx.beginPath(); ctx.moveTo(lx - 34, ly); ctx.lineTo(lx - 22, ly - 230); ctx.lineTo(lx + 22, ly - 230); ctx.lineTo(lx + 34, ly); ctx.fill();
    ctx.fillStyle = C('#d0574a'); for (let i = 0; i < 3; i++) ctx.fillRect(lx - 31 + i * 3, ly - 60 - i * 70, 62 - i * 6, 26);
    ctx.fillStyle = C('#3d2a2a'); ctx.fillRect(lx - 30, ly - 262, 60, 34);
    ctx.fillStyle = C('#d0574a'); ctx.beginPath(); ctx.moveTo(lx - 36, ly - 262); ctx.lineTo(lx, ly - 300); ctx.lineTo(lx + 36, ly - 262); ctx.fill();
    if (T.lighthouse > 0) {
      ctx.fillStyle = `rgba(255,240,180,${T.lighthouse})`; ctx.fillRect(lx - 24, ly - 258, 48, 26);
      const a = Math.sin(t * 1.3) * 1.1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(lx, ly - 245);
      const bg = ctx.createLinearGradient(0, 0, 1600 * Math.cos(a + Math.PI), 0);
      ctx.rotate(Math.PI + a * .6);
      const g = ctx.createLinearGradient(0, 0, 1800, 0); g.addColorStop(0, `rgba(255,240,190,${lerp(.12, .55, clamp(T.night)) * T.lighthouse})`); g.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1800, -160); ctx.lineTo(1800, 160); ctx.fill(); ctx.restore();
      glow(lx, ly - 245, 200, GOLD, .8 * T.lighthouse);
    }
  });
  // hills
  const tree = SEASON_TREES[T.season || 'summer'];
  layer(.35, () => {
    ctx.fillStyle = C(T.season === 'winter' ? '#c9d6de' : '#7fae8a');
    ctx.beginPath(); ctx.moveTo(-500, 1100);
    for (let x = -500; x <= 3100; x += 40) ctx.lineTo(x, 900 - 60 * Math.sin(x / 260) - 40 * Math.sin(x / 113 + 1));
    ctx.lineTo(3100, 1100); ctx.fill();
  });
  layer(.55, () => {
    ctx.fillStyle = C(T.season === 'winter' ? '#e4edf2' : '#6a9c5e');
    ctx.beginPath(); ctx.moveTo(-500, 1150);
    for (let x = -500; x <= 3100; x += 40) ctx.lineTo(x, 990 - 30 * Math.sin(x / 180 + 2));
    ctx.lineTo(3100, 1150); ctx.fill();
    const r = rng(17);
    for (let i = 0; i < 26; i++) {
      const x = -300 + i * 130 + r() * 60, y = 1000 + r() * 30, s = .8 + r() * .5;
      ctx.fillStyle = C('#6b4a36'); ctx.fillRect(x - 8 * s, y - 40 * s, 16 * s, 60 * s);
      [[0, -90, 62], [-38, -60, 46], [38, -62, 48], [0, -130, 42]].forEach(([dx, dy, rad], j) => { ctx.fillStyle = C(tree[j % 3]); ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, rad * s, 0, 7); ctx.fill(); });
    }
  });
  // houses
  layer(.75, () => {
    HOUSES.forEach((h, i) => house(h, i, t, T));
    // lighthouse keeper Mabel counts as the sixth light: handled in the lighthouse layer
  });
  // bunting
  if (T.bunting !== 0) layer(.85, () => {
    const lines = [[200, 1010, 1180, 1050], [1420, 1050, 2400, 1010]];
    lines.forEach(([x1, y1, x2, y2], li) => {
      ctx.strokeStyle = C('#5a3b2c'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 70, x2, y2); ctx.stroke();
      const cols = ['#ff8fb8', '#ffd84d', '#8fe3ff', '#b8ff8f', '#ffb37a'];
      for (let k = 1; k < 16; k++) {
        const u = k / 16, x = lerp(x1, x2, u), y = (1 - u) * (1 - u) * y1 + 2 * u * (1 - u) * (Math.max(y1, y2) + 70) + u * u * y2;
        const sway = Math.sin(t * 2.5 + k + li) * 4;
        ctx.fillStyle = C(cols[k % 5]); ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 18, y); ctx.lineTo(x + sway, y + 42); ctx.fill();
      }
    });
  });
  // the square
  layer(1, () => square(t, T));
}
function house(h, i, t, T) {
  const base = 1100, x = h.x, w = h.w, top = base - h.h, lit = T.lights ? T.lights[i] : 0;
  // chimney + smoke
  ctx.fillStyle = C('#8a5a48'); ctx.fillRect(x + w * .2, top - 70, 44, 90);
  if (T.smoke) for (let k = 0; k < 7; k++) {
    const ph = ((t * .35 + k / 7) % 1);
    ctx.fillStyle = C('#ffffff', .35 * (1 - ph) * T.smoke);
    ctx.beginPath(); ctx.arc(x + w * .2 + 22 + Math.sin(ph * 5 + i) * 26 + ph * 50, top - 80 - ph * 260, 18 + ph * 40, 0, 7); ctx.fill();
  }
  ctx.fillStyle = C(h.wall); rr(x - w / 2 + w / 2 - w / 2, top + 30, w, h.h - 30, 8); ctx.fill();
  // timber lines
  ctx.fillStyle = C('#000000', .06); ctx.fillRect(x - w / 2, top + 30, w, 16);
  // roof
  ctx.fillStyle = C(h.roof);
  ctx.beginPath(); ctx.moveTo(x - w / 2 - 30, top + 50); ctx.lineTo(x, top - 90); ctx.lineTo(x + w / 2 + 30, top + 50); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C('#000000', .12); ctx.lineWidth = 4;
  for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - (w / 2 + 30) * k / 4, top + 50 - 140 * (1 - k / 4)); ctx.lineTo(x + (w / 2 + 30) * k / 4, top + 50 - 140 * (1 - k / 4)); ctx.stroke(); }
  if (T.season === 'winter') { ctx.fillStyle = C('#ffffff'); ctx.beginPath(); ctx.moveTo(x - w / 2 - 34, top + 46); ctx.lineTo(x, top - 96); ctx.lineTo(x + w / 2 + 34, top + 46); ctx.lineTo(x + w / 2, top + 30); ctx.lineTo(x, top - 60); ctx.lineTo(x - w / 2, top + 30); ctx.fill(); }
  // windows
  const wy = top + 90, ws = 64;
  [x - w * .26, x + w * .26].forEach((wx, k) => {
    ctx.fillStyle = C('#5a3b2c'); rr(wx - ws / 2 - 6, wy - 6, ws + 12, ws + 12, 10); ctx.fill();
    ctx.fillStyle = lit > 0 ? `rgba(${255},${lerp(70, 214, lit) | 0},${lerp(90, 120, lit) | 0},1)` : C('#3a4a66');
    if (lit > 0) ctx.fillStyle = `rgb(${lerp(58, 255, lit) | 0},${lerp(74, 214, lit) | 0},${lerp(102, 130, lit) | 0})`;
    rr(wx - ws / 2, wy, ws, ws, 6); ctx.fill();
    if (lit > 0 && k === 0 && T.silhouettes) silhouette(h.kind, wx, wy + ws - 6, .42, lit);
    ctx.fillStyle = C('#5a3b2c'); ctx.fillRect(wx - 3, wy, 6, ws); ctx.fillRect(wx - ws / 2, wy + ws / 2 - 3, ws, 6);
    if (lit > 0) glow(wx, wy + ws / 2, 170, WARM, .55 * lit);
  });
  // door + sign
  ctx.fillStyle = C('#7a4a34'); rr(x - 34, base - 120, 68, 120, [34, 34, 0, 0]); ctx.fill();
  ctx.fillStyle = C('#e0b04a'); ctx.beginPath(); ctx.arc(x + 18, base - 60, 5, 0, 7); ctx.fill();
  ctx.fillStyle = C('#fff4dc'); rr(x - 50, top + 172, 100, 50, 12); ctx.fill();
  signIcon(h.sign, x, top + 197);
  // flowers on the sill
  for (let k = 0; k < 5; k++) { ctx.fillStyle = C(['#ff8fb8', '#ffd84d', '#ffffff'][k % 3]); ctx.beginPath(); ctx.arc(x - w / 2 + 20 + k * (w - 40) / 4, base - 6, 9, 0, 7); ctx.fill(); }
}
function signIcon(kind, x, y) {
  ctx.save(); ctx.translate(x, y);
  if (kind === 'bread') { ctx.fillStyle = C('#d9954a'); ctx.beginPath(); ctx.ellipse(0, 0, 30, 16, 0, 0, 7); ctx.fill(); ctx.strokeStyle = C('#a8642c'); ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 12 - 4, -8); ctx.lineTo(i * 12 + 4, 8); ctx.stroke(); } }
  if (kind === 'flower') { for (let i = 0; i < 5; i++) { ctx.fillStyle = C('#ff8fb8'); ctx.beginPath(); ctx.arc(Math.cos(i * 1.256) * 11, Math.sin(i * 1.256) * 11, 9, 0, 7); ctx.fill(); } ctx.fillStyle = C('#ffd84d'); ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); }
  if (kind === 'toy') { ctx.fillStyle = C('#e85a5a'); ctx.fillRect(-16, -16, 32, 32); ctx.fillStyle = C('#ffd84d'); ctx.fillRect(-8, -8, 16, 16); }
  if (kind === 'wave') { ctx.strokeStyle = C('#3f8fb3'); ctx.lineWidth = 5; ctx.beginPath(); for (let i = -30; i <= 30; i += 2) ctx.lineTo(i, Math.sin(i / 6) * 7); ctx.stroke(); }
  if (kind === 'book') { ctx.fillStyle = C('#7a5a9a'); ctx.fillRect(-24, -16, 22, 32); ctx.fillStyle = C('#5d7fb3'); ctx.fillRect(2, -16, 22, 32); }
  ctx.restore();
}
function silhouette(kind, x, y, s, a) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = `rgba(70,35,20,${.8 * a})`;
  ctx.beginPath(); ctx.arc(0, -46, 46, 0, 7); ctx.fill(); ctx.fillRect(-56, -10, 112, 20);
  if (kind === 'hedgehog') for (let i = 0; i < 9; i++) { const g = -Math.PI + i * Math.PI / 8; ctx.beginPath(); ctx.moveTo(Math.cos(g) * 40, -46 + Math.sin(g) * 40); ctx.lineTo(Math.cos(g) * 66, -46 + Math.sin(g) * 66); ctx.lineTo(Math.cos(g + .22) * 40, -46 + Math.sin(g + .22) * 40); ctx.fill(); }
  if (kind === 'mouse') [-38, 38].forEach(ex => { ctx.beginPath(); ctx.arc(ex, -86, 24, 0, 7); ctx.fill(); });
  if (kind === 'mole' || kind === 'otter') [-34, 34].forEach(ex => { ctx.beginPath(); ctx.arc(ex, -82, 13, 0, 7); ctx.fill(); });
  if (kind === 'bee') { ctx.lineWidth = 6; ctx.strokeStyle = ctx.fillStyle; [-18, 18].forEach(ex => { ctx.beginPath(); ctx.moveTo(ex, -86); ctx.lineTo(ex * 1.8, -116); ctx.stroke(); }); }
  ctx.restore();
}
// the square: cobbles, lamps, the Glimmerwell
function square(t, T) {
  ctx.fillStyle = C(T.season === 'winter' ? '#e6eef3' : '#d9c3a0'); ctx.fillRect(-600, 1100, 3800, 1200);
  const r = rng(31);
  for (let row = 0; row < 14; row++) {
    const y0 = 1100 + 60 * row + 6 * row * row, hgt = 52 + 12 * row, sw = 90 + 22 * row;
    for (let x = -600 + (row % 2) * sw / 2; x < 3200; x += sw) {
      const v = r();
      ctx.fillStyle = C(T.season === 'winter' ? (v > .5 ? '#f2f6f9' : '#dbe5ec') : (v > .5 ? '#e7d3b0' : '#cfb58e'));
      rr(x + 4, y0 + 4, sw - 8, hgt - 8, 12 + row); ctx.fill();
    }
  }
  // lamp posts
  [[820, 1300, 1], [1780, 1300, 1], [300, 1720, 1.5], [2300, 1720, 1.5]].forEach(([x, y, s], i) => {
    ctx.fillStyle = C('#3b3040'); ctx.fillRect(x - 9 * s, y - 330 * s, 18 * s, 330 * s);
    ctx.fillRect(x - 26 * s, y - 20 * s, 52 * s, 20 * s);
    const on = T.lamps ?? 0;
    ctx.fillStyle = on > 0 ? `rgb(255,${lerp(110, 230, on) | 0},${lerp(80, 150, on) | 0})` : C('#4b4a63');
    rr(x - 30 * s, y - 410 * s, 60 * s, 80 * s, 16 * s); ctx.fill();
    ctx.fillStyle = C('#3b3040'); ctx.beginPath(); ctx.moveTo(x - 40 * s, y - 410 * s); ctx.lineTo(x, y - 450 * s); ctx.lineTo(x + 40 * s, y - 410 * s); ctx.fill();
    if (on > 0) glow(x, y - 370 * s, 300 * s, WARM, .7 * on);
  });
  fountain(1300, 1420, t, T);
  // orbs gathering (the "many paws" offering)
  if (T.orbs) T.orbs.forEach(o => { glow(o.x, o.y, 110, GOLD, .9 * o.a); star(o.x, o.y, 22, `rgba(255,250,220,${o.a})`, t * 3); });
}
function fountain(x, y, t, T) {
  const F = T.fountain || 0, Wt = T.water ?? F;
  // basin
  ctx.fillStyle = C('#8f8aa0'); ctx.beginPath(); ctx.ellipse(x, y + 40, 360, 105, 0, 0, 7); ctx.fill();
  ctx.fillStyle = C('#c9c2d6'); ctx.beginPath(); ctx.ellipse(x, y, 360, 105, 0, 0, 7); ctx.fill();
  ctx.fillStyle = C('#a59fb8'); ctx.beginPath(); ctx.ellipse(x, y - 4, 320, 84, 0, 0, 7); ctx.fill();
  ctx.fillStyle = Wt > 0 ? mix('#3a4766', '#5fd0f2', Wt * LOOK.sat) : C('#3a4766'); ctx.beginPath(); ctx.ellipse(x, y, 300, 72, 0, 0, 7); ctx.fill();
  // ripples
  if (Wt > 0) for (let k = 0; k < 3; k++) { const ph = (t * .6 + k / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${.5 * (1 - ph) * Wt})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 60 + ph * 220, 15 + ph * 52, 0, 0, 7); ctx.stroke(); }
  // pillar + upper bowl
  ctx.fillStyle = C('#a59fb8'); ctx.fillRect(x - 40, y - 260, 80, 260);
  ctx.fillStyle = C('#c9c2d6'); ctx.fillRect(x - 28, y - 260, 40, 260);
  ctx.fillStyle = C('#8f8aa0'); ctx.beginPath(); ctx.ellipse(x, y - 250, 170, 46, 0, 0, 7); ctx.fill();
  ctx.fillStyle = C('#c9c2d6'); ctx.beginPath(); ctx.ellipse(x, y - 270, 170, 46, 0, 0, 7); ctx.fill();
  ctx.fillStyle = Wt > 0 ? mix('#3a4766', '#7fe0ff', Wt * LOOK.sat) : C('#3a4766'); ctx.beginPath(); ctx.ellipse(x, y - 274, 140, 32, 0, 0, 7); ctx.fill();
  // the gem on top
  const gy = y - 350;
  ctx.fillStyle = C('#a59fb8'); ctx.fillRect(x - 14, gy + 10, 28, 70);
  ctx.fillStyle = F > 0 ? `rgb(${lerp(140, 255, F) | 0},${lerp(150, 246, F) | 0},${lerp(180, 200, F) | 0})` : C('#8f9ab8');
  ctx.beginPath(); ctx.moveTo(x, gy - 50); ctx.lineTo(x + 30, gy); ctx.lineTo(x, gy + 26); ctx.lineTo(x - 30, gy); ctx.fill();
  if (F > 0) {
    glow(x, gy, 420, GOLD, F);
    // jets
    const r = rng(5);
    for (let i = 0; i < 110; i++) {
      const ph = (t * 1.1 + r()) % 1, side = r() < .5 ? -1 : 1, spread = 80 + r() * 240;
      const px = x + side * spread * ph, py = y - 300 - 360 * ph + 420 * ph * ph;
      ctx.fillStyle = `rgba(${i % 3 ? '200,244,255' : '255,255,255'},${Wt * (1 - ph * .5)})`;
      ctx.beginPath(); ctx.arc(px, py, 7 + r() * 7, 0, 7); ctx.fill();
    }
    const r2 = rng(8);
    for (let i = 0; i < 26; i++) { const tw = Math.max(0, Math.sin(t * (2 + r2() * 3) + i)); star(x - 420 + r2() * 840, y - 640 + r2() * 640, 6 + 18 * tw, `rgba(255,248,210,${tw * F})`, t + i); }
  }
}
// weather + air
function rain(t, a) {
  if (a <= 0) return;
  ctx.save(); ctx.strokeStyle = `rgba(200,210,230,${.35 * a})`; ctx.lineWidth = 3;
  const r = rng(77);
  for (let i = 0; i < 160; i++) { const x = r() * (W + 400) - 200, sp = 1500 + r() * 700, y = ((r() * H + t * sp) % (H + 200)) - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 18, y + 60); ctx.stroke(); }
  ctx.restore();
}
function fall(t, kind, a = 1, seed = 300) {
  const r = rng(seed);
  for (let j = 0; j < 55; j++) {
    const x0 = r() * W, sp = 120 + r() * 220, ph = r(), size = .6 + r() * .9;
    const y = ((ph * H + t * sp) % (H + 100)) - 50, x = x0 + Math.sin(t * 1.4 + j) * 50;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(t * 1.5 + j); ctx.scale(size, size);
    if (kind === 'petal') { ctx.fillStyle = j % 2 ? '#ffb3cc' : '#fff0f5'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 9, 0, 0, 7); ctx.fill(); }
    if (kind === 'leaf') { ctx.fillStyle = ['#e8742c', '#c94f2c', '#f2b13a'][j % 3]; ctx.beginPath(); ctx.ellipse(0, 0, 22, 11, 0, 0, 7); ctx.fill(); }
    if (kind === 'snow') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); }
    if (kind === 'firefly') { ctx.globalAlpha = a * (.5 + .5 * Math.sin(t * 5 + j)); glow(0, 0, 40, GOLD, .9); }
    ctx.restore();
  }
}
function motes(t, a = 1, seed = 5, area = [0, 0, W, H]) {
  const r = rng(seed);
  for (let i = 0; i < 60; i++) {
    const x = area[0] + ((r() * area[2] + Math.sin(t * .4 + i) * 40 + t * 8) % area[2]), y = area[1] + ((r() * area[3] - t * (10 + r() * 20)) % area[3] + area[3]) % area[3];
    const s = 2 + r() * 5, tw = .4 + .6 * Math.sin(t * 2 + i);
    ctx.fillStyle = `rgba(255,240,200,${a * tw * .7})`; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
  }
}
function bokeh(t, a = 1, seed = 2, cols = ['255,220,160', '255,180,200', '180,220,255']) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const x = r() * W + Math.sin(t * .3 + i) * 60, y = r() * H + Math.cos(t * .25 + i) * 60, rad = 40 + r() * 110;
    ctx.fillStyle = `rgba(${cols[i % cols.length]},${a * .12})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function fog(t, a, col = '200,205,220') {
  if (a <= 0) return;
  const r = rng(51);
  for (let i = 0; i < 8; i++) {
    const x = ((r() * 1600 + t * (20 + r() * 30)) % 1800) - 400, y = 900 + r() * 900, rad = 300 + r() * 300;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(${col},${a * .35})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}
function poof(sx, sy, te, t, seed, big = 1) {
  const dt = t - te; if (dt < 0 || dt > 1.3) return;
  const r = rng(seed);
  for (let i = 0; i < 12 * big; i++) {
    const a = r() * 6.283, sp = (120 + r() * 240) * big, k = easeOut(clamp(dt / 1));
    ctx.fillStyle = `rgba(250,244,236,${(1 - k) * .9})`;
    ctx.beginPath(); ctx.arc(sx + Math.cos(a) * sp * k, sy + Math.sin(a) * sp * k * .7 - 40 * k, (26 + r() * 30) * (1 - k * .7) * Math.sqrt(big), 0, 7); ctx.fill();
  }
  const cols = ['#ffd84d', '#ff8fb8', '#8fe3ff', '#ffffff', '#b8ff8f'];
  for (let i = 0; i < 16 * big; i++) {
    const a = r() * 6.283, sp = (180 + r() * 380) * big, k = easeOut(clamp(dt / 1.1));
    ctx.save(); ctx.globalAlpha = 1 - k * k;
    star(sx + Math.cos(a) * sp * k, sy + Math.sin(a) * sp * k - 80 * k + 160 * k * k, (14 + r() * 18) * (1 - k * .5), cols[i % 5], dt * 6 + i); ctx.restore();
  }
}

// ================= painted interiors (burrow, bakery) =================
let pc = { x: 896, y: 512, z: 1 };
const P = (wx, wy) => [(wx - pc.x) * pc.z + W / 2, (wy - pc.y) * pc.z + H / 2];
function interior(name, blooms, full, fx, fy, grade = {}) {
  const img = IMG[name]; const [x0, y0] = P(0, 0); const w = img.width * pc.z, h = img.height * pc.z;
  ctx.fillStyle = grade.bg || '#1c1614'; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  if (full >= 1) ctx.drawImage(img, x0, y0, w, h);
  else {
    ctx.drawImage(GREY[name], x0, y0, w, h);
    ctx.save(); ctx.beginPath();
    for (const b of blooms) if (b.r > 0) { const [bx, by] = P(b.x, b.y); ctx.moveTo(bx + b.r * pc.z, by); ctx.arc(bx, by, b.r * pc.z, 0, 7); }
    if (full > 0) { const [cx, cy] = P(fx, fy); const rad = full * 2600 * pc.z; ctx.moveTo(cx + rad, cy); ctx.arc(cx, cy, rad, 0, 7); }
    ctx.clip(); ctx.drawImage(img, x0, y0, w, h); ctx.restore();
    for (const b of blooms) {
      if (b.r <= 0 || b.k >= 1) continue; const [bx, by] = P(b.x, b.y);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - b.k) * .7; ctx.strokeStyle = '#fff1b0'; ctx.lineWidth = 22 * (1 - b.k) + 3; ctx.shadowColor = '#ffe9a0'; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.arc(bx, by, b.r * pc.z, 0, 7); ctx.stroke(); ctx.restore();
    }
    if (full > 0) { const [cx, cy] = P(fx, fy); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - full) * .8; ctx.strokeStyle = '#fff1b0'; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(cx, cy, full * 2600 * pc.z, 0, 7); ctx.stroke(); ctx.restore(); }
  }
}
function pspr(name, frame, wx, wy, scale, o = {}) { const [sx, sy] = P(wx, wy); spr(name, frame, sx, sy, scale * pc.z, o); }
function ppuff(state, wx, wy, scale, t, o = {}) { const [sx, sy] = P(wx, wy); puff(state, sx, sy, scale * pc.z, t, o); }
function shafts(t, wx, wy, a, angle = .55) {
  const [sx, sy] = P(wx, wy);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(sx, sy); ctx.rotate(angle);
  for (let i = 0; i < 4; i++) {
    const g = ctx.createLinearGradient(0, 0, 0, 1700); g.addColorStop(0, `rgba(255,232,170,${a * (.3 + .1 * Math.sin(t * 1.5 + i))})`); g.addColorStop(1, 'rgba(255,232,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-60 + i * 40, 0); ctx.lineTo(-30 + i * 40, 0); ctx.lineTo(160 + i * 120, 1700); ctx.lineTo(10 + i * 110, 1700); ctx.fill();
  }
  ctx.restore();
}


// ---------- post ----------
const GRAIN = [];
const SHINE = document.createElement('canvas'); SHINE.width = W; SHINE.height = H;
function grain(t, a = .07) { const g = GRAIN[Math.floor(t * 24) % GRAIN.length]; ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay'; ctx.imageSmoothingEnabled = true; ctx.drawImage(g, 0, 0, W, H); ctx.restore(); }
function vignette(a) { const g = ctx.createRadialGradient(W / 2, H / 2, H * .28, W / 2, H / 2, H * .72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(10,5,10,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function dip(t, at, len = .35, col = '0,0,0') { const d = Math.abs(t - at); if (d < len) { ctx.fillStyle = `rgba(${col},${1 - d / len})`; ctx.fillRect(0, 0, W, H); } }


// Loads sprites, area paintings, grey copies, grain and fonts. Pages await window.ready = loadKit().
async function loadKit() {
  await Promise.all(Object.keys(SHEETS).concat(['burrow', 'bakery']).map(n => new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { IMG[n] = im; res(); }; im.onerror = () => rej(new Error('missing ' + n));
    im.src = ASSETS + (n === 'burrow' || n === 'bakery' ? 'areas/' + n + '.webp' : 'sprites/' + n + '.png');
  })));
  for (const n of Object.keys(IMG)) {
    const c = document.createElement('canvas'); c.width = IMG[n].width; c.height = IMG[n].height;
    const g = c.getContext('2d'); g.filter = 'grayscale(1) brightness(.7) contrast(.85)'; g.drawImage(IMG[n], 0, 0); GREY[n] = c;
  }
  for (let i = 0; i < 6; i++) {
    const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d');
    const d = g.createImageData(540, 960), r = rng(1000 + i);
    for (let p = 0; p < d.data.length; p += 4) { const v = r() * 255; d.data[p] = d.data[p + 1] = d.data[p + 2] = v; d.data[p + 3] = 255; }
    g.putImageData(d, 0, 0); GRAIN.push(c);
  }
  await Promise.all(['700 50px Fredoka', '600 50px Cormorant', '600 50px CormorantI'].map(f => document.fonts.load(f)));
  return true;
}
