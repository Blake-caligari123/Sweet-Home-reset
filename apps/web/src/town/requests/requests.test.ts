import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { AreaMess, MESS_TYPES } from '../play/mess';
import { FEET, navFor, REACH } from '../world/nav';
import { accept, cleanDone, freshMess, newDay, TOWN, type RequestState, type RequestTemplate } from './requests';
import type { MessSpot } from '../play/mess';

const T = 16;
const tpl = (id: string, over: Partial<RequestTemplate> = {}): RequestTemplate => ({ id, neighbourId: 'hazel', kind: 'bring', item: 'radish', text: `${id}.text`, sparkles: 40, ...over });
const templates = [tpl('a', { first: true }), tpl('b'), tpl('c'), tpl('d'), tpl('e')];
const empty = (): RequestState => ({ day: 0, list: [] });

describe('the notice board', () => {
  it('posts 1 to 3 requests a day, the same ones for the same day', () => {
    for (let day = 1; day < 30; day += 1) {
      const a = newDay(empty(), templates, day, { expire: true });
      const b = newDay(empty(), templates, day, { expire: true });
      expect(a.state.list.length).toBeGreaterThanOrEqual(1);
      expect(a.state.list.length).toBeLessThanOrEqual(3);
      expect(a.state.list).toEqual(b.state.list);
    }
  });

  it('always puts the first-day request up on day 1', () => {
    expect(newDay(empty(), templates, 1, { expire: true }).state.list.map((r) => r.id)).toContain('a');
  });

  it('waits to post a job until the day its place opens', () => {
    const river = [tpl('a', { first: true }), tpl('river', { fromDay: 3 })];
    for (let day = 1; day < 3; day += 1) expect(newDay(empty(), river, day, { expire: true }).state.list.map((r) => r.id)).not.toContain('river');
    expect([3, 4, 5, 6].some((day) => newDay(empty(), river, day, { expire: true }).state.list.some((r) => r.id === 'river'))).toBe(true);
  });

  it('never posts the same request twice at once', () => {
    let s = empty();
    for (let day = 1; day < 20; day += 1) {
      s = newDay(s, templates, day, { expire: true }).state;
      expect(new Set(s.list.map((r) => r.id)).size).toBe(s.list.length);
    }
  });

  it('lets a missed request quietly go after its 2–3 days, and never in relaxed mode', () => {
    let s = accept(newDay(empty(), templates, 1, { expire: true }).state, 'a')!;
    const until = s.list.find((r) => r.id === 'a')!.until;
    // Up for 2–3 days, today included.
    expect(until).toBeGreaterThanOrEqual(2);
    expect(until).toBeLessThanOrEqual(3);
    const kept = newDay(s, templates, until, { expire: true });
    expect(kept.state.list.some((r) => r.id === 'a')).toBe(true);
    const gone = newDay(s, templates, until + 1, { expire: true });
    expect(gone.state.list.some((r) => r.id === 'a' && r.accepted)).toBe(false);
    expect(gone.expired).toContain('a');
    s = newDay(s, templates, until + 5, { expire: false }).state;
    expect(s.list.some((r) => r.id === 'a' && r.accepted)).toBe(true);
  });

  it('holds at most 3 accepted at once', () => {
    let s: RequestState = { day: 1, list: ['a', 'b', 'c', 'd'].map((id) => ({ id, until: 4, accepted: false })) };
    for (const id of ['a', 'b', 'c']) s = accept(s, id)!;
    expect(accept(s, 'd')).toBeNull();
  });
});

describe('tidy requests', () => {
  it('scatter fresh mess that a restored home stays restored through', () => {
    const t = tpl('counter', { kind: 'clean', area: 'bakery', rect: [14, 10, 4, 1], mess: 'crumbs' });
    const area = new Area(pack.areas.find((a) => a.id === 'bakery')!);
    const m = new AreaMess(area.w, area.h, area.spots, true);
    m.restore();
    const before = m.progress;
    const spots = freshMess(t, area, m);
    expect(spots.length).toBeGreaterThan(0);
    m.scatter(spots);
    expect(m.progress).toBe(before);
    expect(m.restored).toBe(true);
    expect(cleanDone(t, m)).toBe(false);
    for (const s of spots) m.hit(s.x, s.y, 'duster', 1);
    expect(cleanDone(t, m)).toBe(true);
    const copy = new AreaMess(area.w, area.h, area.spots, true);
    m.scatter(spots); copy.load(JSON.parse(JSON.stringify(m.snapshot())));
    expect(copy.progress).toBe(before);
    expect(copy.typeAt(spots[0].x, spots[0].y)).toBe('crumbs');
  });

  it('takes a missed tidy job\'s leftover mess away with it, leaving older mess alone', () => {
    const t = tpl('counter', { kind: 'clean', area: 'bakery', rect: [14, 10, 5, 1], mess: 'crumbs' });
    const area = new Area(pack.areas.find((a) => a.id === 'bakery')!);
    const m = new AreaMess(area.w, area.h, [{ type: 'stain', x: 15, y: 10 }], true);
    const tiles = m.scatter(freshMess(t, area, m));
    m.clearFresh(tiles);
    for (const i of tiles) expect(m.type[i]).toBe(0);
    expect(m.typeAt(15, 10)).toBe('stain');
    m.clearFresh([15 + 10 * m.w]);
    expect(m.typeAt(15, 10)).toBe('stain');
  });

  it('only needs the mess it put down, not whatever was already in its spot', () => {
    const t = tpl('counter', { kind: 'clean', area: 'bakery', rect: [14, 10, 5, 1], mess: 'crumbs' });
    const area = new Area(pack.areas.find((a) => a.id === 'bakery')!);
    const old: MessSpot[] = [{ type: 'stain', x: 15, y: 10 }];
    const m = new AreaMess(area.w, area.h, old, true);
    const tiles = m.scatter(freshMess(t, area, m));
    expect(cleanDone(t, m, tiles)).toBe(false);
    for (const i of tiles) m.hit(i % m.w, Math.floor(i / m.w), 'duster', 1);
    expect(m.typeAt(15, 10)).toBe('stain');
    expect(cleanDone(t, m, tiles)).toBe(true);
  });
});

describe('Hollowfern requests', () => {
  const list = pack.requests ?? [];
  const text = pack.strings!['en-AU'];

  it('has a first-day counter request for Hazel, and every request makes sense', () => {
    expect(list.find((r) => r.first)).toMatchObject({ neighbourId: 'hazel', kind: 'clean', area: 'bakery', setFlag: 'onboard_counter_done' });
    for (const r of list) {
      expect(text[r.text], r.id).toBeTruthy();
      expect(r.neighbourId === TOWN || pack.neighbours!.some((n) => n.id === r.neighbourId), r.id).toBe(true);
      if (r.kind === 'bring') expect(pack.items[r.item!]?.name, r.id).toBeTruthy();
    }
  });

  it('gives every neighbour jobs, and never posts one before its place opens', () => {
    // The first day each place can be reached: the latest gate on the earliest way there.
    const opens = new Map<string, number>([['burrow', 1]]);
    for (let changed = true; changed;) {
      changed = false;
      for (const a of pack.areas) for (const d of a.doors) {
        const from = opens.get(a.id);
        if (from === undefined || (d.closedText && !d.opensDay)) continue;
        const day = Math.max(from, d.opensDay ?? 1);
        if (day < (opens.get(d.to) ?? Infinity)) { opens.set(d.to, day); changed = true; }
      }
    }
    for (const n of pack.neighbours!) expect(list.filter((r) => r.neighbourId === n.id).length, n.id).toBeGreaterThanOrEqual(2);
    for (const r of list.filter((x) => x.neighbourId !== TOWN)) {
      const who = pack.neighbours!.find((n) => n.id === r.neighbourId)!;
      const ready = r.kind === 'clean' ? opens.get(r.area!)! : Math.min(...who.schedule.map((s) => opens.get(s.area) ?? Infinity));
      expect(r.fromDay ?? 1, r.id).toBeGreaterThanOrEqual(ready);
    }
  });

  it('has town jobs from day 8: tidying jobs anywhere open, for the whole town', () => {
    const town = list.filter((r) => r.neighbourId === TOWN);
    expect(town.length).toBeGreaterThanOrEqual(4);
    for (const r of town) {
      expect(r.kind, r.id).toBe('clean');
      expect(r.fromDay, r.id).toBeGreaterThanOrEqual(8);
    }
  });

  it('puts every tidy request where Puff can reach it', () => {
    for (const r of list.filter((x) => x.kind === 'clean')) {
      const a = pack.areas.find((x) => x.id === r.area)!;
      const area = new Area(a); const nav = navFor(area);
      const spots = freshMess(r, area, new AreaMess(area.w, area.h, [], false));
      expect(MESS_TYPES, r.id).toContain(r.mess);
      expect(spots.length, r.id).toBeGreaterThan(1);
      const from = nav.nearestOpen({ x: a.spawn.x * T + T / 2, y: a.spawn.y * T + FEET })!;
      for (const s of spots) expect(nav.findPathNear(from, { x0: s.x * T, y0: s.y * T, x1: (s.x + 1) * T, y1: (s.y + 1) * T }, REACH), `${r.id} ${s.x},${s.y}`).not.toBeNull();
    }
  });
});
