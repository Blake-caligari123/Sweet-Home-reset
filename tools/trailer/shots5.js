// Content batch 1 (9:16): POV guests, Town ep 1, ASMR. Uses helpers from shots/shots3/shots4.
const S5 = window.SHOTS;

function v5Timer(D, txt, { warn = false, pulse = -9, y } = {}) {
  const e = D.counter('timer', txt, { x: 0.5, y: y ?? 0.3, size: 4.6, pulseT: pulse, color: warn ? '#ff4d6d' : '#fff' });
  return e;
}
const v5Clock = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.max(0, Math.floor(sec % 60))).padStart(2, '0')}`;
function v5Pill(D, id, txt, y, t0) {
  const e = D.el(id, (e) => { e.className = 'o ttbox'; e.style.whiteSpace = 'nowrap'; e.style.fontSize = D.U() * 1.35 + 'px'; e.innerHTML = `<span class="w">${txt}</span>`; });
  D.place2(e, D.vw / 2, D.vh * y, { s: D.E.back((D.t - t0) / 0.25) });
}

// ================================================= POV: guests are coming in 10 minutes (48 beats)
function v5Guests(D, t) {
  resetFx(D);
  const p = D.puff, z0 = baseZoom(D) * 0.9, zr = baseZoom(D) * 0.8;
  const capY = 0.19, u = D.U();
  const run = v4Times([[7, 15, 1], [15, 21, 0.5], [21, 25, 0.25]]);
  v4Segs(D, t, [
    [0, 4, null, (D, t) => {
      D.fx.closed = true; breathe(D, t, 0.04, 2.0);
      D.cam.zoom = z0 * D.lerp(1.0, 1.12, t / bt(4));
      D.cap('pov', "POV: you said you'd clean *'later'*", { x: 0.5, y: capY, t0: 0.02, size: 2.4, wordDur: 0.1 });
      D.emoji('zz', '😴', 0.72, 0.42, bt(1.5), bt(4), 3);
    }],
    [4, 7, null, (D, t, t0) => {
      // notification + doorbell
      D.cue('bell', t0, () => { D.sfx('notif'); });
      const n = D.el('notif', (e) => { e.style.cssText += `;width:${D.vw * 0.86}px;background:rgba(255,255,255,.96);border-radius:${u * 1.1}px;box-shadow:0 ${u * 0.4}px ${u * 1.2}px rgba(0,0,0,.25);padding:${u * 1.0}px ${u * 1.2}px;font-weight:700;color:#111;font-size:${u * 1.7}px;line-height:1.3;white-space:normal`; e.innerHTML = `<div style="font-size:${u * 1.1}px;color:#888;font-weight:700">💬 MESSAGES · now</div><div style="font-weight:900">guests</div><div>we're 10 mins away!! 🎉🎉</div>`; });
      const k = D.E.back((t - t0) / 0.3);
      D.place2(n, D.vw / 2, D.vh * 0.2 - (1 - k) * u * 8, {});
      if (t < t0 + bt(1)) { D.fx.closed = true; D.cam.zoom = z0 * 1.12; }
      else if (t < t0 + bt(2.5)) {
        D.stepMs = FREEZE; const q = D.E.out((t - t0 - bt(1)) / 0.25); D.cam.zoom = z0 * D.lerp(1.12, 2.5, q); D.cam.dy = -12 * q;
        D.vignetteDark(0.5 * q); D.emoji('shock', '😳', 0.74, 0.42, t0 + bt(1.1), 1e9, 3.4);
        D.cue('scr', t0 + bt(1), () => D.sfx('scratch', { at: 0 }));
      } else {
        D.cam.dy = 0; p.pose = 'swing'; p.dir = 'down';
        D.cam.zoom = z0 * (1.6 + punch(t, t0 + bt(2.5), 0.4, 8)); D.cam.shake = punch(t, t0 + bt(2.5), 18, 8);
        D.cue('pan', t0 + bt(2.5), () => D.sfx('impact'));
        D.cap('panic', '*PANIC* 😱', { x: 0.5, y: 0.4, t0: t0 + bt(2.5), size: 3.2, wordDur: 0.05 });
        v5Timer(D, '10:00', { pulse: t0 + bt(2.5), y: 0.32 });
      }
    }],
    [7, 25, null, (D, t) => {
      D.legs ??= v4Route(D, D.messList(), run.length, { x: p.fx, y: p.fy });
      v4Run(D, t, 'gr', D.legs, run, { tStart: bt(7) - 0.2 });
      let z = zr; for (const s of run) z += punch(t, s, 0.05 * z0, 14); D.cam.zoom = z; D.cam.ease = 0.14;
      const sec = D.lerp(600, 4, D.clamp((t - bt(7)) / bt(18), 0, 1));
      v5Timer(D, v5Clock(sec), { warn: sec < 60, pulse: Math.floor(t / bt(1)) * bt(1), y: 0.32 });
      v4Badge(D, t, run, 0.385);
      D.cap('c1', 'dust? gone.', { x: 0.5, y: capY, t0: bt(8), t1: bt(14.9), size: 2.3, wordDur: 0.12 });
      D.cap('c2', 'everything else?? 😭', { x: 0.5, y: capY, t0: bt(15), t1: bt(20.9), size: 2.3, wordDur: 0.12 });
      D.cap('c3', '*NOT NOW* 🏃', { x: 0.5, y: capY, t0: bt(21), size: 2.4, wordDur: 0.1 });
    }],
    [25, 26, null, (D, t, t0) => { v4Freeze(D, t, t0, zr, { cap: 'one more…', emo: '😬' }); v5Timer(D, '00:03', { warn: true, y: 0.32 }); }],
    [26, 30, null, (D, t, t0) => {
      v4Drop(D, t, t0, zr, { far: 0.85 });
      v5Timer(D, '00:00', { pulse: t0, y: 0.3 }).style.color = '#ffe066';
      D.cue('dd', t0 + bt(2), () => D.sfx('doorbell'));
      D.cap('ding', '*ding dong* 🔔', { x: 0.5, y: 0.72, t0: t0 + bt(2), size: 2.6, wordDur: 0.12 });
    }],
    [30, 38, null, (D, t, t0) => {
      p.dir = 'down'; p.pose = 'idle';
      D.cam.zoom = baseZoom(D) * D.lerp(0.9, 1.6, D.E.inOut((t - t0) / bt(8)));
      if ((t - t0) % 2.4 > 2.2) D.fx.closed = true;
      D.cap('always', "'oh this? it's *always* like this' 😌", { x: 0.5, y: capY, t0: t0 + 0.1, size: 2.3, wordDur: 0.11 });
      D.emoji('smug2', '💅', 0.74, 0.46, t0 + bt(3), 1e9, 3.2);
    }],
    [38, 48, v4SetEnd, (D, t, t0, t1) => v4End(D, t, t0, t1, 'follow for more Puff 🧹', false)]
  ]);
  D.alphaTag(t > bt(7) && !(t >= bt(25) && t < bt(26)));
}
S5.v5Guests = { beats: 48, setup(D) { D.v3 = true; D.visit('burrow', 5, 9, false); D.place(5, 9, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.9; D.legs = null; }, f: (D, t) => v5Guests(D, t) };

// ================================================= Town: 4% — episode 1 (48 beats)
const V5OPTS = [['🍰', 'the bakery'], ['⛲', 'the fountain'], ['🌿', 'the garden']];
function v5Town(D, t) {
  resetFx(D);
  const p = D.puff, zr = baseZoom(D) * 0.8, capY = 0.19, u = D.U();
  const run = v4Times([[6, 14, 1], [14, 20, 0.5], [20, 24, 0.25]]);
  v4Segs(D, t, [
    [0, 4, (D) => { D.visit('square', 14, 12, false); D.colourAll(0); D.place(14, 12, 'down'); D.tint(MIDDAY); D.cam.x = 240; D.cam.y = 180; }, (D, t) => {
      D.cam.zoom = baseZoom(D) * D.lerp(0.75, 0.6, D.E.inOut(t / bt(4)));
      D.cap('intro', 'restoring an *entire* town, one spot at a time 🧹', { x: 0.5, y: capY, t0: 0.02, size: 2.3, wordDur: 0.08 });
      D.counter('town', 'town: 0%', { x: 0.5, y: 0.34, size: 4.2 });
      D.badge('ep', 'EPISODE 1', 0.5, 0.41, 0.3, 1e9, 1.6);
    }],
    [4, 6, (D) => { D.visit('burrow', 5, 9, false); D.place(5, 9, 'down'); D.tint(MIDDAY); D.cam.x = null; D.cam.y = null; D.sfx('whoosh'); D.legs = null; }, (D, t, t0) => {
      D.cam.zoom = baseZoom(D) * D.lerp(1.6, 0.85, D.E.out((t - t0) / bt(2)));
      D.canvasFilter(t - t0 < 0.1 ? `blur(${(1 - (t - t0) / 0.1) * 10}px)` : '');
      D.cap('today', "today: Puff's burrow 🏠", { x: 0.5, y: capY, t0: t0 + 0.05, size: 2.4, wordDur: 0.08 });
    }],
    [6, 24, null, (D, t) => {
      D.canvasFilter('');
      D.legs ??= v4Route(D, D.messList(), run.length, { x: p.fx, y: p.fy });
      const done = v4Run(D, t, 'tr', D.legs, run, { tStart: bt(6) - 0.2, onClean: () => { D.lastClean = D.t; } });
      let z = zr; for (const s of run) z += punch(t, s, 0.05 * zr, 14); D.cam.zoom = z; D.cam.ease = 0.14;
      D.counter('bp', `burrow: ${Math.round((done / D.legs.length) * 99)}%`, { x: 0.5, y: 0.3, size: 2.9, pulseT: D.lastClean ?? -9 });
      v4Badge(D, t, run, 0.36);
      D.cap('today2', "today: Puff's burrow 🏠", { x: 0.5, y: capY, t0: 0, size: 2.2, wordDur: 0 });
    }],
    [24, 25, null, (D, t, t0) => { v4Freeze(D, t, t0, zr); D.counter('bp', 'burrow: 99%', { x: 0.5, y: 0.3, size: 2.9 }); }],
    [25, 29, null, (D, t, t0) => {
      v4Drop(D, t, t0, zr, { far: 0.85 });
      D.counter('bp', 'burrow: 100%', { x: 0.5, y: 0.3, size: 3.1, pulseT: t0, color: '#ffe066' });
      D.emoji('sp1', '✨', 0.12, 0.3, t0 + 0.05, 1e9, 3); D.emoji('sp2', '✨', 0.88, 0.3, t0 + 0.1, 1e9, 3);
    }],
    [29, 33, (D) => { D.visit('square', 14, 12, false); D.colourAll(0); D.place(14, 12, 'down'); D.tint(MIDDAY); D.cam.x = 240; D.cam.y = 180; D.sfx('whoosh', { gain: 0.6 }); }, (D, t, t0) => {
      D.cam.zoom = baseZoom(D) * 0.6;
      const k = D.clamp((t - t0 - bt(0.5)) / bt(1.5), 0, 1);
      const v = Math.round(k * 4);
      D.cue('tick4', t0 + bt(2), () => { D.sfx('jingle'); });
      D.counter('town', `town: ${v}%`, { x: 0.5, y: 0.34, size: k >= 1 ? 4.8 : 4.2, pulseT: t0 + bt(2), color: k >= 1 ? '#ffe066' : '#fff' });
      D.particles('tconf', D.vw / 2, D.vh * 0.34, t0 + bt(2), { n: 50, speed: 1100, grav: 900, life: 1.5, size: 1.2, shape: 'star', colours: ['#ffe066', '#fff', '#9be7a0', '#9cc7ff'] });
      D.cap('long', 'only 96% to go 🫠', { x: 0.5, y: 0.72, t0: t0 + bt(2.3), size: 2.4, wordDur: 0.1 });
    }],
    [33, 41, null, (D, t, t0) => {
      D.fx.hide = true; D.canvasFilter('blur(6px)'); D.layer('dim', 'background:rgba(249,237,194,.55)');
      D.cap('next', 'what should Puff clean next? 👇', { x: 0.5, y: 0.2, t0: t0 + 0.05, size: 2.4, wordDur: 0.08 });
      V5OPTS.forEach(([emo, name], i) => {
        const tb = t0 + bt(1 + i); if (t < tb) return;
        const e = D.el('opt' + i, (e) => { e.innerHTML = `<div style="width:${D.vw * 0.78}px;background:#fff8ec;border:${u * 0.45}px solid #8a6e5e;border-radius:${u * 1.2}px;box-shadow:0 ${u * 0.5}px 0 #8a6e5e;display:flex;align-items:center;gap:${u}px;padding:${u * 0.7}px ${u * 1.2}px;font-weight:900;font-size:${u * 1.9}px;color:#534239"><span style="font-family:'Noto Color Emoji';font-size:${u * 2.6}px">${emo}</span>${i + 1}. ${name}</div>`; });
        D.place2(e, D.vw / 2, D.vh * (0.38 + i * 0.14), { s: D.E.back((t - tb) / 0.25) });
        D.cue('op' + i, tb, () => D.sfx('pop', { pitch: semis(PENTA[i + 2]) }));
      });
      D.cap('cmt', 'comment 1, 2 or 3 👇', { x: 0.5, y: 0.82, t0: t0 + bt(4.5), size: 2.3, wordDur: 0.1 });
    }],
    [41, 48, v4SetEnd, (D, t, t0, t1) => v4End(D, t, t0, t1, 'follow for episode 2 ✨', false)]
  ]);
  D.alphaTag(t > 2.0 && !(t >= bt(24) && t < bt(25)));
}
S5.v5Town = { beats: 48, setup(D) { D.v3 = true; D.visit('square', 14, 12, false); D.colourAll(0); D.place(14, 12, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.75; D.legs = null; }, f: (D, t) => v5Town(D, t) };

// ================================================= ASMR clean (no music, 50 beats)
function v5Asmr(D, t) {
  resetFx(D);
  const p = D.puff, z0 = baseZoom(D) * 1.5;
  const run = v4Times([[3, 39, 2.4]]);
  D.legs ??= v4Route(D, D.messList(), run.length, { x: p.fx, y: p.fy });
  if (t < bt(40)) {
    v4Run(D, t, 'as', D.legs, run, { tStart: bt(1) });
    for (const s of run) D.cue('sw' + s.toFixed(3), s - 0.22, () => D.sfx('swish'));
    D.cam.zoom = z0 * (1 + 0.04 * Math.sin(t * 0.6)); D.cam.ease = 0.06;
  } else {
    // gentle full-room bloom
    const k = D.E.inOut((t - bt(40)) / bt(5));
    D.once('bloom', () => { D.bc = { x: p.fx / 16, y: p.fy / 16 }; D.sfx('sparkle'); D.sfx('water', { gain: 0.5 }); });
    D.radial(D.bc.x, D.bc.y, k * 40, 4, 0, 4); D.sweepMess(D.bc.x, D.bc.y, k * 40);
    p.pose = 'idle'; p.dir = 'down';
    D.cam.zoom = z0 * D.lerp(1, 0.6, k);
    D.fx.lift = hop(t, bt(44), 6, 0.34);
    D.cap('sat', 'so satisfying ✨', { x: 0.5, y: 0.72, t0: bt(42), size: 2.4, wordDur: 0.12 });
    v5Pill(D, 'brand', 'Sweet Home Reset · coming soon', 0.82, bt(45));
  }
  if (t < bt(4)) D.cap('snd', 'turn your sound on 🔊', { x: 0.5, y: 0.19, t0: 0.02, t1: bt(4), size: 2.4, wordDur: 0.1 });
  else D.cap('lbl', '🔊 asmr clean', { x: 0.5, y: 0.19, t0: bt(4), size: 1.6, wordDur: 0 });
  D.alphaTag(t > 2.0);
}
S5.v5Asmr = { beats: 50, setup(D) { D.v3 = true; D.visit('burrow', 5, 9, false); D.place(5, 9, 'right'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 1.5; D.legs = null; }, f: (D, t) => v5Asmr(D, t) };

for (const k of ['v5Guests', 'v5Town', 'v5Asmr']) S5[k].dur = S5[k].beats * B;
