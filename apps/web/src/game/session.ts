import { seeded } from '../art/pixel-canvas';
import { DirtMap } from './dirt';
import type { Point, RoomDef, TaskDef } from './pack';

export const STAGES = [25, 50, 75, 100] as const;
export const ROOM_CLEAN_AT = 95;
/** A scrub or wipe patch counts as done at 90% of its pixels (GAME-DESIGN tuning table). */
export const PATCH_DONE_AT = 0.9;
const BIN_MARGIN = 6;

export type SessionEvent =
  | { type: 'taskDone'; task: number }
  | { type: 'stage'; stage: (typeof STAGES)[number] }
  | { type: 'roomClean' }
  | { type: 'pop'; task: number; bunny: number }
  | { type: 'crumb'; task: number; crumb: number }
  | { type: 'placed'; task: number; item: number; bin: string }
  | { type: 'bounce'; task: number; item: number; wrongBin: boolean };

export interface SessionSave { seed: number; /** run-length pairs [value, count, ...] */ hp: number[]; popped: boolean[][]; placed: (string | null)[][]; vacuumed?: boolean[][]; stage: number; complete: boolean }

export class RoomSession {
  readonly dirt: DirtMap;
  readonly popped: boolean[][];
  readonly placed: (string | null)[][];
  /** Crumb positions for vacuum tasks, scattered from the mess seed. */
  readonly crumbs: Point[][];
  readonly vacuumed: boolean[][];
  readonly done: boolean[];
  stage = 0;
  complete = false;

  constructor(readonly room: RoomDef, readonly seed: number, saved?: SessionSave) {
    this.dirt = new DirtMap(room.tasks, seed);
    this.popped = room.tasks.map((t) => (t.type === 'pop' ? t.bunnies.map(() => false) : []));
    this.placed = room.tasks.map((t) => (t.type === 'sort' ? t.items.map(() => null) : []));
    this.crumbs = room.tasks.map((t) => (t.type === 'vacuum' ? scatter(t.areas, t.count, seed * 104729 + t.seed) : []));
    this.vacuumed = this.crumbs.map((list) => list.map(() => false));
    this.done = room.tasks.map(() => false);
    if (saved && saved.seed === seed) this.restore(saved);
  }

  get tasks(): TaskDef[] { return this.room.tasks; }

  taskProgress(index: number) {
    const task = this.tasks[index];
    if (this.done[index]) return 1;
    switch (task.type) {
      case 'scrub': case 'wipe': return Math.min(1, this.dirt.progress(index) / PATCH_DONE_AT);
      case 'pop': return this.popped[index].filter(Boolean).length / task.bunnies.length;
      case 'vacuum': return this.vacuumed[index].filter(Boolean).length / this.crumbs[index].length;
      case 'sort': return this.placed[index].filter(Boolean).length / task.items.length;
    }
  }

  meter() {
    const sum = this.tasks.reduce((total, _, i) => total + this.taskProgress(i), 0);
    return (sum / this.tasks.length) * 100;
  }

  scrub(x0: number, y0: number, x1: number, y1: number, radius: number) {
    const result = this.dirt.stroke(x0, y0, x1, y1, radius);
    return { box: result.box, changed: result.changed, cleared: result.cleared, events: result.changed ? this.settle() : [] };
  }

  pop(task: number, bunny: number): SessionEvent[] {
    if (this.tasks[task]?.type !== 'pop' || this.popped[task][bunny] !== false) return [];
    this.popped[task][bunny] = true;
    return [{ type: 'pop', task, bunny }, ...this.settle()];
  }

  vacuum(task: number, crumb: number): SessionEvent[] {
    if (this.tasks[task]?.type !== 'vacuum' || this.vacuumed[task][crumb] !== false) return [];
    this.vacuumed[task][crumb] = true;
    return [{ type: 'crumb', task, crumb }, ...this.settle()];
  }

  /** Drop a sort item at a room point. Right bin snaps in; a wrong bin bounces it back, no penalty. */
  drop(task: number, item: number, x: number, y: number): SessionEvent[] {
    const def = this.tasks[task];
    if (def?.type !== 'sort' || this.placed[task][item] !== null) return [];
    const kind = def.items[item].kind;
    const bin = def.bins.find((b) => x >= b.x - BIN_MARGIN && y >= b.y - BIN_MARGIN && x <= b.x + b.w + BIN_MARGIN && y <= b.y + b.h + BIN_MARGIN);
    if (!bin || !bin.accepts.includes(kind)) return [{ type: 'bounce', task, item, wrongBin: Boolean(bin) }];
    this.placed[task][item] = bin.id;
    return [{ type: 'placed', task, item, bin: bin.id }, ...this.settle()];
  }

  /** Help Puff: finish one task for the player, with no penalty. */
  help(task: number): SessionEvent[] {
    return [...this.completeTask(task), ...this.settle()];
  }

  /** Index of the first unfinished task, or -1. */
  nextTask() { return this.done.findIndex((d, i) => !d && this.taskProgress(i) < 1); }

  private completeTask(index: number): SessionEvent[] {
    const task = this.tasks[index];
    if (!task || this.done[index]) return [];
    const events: SessionEvent[] = [];
    if (task.type === 'scrub' || task.type === 'wipe') this.dirt.clearTask(index);
    if (task.type === 'pop') this.popped[index].forEach((p, b) => { if (!p) { this.popped[index][b] = true; events.push({ type: 'pop', task: index, bunny: b }); } });
    if (task.type === 'vacuum') this.vacuumed[index].forEach((v, c) => { if (!v) { this.vacuumed[index][c] = true; events.push({ type: 'crumb', task: index, crumb: c }); } });
    if (task.type === 'sort') this.placed[index].forEach((p, i) => {
      if (p === null) {
        const bin = task.bins.find((b) => b.accepts.includes(task.items[i].kind))!;
        this.placed[index][i] = bin.id;
        events.push({ type: 'placed', task: index, item: i, bin: bin.id });
      }
    });
    this.done[index] = true;
    events.push({ type: 'taskDone', task: index });
    return events;
  }

  private settle(): SessionEvent[] {
    const events: SessionEvent[] = [];
    this.tasks.forEach((_, i) => {
      if (!this.done[i] && this.taskProgress(i) >= 1) events.push(...this.completeTask(i));
    });
    const finishing = !this.complete && this.meter() >= ROOM_CLEAN_AT;
    if (finishing) {
      this.tasks.forEach((_, i) => events.push(...this.completeTask(i)));
      this.complete = true;
    }
    const meter = this.meter();
    for (const stage of STAGES) {
      if (stage > this.stage && meter >= stage) { this.stage = stage; events.push({ type: 'stage', stage }); }
    }
    if (finishing) events.push({ type: 'roomClean' });
    return events;
  }

  save(): SessionSave {
    return { seed: this.seed, hp: encodeRuns(this.dirt.snapshot()), popped: this.popped.map((p) => [...p]), placed: this.placed.map((p) => [...p]), vacuumed: this.vacuumed.map((v) => [...v]), stage: this.stage, complete: this.complete };
  }

  private restore(saved: SessionSave) {
    this.dirt.restore(decodeRuns(saved.hp, this.dirt.hp.length));
    saved.popped.forEach((list, t) => list.forEach((v, b) => { if (this.popped[t] && b < this.popped[t].length) this.popped[t][b] = Boolean(v); }));
    saved.placed.forEach((list, t) => list.forEach((v, i) => { if (this.placed[t] && i < this.placed[t].length) this.placed[t][i] = v; }));
    (saved.vacuumed ?? []).forEach((list, t) => list.forEach((v, c) => { if (this.vacuumed[t] && c < this.vacuumed[t].length) this.vacuumed[t][c] = Boolean(v); }));
    this.tasks.forEach((_, i) => { if (this.taskProgress(i) >= 1) this.done[i] = true; });
    this.stage = saved.stage;
    this.complete = saved.complete;
  }
}

export function encodeRuns(values: Uint8Array) {
  const out: number[] = [];
  for (let i = 0; i < values.length;) {
    let j = i + 1;
    while (j < values.length && values[j] === values[i]) j += 1;
    out.push(values[i], j - i);
    i = j;
  }
  return out;
}

export function decodeRuns(runs: number[], length: number) {
  const out = new Uint8Array(length);
  let k = 0;
  for (let i = 0; i + 1 < runs.length && k < length; i += 2) {
    const end = Math.min(length, k + Math.max(0, runs[i + 1]));
    out.fill(runs[i], k, end);
    k = end;
  }
  return out;
}

/** Seeded crumb positions spread across the areas, at least 4 px apart where possible. */
export function scatter(areas: { x: number; y: number; w: number; h: number }[], count: number, seed: number): Point[] {
  const rand = seeded(seed);
  const out: Point[] = [];
  for (let guard = 0; out.length < count && guard < count * 40; guard += 1) {
    const a = areas[Math.floor(rand() * areas.length)];
    const p = { x: Math.round(a.x + rand() * (a.w - 1)), y: Math.round(a.y + rand() * (a.h - 1)) };
    if (guard < count * 30 && out.some((q) => Math.abs(q.x - p.x) < 4 && Math.abs(q.y - p.y) < 4)) continue;
    out.push(p);
  }
  return out;
}
