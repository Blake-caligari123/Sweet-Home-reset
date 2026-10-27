// Trailer v2 shots. Each: { beats, setup(D), f(D, t) }. 140 bpm.
window.SHOTS = {};
const B = 60 / 140;
const S = window.SHOTS;
const HOOKS = {
  A: 'POV: you sneezed on your whole house',
  B: 'Watch this dust bunny fix an entire town',
  C: 'They did not mean to do that'
};
const MIDDAY = 12 * 60;

// ---- helpers
const baseZoom = (D) => (D.vertical ? 10 / 6 : 1);
// damped spring around 1 (for squash): returns [sx, sy]
function squash(t, t0, amp, { freq = 14, decay = 9 } = {}) {
  const d = t - t0; if (d < 0) return [1, 1];
  const k = amp * Math.exp(-decay * d) * Math.cos(freq * d);
  return [1 + k, 1 - k];
}
function hop(t, t0, h = 10, dur = 0.38) {
  const d = (t - t0) / dur; if (d < 0 || d > 1) return 0;
  return 4 * h * d * (1 - d);
}
function punch(t, t0, amp, decay = 10) { const d = t - t0; return d < 0 ? 0 : amp * Math.exp(-decay * d); }
function hookText(D, t) {
  if (!D.vertical || !D.variant) return;
  const e = D.text('hook', HOOKS[D.variant], { x: 0.5, y: 0.25, size: 2.05, t0: 0, anim: 'pop', cls: 'stk', html: HOOKS[D.variant] });
  if (e) { e.style.whiteSpace = 'normal'; e.style.width = D.vw * 0.84 + 'px'; e.style.textAlign = 'center'; e.style.lineHeight = '1.12'; }
}
function bigText(D, id, txt, o) { return D.text(id, txt, { cls: 'big', size: D.vertical ? 3.2 : 3.4, anim: 'stamp', ...o }); }
function resetFx(D) { Object.assign(D.fx, { sx: 1, sy: 1, lift: 0, closed: false, hide: false, rot: 0 }); D.cam.shake = 0; }
function breathe(D, t, amp = 0.035, rate = 2.2) { const k = Math.sin(t * rate) * amp; D.fx.sx = 1 - k * 0.5; D.fx.sy = 1 + k; }
function sneezeBurst(D, wx, wy, n = 70) {
  D.burst('puff', wx, wy, n, ['#e8e2d6', '#fff8ec', '#cfc6b8'], 110, 10);
  D.burst('puff', wx, wy, n / 2, ['#e8e2d6', '#d9d0c2'], 60, -10);
}
// colour meter driven per shot
const meter = (D, v, pulse = 0) => D.meter(v, { pulse });

// ---- burrow intro (16:9 only): the door opens on a tidy burrow, Puff wakes
S.open = {
  beats: 9,
  setup(D) { D.visit('burrow', 8, 8, true); D.hideMess(); D.place(8, 8); D.tint(MIDDAY); D.cam.zoom = 1.18; },
  f(D, t) {
    resetFx(D);
    const wake = 6 * B;
    D.cam.zoom = 1.18 - 0.14 * D.E.inOut(t / (9 * B));
    if (t < wake) { D.fx.closed = true; breathe(D, t); }
    else {
      D.fx.lift = hop(t, wake, 7, 0.34);
      const [sx, sy] = squash(t, wake + 0.34, 0.16); D.fx.sx = sx; D.fx.sy = sy;
      if (t > wake + 1.0 && t < wake + 1.12) D.fx.closed = true;
    }
    D.cue('creak', 0.25, () => D.sfx('creak'));
    D.cue('wake', wake, () => D.sfx('boing', { pitch: 1.2 }));
    D.cue('blink', wake + 1.0, () => D.sfx('blip', { pitch: 1.6 }));
    // door of light: black with a widening warm slit
    const k = D.E.inOut((t - 0.3) / 1.9);
    const w = D.clamp(k, 0, 1) * 50;
    const L = D.layer('door', 'background:#120d0a;', t < 2.5 ? 1 : 1 - D.clamp((t - 2.5) / 0.3, 0, 1));
    L.style.clipPath = `polygon(0 0,100% 0,100% 100%,0 100%,0 0,${50 - w}% 0,${50 - w}% 100%,${50 + w}% 100%,${50 + w}% 0,${50 - w}% 0)`;
    const g = D.layer('doorglow', 'background:radial-gradient(ellipse at 50% 60%, rgba(255,226,160,.55), rgba(255,226,160,0) 60%);mix-blend-mode:screen', D.clamp(1 - (t - 1.2) / 1.6, 0, 1) * D.clamp(t / 0.6, 0, 1));
    D.alphaTag(t > 2.6);
  }
};

// ---- the sneeze: colour drains, dust bursts out
S.sneeze = {
  beats: 3,
  setup(D) { D.visit('burrow', 8, 8, true); D.hideMess(); D.place(8, 8); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 1.08; },
  f(D, t) {
    resetFx(D);
    const at = D.vertical ? 0.02 : 0.5; // vertical opens mid-sneeze
    const cx = 8.5, cy = 8;
    if (t < at) { // ah... ah...
      const k = D.E.out(t / at); D.fx.sy = 1 + 0.16 * k; D.fx.sx = 1 - 0.1 * k; D.fx.lift = 2 * k; D.fx.closed = t > at * 0.5;
      D.cam.zoom = baseZoom(D) * (1.08 + 0.06 * k);
    } else {
      const [sx, sy] = squash(t, at, 0.3, { freq: 18, decay: 7 }); D.fx.sx = sx * 1.0; D.fx.sy = sy;
      D.fx.closed = t < at + 0.25;
      D.cam.zoom = baseZoom(D) * (1.0 + punch(t, at, 0.12, 6));
      D.cam.shake = punch(t, at, 26, 6);
      D.once('achoo', () => { sneezeBurst(D, D.puff.fx, D.puff.fy - 14); D.sfx('sneeze', { pre: D.vertical ? 0 : 0.5 }); D.sfx('scratch', { at: 0.12 }); });
      const r = D.E.out((t - at) / 0.75) * 22;
      D.radial(cx, cy, r, 0, 4, 2.5);
      D.revealMess(cx, cy, r);
      D.text('achoo', 'ACHOO!', { cls: 'big', size: D.vertical ? 3.6 : 3.8, x: 0.5, y: D.vertical ? 0.45 : 0.22, t0: at, t1: at + 0.65, anim: 'stamp', r: -6 });
    }
    hookText(D, t);
    D.alphaTag();
  }
};

// ---- "Ooh. Grey. Let's fix that."
S.bubble = {
  beats: 4,
  setup(D) { D.visit('burrow', 8, 8, false); D.place(8, 8, 'left'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D); },
  f(D, t) {
    resetFx(D);
    const p = D.puff;
    p.dir = t < B ? 'left' : t < 2 * B ? 'right' : 'down';
    if (t > 2 * B) { const [sx, sy] = squash(t, 2 * B, 0.08); D.fx.sx = sx; D.fx.sy = sy; }
    D.cam.zoom = baseZoom(D) * (1 + 0.07 * D.E.inOut(t / (4 * B)));
    const below = D.vertical;
    const s = below ? D.puffScreen(-12) : D.puffScreen(30);
    const e = D.text('bubble', "Ooh. Grey. Let's fix that.", { x: s.x / D.vw, y: s.y / D.vh, size: D.vertical ? 1.5 : 1.25, t0: 0.15, anim: 'type', cls: 'stk', ay: below ? 0 : 1 });
    if (e && !e.querySelector('.tail')) { const tl = document.createElement('div'); tl.className = 'tail'; const u = D.U(); tl.style.cssText = below ? `position:absolute;left:50%;top:${-u * 0.95}px;width:${u * 0.9}px;height:${u * 0.9}px;background:#fff8ec;border-left:${u * 0.55}px solid #8a6e5e;border-top:${u * 0.55}px solid #8a6e5e;transform:translateX(-50%) rotate(45deg)` : `position:absolute;left:50%;bottom:${-u * 0.95}px;width:${u * 0.9}px;height:${u * 0.9}px;background:#fff8ec;border-right:${u * 0.55}px solid #8a6e5e;border-bottom:${u * 0.55}px solid #8a6e5e;transform:translateX(-50%) rotate(45deg)`; e.append(tl); }
    for (let i = 0; i < 26; i += 2) D.cue('ty' + i, 0.15 + i * 0.045, () => D.sfx('blip', { pitch: 1 + (i % 6) * 0.08, gain: 0.5 }));
    hookText(D, t);
    D.alphaTag();
  }
};

// ---- "Grab a duster." (16:9)
S.duster = {
  beats: 4,
  setup(D) { D.visit('burrow', 8, 8, false); D.place(6, 8, 'down'); D.tint(MIDDAY); D.cam.zoom = 1.7; D.cam.snap = true; },
  f(D, t) {
    resetFx(D); D.cam.snap = false;
    const p = D.puff;
    p.pose = t < 2 * B ? 'swing' : 'idle';
    D.cam.zoom = 1.6 + punch(t, 0, 0.25, 7) + punch(t, 2 * B, 0.1, 9);
    D.cam.shake = punch(t, 0, 14, 9);
    const [sx, sy] = squash(t, 0, 0.18); D.fx.sx = sx; D.fx.sy = sy;
    bigText(D, 'grab', 'Grab a duster.', { x: 0.5, y: 0.2, t0: 0.02 });
    D.cue('hit0', 0.0, () => D.sfx('impact'));
    D.cue('clean', 2 * B, () => { const m = nearestDust(D, 3); if (m[0]) { D.clean(m[0].x, m[0].y, 16); D.sfx('pop', { pitch: 1 }); } });
    D.alphaTag();
  }
};

function nearestDust(D, n, types = ['dust']) {
  const p = D.puff; const fx = p.fx / 16, fy = (p.fy - 4) / 16;
  return D.messList().filter((m) => types.includes(m.type)).sort((a, b) => Math.hypot(a.x + 0.5 - fx, a.y + 0.5 - fy) - Math.hypot(b.x + 0.5 - fx, b.y + 0.5 - fy)).slice(0, n);
}
function faceTo(D, m) {
  const p = D.puff; const dx = m.x * 16 + 8 - p.fx, dy = m.y * 16 + 8 - (p.fy - 6);
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

// ---- rhythm clean: four piles on four beats
S.rhythm = {
  beats: 6,
  setup(D) { D.visit('burrow', 8, 8, false); D.place(5, 9, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 1.15; D.targets = nearestDust(D, 4).sort((a, b) => a.x - b.x || a.y - b.y); },
  f(D, t) {
    resetFx(D);
    const p = D.puff, tg = D.targets;
    let z = baseZoom(D) * 1.15;
    for (let i = 0; i < 4; i++) {
      const tb = (i + 1) * B;
      if (tg[i] && t >= tb - 0.16 && t < tb) { faceTo(D, tg[i]); p.pose = 'swing'; }
      if (tg[i]) D.cue('c' + i, tb, () => { D.clean(tg[i].x, tg[i].y, 14); p.pose = 'idle'; D.sfx('pop', { pitch: [1, 1.122, 1.26, 1.335][i] }); D.sfx('sparkle', { gain: 0.4 }); });
      z += punch(t, tb, 0.06, 12) * baseZoom(D);
      const [sx, sy] = squash(t, tb, 0.12); if (t >= tb) { D.fx.sx = sx; D.fx.sy = sy; }
    }
    if (t >= 5 * B) { p.dir = 'down'; D.fx.lift = hop(t, 5 * B, 8, 0.36); const [sx, sy] = squash(t, 5 * B + 0.36, 0.14); if (t > 5 * B + 0.36) { D.fx.sx = sx; D.fx.sy = sy; } D.cue('hop', 5 * B, () => D.sfx('boing', { pitch: 1.3, gain: 0.6 })); }
    D.cam.zoom = z;
    const v = 0.05 * [B, 2 * B, 3 * B, 4 * B].filter((x) => t >= x).length;
    meter(D, 0.04 + v, punch(t, Math.floor(t / B) * B, 0.6, 10) * (t >= B && t < 4.5 * B ? 1 : 0));
    D.alphaTag();
  }
};

// ---- items into the bag (16:9)
S.items = {
  beats: 4,
  setup(D) { D.visit('burrow', 8, 8, false); D.place(5, 10, 'down'); D.tint(MIDDAY); D.cam.zoom = 1.25; D.cam.y = 10 * 16 + 4; },
  f(D, t) {
    resetFx(D);
    const p = D.puff;
    const at = 0.5 * B;
    if (t >= at - 0.15 && t < at) p.pose = 'swing';
    D.cue('sock', at, () => { const s = D.tileScreen(5, 11); D.flyFrom = s; D.clean(5, 11, 12); p.pose = 'idle'; D.sfx('pop', { pitch: 1.5 }); });
    // bag
    const u = D.U(); const bx = D.vw - u * 4, by = D.vh - u * 4.2;
    const bag = D.el('bag', (e) => { e.innerHTML = `<div style="width:${u * 5}px;height:${u * 5}px;background:#fff8ec;border:${u * 0.45}px solid #8a6e5e;border-radius:${u * 1.4}px;box-shadow:0 ${u * 0.45}px 0 #8a6e5e;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${u * 1.1}px;flex-direction:column"><div class="slot" style="width:${u * 2.6}px;height:${u * 2.6}px"></div>Bag</div>`; });
    const land = at + 0.55;
    D.place2(bag, bx, by, { s: D.E.back(t / 0.3) * (1 + punch(t, land, 0.25, 9)) });
    const fly = D.el('flysock', (e) => { e.className = 'o spr'; e.style.width = e.style.height = u * 2.6 + 'px'; e.style.backgroundImage = 'url(/Sweet-Home-reset/sprites/item_sock.png)'; e.style.backgroundSize = '100% 100%'; });
    if (t < at) fly.style.display = 'none';
    else {
      const k = D.E.inOut((t - at) / 0.55), s0 = D.flyFrom || { x: D.vw / 2, y: D.vh / 2 };
      const x = D.lerp(s0.x, bx, k), y = D.lerp(s0.y, by - u * 0.5, k) - Math.sin(k * Math.PI) * u * 6;
      D.place2(fly, x, y, { s: 1 + Math.sin(k * Math.PI) * 0.6, r: k * 360 });
    }
    D.cue('land', land, () => D.sfx('jingle'));
    D.cue('c2', 2.5 * B, () => { const m = nearestDust(D, 1)[0]; if (m) { faceTo(D, m); D.clean(m.x, m.y, 12); D.sfx('pop', { pitch: 1.26 }); } });
    D.text('tidy', 'Tidy up.', { cls: 'big', size: 3.4, x: 0.5, y: 0.2, t0: 0.02, anim: 'stamp' });
    meter(D, 0.25 + (t > land ? 0.05 : 0) + (t > 2.5 * B ? 0.03 : 0), punch(t, land, 0.6, 10));
    D.alphaTag();
  }
};

// ---- "Bring back the colour…" — Puff dusts the caption away (snare roll)
S.crumble = {
  beats: 4,
  setup(D) { D.visit('burrow', 8, 8, false); D.place(3, 9, 'right'); D.tint(MIDDAY); D.cam.x = 8.5 * 16; D.cam.y = 8.2 * 16; D.cam.zoom = baseZoom(D) * (D.vertical ? 0.95 : 1); D.cam.snap = true; },
  f(D, t) {
    resetFx(D); D.cam.snap = false;
    const dur = 4 * B, p = D.puff;
    // walk across, duster out
    const k = D.clamp(t / (dur * 0.92), 0, 1);
    p.fx = (2.5 + k * 12) * 16; p.fy = 9 * 16 + 12; p.path = []; p.dir = 'right';
    p.pose = Math.floor(t / 0.11) % 2 ? 'swing' : 'walk';
    D.cam.zoom = baseZoom(D) * ((D.vertical ? 0.95 : 1) + 0.12 * D.E.inOut(t / dur));
    const cap = D.text('bring', 'Bring back the colour…', { cls: 'stk', size: D.vertical ? 1.9 : 2.0, x: 0.5, y: D.vertical ? 0.62 : 0.72, t0: 0, anim: 'pop', crumble: 0.25 * dur, crumbleDur: 0.6 * dur });
    // dust where letters fall
    if (t > 0.25 * dur) D.particles('cr', D.vw * (0.25 + 0.5 * D.clamp((t - 0.25 * dur) / (0.6 * dur), 0, 1)), D.vh * (D.vertical ? 0.62 : 0.72), 0.25 * dur, { n: 30, speed: 260, grav: 500, life: 1.4, size: 0.8 });
    for (let i = 0; i < 3; i++) { const m = nearestDust(D, 1)[0]; if (m && Math.abs(m.x + 0.5 - p.fx / 16) < 0.6 && Math.abs(m.y - 9) < 1.6) { D.clean(m.x, m.y, 8); D.sfx('pop', { pitch: 1.1 + i * 0.1, gain: 0.5 }); } }
    meter(D, 0.33);
    D.alphaTag();
  }
};

// ---- THE DROP: colour wave through the whole burrow
S.drop = {
  beats: 6,
  setup(D) { D.visit('burrow', 8, 8, false); D.place(9, 8, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 1.5; D.cam.snap = true; },
  f(D, t) {
    resetFx(D); D.cam.snap = false;
    const p = D.puff; const cx = 9.5, cy = 8;
    p.pose = t < 0.3 ? 'swing' : 'idle';
    const r = D.E.out(t / 1.5) * 34;
    D.radial(cx, cy, r, 4, 0, 3);
    D.sweepMess(cx, cy, r);
    const zEnd = D.vertical ? 1.15 : 0.82;
    D.cam.zoom = baseZoom(D) * (D.lerp(1.5, zEnd, D.E.inOut((t - 0.15) / 1.4)) + punch(t, 0, 0.2, 8));
    D.cam.ease = 0.12;
    D.cam.shake = punch(t, 0, 30, 5);
    const [sx, sy] = squash(t, 0, 0.25, { freq: 16, decay: 6 }); D.fx.sx = sx; D.fx.sy = sy;
    if (t > 1.2) { D.fx.lift = hop(t, 1.2, 10, 0.4) + hop(t, 1.2 + 2 * B, 7, 0.34); }
    D.cue('drop', 0, () => { D.sfx('impact', { gain: 1.2 }); D.sfx('sweep'); for (let i = 0; i < 8; i++) D.W.sparkleBurst(9 + (i % 4) - 1, 7 + (i >> 2), 18); });
    D.cue('hop1', 1.2, () => D.sfx('boing', { pitch: 1.2, gain: 0.6 }));
    bigText(D, 'all', '…ALL OF IT!', { x: 0.5, y: D.vertical ? 0.3 : 0.24, t0: 0.03, t1: 6 * B - 0.25, size: D.vertical ? 4.2 : 4.6, r: -4 });
    D.particles('allsp', D.vw / 2, D.vh * (D.vertical ? 0.3 : 0.24), 0.05, { n: 40, speed: 900, grav: 600, life: 1.2, size: 1.3, shape: 'star', colours: ['#fff8ec', '#f6e3a1', '#f4c2a8', '#a9cda0'] });
    meter(D, 0.33 + 0.37 * D.E.out(t / 1.5), t < 1.6 ? 0.5 : 0);
    D.alphaTag();
  }
};

// ---- montage
const whip = (D, t, dir = 1) => { D.cam.dx = dir * 140 * (1 - D.E.out(t / 0.28)); D.canvasFilter(t < 0.22 ? `blur(${(1 - t / 0.22) * 10}px)` : ''); };
S.yard = {
  beats: 4,
  setup(D) { D.visit('yard', 12, 6, true); D.place(12, 6, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 1.05; D.walkTo(19, 9); },
  f(D, t) {
    resetFx(D); whip(D, t, -1);
    D.fx.lift = hop(t, 0, 9, 0.36);
    D.cue('wh', 0, () => D.sfx('whoosh'));
    if (D.vertical) D.text('w1', 'Explore', { cls: 'big', size: 3.6, x: 0.5, y: 0.28, t0: 0.05, anim: 'stamp' });
    else D.text('w1', 'Explore Hollowfern.', { cls: 'big', size: 3.4, x: 0.5, y: 0.2, t0: 0.05, anim: 'stamp' });
    meter(D, 0.74);
    D.alphaTag();
  }
};
S.square = {
  beats: 2,
  setup(D) { D.visit('square', 7, 10, true); D.place(7, 10, 'right'); D.tint(15 * 60); D.cam.zoom = 1.1; D.walkTo(12, 12); },
  f(D, t) { resetFx(D); whip(D, t, 1); D.cue('wh', 0, () => D.sfx('whoosh', { gain: 0.6 })); meter(D, 0.76); D.alphaTag(); }
};
const CAKES = [120.5, 135, 148.5, 162.5, 177, 191.5, 207];
S.bakery = {
  beats: 4,
  setup(D) { D.visit('bakery', 10, 10, true); D.hideMess(); D.place(10, 10, 'up'); D.tint(MIDDAY); D.cam.x = 164; D.cam.y = 148; D.cam.zoom = baseZoom(D) * (D.vertical ? 0.95 : 1.2); D.cam.snap = true; },
  f(D, t) {
    resetFx(D); D.cam.snap = false; whip(D, t, 1);
    D.cue('wh', 0, () => D.sfx('whoosh', { gain: 0.6 }));
    let z = D.vertical ? 0.95 : 1.2;
    const n = D.vertical ? 7 : 7;
    for (let i = 0; i < n; i++) {
      const tb = 0.25 + i * (D.vertical ? B * 0.5 : B * 0.5);
      D.cue('cake' + i, tb, () => { D.burst('sparkle', CAKES[i], 132, 16, ['#fff8ec', '#f6e3a1', '#f4c2a8'], 50, 10); D.burst('sparkle', CAKES[i], 148, 16, ['#fff8ec', '#f6e3a1', '#f7d2bf'], 50, 10); D.sfx('pop', { pitch: [1, 1.122, 1.26, 1.335, 1.5, 1.68, 1.89][i], gain: 0.6 }); });
      z += punch(t, tb, 0.03, 12);
    }
    D.cam.zoom = baseZoom(D) * z;
    if (D.vertical) D.text('w2', 'Bake', { cls: 'big', size: 3.6, x: 0.5, y: 0.7, t0: 0.05, anim: 'stamp' });
    else D.text('w2', 'Pop into the bakery.', { cls: 'big', size: 3.4, x: 0.5, y: 0.8, t0: 0.05, anim: 'stamp' });
    meter(D, 0.8);
    D.alphaTag();
  }
};
// before / after wipe in the burrow
S.beforeafter = {
  beats: 4,
  setup(D) { D.visit('burrow', 8, 8, false); D.place(8, 8, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * (D.vertical ? 0.9 : 0.85); D.cam.x = 9 * 16; D.cam.y = 8.5 * 16; D.cam.snap = true; D.saved = D.messList(); },
  f(D, t) {
    resetFx(D); D.cam.snap = false;
    const a = D.W.area;
    const k = D.E.inOut((t - 0.35) / (2.2 * B));
    // 16:9: colour sweeps in from the right; vertical: from the bottom
    let edgeS; // screen position of the wipe
    if (D.vertical) {
      const top = D.W.toWorld(0, 0).y / 16, bot = D.W.toWorld(0, D.vh).y / 16;
      const wy = D.lerp(bot, (top + bot) / 2, k);
      D.colourField((x, y) => (y + 0.5 > wy ? 4 : 0));
      for (const m of D.saved) { const i = m.y * a.w + m.x; if (m.y + 0.5 > wy && D.G.mess.type[i]) { D.G.mess.type[i] = 0; D.W.syncMess(i); D.W.sparkleBurst(m.x, m.y, 6); } }
      edgeS = D.W.toScreen(0, wy * 16).y;
      const line = D.el('wline', (e) => { e.style.cssText += `;width:${D.vw}px;height:${D.U() * 0.45}px;background:#fff8ec;box-shadow:0 0 0 ${D.U() * 0.25}px #8a6e5e`; });
      D.place2(line, D.vw / 2, edgeS);
      D.text('lb', 'BEFORE', { cls: 'stk', size: 1.6, x: 0.5, y: 0.2, t0: 0.1, anim: 'pop' });
      D.text('la', 'AFTER', { cls: 'stk', size: 1.6, x: 0.5, y: 0.82, t0: 0.1 + B, anim: 'pop' });
    } else {
      const left = D.W.toWorld(0, 0).x / 16, right = D.W.toWorld(D.vw, 0).x / 16;
      const wx = D.lerp(right, (left + right) / 2, k);
      D.colourField((x) => (x + 0.5 > wx ? 4 : 0));
      for (const m of D.saved) { const i = m.y * a.w + m.x; if (m.x + 0.5 > wx && D.G.mess.type[i]) { D.G.mess.type[i] = 0; D.W.syncMess(i); D.W.sparkleBurst(m.x, m.y, 6); } }
      edgeS = D.W.toScreen(wx * 16, 0).x;
      const line = D.el('wline', (e) => { e.style.cssText += `;height:${D.vh}px;width:${D.U() * 0.45}px;background:#fff8ec;box-shadow:0 0 0 ${D.U() * 0.25}px #8a6e5e`; });
      D.place2(line, edgeS, D.vh / 2);
      D.text('lb', 'BEFORE', { cls: 'stk', size: 1.6, x: 0.25, y: 0.88, t0: 0.1, anim: 'pop' });
      D.text('la', 'AFTER', { cls: 'stk', size: 1.6, x: 0.75, y: 0.88, t0: 0.1 + B, anim: 'pop' });
    }
    D.cue('sw', 0.35, () => D.sfx('swoosh'));
    meter(D, 0.8 + 0.08 * k);
    D.alphaTag();
  }
};
// the Glimmerwell
S.fountain = {
  beats: 4,
  setup(D) { D.visit('square', 14, 13, true); D.place(14, 13, 'up'); D.tint(MIDDAY); D.cam.x = 240; D.cam.y = 170; D.cam.zoom = baseZoom(D) * (D.vertical ? 0.95 : 1.0); D.cam.snap = true; D.colourAll(0); },
  f(D, t) {
    resetFx(D); D.cam.snap = false;
    const at = B;
    if (t >= at) {
      const r = D.E.out((t - at) / 1.3) * 26;
      D.radial(15, 10, r, 4, 0, 3);
      if (t - at < 1.1 && D.frameNo % 2 === 0) D.burst('sparkle', 240 + (D.rnd() - 0.5) * 4, 146, 6, ['#a9bfd6', '#c1d1e2', '#fff8ec'], 70, 110);
      D.cam.shake = punch(t, at, 16, 7);
    }
    D.cam.zoom = baseZoom(D) * ((D.vertical ? 0.95 : 1.0) + punch(t, at, 0.12, 6) + 0.05 * D.E.inOut(t / (4 * B)));
    D.cue('burst', at, () => { D.sfx('water'); D.burst('sparkle', 240, 150, 40, ['#a9bfd6', '#fff8ec', '#f6e3a1'], 110, 60); });
    if (t >= at) D.layer('flash', 'background:#fff8ec', D.clamp(1 - (t - at) / 0.25, 0, 1) * 0.7);
    if (D.vertical) D.text('w3', 'Restore', { cls: 'big', size: 3.6, x: 0.5, y: 0.72, t0: at, anim: 'stamp' });
    else D.text('w3', 'Restore the Glimmerwell.', { cls: 'big', size: 3.4, x: 0.5, y: 0.82, t0: at, anim: 'stamp' });
    meter(D, t < at ? 0.88 : 0.95, punch(t, at, 0.6, 8));
    D.alphaTag();
  }
};
// six neighbours (silhouettes)
const SIL = [
  '<path d="M31 40 L27 12 L47 30Z M69 40 L73 12 L53 30Z"/><circle cx="50" cy="54" r="25"/>', // cat
  '<circle cx="29" cy="33" r="11"/><circle cx="71" cy="33" r="11"/><circle cx="50" cy="55" r="25"/>', // bear
  '<path d="M26 46 L22 10 L46 32Z M74 46 L78 10 L54 32Z M24 44 Q50 26 76 44 Q72 70 50 82 Q28 70 24 44Z"/>', // fox
  '<path d="M46 32 Q46 10 60 14 Q52 20 56 32Z M70 50 L92 57 L70 64Z"/><circle cx="50" cy="56" r="24"/>', // bird
  '<path d="M22 54 L20 38 L30 42 L30 26 L40 34 L46 18 L52 32 L60 18 L64 34 L72 26 L72 42 L82 38 L78 54Z"/><circle cx="50" cy="58" r="24"/>', // hedgehog
  '<circle cx="33" cy="38" r="11"/><circle cx="67" cy="38" r="11"/><ellipse cx="50" cy="60" rx="30" ry="21"/>' // frog
];
S.neighbours = {
  beats: 6,
  setup(D) { D.visit('square', 14, 12, true); D.place(14, 12, 'down'); D.tint(MIDDAY); D.cam.zoom = 1; },
  f(D, t) {
    resetFx(D); D.fx.hide = true;
    D.canvasFilter('blur(6px)');
    D.layer('dim', 'background:rgba(249,237,194,.55)');
    const u = D.U();
    for (let i = 0; i < 6; i++) {
      const tb = 0.2 + i * B * 0.75;
      if (t < tb) continue;
      const e = D.el('card' + i, (e) => { e.style.perspective = '800px'; e.innerHTML = `<div class="cd" style="width:${u * 5.6}px;height:${u * 7.2}px;background:#fff8ec;border:${u * 0.45}px solid #8a6e5e;border-radius:${u * 1}px;box-shadow:0 ${u * 0.5}px 0 #8a6e5e;display:flex;flex-direction:column;align-items:center;justify-content:center"><svg viewBox="0 0 100 90" width="${u * 4.4}" height="${u * 4}"><g fill="#534239">${SIL[i]}</g></svg><div style="font-weight:900;font-size:${u * 1.5}px;line-height:1">?</div></div>`; });
      const k = (t - tb) / 0.32;
      e.firstChild.style.transform = `rotateY(${(1 - D.E.back(k)) * 90}deg)`;
      D.place2(e, D.vw * (0.5 + (i - 2.5) * 0.15), D.vh * 0.55 + Math.sin(t * 3 + i) * u * 0.15, {});
      D.cue('fl' + i, tb, () => D.sfx('flip', { pitch: 1 + i * 0.09 }));
    }
    D.text('nb', 'Meet six neighbours.', { cls: 'big', size: 3.2, x: 0.5, y: 0.2, t0: 0.05, anim: 'stamp' });
    D.alphaTag();
  }
};
// cosy night (half-time)
S.night = {
  beats: 8,
  setup(D) { D.visit('burrow', 6, 8, true); D.hideMess(); D.place(6, 8, 'down'); D.tint(22 * 60); D.cam.zoom = 1.05; },
  f(D, t) {
    resetFx(D); D.canvasFilter('');
    const dur = 8 * B;
    D.cam.zoom = 1.05 + 0.15 * D.E.inOut(t / dur);
    if (t < 1.0) { const k = Math.sin(D.clamp(t / 1.0, 0, 1) * Math.PI); D.fx.sy = 1 + 0.12 * k; D.fx.sx = 1 - 0.06 * k; D.fx.closed = t > 0.25; }
    else { D.fx.closed = true; breathe(D, t, 0.04, 2.4); }
    D.cue('yawn', 0.05, () => D.sfx('yawn'));
    const s = D.puffScreen(30);
    for (let i = 0; i < 3; i++) {
      const tz = 1.1 + i * 0.7; if (t < tz) continue;
      const q = (t - tz) % 2.1;
      const z = D.el('z' + i, (e) => { e.className = 'o big'; e.style.fontSize = D.U() * (1.4 + i * 0.4) + 'px'; e.textContent = 'z'; });
      D.place2(z, s.x + D.U() * (1.5 + q * 1.5) + Math.sin(q * 3) * D.U() * 0.5, s.y - q * D.U() * 3, { o: D.clamp(1 - q / 2.1, 0, 1) * D.clamp(q / 0.2, 0, 1) });
    }
    D.layer('lamp', 'background:#0e1020', D.clamp((t - dur + 1.2) / 1.2, 0, 1) * 0.35);
    D.text('cosy', 'Cosy. Kind. No ads.', { cls: 'big', size: 3.0, x: 0.5, y: 0.8, t0: 2 * B, anim: 'words', beat: 1.3 * B });
    D.alphaTag();
  }
};

// ---- logo + stinger
function logoCard(D, t, { inAt = B, grey = 0, puffT = 2 * B, sneezeAt = null }) {
  const u = D.U();
  const card = D.el('logo', (e) => {
    e.innerHTML = `<div class="lc" style="background:#fff8ec;border:${u * 0.55}px solid #8a6e5e;border-radius:${u * 2}px;box-shadow:0 ${u * 0.7}px 0 #8a6e5e;padding:${u * 1.4}px ${u * 3}px ${u * 1.6}px;text-align:center">
      <div style="color:#79b176;font-weight:900;letter-spacing:.22em;font-size:${u * 0.95}px">PUFF'S</div>
      <div style="font-weight:900;font-size:${u * (D.vertical ? 3.4 : 4.4)}px;line-height:1.02;letter-spacing:-.02em;white-space:${D.vertical ? 'normal' : 'nowrap'};width:${D.vertical ? u * 15 + 'px' : 'auto'}">Sweet Home Reset</div>
      <div class="cs" style="display:inline-block;margin-top:${u * 0.8}px;background:#a9cda0;border:${u * 0.35}px solid #8a6e5e;border-radius:${u * 0.9}px;box-shadow:0 ${u * 0.35}px 0 #8a6e5e;padding:${u * 0.35}px ${u * 1.2}px;font-weight:900;font-size:${u * 1.2}px">Coming soon</div>
      <div class="pl" style="margin-top:${u * 0.7}px;font-weight:700;font-size:${u * 0.72}px;color:#8a6e5e">Web · iOS · Android</div>
      <div class="at" style="margin-top:${u * 0.55}px;display:inline-block" ><span class="o tag" style="position:static;font-size:${u * 0.55}px">ALPHA TRAILER</span></div>
    </div>`;
  });
  const k = (t - inAt) / 0.55;
  if (t < inAt) { card.style.display = 'none'; return; }
  const s = D.E.elastic(k);
  const sh = sneezeAt != null ? punch(t, sneezeAt, 18, 6) : 0;
  D.place2(card, D.vw / 2 + (D.hash(D.frameNo) - 0.5) * sh, D.vh * (D.vertical ? 0.5 : 0.55) + (D.hash(D.frameNo + 5) - 0.5) * sh, { s });
  card.style.filter = grey ? `grayscale(${grey})` : '';
  const cs = card.querySelector('.cs'), pl = card.querySelector('.pl'), at = card.querySelector('.at');
  const kc = (t - inAt - 2 * B) / 0.3; cs.style.transform = `scale(${D.E.back(kc)})`;
  pl.style.opacity = D.clamp((t - inAt - 2.5 * B) / 0.2, 0, 1); at.style.opacity = D.clamp((t - inAt - 3 * B) / 0.2, 0, 1);
  // Puff lands on top of the card
  const rect = card.firstElementChild.getBoundingClientRect();
  const topY = rect.top + 2;
  const h = u * (D.vertical ? 7.5 : 7.5);
  if (t >= puffT) {
    const fall = D.clamp((t - puffT) / 0.32, 0, 1);
    const y = D.lerp(-h, topY, fall * fall);
    let [sx, sy] = fall >= 1 ? squash(t, puffT + 0.32, 0.25) : [0.92, 1.1];
    let closed = false;
    if (sneezeAt != null) {
      const pre = 0.55;
      if (t > sneezeAt - pre && t < sneezeAt) { const q = D.E.out((t - (sneezeAt - pre)) / pre); sy = 1 + 0.16 * q; sx = 1 - 0.1 * q; closed = q > 0.5; }
      if (t >= sneezeAt) { [sx, sy] = squash(t, sneezeAt, 0.3, { freq: 18, decay: 7 }); closed = t < sneezeAt + 0.25; }
    }
    D.domPuff('lpuff', rect.left + rect.width * 0.78, y, h, { sx, sy, closed, grey: grey * 0.0 });
    D.cue('land', puffT + 0.32, () => D.sfx('land'));
  }
}
S.logo = {
  beats: 6,
  setup(D) { D.visit('burrow', 9, 8, true); D.hideMess(); D.place(9, 8); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.9; },
  f(D, t) {
    resetFx(D); D.fx.hide = true;
    D.canvasFilter('blur(5px) saturate(1.1)');
    D.layer('dim', 'background:rgba(249,237,194,.5)');
    // meter fills and bursts
    if (t < B) { meter(D, 0.95 + 0.05 * D.E.out(t / (0.6 * B)), D.clamp(t / B, 0, 1)); }
    const u = D.U();
    const mp = D.vertical ? { x: u * 1.9, y: D.vh * 0.42 } : { x: u * 9.2, y: u * 2.2 };
    D.particles('mb', mp.x, mp.y, B, { n: 50, speed: 1200, grav: 700, life: 1.3, size: 1.4, shape: 'star', colours: ['#fff8ec', '#f6e3a1', '#f4c2a8', '#a9cda0', '#a9bfd6'] });
    D.cue('mburst', B, () => D.sfx('burst'));
    D.cue('logo', B, () => D.sfx('boing', { pitch: 0.9 }));
    D.cue('jing', 3 * B, () => D.sfx('jingle', { gain: 0.8 }));
    logoCard(D, t, { inAt: B, puffT: 2 * B });
    D.particles('lc', D.vw / 2, D.vh * 0.55, B + 0.05, { n: 36, speed: 900, grav: 500, life: 1.5, size: 1.2, shape: 'star', colours: ['#fff8ec', '#f6e3a1', '#a9cda0'] });
  }
};
S.stinger = {
  beats: 5,
  setup(D) { D.visit('burrow', 9, 8, true); D.hideMess(); D.place(9, 8); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.9; },
  f(D, t) {
    resetFx(D); D.fx.hide = true;
    D.layer('dim', 'background:rgba(249,237,194,.5)');
    const sneezeAt = D.vertical ? 3 * B - 0.02 : 1.3 * B;
    const grey = D.vertical ? 0 : D.clamp((t - sneezeAt) / 0.45, 0, 1);
    D.canvasFilter(`blur(5px) grayscale(${grey})`);
    logoCard(D, t, { inAt: -10, puffT: -10, grey, sneezeAt });
    if (!D.vertical) {
      D.cue('sn', sneezeAt, () => D.sfx('sneeze', { pre: 0.5 }));
      const s = document.querySelector('#tr .spr');
      if (s && t >= sneezeAt) { const r = s.getBoundingClientRect(); D.particles('sd', r.left + r.width / 2, r.top + r.height * 0.4, sneezeAt, { n: 60, speed: 1100, grav: 200, life: 1.4, size: 2.2, colours: ['#e8e2d6', '#fff8ec', '#cfc6b8'] }); }
      D.text('oop', 'oops.', { cls: 'stk', size: 1.4, x: 0.5, y: 0.9, t0: 3.3 * B, anim: 'pop' });
      D.cue('bonk', 3.3 * B, () => D.sfx('bonk'));
      D.layer('black', 'background:#000', D.clamp((t - 4.4 * B) / 0.15, 0, 1));
    } else {
      D.cue('pre', sneezeAt - 0.55, () => D.sfx('ahah'));
    }
  }
};
for (const s of Object.values(S)) s.dur = s.beats * B;
// cover image: half grey / half colour, Puff on the seam
S.cover = {
  beats: 1,
  setup(D) { D.visit('burrow', 8, 8, false); D.place(9, 8, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * (D.vertical ? 1.45 : 1.05); D.cam.x = 9.5 * 16; D.cam.y = 8.2 * 16; D.cam.snap = true; D.saved = D.messList(); },
  f(D, t) {
    resetFx(D);
    const a = D.W.area;
    const seam = (x, y) => (D.vertical ? y + 0.5 > 9.3 : x + 0.5 > 9.5);
    D.colourField((x, y) => (seam(x, y) ? 4 : 0));
    for (const m of D.saved) { const i = m.y * a.w + m.x; if (seam(m.x, m.y) && D.G.mess.type[i]) { D.G.mess.type[i] = 0; D.W.syncMess(i); } }
    const u = D.U();
    if (D.vertical) {
      const s = D.W.toScreen(0, 8.8 * 16).y;
      const line = D.el('wline', (e) => { e.style.cssText += `;width:${D.vw}px;height:${u * 0.45}px;background:#fff8ec;box-shadow:0 0 0 ${u * 0.25}px #8a6e5e`; }); D.place2(line, D.vw / 2, s);
    } else {
      const s = D.W.toScreen(9.5 * 16, 0).x;
      const line = D.el('wline', (e) => { e.style.cssText += `;height:${D.vh}px;width:${u * 0.45}px;background:#fff8ec;box-shadow:0 0 0 ${u * 0.25}px #8a6e5e`; }); D.place2(line, s, D.vh / 2);
    }
    D.text('ct', 'Sweet Home Reset', { cls: 'big', size: D.vertical ? 2.9 : 4.4, x: 0.5, y: D.vertical ? 0.24 : 0.2, t0: -1, anim: 'none' });
    D.text('cb', 'BEFORE', { cls: 'stk', size: 1.5, x: D.vertical ? 0.5 : 0.22, y: D.vertical ? 0.33 : 0.86, t0: -1, anim: 'none' });
    D.text('ca', 'AFTER', { cls: 'stk', size: 1.5, x: D.vertical ? 0.5 : 0.78, y: D.vertical ? 0.86 : 0.86, t0: -1, anim: 'none' });
    D.alphaTag();
  }
};
S.cover.dur = S.cover.beats * B;
