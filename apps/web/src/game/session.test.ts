import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validatePack } from './pack';
import { decodeRuns, encodeRuns, RoomSession, type SessionEvent } from './session';

const pack = validatePack(JSON.parse(readFileSync(new URL('../../public/packs-bundled/starter-home/2/pack.json', import.meta.url), 'utf8')));
const kitchen = pack.rooms[0];
const stagesOf = (events: SessionEvent[]) => events.filter((e) => e.type === 'stage').map((e) => (e as { stage: number }).stage);

function scrubAll(session: RoomSession, task: number) {
  const t = session.tasks[task];
  if (t.type !== 'scrub' && t.type !== 'wipe') return [];
  const events: SessionEvent[] = [];
  for (let pass = 0; pass < 14; pass += 1) {
    for (const a of t.areas) for (let y = a.y; y < a.y + a.h; y += 4) events.push(...session.scrub(a.x, y, a.x + a.w, y, 7).events);
  }
  return events;
}

describe('room session', () => {
  it('fires each stage once, in order, and finishes the room at 95%', () => {
    const session = new RoomSession(kitchen, 1);
    const events: SessionEvent[] = [];
    kitchen.tasks.forEach((t, i) => {
      if (t.type === 'pop') t.bunnies.forEach((_, b) => events.push(...session.pop(i, b)));
      if (t.type === 'sort') t.items.forEach((item, k) => {
        const bin = t.bins.find((b) => b.accepts.includes(item.kind))!;
        events.push(...session.drop(i, k, bin.x + 2, bin.y + 2));
      });
      events.push(...scrubAll(session, i));
    });
    expect(stagesOf(events)).toEqual([25, 50, 75, 100]);
    expect(events.filter((e) => e.type === 'roomClean')).toHaveLength(1);
    expect(events.filter((e) => e.type === 'taskDone')).toHaveLength(kitchen.tasks.length);
    expect(session.complete).toBe(true);
    expect(session.meter()).toBe(100);
  });

  it('auto-finishes the last 5% so a near-clean room never stalls', () => {
    const session = new RoomSession(kitchen, 1);
    // Finish three tasks fully, then most of the last one.
    session.help(1); session.help(2); session.help(3);
    expect(session.complete).toBe(false);
    const events = scrubAll(session, 0);
    expect(events.some((e) => e.type === 'roomClean')).toBe(true);
    expect(session.dirt.progress(0)).toBe(1);
  });

  it('bounces an item off the wrong bin with no penalty, then accepts the right one', () => {
    const session = new RoomSession(kitchen, 1);
    const sortIndex = kitchen.tasks.findIndex((t) => t.type === 'sort');
    const sort = kitchen.tasks[sortIndex];
    if (sort.type !== 'sort') throw new Error('no sort task');
    const plate = sort.items.findIndex((i) => i.kind === 'plate');
    const bowl = sort.bins.find((b) => b.id === 'bowl')!;
    const sink = sort.bins.find((b) => b.id === 'sink')!;
    expect(session.drop(sortIndex, plate, bowl.x + 3, bowl.y + 3)).toEqual([{ type: 'bounce', task: sortIndex, item: plate, wrongBin: true }]);
    expect(session.drop(sortIndex, plate, 90, 380)[0]).toMatchObject({ type: 'bounce', wrongBin: false });
    expect(session.drop(sortIndex, plate, sink.x + 3, sink.y + 3)[0]).toMatchObject({ type: 'placed', bin: 'sink' });
    expect(session.taskProgress(sortIndex)).toBe(0.25);
  });

  it('Help Puff completes a task and counts toward the meter', () => {
    const session = new RoomSession(kitchen, 1);
    const events = session.help(0);
    expect(events).toContainEqual({ type: 'taskDone', task: 0 });
    expect(session.meter()).toBe(25);
    expect(stagesOf(events)).toEqual([25]);
    expect(session.nextTask()).toBe(1);
  });

  it('popping the same bunny twice does nothing the second time', () => {
    const session = new RoomSession(kitchen, 1);
    const pop = kitchen.tasks.findIndex((t) => t.type === 'pop');
    expect(session.pop(pop, 0)).toContainEqual({ type: 'pop', task: pop, bunny: 0 });
    expect(session.pop(pop, 0)).toEqual([]);
  });

  it('restores a saved room mid-way', () => {
    const session = new RoomSession(kitchen, 3);
    session.help(2);
    session.scrub(0, 115, 180, 115, 8);
    const saved = JSON.parse(JSON.stringify(session.save()));
    const again = new RoomSession(kitchen, 3, saved);
    expect(again.meter()).toBeCloseTo(session.meter());
    expect(again.stage).toBe(session.stage);
    expect(again.done[2]).toBe(true);
  });

  it('stores dirt compactly as runs', () => {
    const session = new RoomSession(kitchen, 3);
    const saved = session.save();
    expect(saved.hp.length).toBeLessThan(session.dirt.hp.length / 4);
    expect(Array.from(decodeRuns(encodeRuns(session.dirt.hp), session.dirt.hp.length))).toEqual(Array.from(session.dirt.hp));
  });

  it('ignores a save made for a different mess', () => {
    const saved = new RoomSession(kitchen, 3).save();
    saved.stage = 50;
    expect(new RoomSession(kitchen, 4, saved).stage).toBe(0);
  });
});
