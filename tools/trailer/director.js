// Trailer director: runs inside the game page. Camera, Puff squash/stretch, colour control,
// trailer-only effects and an immediate-mode DOM overlay. Never shipped with the game.
(() => {
  const G = window.__game, W = G.world, T = 16, FULL = 4;
  const D = (window.D = { G, W, T, sfxLog: [], t: 0 });
  const BASE = '/Sweet-Home-reset/';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  D.clamp = clamp; D.lerp = lerp;
  // ---- easing
  const E = (D.E = {
    out: (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3),
    inOut: (k) => { k = clamp(k, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    back: (k) => { k = clamp(k, 0, 1); const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
    elastic: (k) => { k = clamp(k, 0, 1); if (k === 0 || k === 1) return k; return Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI) / 3) + 1; },
    bounce: (k) => { k = clamp(k, 0, 1); const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375; }
  });
  let seed = 7; const rnd = (D.rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647));
  const hash = (D.hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); });

  // ---- freeze the game's own systems that would fight the director
  G.sound.enabled = false; G.sound.musicOn = false; try { G.sound.stopMusic(); } catch {}
  G.clock.advance = () => [];
  G.say = () => {}; G.banner = () => {}; G.onboard = () => {}; G.offerClip = () => {};
  G.save = async () => {};
  W.setHighlight = () => {}; W.highlight.clear();
  W.showMarker = () => {};
  document.querySelector('#ui').style.visibility = 'hidden';
  Math.random = rnd; // deterministic particles

  // ---- camera
  D.cam = { x: null, y: null, zoom: 1, ease: 0.2, snap: false, shake: 0, clampMap: true, dx: 0, dy: 0 };
  W.follow = function (px, py, snap) {
    if (!this.area) return;
    const c = D.cam; const s = this.scale * c.zoom;
    this.stage.scale.set(s);
    const { width, height } = this.app.screen;
    const vw = width / s, vh = height / s, mw = this.area.w * T, mh = this.area.h * T;
    const tx = (c.x ?? px) + c.dx, ty = (c.y ?? py) + c.dy;
    let cx = tx - vw / 2, cy = ty - vh / 2;
    if (c.clampMap) { cx = mw <= vw ? (mw - vw) / 2 : clamp(cx, 0, mw - vw); cy = mh <= vh ? (mh - vh) / 2 : clamp(cy, 0, mh - vh); }
    const hard = snap || c.snap;
    this.cam.x = hard ? cx : this.cam.x + (cx - this.cam.x) * c.ease;
    this.cam.y = hard ? cy : this.cam.y + (cy - this.cam.y) * c.ease;
    const sh = c.shake ? [(hash(D.frameNo * 1.7) - 0.5) * 2 * c.shake, (hash(D.frameNo * 3.1 + 9) - 0.5) * 2 * c.shake] : [0, 0];
    this.stage.position.set(Math.round(-this.cam.x * s + sh[0]), Math.round(-this.cam.y * s + sh[1]));
  };

  // ---- Puff
  D.fx = { sx: 1, sy: 1, lift: 0, closed: false, hide: false, rot: 0 };
  const drawPuff = W.drawPuff.bind(W);
  W.drawPuff = function (v, dt) {
    drawPuff(v, dt);
    const f = D.fx, p = this.puff;
    if (f.closed && this.sprites) { const fr = this.sprites.frames('puff_blink_down'); if (fr) p.texture = fr[1]; }
    p.scale.set(p.scale.x * f.sx, p.scale.y * f.sy);
    p.position.y -= f.lift; p.rotation = f.rot;
    p.visible = !f.hide; this.puffShadow.visible = !f.hide;
    this.puffShadow.scale.set(1 - Math.min(0.5, f.lift / 30));
  };
  const P = (D.puff = G.puff);
  D.place = (tx, ty, dir = 'down') => { Object.assign(P, { fx: tx * T + T / 2, fy: ty * T + 12, x: tx, y: ty, path: [], action: null, pose: 'idle', dir }); };
  D.walkTo = (tx, ty) => window.__town.tapTile(tx, ty);
  D.puffScreen = (up = 14) => W.toScreen(P.fx, P.fy - up);
  D.tileScreen = (x, y) => W.toScreen(x * T + T / 2, y * T + T / 2);

  // ---- areas, time of day, colour
  D.visit = (id, x, y, colour = true) => window.__town.visit(id, x, y, colour);
  D.tint = (min) => W.setTint(min);
  const tiles = () => { const a = W.area; return a ? a.w * a.h : 0; };
  D.colourField = (fn) => {
    const m = G.mess, a = W.area; const all = [];
    for (let i = 0; i < tiles(); i += 1) { const v = clamp(fn(i % a.w, Math.floor(i / a.w)), 0, FULL); m.colour[i] = Math.round(v); W.shownColour[i] = v; all.push(i); }
    W.redrawTiles(all);
  };
  D.colourAll = (v) => D.colourField(() => v);
  // radial: colour inside radius r (tiles) around cx,cy, soft edge
  D.radial = (cx, cy, r, inside = FULL, outside = 0, soft = 2) => D.colourField((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); const k = clamp((r - d) / soft, 0, 1); return outside + (inside - outside) * k; });

  // ---- mess
  let backup = null;
  D.hideMess = () => { const m = G.mess; backup = { type: m.type.slice(), hp: m.hp.slice(), item: m.item.slice() }; m.type.fill(0); for (let i = 0; i < tiles(); i += 1) W.syncMess(i); };
  D.revealMess = (cx, cy, r, puff = true) => {
    if (!backup) return; const m = G.mess, a = W.area;
    for (let i = 0; i < tiles(); i += 1) {
      if (!backup.type[i] || m.type[i]) continue; const x = i % a.w, y = Math.floor(i / a.w);
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > r) continue;
      m.type[i] = backup.type[i]; m.hp[i] = backup.hp[i]; m.item[i] = backup.item[i]; backup.type[i] = 0; W.syncMess(i);
      if (puff) W.dustPuff(x, y);
    }
  };
  D.messList = () => window.__town.mess();
  D.clean = (x, y, burst = 10) => {
    const m = G.mess; let res = null;
    for (const tool of ['duster', 'hands', 'sponge', 'rake', 'broom', 'mop', 'cloth']) { res = m.hit(x, y, tool, 9); if (res.ok) break; }
    if (!res || !res.ok) { m.type[y * W.area.w + x] = 0; W.syncMess(y * W.area.w + x); res = { changed: m.ripple(x, y), cleared: true }; }
    W.syncMess(y * W.area.w + x); for (const c of res.changed) W.syncMess(c);
    W.colourChanged(res.changed);
    W.dustPuff(x, y); W.sparkleBurst(x, y, burst);
    return res;
  };
  // Wipe every mess tile the colour has reached (for the drop)
  D.sweepMess = (cx, cy, r) => {
    const m = G.mess, a = W.area;
    for (let i = 0; i < tiles(); i += 1) {
      if (!m.type[i]) continue; const x = i % a.w, y = Math.floor(i / a.w);
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > r) continue;
      m.type[i] = 0; W.syncMess(i); W.sparkleBurst(x, y, 6);
    }
  };
  D.burst = (kind, wx, wy, n, colours, speed, gravity) => W.particles.burst(kind, wx, wy, n, colours, speed, gravity);

  // ---- sound cue log (times are shot-relative seconds)
  const fired = new Set();
  D.once = (key, fn) => { if (fired.has(key)) return; fired.add(key); fn(); };
  D.sfx = (name, opt = {}) => D.sfxLog.push({ t: D.t, name, ...opt });
  D.cue = (key, t, fn) => { if (D.t >= t) D.once(key, fn); };

  // ---- DOM overlay (immediate mode)
  const css = document.createElement('style');
  css.textContent = `
  #tr{position:fixed;inset:0;z-index:1000;pointer-events:none;overflow:hidden;font-family:Inter,sans-serif;color:#534239}
  #tr .o{position:absolute;left:0;top:0;will-change:transform;white-space:nowrap}
  #tr .stk{background:#fff8ec;border:calc(var(--u)*0.55) solid #8a6e5e;border-radius:calc(var(--u)*2.2);box-shadow:0 calc(var(--u)*0.7) 0 #8a6e5e;padding:calc(var(--u)*1) calc(var(--u)*2.2);font-weight:900;letter-spacing:-0.01em}
  #tr .big{font-weight:900;color:#fff8ec;-webkit-text-stroke:calc(var(--u)*0.9) #534239;paint-order:stroke fill;letter-spacing:-0.02em;text-shadow:0 calc(var(--u)*0.8) 0 #534239}
  #tr .big .hl{color:#f6e3a1}
  #tr .ch{display:inline-block;white-space:pre}
  #tr .tag{background:rgba(83,66,57,.82);color:#fff8ec;font-weight:800;letter-spacing:.16em;border-radius:999px;padding:calc(var(--u)*.45) calc(var(--u)*1.2)}
  #tr .spr{image-rendering:pixelated;background-repeat:no-repeat}
  #tr .dot{border-radius:50%}
  `;
  document.head.append(css);
  const root = document.createElement('div'); root.id = 'tr'; document.body.append(root);
  const U = () => Math.min(innerWidth, innerHeight) / 30; // layout unit
  root.style.setProperty('--u', U() + 'px');
  D.U = U; D.vw = innerWidth; D.vh = innerHeight; D.vertical = innerHeight > innerWidth;
  const els = new Map(); let touched = new Set();
  D.el = (id, make) => {
    let e = els.get(id);
    if (!e) { e = document.createElement('div'); e.className = 'o'; make?.(e); root.append(e); els.set(id, e); }
    touched.add(id); e.style.display = '';
    return e;
  };
  D.place2 = (e, x, y, { s = 1, sx = s, sy = s, r = 0, o = 1, ax = 0.5, ay = 0.5 } = {}) => {
    e.style.transform = `translate(${x}px,${y}px) translate(${-ax * 100}%,${-ay * 100}%) rotate(${r}deg) scale(${sx},${sy})`;
    e.style.transformOrigin = `${ax * 100}% ${ay * 100}%`;
    e.style.opacity = o;
  };
  D.beginFrame = () => { touched = new Set(); };
  D.endFrame = () => { for (const [id, e] of els) if (!touched.has(id)) e.style.display = 'none'; };

  // Text: anim 'pop' | 'stamp' | 'words' | 'type' ; crumble at tc (letters fall left→right)
  D.text = (id, txt, o) => {
    const { x, y, size = 2.2, t0 = 0, t1 = 1e9, cls = 'stk', anim = 'pop', crumble = null, crumbleDur = 0.6, r = 0, html = null, outDur = 0.18, ax = 0.5, ay = 0.5, beat = 0.2143 } = o;
    const t = D.t; if (t < t0 || t > t1 + outDur) return null;
    const e = D.el(id, (e) => {
      e.className = 'o ' + cls; e.style.fontSize = size * U() + 'px';
      if (html) e.innerHTML = html;
      else if (anim === 'words') e.innerHTML = txt.split(' ').map((w) => `<span class="ch">${w} </span>`).join('');
      else e.innerHTML = [...txt].map((c) => `<span class="ch">${c}</span>`).join('');
    });
    const k = t - t0; let s = 1, rr = r, op = 1;
    if (anim === 'pop') s = E.back(k / 0.28);
    if (anim === 'stamp') { s = k < 0.16 ? lerp(2.4, 0.92, E.out(k / 0.16)) : lerp(0.92, 1, E.out((k - 0.16) / 0.12)); op = clamp(k / 0.06, 0, 1); }
    if (anim === 'drop') { s = 1; }
    if (t > t1) { const q = (t - t1) / outDur; s *= 1 - E.out(q) * 0.6; op *= 1 - q; }
    const kids = e.children;
    if (anim === 'words') for (let i = 0; i < kids.length; i += 1) { const q = (k - i * beat) / 0.22; kids[i].style.transform = `scale(${E.back(q)}) translateY(${(1 - E.out(q)) * 0.4}em)`; kids[i].style.opacity = q > 0 ? 1 : 0; }
    if (anim === 'type') { const n = Math.floor(k / 0.045); for (let i = 0; i < kids.length; i += 1) kids[i].style.visibility = i < n ? 'visible' : 'hidden'; }
    if (anim === 'drop') { const q = k / 0.5; const dy = (1 - E.bounce(q)) * -1.2; e.style.marginTop = dy * size * U() + 'px'; }
    if (crumble != null && t >= crumble) {
      for (let i = 0; i < kids.length; i += 1) {
        const st = crumble + (i / kids.length) * crumbleDur; const q = Math.max(0, t - st);
        const g = q * q * 900, vx = (hash(i) - 0.3) * 260 * q, rot = (hash(i + 50) - 0.5) * 540 * q;
        kids[i].style.transform = `translate(${vx}px,${g}px) rotate(${rot}deg) scale(${1 - Math.min(0.7, q * 1.2)})`;
        kids[i].style.opacity = q > 0 ? clamp(1 - q * 1.6, 0, 1) : 1;
      }
      e.style.background = e.style.borderColor = e.style.boxShadow = '';
      const q2 = clamp((t - crumble) / (crumbleDur + 0.2), 0, 1);
      if (cls.includes('stk')) { e.style.background = `rgba(255,248,236,${1 - q2})`; e.style.borderColor = `rgba(138,110,94,${1 - q2})`; e.style.boxShadow = `0 ${0.7 * U()}px 0 rgba(138,110,94,${1 - q2})`; }
    }
    D.place2(e, x * D.vw, y * D.vh, { s, r: rr, o: op, ax, ay });
    return e;
  };

  // DOM dust/sparkle particles (for overlays over the logo, crumbling text etc.)
  D.particles = (id, x0, y0, t0, { n = 24, spread = 1, speed = 500, grav = 900, life = 1, size = 1, colours = ['#fff8ec', '#e6dccd', '#cfc3b3'], up = 0.4, shape = 'dot' } = {}) => {
    const t = D.t - t0; if (t < 0 || t > life * 1.6) return;
    for (let i = 0; i < n; i += 1) {
      const e = D.el(`${id}_${i}`, (e) => { e.className = 'o ' + (shape === 'star' ? '' : 'dot'); if (shape === 'star') { e.textContent = '✦'; e.style.color = colours[i % colours.length]; e.style.fontSize = U() * size * (0.6 + hash(i + 3)) + 'px'; } else { const s = U() * size * (0.35 + hash(i + 3) * 0.7); e.style.width = e.style.height = s + 'px'; e.style.background = colours[i % colours.length]; } });
      const a = hash(i * 3.3 + t0) * Math.PI * 2 * spread - (spread < 1 ? Math.PI / 2 + Math.PI * spread : 0);
      const v = speed * (0.35 + hash(i * 7.7) * 0.9);
      const lifeI = life * (0.6 + hash(i * 1.9) * 0.6);
      const k = t / lifeI;
      const x = x0 + Math.cos(a) * v * t, y = y0 + (Math.sin(a) - up) * v * t + 0.5 * grav * t * t;
      D.place2(e, x, y, { s: 1 - 0.5 * clamp(k, 0, 1), o: clamp(1 - k, 0, 1) });
    }
  };

  // Persistent pieces
  D.alphaTag = (show = true) => {
    if (!show) return;
    const e = D.el('alphatag', (e) => { e.className = 'o tag'; e.style.fontSize = U() * 0.62 + 'px'; e.textContent = 'ALPHA FOOTAGE · WORK IN PROGRESS'; });
    if (D.vertical) D.place2(e, D.vw * 0.5, D.vh * (D.v3 ? 0.085 : 0.135), {}); else if (D.v3) D.place2(e, U() * 1.0, U() * 1.0, { ax: 0, ay: 0 }); else D.place2(e, D.vw - U() * 1.0, U() * 1.0, { ax: 1, ay: 0 });
  };
  // Colour meter: value 0..1
  D.meter = (v, { pulse = 0, show = 1 } = {}) => {
    if (show <= 0) return;
    const e = D.el('meter', (e) => {
      e.innerHTML = `<div class="mt" style="position:relative;background:#e9dcc4;border:${U() * 0.4}px solid #8a6e5e;border-radius:999px;box-shadow:0 ${U() * 0.4}px 0 #8a6e5e;overflow:hidden"><div class="mf" style="position:absolute;left:0;bottom:0;background:linear-gradient(var(--dir),#79b176,#e7cb69,#f0a986,#7fa3c9);"></div><div class="mg" style="position:absolute;inset:0;background:repeating-linear-gradient(var(--dir),transparent 0 ${U() * 0.9}px, rgba(255,255,255,.35) ${U() * 0.9}px ${U() * 1.1}px)"></div></div><div class="mi" style="position:absolute;font-size:${U() * 1.3}px">✨</div>`;
    });
    const mt = e.querySelector('.mt'), mf = e.querySelector('.mf'), mi = e.querySelector('.mi');
    const u = U();
    if (D.vertical) {
      mt.style.width = u * 1.3 + 'px'; mt.style.height = u * 14 + 'px'; mt.style.setProperty('--dir', '0deg');
      mf.style.width = '100%'; mf.style.height = clamp(v, 0, 1) * 100 + '%';
      mi.style.left = '50%'; mi.style.top = -u * 1.9 + 'px'; mi.style.transform = 'translateX(-50%)';
      D.place2(e, u * 1.9, D.vh * 0.42, { s: 1 + pulse * 0.25, o: show });
    } else {
      mt.style.width = u * 12 + 'px'; mt.style.height = u * 1.4 + 'px'; mt.style.setProperty('--dir', '90deg');
      mf.style.height = '100%'; mf.style.width = clamp(v, 0, 1) * 100 + '%';
      mi.style.left = -u * 1.9 + 'px'; mi.style.top = '50%'; mi.style.transform = 'translateY(-50%)';
      D.place2(e, u * 3.2, u * 1.6, { ax: 0, ay: 0, s: 1 + pulse * 0.25, o: show });
    }
    return e;
  };

  // Hi-res Puff sprite in the DOM (for logo/end card). frame: idle 0..5; closed eyes uses blink sheet
  D.domPuff = (id, x, y, h, { closed = false, frame = 0, sx = 1, sy = 1, o = 1, r = 0, grey = 0 } = {}) => {
    const e = D.el(id, (e) => { e.className = 'o spr'; });
    const fw = 144, fh = 168, k = h / fh;
    e.style.width = fw * k + 'px'; e.style.height = h + 'px';
    if (closed) { e.style.backgroundImage = `url(${BASE}sprites/puff_blink_down.png)`; e.style.backgroundSize = `${288 * k}px ${h}px`; e.style.backgroundPosition = `${-fw * k}px 0`; }
    else { e.style.backgroundImage = `url(${BASE}sprites/puff_idle_down.png)`; e.style.backgroundSize = `${864 * k}px ${h}px`; e.style.backgroundPosition = `${-fw * k * (frame % 6)}px 0`; }
    e.style.filter = grey ? `grayscale(${grey})` : '';
    D.place2(e, x, y, { sx, sy, o, r, ax: 0.5, ay: 1 });
    return e;
  };

  // Full-screen colour/black layers
  D.layer = (id, style, o = 1) => { const e = D.el(id, (e) => { e.style.cssText = 'position:absolute;inset:0;' + style; }); e.style.opacity = o; e.style.transform = ''; return e; };
  D.canvasFilter = (f) => { document.querySelector('#app canvas').style.filter = f || ''; };

  // ---- frame driver
  D.frameNo = 0;
  D.shot = null;
  D.run = (t) => { D.t = t; D.stepMs = 1000 / 60; D.beginFrame(); D.shot?.(D, t); D.endFrame(); D.frameNo += 1; return D.stepMs; };

  // ---- v3: platform-native captions, emoji, counter, badges, flashes
  const css3 = document.createElement('style');
  css3.textContent = `
  #tr .tt{font-weight:900;color:#fff;-webkit-text-stroke:calc(var(--u)*0.42) #111;paint-order:stroke fill;letter-spacing:-0.01em;text-align:center;white-space:normal;line-height:1.08;text-shadow:0 calc(var(--u)*0.18) calc(var(--u)*0.3) rgba(0,0,0,.35)}
  #tr .ttbox{font-weight:800;color:#111;text-align:center;white-space:normal;line-height:1.18}
  #tr .ttbox .w{background:#fff;box-decoration-break:clone;-webkit-box-decoration-break:clone;padding:calc(var(--u)*0.12) calc(var(--u)*0.35);border-radius:calc(var(--u)*0.35)}
  #tr .w{display:inline-block;white-space:pre}
  #tr .emo{font-family:'Noto Color Emoji';line-height:1}
  #tr .hl{color:#ffe066}
  `;
  document.head.append(css3);
  // word-by-word caption. words wrapped in *stars* get highlight colour.
  D.cap = (id, txt, { x = 0.5, y = 0.2, t0 = 0, t1 = 1e9, size = 2.0, box = false, wordDur = 0.09, width = 0.86, pop = 1.18 } = {}) => {
    const t = D.t; if (t < t0 || t > t1) return null;
    const e = D.el(id, (e) => {
      e.className = 'o ' + (box ? 'ttbox' : 'tt'); e.style.fontSize = size * D.U() + 'px'; e.style.width = width * D.vw + 'px';
      e.innerHTML = txt.split(' ').map((w) => { const hl = /^\*.*\*$/.test(w); w = w.replace(/\*/g, ''); const emo = /\p{Extended_Pictographic}/u.test(w); return `<span class="w${hl ? ' hl' : ''}${emo ? ' emo' : ''}">${w}</span><span class="w"> </span>`; }).join('');
    });
    const ws = [...e.querySelectorAll('.w')].filter((_, i) => i % 2 === 0);
    ws.forEach((w, i) => { const q = (t - t0 - i * wordDur) / 0.1; w.style.visibility = q >= 0 ? 'visible' : 'hidden'; const s = q < 0 ? 0 : q < 1 ? D.lerp(pop, 1, D.E.out(q)) : 1; w.style.transform = `scale(${s})`; });
    D.place2(e, x * D.vw, y * D.vh, {});
    return e;
  };
  D.emoji = (id, ch, x, y, t0, t1 = 1e9, size = 3, r = 0) => {
    const t = D.t; if (t < t0 || t > t1 + 0.12) return null;
    const e = D.el(id, (e) => { e.className = 'o emo'; e.style.fontSize = size * D.U() + 'px'; e.textContent = ch; });
    const k = t - t0; let s = D.E.back(k / 0.22); if (t > t1) s *= 1 - (t - t1) / 0.12;
    D.place2(e, x * D.vw, y * D.vh, { s, r: r + Math.sin(k * 9) * 6 * Math.exp(-k * 3) });
    return e;
  };
  D.counter = (id, txt, { x = 0.5, y = 0.32, size = 4.2, pulseT = -9, color = '#fff' } = {}) => {
    const e = D.el(id, (e) => { e.className = 'o tt'; e.style.whiteSpace = 'nowrap'; e.style.width = 'auto'; });
    e.style.fontSize = size * D.U() + 'px'; e.textContent = txt; e.style.color = color;
    const k = D.t - pulseT; const s = k >= 0 && k < 0.25 ? 1 + 0.28 * Math.exp(-k * 14) : 1;
    D.place2(e, x * D.vw, y * D.vh, { s });
    return e;
  };
  D.badge = (id, txt, x, y, t0, t1 = 1e9, size = 1.3) => {
    const t = D.t; if (t < t0 || t > t1) return null;
    const e = D.el(id, (e) => { e.className = 'o'; e.style.cssText += `;background:#ff2d55;color:#fff;font-weight:900;border-radius:${D.U() * 0.5}px;padding:${D.U() * 0.2}px ${D.U() * 0.6}px;font-size:${size * D.U()}px;box-shadow:0 ${D.U() * 0.25}px 0 #a3001f`; });
    e.textContent = txt;
    D.place2(e, x * D.vw, y * D.vh, { s: D.E.back((t - t0) / 0.2), r: -4 });
    return e;
  };
  D.flash = (id, t0, dur = 0.18, color = '#fff', peak = 0.85) => { const k = (D.t - t0) / dur; if (k < 0 || k > 1) return; D.layer(id, 'background:' + color, (1 - k) * peak); };
  D.vignetteDark = (o) => D.layer('vdark', 'background:radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,.7) 100%)', o);
  window.__step(16.667);
})();
