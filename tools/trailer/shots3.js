// v3 viral cuts. One shot per video; scenes switch inside the timeline. Times in beats (140 bpm).
// Uses helpers from shots.js: B, squash, hop, punch, baseZoom, resetFx, breathe, sneezeBurst, logoCard, CAKES, MIDDAY.
const S3 = window.SHOTS;
const FREEZE = 0.05;
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const semis = (n) => Math.pow(2, n / 12);

function chainFrom(D, list, sx, sy) {
  const out = []; let cx = sx, cy = sy; const pool = list.slice();
  while (pool.length) { pool.sort((a, b) => Math.hypot(a.x + 0.5 - cx, a.y + 0.5 - cy) - Math.hypot(b.x + 0.5 - cx, b.y + 0.5 - cy)); const m = pool.shift(); out.push(m); cx = m.x + 0.5; cy = m.y + 0.5; }
  return out;
}
const standOf = (m) => ({ x: m.x * 16 + 8 - 12, y: m.y * 16 + 13 });

// Hop Puff from pile to pile; clean each on its scheduled time. Returns index of cleans done.
function hopClean(D, t, start, targets, times, { pitchBase = 0, onClean } = {}) {
  const p = D.puff; let done = 0;
  for (let i = 0; i < times.length; i++) if (t >= times[i]) done = i + 1;
  for (let i = 0; i < times.length; i++) D.cue('hc' + times[i].toFixed(4), times[i], () => {
    const m = targets[i]; if (!m) return;
    D.clean(m.x, m.y, 12); p.pose = 'idle';
    D.sfx('pop', { pitch: semis(PENTA[(i + pitchBase) % PENTA.length]), gain: 0.9 });
    onClean?.(i);
  });
  const i = done; // heading to target i
  const from = i === 0 ? start : standOf(targets[i - 1]);
  const to = targets[i] ? standOf(targets[i]) : from;
  const t0 = i === 0 ? Math.min(times[0] - 0.3, times[0]) : times[i - 1];
  const t1 = times[i] ?? t0 + 1;
  const k = D.clamp((t - t0) / Math.max(0.05, t1 - t0), 0, 1);
  const travel = D.clamp(k / 0.8, 0, 1);
  p.path = []; p.fx = D.lerp(from.x, to.x, D.E.inOut(travel)); p.fy = D.lerp(from.y, to.y, D.E.inOut(travel));
  p.x = Math.floor(p.fx / 16); p.y = Math.floor(p.fy / 16);
  p.dir = 'right';
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  D.fx.lift = travel < 1 ? Math.sin(travel * Math.PI) * Math.min(12, 3 + dist * 0.15) : 0;
  p.pose = travel < 1 ? 'walk' : 'swing';
  if (i > 0) { const [sx, sy] = squash(t, times[i - 1], 0.14, { freq: 20, decay: 12 }); D.fx.sx = sx; D.fx.sy = sy; }
  return done;
}

const bt = (b) => b * B; // beat → seconds

// ---------------------------------------------------------------- A: satisfying
// "cleaning my ENTIRE house in 15 seconds"
function timelineA(D, t, { wide = false } = {}) {
  resetFx(D);
  const V = D.vertical, u = D.U();
  const z0 = baseZoom(D) * (V ? 0.8 : 0.8);
  const capY = V ? 0.19 : 0.13, cntY = V ? 0.32 : 0.3;
  const p = D.puff;
  if (t < bt(21)) {
    D.once('sceneA1', () => {});
    const sched = [];
    for (let b = 2; b < 10; b++) sched.push(bt(b));
    for (let b = 10; b < 14; b += 0.5) sched.push(bt(b));
    for (let b = 14; b < 16; b += 0.25) sched.push(bt(b));
    if (!D.targets) D.targets = chainFrom(D, D.messList(), 5.5, 9).slice(0, sched.length);
    const n = sched.length;
    let done = 0;
    if (t < bt(16)) done = hopClean(D, t, { x: 5 * 16 + 8, y: 9 * 16 + 13 }, D.targets, sched, { onClean: (i) => { D.lastClean = D.t; } });
    else done = n;
    // camera
    let z = z0;
    if (t < bt(1)) z = D.lerp(z0 * 3.2, z0, D.E.out(t / bt(1)));
    for (const s of sched) z += punch(t, s, 0.05 * z0, 14);
    // percentage
    let pct = Math.round((done / n) * 99);
    let freeze = t >= bt(16) && t < bt(17);
    if (freeze) {
      D.stepMs = FREEZE; pct = 99;
      const k = (t - bt(16)) / bt(1);
      z = z0 * D.lerp(1, 2.3, D.E.out(k * 3)); D.cam.dy = -12 * D.E.out(k * 3);
      D.vignetteDark(0.6 * D.E.out(k * 3));
      D.cap('wait', 'wait for it…', { x: 0.5, y: V ? 0.72 : 0.8, t0: bt(16) + 0.05, size: V ? 2.2 : 2.0 });
      p.pose = 'swing'; p.dir = 'down';
      D.emoji('e_eyes', '👀', V ? 0.75 : 0.62, V ? 0.42 : 0.4, bt(16) + 0.15, bt(17), V ? 3.2 : 3);
    }
    if (t >= bt(17)) {
      // DROP: slow-mo colour wave, then snap back
      const dt = t - bt(17);
      D.stepMs = dt < bt(2) ? 1000 / 60 * 0.3 : 1000 / 60;
      const waveK = dt < bt(2) ? 0.25 * (dt / bt(2)) : 0.25 + 0.75 * D.E.out((dt - bt(2)) / bt(1));
      const cx = p.fx / 16, cy = p.fy / 16;
      D.radial(cx, cy, waveK * 40, 4, 0, 3);
      D.sweepMess(cx, cy, waveK * 40);
      pct = 100;
      z = z0 * D.lerp(1.6, V ? 0.85 : 0.75, D.E.inOut(dt / bt(3.5))) + punch(t, bt(17), 0.3 * z0, 6);
      D.cam.shake = punch(t, bt(17), 28, 5);
      D.flash('fl1', bt(17), 0.25);
      p.dir = 'down'; p.pose = dt < 0.2 ? 'swing' : 'idle';
      D.fx.lift = hop(t, bt(19), 10, 0.36) + hop(t, bt(19.8), 7, 0.32);
      D.cue('dropS', bt(17), () => { D.sfx('impact', { gain: 1.3 }); D.sfx('sweep'); for (let i = 0; i < 10; i++) D.W.sparkleBurst(Math.round(cx) - 2 + (i % 5), Math.round(cy) - 1 + (i >> 2), 18); });
      D.emoji('e_smug', '😌', V ? 0.72 : 0.6, V ? 0.45 : 0.42, bt(19), bt(21), V ? 3.2 : 3);
      D.particles('conf', D.vw / 2, D.vh * cntY, bt(17), { n: 60, speed: 1300, grav: 900, life: 1.6, size: 1.3, shape: 'star', colours: ['#ffe066', '#fff', '#ff9bb3', '#9be7a0', '#9cc7ff'] });
    }
    D.cam.zoom = z;
    D.cam.ease = 0.14;
    D.cap('hook', V ? 'cleaning my *ENTIRE* house in 15 seconds 😤' : 'cleaning my *ENTIRE* house in 15 seconds 😤', { x: 0.5, y: capY, t0: 0.02, t1: bt(16) - 0.01, size: V ? 2.3 : 2.1, wordDur: 0.07, width: V ? 0.88 : 0.92 });
    D.counter('pct', `${pct}%`, { x: 0.5, y: t >= bt(17) ? (V ? 0.3 : 0.3) : cntY, size: t >= bt(17) ? (V ? 6.5 : 6) : V ? 4.6 : 4, pulseT: t >= bt(17) ? bt(17) : (D.lastClean ?? -9), color: pct >= 100 ? '#ffe066' : '#fff' });
    if (t >= bt(17)) D.emoji('spk1', '✨', V ? 0.2 : 0.33, V ? 0.3 : 0.3, bt(17) + 0.05, bt(21), V ? 3.4 : 3), D.emoji('spk2', '✨', V ? 0.8 : 0.67, V ? 0.3 : 0.3, bt(17) + 0.1, bt(21), V ? 3.4 : 3);
    if (t >= bt(10) && t < bt(14)) D.badge('b2', '2× ⏩', 0.5, cntY + (V ? 0.065 : 0.12), bt(10), 1e9, 2.0);
    if (t >= bt(14) && t < bt(16)) D.badge('b4', '4× ⏩⏩', 0.5, cntY + (V ? 0.065 : 0.12), bt(14), 1e9, 2.2);
    if (t >= bt(2) && t < bt(10)) D.badge('b1', '1×', 0.5, cntY + (V ? 0.065 : 0.12), bt(2), 1e9, 1.8);
    D.alphaTag(t > 2.2 && !(t >= bt(16) && t < bt(17)));
    return;
  }
  // ---- town reveal + montage
  D.cam.dx = 0; D.cam.dy = 0;
  const scene = (key, fn) => D.once(key, fn);
  if (t < bt(23)) {
    scene('yard', () => { D.visit('yard', 12, 6, true); D.place(13, 7, 'down'); D.tint(MIDDAY); D.cam.snap = true; D.W.follow(0, 0, true); D.cam.snap = false; D.sfx('whoosh'); });
    const k = (t - bt(21)) / bt(2);
    D.cam.zoom = baseZoom(D) * D.lerp(1.8, 0.75, D.E.out(k * 1.6));
    D.canvasFilter(k < 0.12 ? `blur(${(1 - k / 0.12) * 10}px)` : '');
    D.cap('town', 'wait… there\'s a whole *TOWN?* 😳', { x: 0.5, y: capY, t0: bt(21) + 0.05, size: V ? 2.4 : 2.2, wordDur: 0.08 });
    D.emoji('e_shock', '😳', V ? 0.68 : 0.58, V ? 0.44 : 0.42, bt(21.6), bt(23), V ? 3.2 : 3);
  } else if (t < bt(25)) {
    scene('fount', () => { D.canvasFilter(''); D.visit('square', 14, 13, true); D.place(14, 13, 'up'); D.tint(MIDDAY); D.cam.x = 240; D.cam.y = 168; D.colourAll(0); D.sfx('whoosh', { gain: 0.6 }); });
    const at = bt(23.5);
    D.cam.zoom = baseZoom(D) * ((V ? 0.95 : 0.9) + punch(t, at, 0.15, 6));
    if (t >= at) { D.radial(15, 10, D.E.out((t - at) / 0.9) * 26, 4, 0, 3); if (t - at < 0.7 && D.frameNo % 2 === 0) D.burst('sparkle', 240 + (D.rnd() - 0.5) * 4, 146, 6, ['#a9bfd6', '#c1d1e2', '#fff8ec'], 70, 110); D.cam.shake = punch(t, at, 14, 7); }
    D.cue('fb', at, () => { D.sfx('water'); D.burst('sparkle', 240, 150, 40, ['#a9bfd6', '#fff8ec', '#f6e3a1'], 110, 60); });
    D.cap('c_f', 'the fountain ⛲', { x: 0.5, y: V ? 0.72 : 0.82, t0: at, size: V ? 2.4 : 2.2 });
  } else if (t < bt(27)) {
    scene('bake', () => { D.visit('bakery', 10, 10, true); D.hideMess(); D.place(10, 10, 'up'); D.tint(MIDDAY); D.cam.x = 164; D.cam.y = 148; D.sfx('whoosh', { gain: 0.6 }); });
    let z = V ? 0.95 : 1.15;
    for (let i = 0; i < 7; i++) { const tb = bt(25) + 0.1 + i * bt(0.25); D.cue('ck' + i, tb, () => { D.burst('sparkle', CAKES[i], 132, 14, ['#fff8ec', '#f6e3a1', '#f4c2a8'], 50, 10); D.burst('sparkle', CAKES[i], 148, 14, ['#fff8ec', '#f7d2bf'], 50, 10); D.sfx('pop', { pitch: semis(PENTA[i + 3]), gain: 0.6 }); }); z += punch(t, tb, 0.03, 12); }
    D.cam.zoom = baseZoom(D) * z;
    D.cap('c_b', 'the bakery 🍰', { x: 0.5, y: V ? 0.72 : 0.82, t0: bt(25) + 0.05, size: V ? 2.4 : 2.2 });
  } else if (t < bt(wide ? 31 : 29)) {
    // neighbours tease (16:9 only gets the cards) / "this might take a while"
    if (wide && t >= bt(29)) {
      scene('nb', () => { D.visit('square', 14, 12, true); D.place(14, 12, 'down'); D.tint(MIDDAY); });
      D.fx.hide = true; D.canvasFilter('blur(6px)'); D.layer('dim', 'background:rgba(249,237,194,.55)');
      for (let i = 0; i < 6; i++) {
        const tb = bt(29) + 0.05 + i * bt(0.25); if (t < tb) continue;
        const e = D.el('card' + i, (e) => { e.style.perspective = '800px'; e.innerHTML = `<div style="width:${u * 5.6}px;height:${u * 7.2}px;background:#fff8ec;border:${u * 0.45}px solid #8a6e5e;border-radius:${u}px;box-shadow:0 ${u * 0.5}px 0 #8a6e5e;display:flex;flex-direction:column;align-items:center;justify-content:center"><svg viewBox="0 0 100 90" width="${u * 4.4}" height="${u * 4}"><g fill="#534239">${SIL[i]}</g></svg><div style="font-weight:900;font-size:${u * 1.5}px;line-height:1">?</div></div>`; });
        e.firstChild.style.transform = `rotateY(${(1 - D.E.back((t - tb) / 0.25)) * 90}deg)`;
        D.place2(e, D.vw * (0.5 + (i - 2.5) * 0.15), D.vh * 0.56, {});
        D.cue('fl' + i, tb, () => D.sfx('flip', { pitch: 1 + i * 0.09 }));
      }
      D.cap('c_n', '+ six neighbours to meet 👀', { x: 0.5, y: 0.2, t0: bt(29) + 0.05, size: 2.2 });
    } else {
      scene('while', () => { D.canvasFilter(''); D.visit('square', 7, 11, false); D.place(8, 11, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.75; });
      const k = (t - bt(27)) / bt(2);
      D.cam.zoom = baseZoom(D) * D.lerp(1.1, 0.7, D.E.out(k));
      D.counter('tpct', 'town: 2%', { x: 0.5, y: cntY, size: V ? 4.2 : 3.6, pulseT: bt(27) + 0.05 });
      D.cap('c_w', 'ok… this might take a while 🫠', { x: 0.5, y: V ? 0.72 : 0.82, t0: bt(27) + 0.2, size: V ? 2.3 : 2.1 });
    }
  } else {
    // end card
    const e0 = bt(wide ? 31 : 29);
    scene('end', () => { D.visit('burrow', 9, 8, true); D.hideMess(); D.place(9, 8); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.9; D.sfx('boing', { pitch: 0.9 }); });
    D.fx.hide = true;
    D.canvasFilter('blur(5px) saturate(1.1)');
    D.layer('dim', 'background:rgba(249,237,194,.5)');
    const end = e0 + bt(wide ? 6 : 6);
    logoCard(D, t, { inAt: e0, puffT: e0 + bt(0.5), sneezeAt: V ? end - 0.02 : null });
    D.particles('lc', D.vw / 2, D.vh * 0.55, e0 + 0.05, { n: 40, speed: 1000, grav: 500, life: 1.4, size: 1.2, shape: 'star', colours: ['#fff8ec', '#ffe066', '#a9cda0'] });
    D.cap('c_e', V ? 'follow to watch Puff clean the *whole* town 🧹' : "Puff's whole town is waiting ✨", { x: 0.5, y: V ? 0.78 : 0.88, t0: e0 + bt(1.5), size: V ? 2.1 : 1.8, width: V ? 0.86 : 0.8 });
    if (V) D.cue('ahA', end - 0.57, () => D.sfx('ahah'));
  }
  D.alphaTag(true);
}
S3.v3A = { beats: 35, setup(D) { D.visit('burrow', 5, 9, false); D.place(5, 9, 'right'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 2.5; D.targets = null; }, f: (D, t) => timelineA(D, t) };
S3.v3H = { beats: 37, setup(D) { D.visit('burrow', 5, 9, false); D.place(5, 9, 'right'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 2.5; D.targets = null; }, f: (D, t) => timelineA(D, t, { wide: true }) };

// ---------------------------------------------------------------- B: POV story
function timelineB(D, t) {
  resetFx(D);
  const V = D.vertical, p = D.puff;
  const z0 = baseZoom(D) * 0.9;
  const capY = V ? 0.19 : 0.13;
  let z = z0;
  const cx = 8.5, cy = 8;
  // 0–3 happy, clean room; ah-ah from 2
  if (t < bt(3)) {
    if (t > bt(2)) { const k = D.E.out((t - bt(2)) / bt(1)); D.fx.sy = 1 + 0.16 * k; D.fx.sx = 1 - 0.1 * k; D.fx.lift = 2 * k; D.fx.closed = k > 0.5; z = z0 * (1 + 0.25 * k); D.cam.dy = -8 * k; }
    else if (t > bt(1) && t < bt(1) + 0.12) D.fx.closed = true;
    D.cap('pov', 'POV: you sneeze *once*', { x: 0.5, y: capY, t0: 0.02, size: V ? 2.5 : 2.2, wordDur: 0.1 });
  } else if (t < bt(9)) {
    // ACHOO, drain, freeze
    const at = bt(3);
    D.cue('achoo', at, () => { sneezeBurst(D, p.fx, p.fy - 14); D.sfx('sneeze', { pre: 0 }); D.sfx('scratch', { at: 0.05 }); });
    const r = D.E.out((t - at) / 0.5) * 24;
    D.radial(cx, cy, r, 0, 4, 2.5); D.revealMess(cx, cy, r);
    const [sx, sy] = squash(t, at, 0.3, { freq: 18, decay: 7 }); D.fx.sx = sx; D.fx.sy = sy;
    D.cam.shake = punch(t, at, 26, 6);
    z = z0 * (1 + punch(t, at, 0.2, 6));
    if (t >= bt(4.5) && t < bt(6)) {
      D.stepMs = FREEZE;
      const k = D.E.out((t - bt(4.5)) / 0.25); z = z0 * D.lerp(1, 2.4, k); D.cam.dy = -12 * k;
      D.canvasFilter('saturate(0.6) contrast(1.05)');
      D.vignetteDark(0.5 * k);
      D.emoji('e1', '😳', V ? 0.74 : 0.62, V ? 0.4 : 0.36, bt(4.6), bt(6), V ? 3.4 : 3);
    } else D.canvasFilter('');
    D.cap('ruin', 'and ruin *EVERYTHING*', { x: 0.5, y: capY, t0: bt(4.5), t1: bt(6), size: V ? 2.6 : 2.3, wordDur: 0.12 });
    if (t >= bt(6) && t < bt(8)) {
      p.dir = t < bt(7) ? 'left' : 'right'; p.pose = 'idle';
      const lk = t < bt(7) ? t - bt(6) : t - bt(7);
      z = z0 * (1.5 + punch(lk, 0, 0.3, 10)); D.cam.dx = (t < bt(7) ? -10 : 10);
      D.cap('fine', "it's fine. it's *FINE.*", { x: 0.5, y: capY, t0: bt(6), size: V ? 2.5 : 2.2, wordDur: bt(0.5) });
      D.emoji('e2', '🫠', V ? 0.74 : 0.62, V ? 0.42 : 0.38, bt(7), bt(8), V ? 3.2 : 3);
    }
    if (t >= bt(8)) {
      p.dir = 'down'; p.pose = 'swing'; D.cam.dx = 0;
      z = z0 * (1.6 + punch(t, bt(8), 0.4, 8)); D.cam.shake = punch(t, bt(8), 16, 8);
      D.cue('grab', bt(8), () => D.sfx('impact'));
      D.cap('grab', '*grabs duster* 😤', { x: 0.5, y: capY, t0: bt(8), size: V ? 2.6 : 2.3, wordDur: 0.06 });
    }
  } else if (t < bt(17)) {
    D.cam.dx = 0; D.cam.dy = 0;
    const sched = [];
    for (let b = 9; b < 13; b++) sched.push(bt(b));
    for (let b = 13; b < 15; b += 0.5) sched.push(bt(b));
    for (let b = 15; b < 17; b += 0.25) sched.push(bt(b));
    if (!D.targets) D.targets = chainFrom(D, D.messList(), p.fx / 16, p.fy / 16).slice(0, sched.length);
    D.startB ??= { x: p.fx, y: p.fy };
    hopClean(D, t, D.startB, D.targets, sched);
    z = baseZoom(D) * 0.8;
    for (const s of sched) z += punch(t, s, 0.05 * z0, 14);
    D.cam.ease = 0.14;
    if (t >= bt(13) && t < bt(15)) D.badge('b2', '2× ⏩', 0.5, V ? 0.26 : 0.2, bt(13), 1e9, 2.0);
    if (t >= bt(15)) D.badge('b4', '4× ⏩⏩', 0.5, V ? 0.26 : 0.2, bt(15), 1e9, 2.2);
  } else if (t < bt(18)) {
    D.stepMs = FREEZE;
    const k = D.E.out((t - bt(17)) / 0.25); z = baseZoom(D) * 0.8 * D.lerp(1, 2.2, k); D.cam.dy = -12 * k;
    D.vignetteDark(0.6 * k); p.pose = 'swing'; p.dir = 'down';
    D.cap('one', 'one more…', { x: 0.5, y: V ? 0.72 : 0.8, t0: bt(17) + 0.05, size: V ? 2.4 : 2.1 });
  } else if (t < bt(22)) {
    const dt = t - bt(18);
    D.stepMs = dt < bt(2) ? 1000 / 60 * 0.3 : 1000 / 60;
    const waveK = dt < bt(2) ? 0.25 * (dt / bt(2)) : 0.25 + 0.75 * D.E.out((dt - bt(2)) / bt(1));
    const wx = p.fx / 16, wy = p.fy / 16;
    D.radial(wx, wy, waveK * 40, 4, 0, 3); D.sweepMess(wx, wy, waveK * 40);
    D.cam.dy = 0;
    z = baseZoom(D) * D.lerp(1.6, V ? 0.85 : 0.75, D.E.inOut(dt / bt(3.5))) + punch(t, bt(18), 0.3 * z0, 6);
    D.cam.shake = punch(t, bt(18), 28, 5);
    D.flash('fl', bt(18), 0.25);
    p.pose = dt < 0.2 ? 'swing' : 'idle'; p.dir = 'down';
    D.fx.lift = hop(t, bt(20), 10, 0.36);
    D.cue('dropB', bt(18), () => { D.sfx('impact', { gain: 1.3 }); D.sfx('sweep'); for (let i = 0; i < 10; i++) D.W.sparkleBurst(Math.round(wx) - 2 + (i % 5), Math.round(wy) - 1 + (i >> 2), 18); });
    D.cap('fixed', '✨ fixed it ✨', { x: 0.5, y: V ? 0.3 : 0.25, t0: bt(18) + 0.02, size: V ? 3.6 : 3.2, wordDur: 0.05 });
    D.emoji('smug', '😌', V ? 0.72 : 0.6, V ? 0.44 : 0.42, bt(20), bt(22), V ? 3.2 : 3);
    D.particles('conf', D.vw / 2, D.vh * 0.3, bt(18), { n: 60, speed: 1300, grav: 900, life: 1.6, size: 1.3, shape: 'star', colours: ['#ffe066', '#fff', '#ff9bb3', '#9be7a0', '#9cc7ff'] });
  } else {
    // brand + "oh no" (loops back into the sneeze)
    const k = D.E.out((t - bt(23)) / bt(2));
    if (t > bt(23)) { D.fx.sy = 1 + 0.16 * k; D.fx.sx = 1 - 0.1 * k; D.fx.lift = 2 * k; D.fx.closed = k > 0.5; }
    z = baseZoom(D) * D.lerp(0.85, 1.9, D.E.inOut((t - bt(22)) / bt(3)));
    D.cam.dy = -8 * k;
    D.cap('ohno', 'oh no. 😳', { x: 0.5, y: capY, t0: bt(23.3), size: V ? 2.8 : 2.4, wordDur: 0.15 });
    const brand = D.el('brand', (e) => { e.className = 'o ttbox'; e.style.whiteSpace = 'nowrap'; e.style.fontSize = D.U() * (V ? 1.35 : 1.3) + 'px'; e.innerHTML = '<span class="w">Sweet Home Reset · coming soon</span>'; });
    D.place2(brand, D.vw / 2, D.vh * (V ? 0.8 : 0.86), { s: D.E.back((t - bt(22)) / 0.25) });
    D.cue('ahB', bt(23), () => D.sfx('ahah'));
  }
  D.cam.zoom = z;
  D.alphaTag(t > 2.0 && !(t >= bt(4.5) && t < bt(6)) && !(t >= bt(17) && t < bt(18)));
}
S3.v3B = { beats: 25, setup(D) { D.visit('burrow', 8, 8, true); D.hideMess(); D.place(8, 8, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.9; D.targets = null; D.startB = null; }, f: (D, t) => timelineB(D, t) };

// ---------------------------------------------------------------- C: glow-up flips
const FLIPS = [
  { id: 'burrow', at: [8, 8], beforeB: 2, flipB: 6, endB: 8, label: 'AFTER ✨', cam: null },
  { id: 'bakery', at: [10, 10], beforeB: 8, flipB: 9, endB: 11, label: 'AFTER 🍰', cam: [164, 150], up: true },
  { id: 'square', at: [14, 13], beforeB: 11, flipB: 12, endB: 14, label: 'AFTER ⛲', cam: [240, 168], up: true, fountain: true },
  { id: 'yard', at: [13, 8], beforeB: 14, flipB: 15, endB: 17, label: 'AFTER 🌿', cam: null }
];
function timelineC(D, t) {
  resetFx(D);
  const V = D.vertical, p = D.puff;
  const capY = V ? 0.19 : 0.13;
  if (t < bt(17)) {
    const f = FLIPS.find((f) => t < bt(f.endB)) ;
    const idx = FLIPS.indexOf(f);
    D.once('fl_scene' + idx, () => {
      if (idx > 0) { D.visit(f.id, f.at[0], f.at[1], false); D.sfx('whoosh', { gain: 0.5 }); }
      D.place(f.at[0], f.at[1], f.up ? 'up' : 'down'); D.tint(MIDDAY);
      if (f.cam) { D.cam.x = f.cam[0]; D.cam.y = f.cam[1]; } else { D.cam.x = null; D.cam.y = null; }
      if (f.id === 'yard' || f.id === 'square') D.colourAll(0);
      D.cam.snap = true; D.W.follow(p.fx, p.fy, true); D.cam.snap = false;
    });
    const fb = bt(f.flipB);
    let z = baseZoom(D) * (V ? 0.85 : 0.8);
    if (t < fb) {
      z *= 1 + 0.08 * ((t - bt(idx === 0 ? 0 : f.beforeB)) / (fb - bt(idx === 0 ? 0 : f.beforeB)));
      D.cap('lb' + idx, 'BEFORE', { x: 0.5, y: V ? 0.3 : 0.27, t0: bt(idx === 0 ? 2 : f.beforeB), size: V ? 3.0 : 2.6, wordDur: 0.05 });
      if (idx === 0 && t > bt(5.5)) { D.stepMs = FREEZE; D.vignetteDark(0.4); }
    } else {
      D.once('flip' + idx, () => {
        D.colourAll(4); D.hideMess();
        const a = D.W.area; for (let i = 0; i < 14; i++) D.W.sparkleBurst(Math.floor(p.fx / 16) - 4 + (i % 7) * 1.3 | 0, Math.floor(p.fy / 16) - 2 + (i >> 1) % 4, 14);
        D.sfx('impact', { gain: idx === 0 ? 1.3 : 1.0 }); D.sfx('sparkle');
        if (f.fountain) { D.sfx('water'); D.burst('sparkle', 240, 150, 40, ['#a9bfd6', '#fff8ec', '#f6e3a1'], 110, 60); }
        if (f.id === 'bakery') for (let i = 0; i < 7; i++) { D.burst('sparkle', CAKES[i], 132, 10, ['#fff8ec', '#f6e3a1'], 50, 10); D.burst('sparkle', CAKES[i], 148, 10, ['#fff8ec', '#f7d2bf'], 50, 10); }
      });
      if (f.fountain && t - fb < 0.8 && D.frameNo % 2 === 0) D.burst('sparkle', 240 + (D.rnd() - 0.5) * 4, 146, 6, ['#a9bfd6', '#c1d1e2', '#fff8ec'], 70, 110);
      if (idx === 0 && t < fb + bt(1)) D.stepMs = 1000 / 60 * 0.35;
      z *= 1 + punch(t, fb, 0.25, 7);
      D.cam.shake = punch(t, fb, idx === 0 ? 26 : 16, 6);
      D.flash('ff' + idx, fb, 0.22);
      D.fx.lift = hop(t, fb + 0.1, 9, 0.34);
      D.cap('la' + idx, f.label, { x: 0.5, y: V ? 0.3 : 0.27, t0: fb, size: V ? 3.0 : 2.6, wordDur: 0.05 });
    }
    D.cam.zoom = z;
    D.cap('rate', 'rate this glow-up 1–10 👇', { x: 0.5, y: capY, t0: 0.02, t1: bt(6) - 0.01, size: V ? 2.4 : 2.1, wordDur: 0.08 });
    if (idx === 0 && t < bt(6) && t > bt(5.5)) D.emoji('eyes', '👀', V ? 0.74 : 0.62, V ? 0.42 : 0.4, bt(5.5), bt(6), V ? 3.2 : 3);
    if (t >= bt(6) && t < bt(8)) D.emoji('wow', '🤩', V ? 0.74 : 0.62, V ? 0.42 : 0.4, bt(6.3), bt(8), V ? 3.2 : 3);
  } else {
    D.once('endC', () => { D.visit('burrow', 9, 8, true); D.hideMess(); D.place(9, 8); D.tint(MIDDAY); D.cam.x = null; D.cam.y = null; D.cam.zoom = baseZoom(D) * 0.9; D.sfx('boing', { pitch: 0.9 }); });
    D.fx.hide = true;
    D.canvasFilter('blur(5px) saturate(1.1)');
    D.layer('dim', 'background:rgba(249,237,194,.5)');
    logoCard(D, t, { inAt: bt(17), puffT: bt(17.5) });
    D.cap('fav', "which one's your favourite? 1️⃣ 2️⃣ 3️⃣ 4️⃣ 👇", { x: 0.5, y: V ? 0.8 : 0.15, t0: bt(17) + 0.05, size: V ? 2.2 : 2.0, wordDur: 0.07, width: V ? 0.88 : 0.8 });
  }
  D.alphaTag(t > 2.0);
}
S3.v3C = { beats: 22, setup(D) { D.visit('burrow', 8, 8, false); D.place(8, 8, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.85; }, f: (D, t) => timelineC(D, t) };

for (const k of ['v3A', 'v3H', 'v3B', 'v3C']) { S3[k].dur = S3[k].beats * B; const su = S3[k].setup; S3[k].setup = (D) => { D.v3 = true; su(D); }; }
