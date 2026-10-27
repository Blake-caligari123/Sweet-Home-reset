// v4: 30-second cuts (70 beats at 140 bpm). Puff walks the game's own nav paths, so they only ever
// stand on open floor. Uses helpers from shots.js / shots3.js (B, bt, squash, hop, punch, baseZoom,
// resetFx, breathe, sneezeBurst, logoCard, CAKES, SIL, MIDDAY, FREEZE, PENTA, semis).
const S4 = window.SHOTS;

// ---- routing on the nav grid
function v4Len(pts) { let L = 0; for (let j = 1; j < pts.length; j++) L += Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y); return L; }
function v4At(pts, d) {
  for (let j = 1; j < pts.length; j++) {
    const a = pts[j - 1], b = pts[j], L = Math.hypot(b.x - a.x, b.y - a.y);
    if (d <= L || j === pts.length - 1) { const k = L ? Math.min(1, d / L) : 1; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, dx: b.x - a.x, dy: b.y - a.y }; }
    d -= L;
  }
  const z = pts[pts.length - 1]; return { x: z.x, y: z.y, dx: 0, dy: 0 };
}
// Greedy route over mess tiles (or points): each leg is a real path that ends within reach of the target.
function v4Route(D, cands, n, from) {
  const nav = D.G.nav; const legs = []; let cur = { x: from.x, y: from.y }; const pool = cands.slice();
  while (legs.length < n && pool.length) {
    pool.sort((a, b) => Math.hypot(a.x * 16 + 8 - cur.x, a.y * 16 + 8 - cur.y) - Math.hypot(b.x * 16 + 8 - cur.x, b.y * 16 + 8 - cur.y));
    let best = null, bi = -1;
    for (let k = 0; k < Math.min(6, pool.length); k++) {
      const m = pool[k];
      const r = m.pt ? { x0: m.pt.x - 1, y0: m.pt.y - 1, x1: m.pt.x + 1, y1: m.pt.y + 1 } : { x0: m.x * 16, y0: m.y * 16, x1: m.x * 16 + 16, y1: m.y * 16 + 16 };
      const path = nav.findPathNear(cur, r, m.pt ? 3 : 10);
      if (!path || !path.length) continue;
      const pts = [cur, ...path]; const len = v4Len(pts);
      if (!best || len < best.len) { best = { m, pts, len }; bi = k; }
    }
    if (!best) { pool.shift(); continue; }
    pool.splice(bi, 1); legs.push(best); cur = best.pts[best.pts.length - 1];
  }
  return legs;
}
const v4Face = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
// Walk each leg, then swing and clean on its beat. Returns cleans done so far.
function v4Run(D, t, key, legs, times, { tStart, onClean, clean = true } = {}) {
  const p = D.puff; let done = 0;
  for (let i = 0; i < times.length && i < legs.length; i++) {
    if (t >= times[i]) done = i + 1;
    D.cue(key + i, times[i], () => {
      const m = legs[i].m;
      if (clean && !m.pt) D.clean(m.x, m.y, 12); else if (m.pt) onClean?.(i, m);
      if (!m.pt) onClean?.(i, m);
      D.sfx('pop', { pitch: semis(PENTA[i % PENTA.length]), gain: 0.9 });
    });
  }
  const i = Math.min(done, legs.length - 1);
  const leg = legs[i]; if (!leg) return done;
  const arrived = done >= legs.length;
  const tA = i === 0 ? tStart : times[i - 1], tB = times[i];
  const k = arrived ? 1 : D.clamp((t - tA) / Math.max(0.05, tB - tA), 0, 1);
  const along = D.clamp(k / 0.78, 0, 1);
  const pos = v4At(leg.pts, D.E.inOut(along) * leg.len);
  p.path = []; p.fx = pos.x; p.fy = pos.y; p.x = Math.floor(p.fx / 16); p.y = Math.floor(p.fy / 16);
  if (along < 1 && leg.len > 1) { p.pose = 'walk'; p.dir = v4Face(pos.dx, pos.dy); D.fx.lift = Math.abs(Math.sin(along * leg.len / 7 * Math.PI)) * 2; }
  else {
    const m = leg.m; const tx = m.pt ? m.pt.x : m.x * 16 + 8, ty = m.pt ? m.pt.y : m.y * 16 + 8;
    p.dir = v4Face(tx - p.fx, ty - (p.fy - 6)); p.pose = arrived ? 'idle' : 'swing';
  }
  if (done > 0 && !arrived) { const [sx, sy] = squash(t, times[done - 1], 0.12, { freq: 20, decay: 12 }); D.fx.sx = sx; D.fx.sy = sy; }
  return done;
}
const v4Times = (spec) => { const out = []; for (const [b0, b1, step] of spec) for (let b = b0; b < b1 - 1e-6; b += step) out.push(bt(b)); return out; };
const v4Badge = (D, t, times, y) => {
  let i = times.findIndex((x) => x > t); if (i < 0) return;
  const gap = i > 0 ? times[i] - times[i - 1] : times[1] - times[0];
  const lab = gap > bt(0.75) ? ['1×', 1.8] : gap > bt(0.375) ? ['2× ⏩', 2.0] : ['4× ⏩⏩', 2.2];
  D.badge('bd' + lab[0], lab[0], 0.5, y, times[0] - 0.05, 1e9, lab[1]);
};

// ---- shared segments
function v4Freeze(D, t, t0, z0, { cap = 'wait for it…', emo = '👀' } = {}) {
  const V = D.vertical;
  D.stepMs = FREEZE;
  const k = D.E.out(D.clamp((t - t0) / 0.25, 0, 1));
  D.cam.zoom = z0 * D.lerp(1, 2.3, k); D.cam.dy = -12 * k;
  D.vignetteDark(0.6 * k);
  D.puff.pose = 'swing'; D.puff.dir = 'down';
  D.cap('fz' + t0.toFixed(2), cap, { x: 0.5, y: V ? 0.72 : 0.8, t0: t0 + 0.05, size: V ? 2.3 : 2.0 });
  D.emoji('fe' + t0.toFixed(2), emo, V ? 0.75 : 0.62, V ? 0.42 : 0.4, t0 + 0.15, 1e9, V ? 3.2 : 3);
}
function v4Drop(D, t, t0, z0, { far = 0.8 } = {}) {
  const V = D.vertical, p = D.puff, dt = t - t0;
  D.cam.dy = 0;
  D.stepMs = dt < bt(2) ? (1000 / 60) * 0.3 : 1000 / 60;
  const waveK = dt < bt(2) ? 0.25 * (dt / bt(2)) : 0.25 + 0.75 * D.E.out((dt - bt(2)) / bt(1));
  D.once('dropc' + t0.toFixed(2), () => { D.dropC = { x: p.fx / 16, y: p.fy / 16 }; D.sfx('impact', { gain: 1.3 }); D.sfx('sweep'); for (let i = 0; i < 10; i++) D.W.sparkleBurst(Math.round(p.fx / 16) - 2 + (i % 5), Math.round(p.fy / 16) - 1 + (i >> 2), 18); });
  const c = D.dropC;
  D.radial(c.x, c.y, waveK * 44, 4, 0, 3); D.sweepMess(c.x, c.y, waveK * 44);
  D.cam.zoom = z0 * D.lerp(1.6, far, D.E.inOut(dt / bt(3.5))) + punch(t, t0, 0.3 * z0, 6);
  D.cam.shake = punch(t, t0, 28, 5);
  D.flash('df' + t0.toFixed(2), t0, 0.25);
  p.dir = 'down'; p.pose = dt < 0.2 ? 'swing' : 'idle';
  D.fx.lift = hop(t, t0 + bt(2), 10, 0.36) + hop(t, t0 + bt(2.8), 7, 0.32);
  D.emoji('ds' + t0.toFixed(2), '😌', V ? 0.72 : 0.6, V ? 0.45 : 0.42, t0 + bt(2), 1e9, V ? 3.2 : 3);
  D.particles('dc' + t0.toFixed(2), D.vw / 2, D.vh * 0.3, t0, { n: 60, speed: 1300, grav: 900, life: 1.6, size: 1.3, shape: 'star', colours: ['#ffe066', '#fff', '#ff9bb3', '#9be7a0', '#9cc7ff'] });
}
function v4Fountain(D, t, t0, cap) {
  const V = D.vertical, at = t0 + bt(0.5);
  D.cam.zoom = baseZoom(D) * ((V ? 0.95 : 0.9) + punch(t, at, 0.15, 6) + 0.04 * D.clamp((t - t0) / bt(4), 0, 1));
  if (t >= at) { D.radial(15, 10, D.E.out((t - at) / 0.9) * 26, 4, 0, 3); if (t - at < 1.0 && D.frameNo % 2 === 0) D.burst('sparkle', 240 + (D.rnd() - 0.5) * 4, 146, 6, ['#a9bfd6', '#c1d1e2', '#fff8ec'], 70, 110); D.cam.shake = punch(t, at, 14, 7); }
  D.cue('fb' + t0.toFixed(2), at, () => { D.sfx('water'); D.burst('sparkle', 240, 150, 40, ['#a9bfd6', '#fff8ec', '#f6e3a1'], 110, 60); });
  D.flash('ffl' + t0.toFixed(2), at, 0.2, '#fff', 0.6);
  D.cap('fc' + t0.toFixed(2), cap, { x: 0.5, y: V ? 0.72 : 0.82, t0: at, size: V ? 2.4 : 2.2 });
}
const v4SetFountain = (D) => { D.canvasFilter(''); D.visit('square', 14, 13, true); D.place(14, 13, 'up'); D.tint(MIDDAY); D.cam.x = 240; D.cam.y = 168; D.colourAll(0); D.sfx('whoosh', { gain: 0.6 }); };
function v4Garden(D, t, t0, cap) {
  const V = D.vertical, at = t0 + bt(0.75), p = D.puff;
  D.cam.zoom = baseZoom(D) * (0.85 + punch(t, at, 0.12, 6));
  if (t >= at) { const r = D.E.out((t - at) / 1.0) * 30; D.radial(p.fx / 16, p.fy / 16, r, 4, 0, 3); D.sweepMess(p.fx / 16, p.fy / 16, r); }
  D.cue('gd' + t0.toFixed(2), at, () => { D.sfx('impact'); D.sfx('sparkle'); });
  D.fx.lift = hop(t, at, 9, 0.34);
  D.flash('gfl' + t0.toFixed(2), at, 0.2, '#fff', 0.6);
  D.cap('gc' + t0.toFixed(2), cap, { x: 0.5, y: V ? 0.72 : 0.82, t0: at, size: V ? 2.4 : 2.2 });
}
const v4SetGarden = (D) => { D.canvasFilter(''); D.visit('yard', 13, 8, false); D.colourAll(0); D.place(13, 8, 'down'); D.tint(MIDDAY); D.cam.x = null; D.cam.y = null; D.sfx('whoosh', { gain: 0.6 }); };
function v4Cakes(D, t, t0, cap, step = 0.5) {
  const V = D.vertical; let z = V ? 0.95 : 1.15;
  for (let i = 0; i < 7; i++) { const tb = t0 + 0.1 + i * bt(step); D.cue('ck' + t0.toFixed(2) + i, tb, () => { D.burst('sparkle', CAKES[i], 132, 14, ['#fff8ec', '#f6e3a1', '#f4c2a8'], 50, 10); D.burst('sparkle', CAKES[i], 148, 14, ['#fff8ec', '#f7d2bf'], 50, 10); D.sfx('pop', { pitch: semis(PENTA[i + 3]), gain: 0.6 }); }); z += punch(t, tb, 0.03, 12); }
  D.cam.zoom = baseZoom(D) * z;
  D.cap('kc' + t0.toFixed(2), cap, { x: 0.5, y: V ? 0.72 : 0.82, t0: t0 + 0.05, size: V ? 2.4 : 2.2 });
}
const v4SetCakes = (D) => { D.canvasFilter(''); D.visit('bakery', 10, 10, true); D.hideMess(); D.place(10, 10, 'up'); D.tint(MIDDAY); D.cam.x = 164; D.cam.y = 148; D.sfx('whoosh', { gain: 0.6 }); };
function v4Neighbours(D, t, t0, cap) {
  const V = D.vertical, u = D.U();
  D.fx.hide = true; D.canvasFilter('blur(6px)'); D.layer('dim', 'background:rgba(249,237,194,.55)');
  for (let i = 0; i < 6; i++) {
    const tb = t0 + 0.05 + i * bt(0.5); if (t < tb) continue;
    const e = D.el('card' + i, (e) => { e.style.perspective = '800px'; e.innerHTML = `<div style="width:${u * 5.6}px;height:${u * 7.2}px;background:#fff8ec;border:${u * 0.45}px solid #8a6e5e;border-radius:${u}px;box-shadow:0 ${u * 0.5}px 0 #8a6e5e;display:flex;flex-direction:column;align-items:center;justify-content:center"><svg viewBox="0 0 100 90" width="${u * 4.4}" height="${u * 4}"><g fill="#534239">${SIL[i]}</g></svg><div style="font-weight:900;font-size:${u * 1.5}px;line-height:1">?</div></div>`; });
    e.firstChild.style.transform = `rotateY(${(1 - D.E.back((t - tb) / 0.25)) * 90}deg)`;
    const pos = V ? [0.2 + (i % 3) * 0.3, 0.44 + Math.floor(i / 3) * 0.17] : [0.5 + (i - 2.5) * 0.15, 0.56];
    D.place2(e, D.vw * pos[0], D.vh * pos[1] + Math.sin(t * 3 + i) * u * 0.15, {});
    D.cue('nf' + i, tb, () => D.sfx('flip', { pitch: 1 + i * 0.09 }));
  }
  D.cap('nc', cap, { x: 0.5, y: V ? 0.24 : 0.2, t0: t0 + 0.05, size: V ? 2.4 : 2.2 });
}
const v4SetNeighbours = (D) => { D.visit('square', 14, 12, true); D.place(14, 12, 'down'); D.tint(MIDDAY); D.cam.x = null; D.cam.y = null; D.cam.zoom = baseZoom(D); };
function v4Night(D, t, t0, cap) {
  const V = D.vertical, lt = t - t0;
  D.canvasFilter(''); D.cam.zoom = baseZoom(D) * (1.05 + 0.15 * D.E.inOut(lt / bt(4)));
  if (lt < 0.9) { const k = Math.sin(D.clamp(lt / 0.9, 0, 1) * Math.PI); D.fx.sy = 1 + 0.12 * k; D.fx.sx = 1 - 0.06 * k; D.fx.closed = lt > 0.25; }
  else { D.fx.closed = true; breathe(D, t, 0.04, 2.4); }
  D.cue('yawn' + t0.toFixed(2), t0 + 0.05, () => D.sfx('yawn'));
  const s = D.puffScreen(30);
  for (let i = 0; i < 3; i++) {
    const tz = t0 + 0.8 + i * 0.5; if (t < tz) continue;
    const q = (t - tz) % 1.8;
    const z = D.el('z' + i, (e) => { e.className = 'o tt'; e.style.whiteSpace = 'nowrap'; e.style.width = 'auto'; e.style.fontSize = D.U() * (1.6 + i * 0.5) + 'px'; e.textContent = 'z'; });
    D.place2(z, s.x + D.U() * (1.5 + q * 1.5) + Math.sin(q * 3) * D.U() * 0.5, s.y - q * D.U() * 3, { o: D.clamp(1 - q / 1.8, 0, 1) * D.clamp(q / 0.2, 0, 1) });
  }
  D.cap('ntc' + t0.toFixed(2), cap, { x: 0.5, y: V ? 0.72 : 0.82, t0: t0 + bt(1), size: V ? 2.4 : 2.2 });
}
const v4SetNight = (D) => { D.canvasFilter(''); D.visit('burrow', 6, 8, true); D.hideMess(); D.place(6, 8, 'down'); D.tint(22 * 60); D.cam.x = null; D.cam.y = null; };
function v4End(D, t, t0, t1, cap, loop) {
  const V = D.vertical;
  D.fx.hide = true; D.canvasFilter('blur(5px) saturate(1.1)'); D.layer('dim', 'background:rgba(249,237,194,.5)');
  logoCard(D, t, { inAt: t0, puffT: t0 + bt(0.5), sneezeAt: loop ? t1 - 0.02 : null });
  D.particles('lc', D.vw / 2, D.vh * 0.55, t0 + 0.05, { n: 40, speed: 1000, grav: 500, life: 1.4, size: 1.2, shape: 'star', colours: ['#fff8ec', '#ffe066', '#a9cda0'] });
  D.cap('ec', cap, { x: 0.5, y: V ? 0.8 : 0.88, t0: t0 + bt(1.5), size: V ? 2.1 : 1.8, width: V ? 0.86 : 0.8 });
  D.cue('eb' + t0.toFixed(2), t0, () => D.sfx('boing', { pitch: 0.9 }));
  if (loop) D.cue('ahE', t1 - 0.57, () => D.sfx('ahah'));
}
const v4SetEnd = (D) => { D.visit('burrow', 9, 8, true); D.hideMess(); D.place(9, 8); D.tint(MIDDAY); D.cam.x = null; D.cam.y = null; D.cam.zoom = baseZoom(D) * 0.9; };

// Run the segment that covers t. Each: [beat0, beat1, setup|null, f(D, t, t0)]
function v4Segs(D, t, segs) {
  for (let i = 0; i < segs.length; i++) {
    const [b0, b1, setup, f] = segs[i];
    if (t < bt(b1) || i === segs.length - 1) { if (setup) D.once('seg' + i, () => setup(D)); D.cam.dx = 0; f(D, t, bt(b0), bt(b1)); return i; }
  }
}

// ======================================================= A (and the 16:9 cut): satisfying, 70 beats
function v4A(D, t, wide) {
  resetFx(D);
  const V = D.vertical, p = D.puff;
  const z0 = baseZoom(D) * 0.8;
  const capY = V ? 0.19 : 0.13, cntY = V ? 0.32 : 0.3, bdgY = cntY + (V ? 0.065 : 0.12);
  const run1 = v4Times([[2, 10, 1], [10, 14, 0.5], [14, 16, 0.25]]);
  const run2 = v4Times([[25, 31, 1], [31, 34, 0.5], [34, 35, 0.25]]);
  const seg = v4Segs(D, t, [
    [0, 17, null, (D, t) => {
      D.legs1 ??= v4Route(D, D.messList(), run1.length, { x: p.fx, y: p.fy });
      let done = v4Run(D, t, 'r1', D.legs1, run1, { tStart: 0.05, onClean: () => { D.lastClean = D.t; } });
      let z = t < bt(1) ? D.lerp(z0 * 3.2, z0, D.E.out(t / bt(1))) : z0;
      for (const s of run1) z += punch(t, s, 0.05 * z0, 14);
      D.cam.zoom = z; D.cam.ease = 0.14;
      let pct = Math.round((done / D.legs1.length) * 99);
      if (t >= bt(16)) { v4Freeze(D, t, bt(16), z0); pct = 99; }
      else if (t >= bt(2)) v4Badge(D, t, run1, bdgY);
      D.cap('hook', 'cleaning my *ENTIRE* house in 15 seconds 😤', { x: 0.5, y: capY, t0: 0.02, t1: bt(16) - 0.01, size: V ? 2.3 : 2.1, wordDur: 0.07, width: V ? 0.88 : 0.92 });
      D.counter('pct', `${pct}%`, { x: 0.5, y: cntY, size: V ? 4.6 : 4, pulseT: D.lastClean ?? -9 });
    }],
    [17, 21, null, (D, t, t0) => {
      v4Drop(D, t, t0, z0, { far: V ? 0.85 : 0.75 });
      D.counter('pct', '100%', { x: 0.5, y: V ? 0.3 : 0.3, size: V ? 6.5 : 6, pulseT: t0, color: '#ffe066' });
      D.emoji('spk1', '✨', V ? 0.2 : 0.33, 0.3, t0 + 0.05, 1e9, V ? 3.4 : 3); D.emoji('spk2', '✨', V ? 0.8 : 0.67, 0.3, t0 + 0.1, 1e9, V ? 3.4 : 3);
    }],
    [21, 23, (D) => { D.visit('yard', 12, 6, true); D.place(13, 7, 'down'); D.tint(MIDDAY); D.cam.snap = true; D.W.follow(0, 0, true); D.cam.snap = false; D.sfx('whoosh'); }, (D, t, t0) => {
      const k = (t - t0) / bt(2);
      D.cam.zoom = baseZoom(D) * D.lerp(1.8, 0.75, D.E.out(k * 1.6));
      D.canvasFilter(k < 0.12 ? `blur(${(1 - k / 0.12) * 10}px)` : '');
      D.cap('town', "wait… there's a whole *TOWN?* 😳", { x: 0.5, y: capY, t0: t0 + 0.05, size: V ? 2.4 : 2.2, wordDur: 0.08 });
      D.emoji('e_shock', '😳', V ? 0.68 : 0.58, V ? 0.44 : 0.42, t0 + bt(0.6), 1e9, V ? 3.2 : 3);
    }],
    [23, 35, (D) => { D.canvasFilter(''); D.visit('bakery', 10, 10, false); D.place(10, 11, 'up'); D.tint(MIDDAY); D.cam.x = null; D.cam.y = null; D.lastClean = -9; D.sfx('whoosh', { gain: 0.6 }); }, (D, t, t0) => {
      D.legs2 ??= v4Route(D, D.messList(), run2.length, { x: p.fx, y: p.fy });
      const done = t >= bt(25) - 0.3 ? v4Run(D, t, 'r2', D.legs2, run2, { tStart: bt(24.4), onClean: () => { D.lastClean = D.t; } }) : 0;
      let z = z0 * (t < t0 + bt(1) ? D.lerp(1.6, 1, D.E.out((t - t0) / bt(1))) : 1);
      for (const s of run2) z += punch(t, s, 0.05 * z0, 14);
      D.cam.zoom = z; D.cam.ease = 0.14;
      D.cap('bk', 'ok. the bakery next 😤', { x: 0.5, y: capY, t0: t0 + 0.05, size: V ? 2.4 : 2.2, wordDur: 0.08 });
      D.counter('bpct', `${Math.round((done / Math.max(1, D.legs2.length)) * 99)}%`, { x: 0.5, y: cntY, size: V ? 4.6 : 4, pulseT: D.lastClean });
      if (t >= bt(25)) v4Badge(D, t, run2, bdgY);
    }],
    [35, 36, null, (D, t, t0) => { v4Freeze(D, t, t0, z0, { cap: 'again… 👀', emo: '😤' }); D.counter('bpct', '99%', { x: 0.5, y: cntY, size: V ? 4.6 : 4 }); }],
    [36, 40, null, (D, t, t0) => {
      v4Drop(D, t, t0, z0, { far: V ? 0.9 : 0.8 });
      D.counter('bpct', '100%', { x: 0.5, y: 0.3, size: V ? 6.5 : 6, pulseT: t0, color: '#ffe066' });
      if (t > t0 + bt(1.5)) for (let i = 0; i < 7; i++) D.cue('bck' + i, t0 + bt(1.5) + i * bt(0.25), () => D.burst('sparkle', CAKES[i], 140, 16, ['#fff8ec', '#f6e3a1', '#f4c2a8'], 60, 10));
    }],
    [40, 44, v4SetFountain, (D, t, t0) => v4Fountain(D, t, t0, 'the fountain ⛲')],
    [44, 48, v4SetGarden, (D, t, t0) => v4Garden(D, t, t0, 'the garden 🌿')],
    [48, 52, v4SetNeighbours, (D, t, t0) => v4Neighbours(D, t, t0, '+ six neighbours to meet 👀')],
    [52, 56, v4SetNight, (D, t, t0) => v4Night(D, t, t0, 'then… nap time 😴')],
    [56, 58, (D) => { D.canvasFilter(''); D.visit('square', 7, 11, false); D.place(8, 11, 'down'); D.tint(MIDDAY); D.cam.x = null; D.cam.y = null; }, (D, t, t0) => {
      D.cam.zoom = baseZoom(D) * D.lerp(1.1, 0.7, D.E.out((t - t0) / bt(2)));
      D.counter('tpct', 'town: 4%', { x: 0.5, y: cntY, size: V ? 4.2 : 3.6, pulseT: t0 + 0.05 });
      D.cap('cw', 'ok… this might take a while 🫠', { x: 0.5, y: V ? 0.72 : 0.82, t0: t0 + 0.2, size: V ? 2.3 : 2.1 });
    }],
    [58, 70, v4SetEnd, (D, t, t0, t1) => v4End(D, t, t0, t1, V ? 'follow to watch Puff clean the *whole* town 🧹' : "Puff's whole town is waiting ✨", V)]
  ]);
  D.alphaTag(t > 2.2 && !((t >= bt(16) && t < bt(17)) || (t >= bt(35) && t < bt(36))));
}
S4.v4A = { beats: 70, setup(D) { D.v3 = true; D.visit('burrow', 5, 9, false); D.place(5, 9, 'right'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 2.5; D.legs1 = null; D.legs2 = null; }, f: (D, t) => v4A(D, t, false) };
S4.v4H = { beats: 70, setup: S4.v4A.setup, f: (D, t) => v4A(D, t, true) };

// ======================================================= B: POV story, 70 beats
function v4B(D, t) {
  resetFx(D);
  const V = D.vertical, p = D.puff;
  const z0 = baseZoom(D) * 0.9, zr = baseZoom(D) * 0.8;
  const capY = V ? 0.19 : 0.13;
  const runA = v4Times([[9, 13, 1], [13, 15, 0.5], [15, 17, 0.25]]);
  const runB = v4Times([[32, 36, 1], [36, 39, 0.5], [39, 41, 0.25]]);
  const cap = (id, txt, t0, o = {}) => D.cap(id, txt, { x: 0.5, y: capY, t0, size: V ? 2.5 : 2.2, wordDur: 0.1, ...o });
  v4Segs(D, t, [
    [0, 3, null, (D, t) => {
      if (t > bt(2)) { const k = D.E.out((t - bt(2)) / bt(1)); D.fx.sy = 1 + 0.16 * k; D.fx.sx = 1 - 0.1 * k; D.fx.lift = 2 * k; D.fx.closed = k > 0.5; D.cam.zoom = z0 * (1 + 0.25 * k); D.cam.dy = -8 * k; }
      else { D.cam.zoom = z0; if (t > bt(1) && t < bt(1) + 0.12) D.fx.closed = true; }
      cap('pov', 'POV: you sneeze *once*', 0.02);
    }],
    [3, 9, null, (D, t, t0) => {
      const cx = p.fx / 16, cy = p.fy / 16 - 0.5;
      D.cue('achoo', t0, () => { sneezeBurst(D, p.fx, p.fy - 14); D.sfx('sneeze', { pre: 0 }); D.sfx('scratch', { at: 0.05 }); });
      const r = D.E.out((t - t0) / 0.5) * 24; D.radial(cx, cy, r, 0, 4, 2.5); D.revealMess(cx, cy, r);
      const [sx, sy] = squash(t, t0, 0.3, { freq: 18, decay: 7 }); D.fx.sx = sx; D.fx.sy = sy;
      D.cam.shake = punch(t, t0, 26, 6);
      let z = z0 * (1 + punch(t, t0, 0.2, 6)); D.cam.dy = 0;
      if (t >= bt(4.5) && t < bt(6)) {
        D.stepMs = FREEZE; const k = D.E.out((t - bt(4.5)) / 0.25); z = z0 * D.lerp(1, 2.4, k); D.cam.dy = -12 * k;
        D.canvasFilter('saturate(0.6) contrast(1.05)'); D.vignetteDark(0.5 * k);
        D.emoji('e1', '😳', V ? 0.74 : 0.62, V ? 0.4 : 0.36, bt(4.6), bt(6), V ? 3.4 : 3);
      } else D.canvasFilter('');
      cap('ruin', 'and ruin *EVERYTHING*', bt(4.5), { t1: bt(6), size: V ? 2.6 : 2.3, wordDur: 0.12 });
      if (t >= bt(6) && t < bt(8)) {
        p.dir = t < bt(7) ? 'left' : 'right'; p.pose = 'idle';
        const lk = t < bt(7) ? t - bt(6) : t - bt(7);
        z = z0 * (1.5 + punch(lk, 0, 0.3, 10)); D.cam.dx = t < bt(7) ? -10 : 10;
        cap('fine', "it's fine. it's *FINE.*", bt(6), { wordDur: bt(0.5) });
        D.emoji('e2', '🫠', V ? 0.74 : 0.62, V ? 0.42 : 0.38, bt(7), bt(8), V ? 3.2 : 3);
      }
      if (t >= bt(8)) { p.dir = 'down'; p.pose = 'swing'; z = z0 * (1.6 + punch(t, bt(8), 0.4, 8)); D.cam.shake = punch(t, bt(8), 16, 8); D.cue('grab', bt(8), () => D.sfx('impact')); cap('grab', '*grabs duster* 😤', bt(8), { size: V ? 2.6 : 2.3, wordDur: 0.06 }); }
      D.cam.zoom = z;
    }],
    [9, 17, null, (D, t) => {
      D.legsA ??= v4Route(D, D.messList(), runA.length, { x: p.fx, y: p.fy });
      v4Run(D, t, 'ra', D.legsA, runA, { tStart: bt(9) - 0.25 });
      let z = zr; for (const s of runA) z += punch(t, s, 0.05 * z0, 14); D.cam.zoom = z; D.cam.ease = 0.14;
      v4Badge(D, t, runA, V ? 0.26 : 0.2);
    }],
    [17, 18, null, (D, t, t0) => v4Freeze(D, t, t0, zr, { cap: 'one more…' })],
    [18, 22, null, (D, t, t0) => { v4Drop(D, t, t0, zr, { far: V ? 0.85 : 0.75 }); D.cap('fixed', '✨ fixed it ✨', { x: 0.5, y: V ? 0.3 : 0.25, t0: t0 + 0.02, size: V ? 3.6 : 3.2, wordDur: 0.05 }); }],
    [22, 25, null, (D, t, t0) => {
      D.cam.zoom = baseZoom(D) * D.lerp(0.85, 1.3, D.E.inOut((t - t0) / bt(3)));
      D.fx.lift = hop(t, t0 + bt(0.5), 8, 0.32) + hop(t, t0 + bt(1.5), 8, 0.32);
      cap('pro', "ok I'm basically a *pro* now 😎", t0 + 0.05, { wordDur: 0.08 });
    }],
    [25, 27, (D) => { D.visit('yard', 12, 6, false); D.colourAll(0); D.place(13, 7, 'down'); D.tint(MIDDAY); D.sfx('whoosh'); }, (D, t, t0) => {
      D.cam.zoom = baseZoom(D) * D.lerp(1.5, 0.9, D.E.out((t - t0) / bt(2)));
      D.canvasFilter(t - t0 < 0.1 ? `blur(${(1 - (t - t0) / 0.1) * 10}px)` : '');
      cap('until', 'until I stepped outside…', t0 + 0.05, { wordDur: 0.08 });
    }],
    [27, 31, (D) => { D.canvasFilter(''); D.visit('square', 14, 13, false); D.colourAll(0); D.place(14, 13, 'down'); D.tint(MIDDAY); D.cam.x = null; D.cam.y = null; D.sfx('scratch', { at: 0 }); }, (D, t, t0) => {
      let z = baseZoom(D) * D.lerp(0.6, 0.85, D.E.out((t - t0) / bt(1)));
      if (t >= t0 + bt(1) && t < t0 + bt(2.5)) { D.stepMs = FREEZE; const k = D.E.out((t - t0 - bt(1)) / 0.25); z = baseZoom(D) * 0.85 * D.lerp(1, 2.4, k); D.cam.dy = -12 * k; D.vignetteDark(0.5 * k); D.emoji('e3', '😳', V ? 0.74 : 0.62, V ? 0.4 : 0.36, t0 + bt(1.1), t0 + bt(2.5), V ? 3.4 : 3); }
      else D.cam.dy = 0;
      cap('whole', 'the WHOLE *TOWN??*', t0 + 0.05, { t1: t0 + bt(2.5), size: V ? 2.7 : 2.4 });
      if (t >= t0 + bt(2.5)) { cap('me', '…was that me? 🫣', t0 + bt(2.5), { wordDur: 0.1 }); p.dir = t < t0 + bt(3.2) ? 'left' : 'right'; }
      D.cam.zoom = z;
    }],
    [31, 32, null, (D, t, t0) => { p.dir = 'down'; p.pose = 'swing'; D.cam.zoom = baseZoom(D) * (1.6 + punch(t, t0, 0.4, 8)); D.cam.shake = punch(t, t0, 16, 8); D.cue('grab2', t0, () => D.sfx('impact')); cap('grab2', '*grabs duster again* 😤', t0, { size: V ? 2.6 : 2.3, wordDur: 0.06 }); }],
    [32, 41, null, (D, t) => {
      if (!D.legsB) {
        // restore spots around the square: open floor points on rings around the fountain
        const pts = []; for (let a = 0; a < 18; a++) { const ang = a * 2.4, rr = 40 + (a % 3) * 22; const q = { x: 240 + Math.cos(ang) * rr * 1.3, y: 172 + Math.sin(ang) * rr }; if (D.isOpen(q.x, q.y)) pts.push({ pt: q, x: Math.floor(q.x / 16), y: Math.floor(q.y / 16) }); }
        D.levels = new Float32Array(D.W.area.w * D.W.area.h);
        D.legsB = v4Route(D, pts, runB.length, { x: p.fx, y: p.fy });
      }
      v4Run(D, t, 'rb', D.legsB, runB, { tStart: bt(32) - 0.2, clean: false, onClean: (i, m) => {
        const a = D.W.area; for (let k = 0; k < D.levels.length; k++) { const x = k % a.w, y = Math.floor(k / a.w); const d = Math.hypot(x + 0.5 - m.pt.x / 16, y + 0.5 - m.pt.y / 16); D.levels[k] = Math.max(D.levels[k], D.clamp((4.2 - d) / 1.5, 0, 1) * 4); }
        D.colourField((x, y) => D.levels[y * a.w + x]); D.burst('sparkle', m.pt.x, m.pt.y - 6, 14, ['#fff8ec', '#f6e3a1', '#a9cda0'], 50, 10);
      } });
      let z = zr; for (const s of runB) z += punch(t, s, 0.05 * z0, 14); D.cam.zoom = z; D.cam.ease = 0.14;
      v4Badge(D, t, runB, V ? 0.26 : 0.2);
    }],
    [41, 42, null, (D, t, t0) => v4Freeze(D, t, t0, zr, { cap: 'last one…' })],
    [42, 46, null, (D, t, t0) => {
      v4Drop(D, t, t0, zr, { far: V ? 0.85 : 0.75 });
      const at = t0; if (t - at < 1.2 && D.frameNo % 2 === 0) D.burst('sparkle', 240 + (D.rnd() - 0.5) * 4, 146, 6, ['#a9bfd6', '#c1d1e2', '#fff8ec'], 70, 110);
      D.cue('wtr', at, () => D.sfx('water'));
      D.cap('fixed2', '✨ fixed it… again ✨', { x: 0.5, y: V ? 0.3 : 0.25, t0: t0 + 0.02, size: V ? 3.2 : 3.0, wordDur: 0.06, width: 0.9 });
    }],
    [46, 50, v4SetCakes, (D, t, t0) => v4Cakes(D, t, t0, "even the bakery's open again 🍰")],
    [50, 55, v4SetNight, (D, t, t0) => v4Night(D, t, t0, 'nap. earned. 😴')],
    [55, 62, (D) => { D.visit('burrow', 8, 8, true); D.hideMess(); D.place(8, 8, 'down'); D.tint(9 * 60); D.cam.x = null; D.cam.y = null; }, (D, t, t0) => {
      D.cam.zoom = baseZoom(D) * D.lerp(1.2, 0.9, D.E.out((t - t0) / bt(2)));
      if (t < t0 + bt(1)) D.fx.closed = true; else { D.fx.lift = hop(t, t0 + bt(1), 8, 0.34); }
      cap('morn', 'good morning ☀️', t0 + bt(1), { wordDur: 0.1 });
      const brand = D.el('brand', (e) => { e.className = 'o ttbox'; e.style.whiteSpace = 'nowrap'; e.style.fontSize = D.U() * (V ? 1.35 : 1.3) + 'px'; e.innerHTML = '<span class="w">Sweet Home Reset · coming soon</span>'; });
      D.place2(brand, D.vw / 2, D.vh * (V ? 0.8 : 0.86), { s: D.E.back((t - t0 - bt(2)) / 0.25) });
      D.alphaTag();
    }],
    [62, 70, null, (D, t, t0) => {
      const k = D.E.out((t - t0 - bt(4)) / bt(3));
      if (t > t0 + bt(4)) { D.fx.sy = 1 + 0.16 * k; D.fx.sx = 1 - 0.1 * k; D.fx.lift = 2 * k; D.fx.closed = k > 0.5; }
      D.cam.zoom = baseZoom(D) * D.lerp(0.9, 1.9, D.E.inOut((t - t0) / bt(8)));
      D.cam.dy = -8 * D.clamp(k, 0, 1);
      cap('feel', 'wait… my nose feels funny', t0 + 0.1, { t1: t0 + bt(4), wordDur: 0.09 });
      cap('ohno', 'oh no. 😳', t0 + bt(4.5), { size: V ? 2.8 : 2.4, wordDur: 0.15 });
      const brand = D.el('brand', (e) => { e.className = 'o ttbox'; e.style.whiteSpace = 'nowrap'; e.style.fontSize = D.U() * (V ? 1.35 : 1.3) + 'px'; e.innerHTML = '<span class="w">Sweet Home Reset · coming soon</span>'; });
      D.place2(brand, D.vw / 2, D.vh * (V ? 0.8 : 0.86), {});
      D.cue('ahB', t0 + bt(4), () => D.sfx('ahah'));
    }]
  ]);
  D.alphaTag(t > 2.0 && !(t >= bt(4.5) && t < bt(6)) && !(t >= bt(17) && t < bt(18)) && !(t >= bt(41) && t < bt(42)));
}
S4.v4B = { beats: 70, setup(D) { D.v3 = true; D.visit('burrow', 8, 8, true); D.hideMess(); D.place(8, 8, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.9; D.legsA = null; D.legsB = null; }, f: (D, t) => v4B(D, t) };

// ======================================================= C: glow-up, 70 beats
const V4FLIPS = [
  { id: 'burrow', at: [8, 8], b0: 2, flip: 6, b1: 10, label: 'AFTER ✨', emo: '🤩' },
  { id: 'bakery', at: [10, 11], b0: 10, flip: 14, b1: 18, label: 'AFTER 🍰', emo: '😍', cam: [164, 150], dir: 'up' },
  { id: 'square', at: [14, 13], b0: 18, flip: 22, b1: 26, label: 'AFTER ⛲', emo: '🥹', cam: [240, 168], dir: 'up', fountain: true },
  { id: 'yard', at: [13, 8], b0: 26, flip: 30, b1: 34, label: 'AFTER 🌿', emo: '🤩' }
];
const V4WIPES = [
  { id: 'burrow', at: [5, 8], b0: 35, cam: null },
  { id: 'bakery', at: [10, 11], b0: 37.5, cam: [164, 150] },
  { id: 'square', at: [10, 15], b0: 40, cam: null },
  { id: 'yard', at: [18, 9], b0: 42.5, cam: null }
];
function v4Before(D, t, f) {
  D.once('fs' + f.id + f.b0, () => {
    D.canvasFilter(''); D.visit(f.id, f.at[0], f.at[1], false); D.colourAll(0); D.place(f.at[0], f.at[1], f.dir ?? 'down'); D.tint(MIDDAY);
    D.cam.x = f.cam?.[0] ?? null; D.cam.y = f.cam?.[1] ?? null; D.cam.snap = true; D.W.follow(D.puff.fx, D.puff.fy, true); D.cam.snap = false;
    if (f.b0 > 2) D.sfx('whoosh', { gain: 0.5 });
  });
}
function v4C(D, t) {
  resetFx(D);
  const V = D.vertical, p = D.puff;
  const capY = V ? 0.19 : 0.13, labY = V ? 0.3 : 0.27;
  const f = V4FLIPS.find((f) => t < bt(f.b1));
  if (f) {
    v4Before(D, t, f);
    const fb = bt(f.flip); let z = baseZoom(D) * (V ? 0.85 : 0.8);
    if (t < fb) {
      z *= 1 + 0.08 * ((t - bt(f.b0)) / (fb - bt(f.b0)));
      D.cap('lb' + f.id, 'BEFORE', { x: 0.5, y: labY, t0: bt(Math.max(2, f.b0)), size: V ? 3.0 : 2.6, wordDur: 0.05 });
      if (t > fb - bt(0.5)) { D.stepMs = FREEZE; D.vignetteDark(0.4); D.emoji('ey' + f.id, '👀', V ? 0.74 : 0.62, V ? 0.42 : 0.4, fb - bt(0.5), fb, V ? 3.2 : 3); }
      else { p.dir = Math.floor((t - bt(f.b0)) / bt(1)) % 2 ? 'left' : 'right'; }
    } else {
      D.once('flip' + f.id, () => {
        D.colourAll(4); D.hideMess(); p.dir = 'down';
        for (let i = 0; i < 14; i++) D.W.sparkleBurst((Math.floor(p.fx / 16) - 4 + (i % 7) * 1.3) | 0, Math.floor(p.fy / 16) - 2 + ((i >> 1) % 4), 14);
        D.sfx('impact', { gain: f.id === 'burrow' ? 1.3 : 1.0 }); D.sfx('sparkle');
        if (f.fountain) { D.sfx('water'); D.burst('sparkle', 240, 150, 40, ['#a9bfd6', '#fff8ec', '#f6e3a1'], 110, 60); }
        if (f.id === 'bakery') for (let i = 0; i < 7; i++) { D.burst('sparkle', CAKES[i], 132, 10, ['#fff8ec', '#f6e3a1'], 50, 10); D.burst('sparkle', CAKES[i], 148, 10, ['#fff8ec', '#f7d2bf'], 50, 10); }
      });
      if (f.fountain && t - fb < 1.0 && D.frameNo % 2 === 0) D.burst('sparkle', 240 + (D.rnd() - 0.5) * 4, 146, 6, ['#a9bfd6', '#c1d1e2', '#fff8ec'], 70, 110);
      if (t < fb + bt(1)) D.stepMs = (1000 / 60) * 0.35;
      z *= 1 + punch(t, fb, 0.25, 7) - 0.1 * D.E.inOut((t - fb) / bt(4));
      D.cam.shake = punch(t, fb, 22, 6);
      D.flash('ff' + f.id, fb, 0.22);
      D.fx.lift = hop(t, fb + bt(1.2), 9, 0.34) + hop(t, fb + bt(2.2), 7, 0.3);
      D.cap('la' + f.id, f.label, { x: 0.5, y: labY, t0: fb, size: V ? 3.0 : 2.6, wordDur: 0.05 });
      D.emoji('em' + f.id, f.emo, V ? 0.74 : 0.62, V ? 0.42 : 0.4, fb + bt(1), bt(f.b1), V ? 3.2 : 3);
    }
    D.cam.zoom = z;
    D.cap('rate', 'rate this glow-up 1–10 👇', { x: 0.5, y: capY, t0: 0.02, t1: bt(6) - 0.01, size: V ? 2.4 : 2.1, wordDur: 0.08 });
    if (t >= bt(10)) D.counter('fn', `${V4FLIPS.indexOf(f) + 1}/4`, { x: V ? 0.88 : 0.93, y: V ? 0.085 : 0.06, size: 1.6 });
  } else if (t < bt(35)) {
    D.once('sr', () => { D.canvasFilter(''); D.sfx('impact'); });
    D.layer('srbg', 'background:#ff2d55');
    D.cap('srt', 'SPEED ROUND ⏩', { x: 0.5, y: 0.47, t0: bt(34), size: V ? 2.9 : 3.2, wordDur: 0.08, pop: 1.5 });
    D.fx.hide = true;
  } else if (t < bt(45)) {
    const w = V4WIPES.filter((w) => t >= bt(w.b0)).pop() ?? V4WIPES[0];
    D.once('w' + w.b0, () => { D.visit(w.id, w.at[0], w.at[1], false); D.colourAll(0); D.place(w.at[0], w.at[1], 'down'); D.tint(MIDDAY); D.cam.x = w.cam?.[0] ?? null; D.cam.y = w.cam?.[1] ?? null; D.cam.snap = true; D.W.follow(D.puff.fx, D.puff.fy, true); D.cam.snap = false; D.saved = D.messList(); D.sfx('swoosh'); });
    const k = D.E.inOut((t - bt(w.b0) - 0.1) / bt(1.6));
    const a = D.W.area;
    D.cam.zoom = baseZoom(D) * (V ? 0.85 : 0.8);
    let edge;
    if (V) {
      const top = D.W.toWorld(0, 0).y / 16, bot = D.W.toWorld(0, D.vh).y / 16; const wy = D.lerp(bot, top, k);
      D.colourField((x, y) => (y + 0.5 > wy ? 4 : 0));
      for (const m of D.saved) { const i = m.y * a.w + m.x; if (m.y + 0.5 > wy && D.G.mess.type[i]) { D.G.mess.type[i] = 0; D.W.syncMess(i); D.W.sparkleBurst(m.x, m.y, 6); } }
      edge = D.W.toScreen(0, wy * 16).y;
      const line = D.el('wl', (e) => { e.style.cssText += `;width:${D.vw}px;height:${D.U() * 0.45}px;background:#fff;box-shadow:0 0 ${D.U()}px #fff`; }); D.place2(line, D.vw / 2, edge, { o: k > 0 && k < 1 ? 1 : 0 });
    } else {
      const left = D.W.toWorld(0, 0).x / 16, right = D.W.toWorld(D.vw, 0).x / 16; const wx = D.lerp(left, right, k);
      D.colourField((x) => (x + 0.5 < wx ? 4 : 0));
      for (const m of D.saved) { const i = m.y * a.w + m.x; if (m.x + 0.5 < wx && D.G.mess.type[i]) { D.G.mess.type[i] = 0; D.W.syncMess(i); D.W.sparkleBurst(m.x, m.y, 6); } }
      edge = D.W.toScreen(wx * 16, 0).x;
      const line = D.el('wl', (e) => { e.style.cssText += `;height:${D.vh}px;width:${D.U() * 0.45}px;background:#fff;box-shadow:0 0 ${D.U()}px #fff`; }); D.place2(line, edge, D.vh / 2, { o: k > 0 && k < 1 ? 1 : 0 });
    }
    D.counter('wn', `${V4WIPES.indexOf(w) + 1}`, { x: 0.5, y: labY, size: V ? 5 : 4.4, pulseT: bt(w.b0) });
    D.fx.lift = hop(t, bt(w.b0) + bt(1.8), 8, 0.32);
  } else if (t < bt(49)) {
    D.once('night', () => v4SetNight(D));
    v4Night(D, t, bt(45), 'bonus: night mode 🌙');
  } else if (t < bt(53)) {
    D.once('golden', () => { D.canvasFilter(''); D.visit('square', 9, 12, true); D.place(9, 12, 'right'); D.tint(18 * 60); D.cam.x = null; D.cam.y = null; D.walkTo(18, 13); D.sfx('whoosh', { gain: 0.5 }); });
    D.cam.zoom = baseZoom(D) * D.lerp(0.95, 0.8, D.E.inOut((t - bt(49)) / bt(4)));
    D.cap('gold', 'golden hour ✨', { x: 0.5, y: V ? 0.72 : 0.82, t0: bt(49) + 0.1, size: V ? 2.4 : 2.2 });
  } else if (t < bt(57)) {
    D.once('nbs', () => v4SetNeighbours(D));
    v4Neighbours(D, t, bt(53), '+ six neighbours to meet 👀');
  } else if (t < bt(61)) {
    // recap: each AFTER again, numbered, one beat each
    const i = Math.min(3, Math.floor((t - bt(57)) / bt(1))), f2 = V4FLIPS[i];
    D.once('rc' + i, () => { D.canvasFilter(''); D.fx.hide = false; D.visit(f2.id, f2.at[0], f2.at[1], true); D.hideMess(); D.place(f2.at[0], f2.at[1], 'down'); D.tint(MIDDAY); D.cam.x = f2.cam?.[0] ?? null; D.cam.y = f2.cam?.[1] ?? null; D.cam.snap = true; D.W.follow(D.puff.fx, D.puff.fy, true); D.cam.snap = false; D.sfx('pop', { pitch: semis(PENTA[i + 2]) }); });
    D.cam.zoom = baseZoom(D) * (0.8 + punch(t, bt(57 + i), 0.12, 8));
    D.counter('rn', ['1️⃣', '2️⃣', '3️⃣', '4️⃣'][i], { x: 0.5, y: labY, size: V ? 5 : 4.4, pulseT: bt(57 + i) }).classList.add('emo');
    D.cap('pick', 'pick one 👇', { x: 0.5, y: capY, t0: bt(57) + 0.05, size: V ? 2.4 : 2.1 });
  } else {
    D.once('endC', () => v4SetEnd(D));
    v4End(D, t, bt(61), bt(70), "which one's your favourite? 1️⃣ 2️⃣ 3️⃣ 4️⃣ 👇", false);
  }
  D.alphaTag(t > 2.0);
}
S4.v4C = { beats: 70, setup(D) { D.v3 = true; D.visit('burrow', 8, 8, false); D.place(8, 8, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.85; }, f: (D, t) => v4C(D, t) };

for (const k of ['v4A', 'v4H', 'v4B', 'v4C']) S4[k].dur = S4[k].beats * B;
