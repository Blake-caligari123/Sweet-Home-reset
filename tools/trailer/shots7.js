// Cinematic storybook trailer: "The Day the Colour Left" (64 s). Times in seconds.
const S7 = window.SHOTS;
const C7_DUR = 64;

// ---- cinematic layer
let c7Grain = null;
function c7GrainURL() {
  if (c7Grain) return c7Grain;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const im = g.createImageData(256, 256);
  let s = 99; for (let i = 0; i < im.data.length; i += 4) { s = (s * 16807) % 2147483647; const v = s % 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); c7Grain = c.toDataURL(); return c7Grain;
}
function c7Cine(D, { fadeIn = 0, fadeOut = 0 } = {}) {
  const css = D.el('c7css', (e) => { e.style.display = 'none'; const st = document.createElement('style'); st.textContent = `#tr .story{font-family:Caladea,'DejaVu Serif',serif;font-style:italic;color:#fff8ec;text-align:center;white-space:normal;line-height:1.15;text-shadow:0 0 calc(var(--u)*0.8) rgba(20,10,5,.75),0 calc(var(--u)*0.12) calc(var(--u)*0.2) rgba(0,0,0,.6)}`; document.head.append(st); });
  const g = D.layer('grain', `background-image:url(${c7GrainURL()});mix-blend-mode:overlay;pointer-events:none`, 0.09);
  g.style.backgroundPosition = `${Math.floor(D.hash(D.frameNo) * 256)}px ${Math.floor(D.hash(D.frameNo + 7) * 256)}px`;
  g.style.zIndex = 50;
  D.layer('vig', 'background:radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(20,10,5,.55) 100%)', 1).style.zIndex = 45;
  if (!D.vertical) {
    const h = (D.vh - D.vw / 2.39) / 2;
    const top = D.el('lbT', (e) => { e.style.cssText += `;width:${D.vw}px;height:${h}px;background:#000;z-index:55`; }); D.place2(top, 0, 0, { ax: 0, ay: 0 });
    const bot = D.el('lbB', (e) => { e.style.cssText += `;width:${D.vw}px;height:${h}px;background:#000;z-index:55`; }); D.place2(bot, 0, D.vh, { ax: 0, ay: 1 });
  }
  if (fadeIn || fadeOut) D.layer('black', 'background:#000', Math.max(fadeIn, fadeOut)).style.zIndex = 60;
}
function c7Text(D, id, txt, t0, t1, { y = 0.5, size = 2.0 } = {}) {
  const t = D.t; if (t < t0 || t > t1) return;
  const e = D.el(id, (e) => { e.className = 'o story'; e.style.fontSize = size * D.U() * (D.vertical ? 1.15 : 1) + 'px'; e.style.width = D.vw * (D.vertical ? 0.86 : 0.8) + 'px'; e.textContent = txt; });
  const a = D.clamp((t - t0) / 0.7, 0, 1), b = D.clamp((t1 - t) / 0.6, 0, 1);
  D.place2(e, D.vw / 2, D.vh * y + (1 - D.E.out(a)) * D.U() * 0.8, { o: Math.min(D.E.inOut(a), b) });
}
function c7Motes(D, id, n, { x0 = 0, x1 = 1, y0 = 0, y1 = 1, colour = '255,240,200', size = 0.22, speed = 0.02 } = {}) {
  const t = D.t, u = D.U();
  for (let i = 0; i < n; i++) {
    const e = D.el(`${id}${i}`, (e) => { const s = u * size * (0.5 + D.hash(i + 11)); e.className = 'o dot'; e.style.width = e.style.height = s + 'px'; e.style.background = `rgba(${colour},.9)`; e.style.boxShadow = `0 0 ${s * 2}px rgba(${colour},.8)`; });
    const fx = (D.hash(i * 3.1) + t * speed * (0.5 + D.hash(i))) % 1, fy = (D.hash(i * 7.7) + Math.sin(t * 0.6 + i) * 0.03 - t * speed * 0.3 * D.hash(i + 2) + 10) % 1;
    D.place2(e, D.vw * (x0 + (x1 - x0) * fx), D.vh * (y0 + (y1 - y0) * fy), { o: 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + i)) });
  }
}
function c7Beam(D, o) { D.layer('beam', 'background:linear-gradient(115deg, rgba(255,230,170,0) 20%, rgba(255,230,170,.32) 32%, rgba(255,230,170,0) 42%, rgba(255,230,170,0) 52%, rgba(255,230,170,.22) 60%, rgba(255,230,170,0) 70%);mix-blend-mode:screen', o); }
function c7Leaves(D, n, t) {
  const u = D.U();
  for (let i = 0; i < n; i++) {
    const e = D.el('lf' + i, (e) => { const s = u * (0.9 + D.hash(i + 4) * 1.2); e.style.cssText += `;width:${s}px;height:${s * 0.55}px;border-radius:50% 0 50% 0;background:${['#c86b3c', '#e3a33a', '#7fa860', '#d98a4e'][i % 4]};filter:blur(${1 + D.hash(i) * 3}px)`; });
    const k = (D.hash(i * 5.3) + t * (0.08 + D.hash(i) * 0.06)) % 1;
    D.place2(e, D.vw * (1.1 - k * 1.3), D.vh * (D.hash(i * 2.2) * 0.8 + k * 0.3) + Math.sin(t * 2 + i) * u, { r: t * 90 * (D.hash(i) - 0.5) * 4 });
  }
}

function c7Segs(D, t, segs) {
  for (let i = 0; i < segs.length; i++) {
    const [s0, s1, setup, f] = segs[i];
    if (t < s1 || i === segs.length - 1) { if (setup) D.once('c7s' + i, () => setup(D)); D.cam.dx = 0; f(D, t, s0, s1); return; }
  }
}
const c7Tex = (D) => (D.vertical ? 1.2 : 1);

function c7(D, t) {
  resetFx(D);
  const V = D.vertical, p = D.puff, bz = baseZoom(D);
  const lowY = V ? 0.78 : 0.76;
  c7Segs(D, t, [
    // 1. Once upon a time…
    [0, 7.5, null, (D, t) => {
      D.fx.hide = true;
      D.cam.x = D.lerp(110, 300, D.E.inOut(t / 7.5)); D.cam.y = 135; D.cam.zoom = bz * (V ? 0.8 : 0.6); D.cam.clampMap = false; D.cam.ease = 1;
      D.canvasFilter('saturate(1.1) contrast(1.05) sepia(0.12)');
      c7Motes(D, 'm1', 26, { colour: '255,236,190', speed: 0.015 });
      c7Leaves(D, 7, t);
      c7Text(D, 'tx1', 'In the little town of Hollowfern,', 1.0, 7.2, { y: V ? 0.4 : 0.44, size: 2.2 });
      c7Text(D, 'tx2', 'everything had its place.', 3.4, 7.2, { y: V ? 0.48 : 0.56, size: 2.2 });
      c7Cine(D, { fadeIn: 1 - D.clamp(t / 1.4, 0, 1), fadeOut: D.clamp((t - 7.1) / 0.4, 0, 1) });
    }],
    // 2. Puff, asleep in a sunbeam
    [7.5, 16.3, (D) => { D.cam.clampMap = true; D.cam.x = null; D.cam.y = null; D.visit('burrow', 5, 8, true); D.hideMess(); D.place(5, 8, 'down'); D.tint(7 * 60); D.cam.zoom = bz * 3; D.cam.dy = -3; D.cam.snap = true; D.W.follow(p.fx, p.fy, true); D.cam.snap = false; }, (D, t, t0) => {
      D.cam.ease = 0.1; D.cam.dy = -3;
      const lt = t - t0;
      let z = bz * D.lerp(3.0, 3.5, D.E.inOut(lt / 6.5));
      D.canvasFilter('saturate(1.08) contrast(1.04)');
      c7Beam(D, 0.9); c7Motes(D, 'm2', 22, { x0: 0.15, x1: 0.85, y0: 0.1, y1: 0.9, colour: '255,240,200', speed: 0.01, size: 0.18 });
      if (t < 11.3) { D.fx.closed = true; breathe(D, t, 0.035, 1.8); }
      else if (t < 14.3) { D.fx.lift = hop(t, 11.3, 4, 0.3); if (t > 12.6 && t < 12.72) D.fx.closed = true; D.cue('wake', 11.3, () => D.sfx('boing', { pitch: 1.3, gain: 0.4 })); }
      else {
        // the sneeze wind-up: a nose twitch, then ah… ah…
        z = bz * D.lerp(3.5, 4.1, D.E.inOut((t - 14.3) / 2));
        if (t < 15.8) { D.fx.sx = 1 + Math.sin(t * 40) * 0.02 * D.clamp((t - 14.4) / 0.4, 0, 1); D.fx.closed = t > 15.2; }
        else { const q = t < 16.04 ? D.E.out((t - 15.8) / 0.2) * 0.6 : 0.6 + 0.4 * D.E.out((t - 16.04) / 0.22); D.fx.sy = 1 + 0.18 * q; D.fx.sx = 1 - 0.1 * q; D.fx.lift = 3 * q; D.fx.closed = true; }
      }
      D.cam.zoom = z;
      c7Text(D, 'tx3', 'Puff the dust bunny kept everything just so.', 8.4, 13.6, { y: lowY, size: 1.9 });
      c7Cine(D, { fadeIn: 1 - D.clamp((t - t0) / 0.5, 0, 1) });
    }],
    // 3. ACHOO — the colour leaves
    [16.3, 17.7, null, (D, t, t0) => {
      const lt = t - t0;
      D.once('achoo', () => { sneezeBurst(D, p.fx, p.fy - 14, 90); D.dc = { x: p.fx / 16, y: p.fy / 16 - 0.5 }; D.sfx('sneeze', { pre: 0.5 }); D.sfx('scratch', { at: 0.1 }); });
      D.stepMs = (1000 / 60) * 0.3;
      const r = D.E.out(lt / 1.3) * 26; D.radial(D.dc.x, D.dc.y, r, 0, 4, 2.5); D.revealMess(D.dc.x, D.dc.y, r);
      const [sx, sy] = squash(t, t0, 0.32, { freq: 10, decay: 4 }); D.fx.sx = sx; D.fx.sy = sy;
      D.cam.zoom = bz * D.lerp(4.1, 1.3, D.E.out(lt / 1.1)); D.cam.dy = -3 * (1 - D.E.out(lt / 1.1)); D.cam.ease = 0.3;
      D.cam.shake = punch(t, t0, 20, 3);
      D.flash('fla', t0, 0.25, '#fff', 0.6);
      D.canvasFilter('');
      c7Cine(D);
    }],
    [17.7, 19.3, (D) => { D.cam.x = 200; D.cam.y = 130; D.cam.clampMap = false; D.visit('yard', 12, 6, true); D.place(12, 6); D.tint(7 * 60); D.cam.zoom = bz * (V ? 0.75 : 0.6); D.cam.snap = true; D.W.follow(0, 0, true); D.cam.snap = false; D.sfx('whoosh', { gain: 0.5 }); }, (D, t, t0) => {
      D.fx.hide = true; D.cam.ease = 1;
      D.cam.x = D.lerp(200, 230, (t - t0) / 1.6);
      const r = D.E.inOut((t - t0) / 1.5) * 34; D.radial(12.5, 5, r, 0, 4, 3);
      c7Cine(D);
    }],
    [19.3, 21.2, (D) => { D.cam.x = 240; D.cam.y = 170; D.visit('square', 14, 12, true); D.place(14, 12); D.tint(7 * 60); D.cam.zoom = bz * (V ? 0.7 : 0.55); D.cam.snap = true; D.W.follow(0, 0, true); D.cam.snap = false; }, (D, t, t0) => {
      D.fx.hide = true; D.cam.ease = 1;
      D.cam.x = D.lerp(240, 220, (t - t0) / 1.9);
      const r = D.E.inOut((t - t0) / 1.6) * 44; D.radial(0, 11, r, 0, 4, 3);
      D.canvasFilter(`saturate(${D.lerp(1, 0.7, (t - t0) / 1.9)})`);
      c7Text(D, 'tx4', '…and the colour went with it.', t0 + 0.2, t1(t0, 1.9), { y: 0.5, size: 2.3 });
      c7Cine(D, { fadeOut: D.clamp((t - t0 - 1.6) / 0.3, 0, 1) });
    }],
    // 4. One small bunny. One very big tidy.
    [21.2, 27.6, (D) => { D.cam.clampMap = true; D.cam.x = null; D.cam.y = null; D.visit('burrow', 8, 8, false); D.place(8, 8, 'down'); D.tint(9 * 60); D.cam.zoom = bz * 1.3; D.cam.snap = true; D.W.follow(p.fx, p.fy, true); D.cam.snap = false; D.legs = null; }, (D, t, t0) => {
      const lt = t - t0; D.cam.ease = 0.08;
      D.canvasFilter('saturate(0.9) contrast(1.06)');
      D.cam.zoom = bz * D.lerp(1.3, 2.3, D.E.inOut(lt / 6.4)); D.cam.dy = -6 * D.E.inOut(lt / 6.4);
      if (lt < 0.9) p.dir = 'down'; else if (lt < 1.8) p.dir = 'left'; else if (lt < 2.7) p.dir = 'right'; else p.dir = 'down';
      if (lt >= 3.0) { p.pose = 'swing'; const [sx, sy] = squash(t, t0 + 3.0, 0.14); D.fx.sx = sx; D.fx.sy = sy; D.cue('grab', t0 + 3.0, () => D.sfx('land')); }
      c7Beam(D, D.clamp((lt - 3.2) / 2.5, 0, 1) * 0.7);
      c7Motes(D, 'm4', 16, { colour: '220,220,220', speed: 0.01, size: 0.18 });
      c7Text(D, 'tx5', 'One small bunny.', t0 + 0.8, t0 + 6.2, { y: V ? 0.26 : 0.3, size: 2.3 });
      c7Text(D, 'tx6', 'One very big tidy.', t0 + 3.2, t0 + 6.2, { y: V ? 0.33 : 0.4, size: 2.3 });
      c7Cine(D, { fadeIn: 1 - D.clamp(lt / 0.4, 0, 1) });
    }],
    // 5. The burrow comes back
    [27.6, 33, null, (D, t, t0) => {
      const times = [28.7, 29.6, 30.4];
      D.legs ??= v4Route(D, D.messList(), 3, { x: p.fx, y: p.fy });
      D.canvasFilter('saturate(1.05) contrast(1.04)');
      if (t < 31.2) { v4Run(D, t, 'c7r', D.legs, times, { tStart: t0 }); D.cam.zoom = bz * D.lerp(1.6, 1.2, D.E.inOut((t - t0) / 3.6)); D.cam.ease = 0.1; }
      else {
        D.once('wave', () => { D.wc = { x: p.fx / 16, y: p.fy / 16 }; D.sfx('sweep'); D.sfx('sparkle'); for (let i = 0; i < 8; i++) D.W.sparkleBurst(Math.round(D.wc.x) - 2 + (i % 4), Math.round(D.wc.y) - 1 + (i >> 2), 14); });
        const lt = t - 31.2; D.stepMs = lt < 0.9 ? (1000 / 60) * 0.35 : 1000 / 60;
        const r = (lt < 0.9 ? 0.25 * lt / 0.9 : 0.25 + 0.75 * D.E.out((lt - 0.9) / 0.9)) * 40; D.radial(D.wc.x, D.wc.y, r, 4, 0, 3); D.sweepMess(D.wc.x, D.wc.y, r);
        p.pose = 'idle'; p.dir = 'down'; D.fx.lift = hop(t, 32.2, 8, 0.34);
        D.cam.zoom = bz * D.lerp(1.2, V ? 0.9 : 0.8, D.E.inOut(lt / 1.8));
        c7Beam(D, D.clamp(lt / 1.2, 0, 1) * 0.8);
        D.flash('flw', 31.2, 0.3, '#fff8ec', 0.5);
      }
      c7Cine(D);
    }],
    // 6. The bakery
    [33, 38, (D) => { D.visit('bakery', 10, 11, false); D.place(10, 11, 'up'); D.tint(10 * 60); D.cam.x = 164; D.cam.y = 148; D.cam.zoom = bz * (V ? 0.95 : 1.05); D.legs = null; D.sfx('whoosh', { gain: 0.4 }); }, (D, t, t0) => {
      D.cam.ease = 0.08; D.cam.zoom = bz * ((V ? 0.95 : 1.05) + 0.12 * D.E.inOut((t - t0) / 5));
      D.canvasFilter('saturate(1.05) contrast(1.04)');
      if (t >= 34.4) {
        D.once('bw', () => { D.sfx('sparkle'); });
        const r = D.E.out((t - 34.4) / 1.6) * 30; D.radial(10.5, 9.5, r, 4, 0, 3); D.sweepMess(10.5, 9.5, r);
        for (let i = 0; i < 7; i++) D.cue('c7ck' + i, 35.0 + i * 0.22, () => { D.burst('sparkle', CAKES[i], 132, 10, ['#fff8ec', '#f6e3a1', '#f4c2a8'], 40, 10); D.burst('sparkle', CAKES[i], 148, 10, ['#fff8ec', '#f7d2bf'], 40, 10); D.sfx('pop', { pitch: semis(PENTA[i + 2]), gain: 0.35 }); });
        D.fx.lift = hop(t, 35.4, 7, 0.32);
      }
      c7Motes(D, 'm6', 14, { colour: '255,236,190', speed: 0.012, size: 0.18 });
      c7Cine(D);
    }],
    // 7. The Glimmerwell at golden hour
    [38, 44, (D) => { D.cam.clampMap = false; D.visit('square', 14, 13, true); D.colourAll(0); D.place(14, 13, 'up'); D.tint(18 * 60); D.cam.x = 240; D.cam.y = 165; D.cam.zoom = bz * 1.3; }, (D, t, t0) => {
      const lt = t - t0; D.cam.ease = 0.1;
      D.cam.zoom = bz * D.lerp(1.3, V ? 0.8 : 0.7, D.E.inOut(lt / 6)); D.cam.y = D.lerp(160, 175, lt / 6);
      D.canvasFilter('saturate(1.12) contrast(1.05) sepia(0.15)');
      const at = 39.4;
      if (t >= at) {
        D.radial(15, 10, D.E.out((t - at) / 2.2) * 30, 4, 0, 3);
        if (t - at < 2.2 && D.frameNo % 2 === 0) D.burst('sparkle', 240 + (D.rnd() - 0.5) * 4, 146, 6, ['#a9bfd6', '#c1d1e2', '#fff8ec', '#f6e3a1'], 70, 110);
        D.flash('flf', at, 0.35, '#fff3d6', 0.55);
      }
      D.cue('wat', at, () => { D.sfx('water'); D.burst('sparkle', 240, 150, 50, ['#a9bfd6', '#fff8ec', '#f6e3a1'], 110, 60); });
      c7Motes(D, 'm7', 20, { colour: '255,214,150', speed: 0.015, size: 0.2 });
      c7Text(D, 'tx7', 'Bring Hollowfern back to life.', 40.3, 43.7, { y: lowY, size: 2.2 });
      c7Cine(D);
    }],
    // 8. Golden-hour walk
    [44, 50, (D) => { D.cam.clampMap = true; D.cam.x = null; D.cam.y = null; D.visit('yard', 12, 6, true); D.place(12, 6, 'down'); D.tint(18 * 60 + 30); D.walkTo(21, 9); D.cam.zoom = bz * 1.05; }, (D, t, t0) => {
      D.cam.ease = 0.08; D.cam.zoom = bz * D.lerp(1.15, 0.95, D.E.inOut((t - t0) / 6));
      D.canvasFilter('saturate(1.12) contrast(1.05) sepia(0.18)');
      c7Leaves(D, 9, t); c7Motes(D, 'm8', 18, { colour: '255,214,150', speed: 0.02, size: 0.2 });
      c7Text(D, 'tx8', 'Explore every cosy corner.', 45.0, 49.5, { y: lowY, size: 2.2 });
      c7Cine(D, { fadeOut: D.clamp((t - 49.6) / 0.4, 0, 1) });
    }],
    // 9. The promise: friends on the hill at dusk (illustration)
    [50, 56, null, (D, t, t0) => {
      const lt = t - t0, u = D.U(), W = D.vw, H = D.vh;
      D.fx.hide = true;
      const sc = D.el('dusk', (e) => {
        e.style.cssText += `;width:${W}px;height:${H}px`;
        const stars = Array.from({ length: 60 }, (_, i) => `<circle cx="${D.hash(i) * 100}" cy="${D.hash(i + 99) * 45}" r="${0.08 + D.hash(i + 5) * 0.18}" fill="#fff8ec" opacity="${0.4 + D.hash(i + 3) * 0.6}"/>`).join('');
        e.innerHTML = `<svg viewBox="0 0 100 ${100 * H / W}" width="${W}" height="${H}" preserveAspectRatio="none"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2347"/><stop offset=".55" stop-color="#a0577a"/><stop offset=".8" stop-color="#ee9a6c"/><stop offset="1" stop-color="#f7c88f"/></linearGradient></defs>
        <rect width="100" height="${100 * H / W}" fill="url(#sky)"/>${stars}<circle cx="80" cy="${12 * H / W * 1.0}" r="3.2" fill="#fff3d6"/><circle cx="80" cy="${12 * H / W}" r="5.5" fill="#fff3d6" opacity=".15"/>
        <path d="M0 ${70 * H / W} Q30 ${58 * H / W} 60 ${66 * H / W} T100 ${62 * H / W} V${100 * H / W} H0Z" fill="#5b3f5e"/>
        <path d="M0 ${80 * H / W} Q40 ${68 * H / W} 100 ${78 * H / W} V${100 * H / W} H0Z" fill="#3a2a40"/></svg>`;
      });
      D.place2(sc, 0, 0, { ax: 0, ay: 0 });
      // the front hill is a quadratic curve (0,.80H)-(.4W,.68H)-(W,.78H); find its height at x
      const hillY = (x) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; const xm = 2 * m * (1 - m) * 0.4 + m * m; if (xm < x) lo = m; else hi = m; } const s = lo; return H * ((1 - s) * (1 - s) * 0.8 + 2 * s * (1 - s) * 0.68 + s * s * 0.78); };
      for (let i = 0; i < 6; i++) {
        const ti = t0 + 0.6 + i * 0.45; if (t < ti) continue;
        const x = (V ? 0.18 : 0.3) + i * (V ? 0.13 : 0.09);
        const e = D.el('sil' + i, (e) => { e.innerHTML = `<svg viewBox="0 0 100 90" width="${u * (V ? 4.4 : 4.2)}" height="${u * (V ? 4 : 3.8)}"><g fill="#21172a">${SIL[i]}</g></svg>`; });
        D.place2(e, W * x, hillY(x) - u * 0.2 + Math.sin(t * 2.2 + i) * u * 0.12, { s: D.E.back((t - ti) / 0.35), ax: 0.5, ay: 1 });
        D.cue('sp' + i, ti, () => D.sfx('pop', { pitch: semis(PENTA[i + 3]), gain: 0.3 }));
      }
      const px = V ? 0.08 : 0.2;
      D.domPuff('dpuff', W * px + (V ? u * 1.5 : 0), hillY(px) + u * 0.1, u * (V ? 5.2 : 5.2), { frame: Math.floor(t * 6) % 6, sy: 1 + Math.sin(t * 2.4) * 0.02 });
      document.querySelector('#tr .spr').style.filter = 'brightness(0.82) sepia(0.25) saturate(1.1)';
      c7Motes(D, 'ff', 22, { y0: 0.45, y1: 0.85, colour: '255,232,140', speed: 0.01, size: 0.25 });
      c7Text(D, 'tx9', 'New friends.', t0 + 1.0, t0 + 5.8, { y: V ? 0.2 : 0.24, size: 2.3 });
      c7Text(D, 'tx10', 'Four seasons.', t0 + 2.2, t0 + 5.8, { y: V ? 0.27 : 0.33, size: 2.3 });
      c7Text(D, 'tx11', 'One cosy town.', t0 + 3.4, t0 + 5.8, { y: V ? 0.34 : 0.42, size: 2.3 });
      c7Cine(D, { fadeIn: 1 - D.clamp(lt / 0.5, 0, 1), fadeOut: D.clamp((lt - 5.6) / 0.4, 0, 1) });
    }],
    // 10. Title
    [56, 64, (D) => { D.cam.clampMap = true; D.cam.x = null; D.cam.y = null; D.visit('burrow', 9, 8, true); D.hideMess(); D.place(9, 8); D.tint(MIDDAY); D.cam.zoom = bz * 0.9; }, (D, t, t0) => {
      D.fx.hide = true;
      D.canvasFilter('blur(6px) saturate(1.1)');
      D.layer('dim', 'background:rgba(249,237,194,.45)');
      logoCard(D, t, { inAt: t0 + 0.6, puffT: t0 + 1.4 });
      D.particles('lgp', D.vw / 2, D.vh * 0.55, t0 + 0.6, { n: 60, speed: 1100, grav: 400, life: 2, size: 1.3, shape: 'star', colours: ['#fff8ec', '#ffe066', '#a9cda0', '#f4c2a8'] });
      D.cue('lgs', t0 + 0.6, () => { D.sfx('sparkle'); D.sfx('boing', { pitch: 0.8, gain: 0.5 }); });
      c7Motes(D, 'm10', 20, { colour: '255,240,200', speed: 0.01, size: 0.2 });
      c7Cine(D, { fadeIn: 1 - D.clamp((t - t0) / 0.6, 0, 1), fadeOut: D.clamp((t - 63) / 1, 0, 1) });
    }]
  ]);
}
function t1(t0, d) { return t0 + d; }
S7.c7 = { dur: C7_DUR, setup(D) { D.v3 = false; D.visit('yard', 12, 6, true); D.place(12, 6); D.tint(7 * 60); D.cam.zoom = baseZoom(D) * 0.6; D.cam.x = 110; D.cam.y = 135; D.cam.clampMap = false; }, f: (D, t) => c7(D, t) };
