// Content batch 2 (9:16): night clean, beat-drop challenge, day in the life, what's in the bag.
const S6 = window.SHOTS;

// ================================================= Cosy night clean (56 beats)
function v6Night(D, t) {
  resetFx(D);
  const p = D.puff, z0 = baseZoom(D) * 1.25;
  const run = v4Times([[3, 39, 2]]);
  D.legs ??= v4Route(D, D.messList(), run.length, { x: p.fx, y: p.fy });
  if (t < bt(40)) {
    v4Run(D, t, 'nc', D.legs, run, { tStart: bt(1) });
    for (const s of run) D.cue('sw' + s.toFixed(3), s - 0.22, () => D.sfx('swish', { gain: 0.7 }));
    D.cam.zoom = z0 * (1 + 0.03 * Math.sin(t * 0.5)); D.cam.ease = 0.06;
    D.cap('t1', 'cosy night clean with Puff 🌙', { x: 0.5, y: 0.19, t0: 0.02, t1: bt(10), size: 2.3, wordDur: 0.12 });
    D.cap('t2', 'lofi beats to tidy to 🎧', { x: 0.5, y: 0.19, t0: bt(10), t1: bt(24), size: 2.2, wordDur: 0.12 });
    D.cap('t3', 'one dust bunny at a time ✨', { x: 0.5, y: 0.19, t0: bt(24), size: 2.2, wordDur: 0.12 });
  } else {
    const k = D.E.inOut((t - bt(40)) / bt(5));
    D.once('bloom', () => { D.bc = { x: p.fx / 16, y: p.fy / 16 }; D.sfx('sparkle', { gain: 0.6 }); });
    D.radial(D.bc.x, D.bc.y, k * 40, 4, 0, 4); D.sweepMess(D.bc.x, D.bc.y, k * 40);
    p.pose = 'idle'; p.dir = 'down';
    D.cam.zoom = z0 * D.lerp(1, 0.75, k);
    const lt = t - bt(45);
    if (lt > 0) {
      if (lt < 0.9) { const q = Math.sin(D.clamp(lt / 0.9, 0, 1) * Math.PI); D.fx.sy = 1 + 0.12 * q; D.fx.sx = 1 - 0.06 * q; D.fx.closed = lt > 0.25; }
      else { D.fx.closed = true; breathe(D, t, 0.04, 2.4); }
      D.cue('yawn', bt(45), () => D.sfx('yawn'));
      const s = D.puffScreen(30);
      for (let i = 0; i < 3; i++) {
        const tz = bt(45) + 0.8 + i * 0.5; if (t < tz) continue;
        const q = (t - tz) % 1.8;
        const z = D.el('z' + i, (e) => { e.className = 'o tt'; e.style.whiteSpace = 'nowrap'; e.style.width = 'auto'; e.style.fontSize = D.U() * (1.6 + i * 0.5) + 'px'; e.textContent = 'z'; });
        D.place2(z, s.x + D.U() * (1.5 + q * 1.5) + Math.sin(q * 3) * D.U() * 0.5, s.y - q * D.U() * 3, { o: D.clamp(1 - q / 1.8, 0, 1) * D.clamp(q / 0.2, 0, 1) });
      }
    }
    D.cap('gn', 'goodnight 🌙', { x: 0.5, y: 0.72, t0: bt(46), size: 2.6, wordDur: 0.15 });
    v5Pill(D, 'brand', 'Sweet Home Reset · coming soon', 0.82, bt(49));
  }
  D.alphaTag(t > 2.0);
}
S6.v6Night = { beats: 56, setup(D) { D.v3 = true; D.visit('burrow', 5, 9, false); D.place(5, 9, 'right'); D.tint(22 * 60); D.cam.zoom = baseZoom(D) * 1.25; D.legs = null; }, f: (D, t) => v6Night(D, t) };

// ================================================= Beat-drop challenge (36 beats)
function v6Race(D, t) {
  resetFx(D);
  const p = D.puff, zr = baseZoom(D) * 0.8, u = D.U();
  const run = v4Times([[2, 10, 1], [10, 18, 0.5], [18, 26, 0.25]]);
  const bar = (k) => {
    const e = D.el('dropbar', (e) => { e.innerHTML = `<div style="width:${D.vw * 0.8}px"><div style="font-weight:900;font-size:${u * 1.1}px;color:#fff;-webkit-text-stroke:${u * 0.25}px #111;paint-order:stroke fill;text-align:center;margin-bottom:${u * 0.3}px">BEAT DROP ⏱️</div><div style="height:${u * 1.3}px;background:rgba(0,0,0,.45);border:${u * 0.3}px solid #fff;border-radius:999px;overflow:hidden"><div class="bf" style="height:100%;width:0;background:linear-gradient(90deg,#ffe066,#ff2d55)"></div></div></div>`; });
    e.querySelector('.bf').style.width = D.clamp(k, 0, 1) * 100 + '%';
    D.place2(e, D.vw / 2, D.vh * 0.86, {});
  };
  v4Segs(D, t, [
    [0, 26, null, (D, t) => {
      D.legs ??= v4Route(D, D.messList(), run.length, { x: p.fx, y: p.fy });
      const done = t >= bt(2) - 0.3 ? v4Run(D, t, 'rc', D.legs, run, { tStart: bt(1.6), onClean: () => { D.lastClean = D.t; } }) : 0;
      let z = t < bt(1) ? D.lerp(zr * 2.6, zr, D.E.out(t / bt(1))) : zr; for (const s of run) z += punch(t, s, 0.05 * zr, 14);
      D.cam.zoom = z; D.cam.ease = 0.14;
      D.cap('ch', 'can Puff clean the bakery *before* the beat drops? ⏱️', { x: 0.5, y: 0.19, t0: 0.02, size: 2.2, wordDur: 0.07, width: 0.9 });
      D.counter('pct', `${Math.round((done / Math.max(1, D.legs.length)) * 99)}%`, { x: 0.5, y: 0.34, size: 4.4, pulseT: D.lastClean ?? -9 });
      if (t >= bt(2)) v4Badge(D, t, run, 0.405);
      bar(t / bt(27));
      if (t >= bt(22)) D.emoji('sweat', '😰', 0.78, 0.46, bt(22), 1e9, 3);
    }],
    [26, 27, null, (D, t, t0) => { v4Freeze(D, t, t0, zr, { cap: 'come onnn…', emo: '😬' }); D.counter('pct', '99%', { x: 0.5, y: 0.34, size: 4.4 }); bar(0.97); }],
    [27, 31, null, (D, t, t0) => {
      v4Drop(D, t, t0, zr, { far: 0.9 });
      D.counter('pct', '100%', { x: 0.5, y: 0.32, size: 6, pulseT: t0, color: '#ffe066' });
      D.cap('made', '*MADE IT* ✅', { x: 0.5, y: 0.2, t0: t0 + 0.02, size: 3.2, wordDur: 0.08 });
      bar(1);
      if (t > t0 + bt(1.5)) for (let i = 0; i < 7; i++) D.cue('bck' + i, t0 + bt(1.5) + i * bt(0.25), () => D.burst('sparkle', CAKES[i], 140, 16, ['#fff8ec', '#f6e3a1', '#f4c2a8'], 60, 10));
    }],
    [31, 36, null, (D, t, t0) => {
      p.pose = 'idle'; p.dir = 'down';
      D.cam.zoom = baseZoom(D) * D.lerp(0.9, 1.4, D.E.inOut((t - t0) / bt(5)));
      D.fx.lift = hop(t, t0 + bt(0.5), 8, 0.32);
      D.cap('easy', 'too easy 😎', { x: 0.5, y: 0.2, t0: t0 + 0.05, size: 2.6, wordDur: 0.1 });
      D.cap('next', 'what should Puff race next? 👇', { x: 0.5, y: 0.72, t0: t0 + bt(1.5), size: 2.2, wordDur: 0.08 });
      v5Pill(D, 'brand', 'Sweet Home Reset · coming soon', 0.84, t0 + bt(2.5));
    }]
  ]);
  D.alphaTag(t > 2.0 && !(t >= bt(26) && t < bt(27)));
}
S6.v6Race = { beats: 36, setup(D) { D.v3 = true; D.visit('bakery', 10, 11, false); D.place(10, 11, 'up'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 2; D.legs = null; }, f: (D, t) => v6Race(D, t) };

// ================================================= A day in the life (58 beats)
function v6Clock(D, txt, t0) { D.counter('clock', txt, { x: 0.5, y: 0.3, size: 4.4, pulseT: t0 }); }
function v6Day(D, t) {
  resetFx(D);
  const p = D.puff;
  const act = (id, txt, t0) => D.cap(id, txt, { x: 0.5, y: 0.72, t0: t0 + 0.1, size: 2.4, wordDur: 0.1 });
  v4Segs(D, t, [
    [0, 8, null, (D, t, t0) => {
      D.cap('title', 'a day in the life of a dust bunny 🐰', { x: 0.5, y: 0.19, t0: 0.02, size: 2.2, wordDur: 0.08 });
      v6Clock(D, '7:00 am', bt(2));
      D.cam.zoom = baseZoom(D) * D.lerp(1.3, 1.0, D.E.inOut(t / bt(8)));
      if (t < bt(4)) { D.fx.closed = true; breathe(D, t, 0.04, 2.0); }
      else { D.fx.lift = hop(t, bt(4), 9, 0.36); const [sx, sy] = squash(t, bt(4) + 0.36, 0.15); if (t > bt(4) + 0.36) { D.fx.sx = sx; D.fx.sy = sy; } D.cue('wake', bt(4), () => D.sfx('boing', { pitch: 1.2 })); }
      act('a1', 'wake up ☀️', bt(4));
    }],
    [8, 16, (D) => { D.visit('burrow', 5, 9, false); D.place(5, 9, 'right'); D.tint(8 * 60); D.legs = null; }, (D, t, t0) => {
      const run = v4Times([[8.5, 15.5, 1]]);
      D.legs ??= v4Route(D, D.messList(), run.length, { x: p.fx, y: p.fy });
      v4Run(D, t, 'dc', D.legs, run, { tStart: t0 });
      D.cam.zoom = baseZoom(D) * 0.9; D.cam.ease = 0.14;
      v6Clock(D, '8:00 am', t0); act('a2', 'tidy the burrow 🧹', t0);
    }],
    [16, 24, v4SetCakes, (D, t, t0) => { v4Cakes(D, t, t0, '', 0.75); v6Clock(D, '12:00 pm', t0); act('a3', 'bakery run 🍰', t0); }],
    [24, 32, (D) => { D.canvasFilter(''); D.visit('square', 14, 13, true); D.place(14, 13, 'up'); D.tint(15 * 60); D.cam.x = 240; D.cam.y = 168; D.sfx('whoosh', { gain: 0.6 }); }, (D, t, t0) => {
      D.cam.zoom = baseZoom(D) * (0.95 + 0.06 * D.E.inOut((t - t0) / bt(8)));
      if (D.frameNo % 3 === 0) D.burst('sparkle', 240 + (D.rnd() - 0.5) * 6, 146, 3, ['#a9bfd6', '#c1d1e2', '#fff8ec'], 50, 90);
      D.cue('wt', t0 + bt(1), () => D.sfx('water', { gain: 0.6 }));
      v6Clock(D, '3:00 pm', t0); act('a4', 'fountain check ⛲', t0);
    }],
    [32, 40, (D) => { D.cam.x = null; D.cam.y = null; D.visit('yard', 12, 6, true); D.place(12, 6, 'down'); D.tint(18 * 60); D.walkTo(20, 9); D.sfx('whoosh', { gain: 0.6 }); }, (D, t, t0) => {
      D.cam.zoom = baseZoom(D) * 0.95;
      v6Clock(D, '6:00 pm', t0); act('a5', 'golden hour walk 🌇', t0);
    }],
    [40, 48, v4SetNight, (D, t, t0) => { v4Night(D, t, t0, ''); v6Clock(D, '10:00 pm', t0); act('a6', 'nap 😴', t0); }],
    [48, 52, (D) => { D.visit('burrow', 8, 8, true); D.hideMess(); D.place(8, 8, 'down'); D.tint(7 * 60); D.cam.x = null; D.cam.y = null; }, (D, t, t0) => {
      D.cam.zoom = baseZoom(D);
      D.fx.lift = hop(t, t0 + bt(1), 9, 0.36);
      v6Clock(D, '7:00 am', t0); act('a7', 'repeat ✨', t0);
    }],
    [52, 58, v4SetEnd, (D, t, t0, t1) => v4End(D, t, t0, t1, 'follow for more of Puff’s days ☀️', false)]
  ]);
  D.alphaTag(t > 2.0);
}
S6.v6Day = { beats: 58, setup(D) { D.v3 = true; D.visit('burrow', 4, 7, true); D.hideMess(); D.place(4, 7, 'down'); D.tint(7 * 60); D.cam.zoom = baseZoom(D) * 1.3; }, f: (D, t) => v6Day(D, t) };

// ================================================= What's in Puff's bag? (28 beats)
function v6Bag(D, t) {
  resetFx(D);
  const p = D.puff, u = D.U();
  const times = [bt(3), bt(6.5), bt(10)];
  if (!D.legs) {
    const items = D.messList().filter((m) => m.item);
    D.legs = v4Route(D, items, 3, { x: p.fx, y: p.fy });
    D.flyFrom = [];
  }
  const bx = D.vw * 0.5, by = D.vh * 0.82;
  const landT = times.map((x) => x + 0.55);
  // bag
  let bagS = D.E.back(t / 0.3);
  for (const l of landT) bagS *= 1 + punch(t, l, 0.25, 9);
  let rot = 0;
  if (t >= bt(13) && t < bt(17)) rot = Math.sin((t - bt(13)) * 30) * 10 * D.clamp((t - bt(13)) / 0.3, 0, 1);
  if (t < bt(17)) { const bag = D.el('bag', (e) => { e.innerHTML = `<div style="width:${u * 7}px;height:${u * 7}px;background:#fff8ec;border:${u * 0.55}px solid #8a6e5e;border-radius:${u * 2}px;box-shadow:0 ${u * 0.55}px 0 #8a6e5e;display:flex;align-items:center;justify-content:center;flex-direction:column;font-weight:900;font-size:${u * 1.4}px;color:#534239"><span style="font-family:'Noto Color Emoji';font-size:${u * 3.4}px">👜</span>Puff's bag</div>`; });
  D.place2(bag, bx, by, { s: bagS, r: rot }); }
  // walking + picking up
  if (t < bt(12)) {
    v4Run(D, t, 'bg', D.legs, times, { tStart: bt(1), clean: true, onClean: (i, m) => { D.flyFrom[i] = D.tileScreen(m.x, m.y); } });
    D.cam.zoom = baseZoom(D) * 0.85; D.cam.ease = 0.14;
  } else { p.pose = 'idle'; p.dir = 'down'; D.cam.zoom = baseZoom(D) * D.lerp(0.85, 1.1, D.clamp((t - bt(12)) / bt(5), 0, 1)); }
  D.legs.forEach((leg, i) => {
    const fly = D.el('fly' + i, (e) => { e.className = 'o spr'; e.style.width = e.style.height = u * 3 + 'px'; e.style.backgroundImage = `url(/Sweet-Home-reset/sprites/item_${leg.m.item}.png)`; e.style.backgroundSize = '100% 100%'; });
    if (t < times[i] || t > landT[i] || !D.flyFrom[i]) { fly.style.display = 'none'; return; }
    const k = D.E.inOut((t - times[i]) / 0.55), s0 = D.flyFrom[i];
    D.place2(fly, D.lerp(s0.x, bx, k), D.lerp(s0.y, by, k) - Math.sin(k * Math.PI) * u * 7, { s: 1 + Math.sin(k * Math.PI) * 0.6, r: k * 360 });
    D.cue('ld' + i, landT[i], () => D.sfx('jingle'));
  });
  D.cap('q', "what's in Puff's bag? 👀", { x: 0.5, y: 0.19, t0: 0.02, t1: bt(13), size: 2.5, wordDur: 0.1 });
  if (t >= bt(13) && t < bt(17)) { D.cap('wa', '*wrong answers only* 👇', { x: 0.5, y: 0.19, t0: bt(13), size: 2.5, wordDur: 0.1 }); D.cue('rattle', bt(13), () => D.sfx('scratch', { at: 0 })); }
  if (t >= bt(17)) {
    // the reveal
    D.once('rev', () => { D.sfx('impact'); D.sfx('sparkle'); });
    D.flash('rf', bt(17), 0.2);
    D.emoji('sock', '🧦', 0.5, 0.5, bt(17), 1e9, 9);
    D.particles('rp', D.vw / 2, D.vh * 0.5, bt(17), { n: 40, speed: 1000, grav: 700, life: 1.4, size: 1.2, shape: 'star', colours: ['#ffe066', '#fff', '#9be7a0'] });
    D.cap('ans', '…it’s always a sock.', { x: 0.5, y: 0.19, t0: bt(17.3), size: 2.6, wordDur: 0.12 });
    D.cap('cm', 'comment your best guess 👇', { x: 0.5, y: 0.72, t0: bt(20), size: 2.2, wordDur: 0.08 });
    v5Pill(D, 'brand', 'Sweet Home Reset · coming soon', 0.84, bt(22));
  }
  D.alphaTag(t > 2.0);
}
S6.v6Bag = { beats: 28, setup(D) { D.v3 = true; D.visit('burrow', 8, 10, false); D.place(8, 10, 'down'); D.tint(MIDDAY); D.cam.zoom = baseZoom(D) * 0.85; D.legs = null; }, f: (D, t) => v6Bag(D, t) };

for (const k of ['v6Night', 'v6Race', 'v6Day', 'v6Bag']) S6[k].dur = S6[k].beats * B;
