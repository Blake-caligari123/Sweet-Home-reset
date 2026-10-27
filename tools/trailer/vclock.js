// Virtual time: rAF, timers and performance.now advance only when __step(ms) is called.
(() => {
  let vt = 0, seq = 1;
  const timers = new Map(); let raf = new Map();
  const realSetTimeout = window.setTimeout.bind(window);
  window.__realSetTimeout = realSetTimeout;
  performance.now = () => vt;
  window.requestAnimationFrame = (fn) => { const id = seq++; raf.set(id, fn); return id; };
  window.cancelAnimationFrame = (id) => { raf.delete(id); };
  window.setTimeout = (fn, ms = 0, ...a) => { const id = seq++; timers.set(id, { at: vt + Math.max(0, +ms || 0), fn, a }); return id; };
  window.clearTimeout = (id) => { timers.delete(id); };
  window.setInterval = (fn, ms = 0, ...a) => { const id = seq++; timers.set(id, { at: vt + Math.max(1, +ms || 1), fn, a, every: Math.max(1, +ms || 1) }); return id; };
  window.clearInterval = window.clearTimeout;
  window.__vt = () => vt;
  window.__step = (ms) => {
    const end = vt + ms;
    for (;;) {
      let best = null, bid = 0;
      for (const [id, t] of timers) if (t.at <= end && (!best || t.at < best.at)) { best = t; bid = id; }
      if (!best) break;
      vt = Math.max(vt, best.at);
      if (best.every) best.at += best.every; else timers.delete(bid);
      try { typeof best.fn === 'function' ? best.fn(...best.a) : eval(best.fn); } catch (e) { console.error(e); }
    }
    vt = end;
    const q = raf; raf = new Map();
    for (const fn of q.values()) { try { fn(vt); } catch (e) { console.error(e); } }
  };
})();
