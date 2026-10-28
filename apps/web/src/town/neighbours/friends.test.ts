import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { chat, give, canGift, tasteOf } from './friends';
import { heartsOf } from './talk';
import { migrate, stamp, type Friend } from '../data/save';
import { TUNING } from '../data/tuning';

const hazel = pack.neighbours!.find((n) => n.id === 'hazel')!;
const fresh = (): Friend => ({ points: 0, talkedDay: 0, met: true });

describe('gifts', () => {
  it('knows what each neighbour loves, likes and would rather not have', () => {
    expect(tasteOf(hazel, 'bread')).toBe('loved');
    expect(tasteOf(hazel, 'honey')).toBe('liked');
    expect(tasteOf(hazel, 'mud')).toBe('disliked');
    expect(tasteOf(hazel, 'sock')).toBe('neutral');
  });

  it('gives points by taste from tuning, and a disliked gift costs nothing', () => {
    const f = fresh();
    expect(give(hazel, f, 'bread', 1).gained).toBe(TUNING.friendship.loved);
    expect(give(hazel, f, 'honey', 2).gained).toBe(TUNING.friendship.liked);
    expect(give(hazel, f, 'sock', 3).gained).toBe(1);
    const before = f.points;
    expect(give(hazel, f, 'mud', 4).gained).toBe(0);
    expect(f.points).toBe(before);
  });

  it('takes one gift a day per neighbour', () => {
    const f = fresh();
    expect(canGift(f, 1)).toBe(true);
    give(hazel, f, 'bread', 1);
    expect(canGift(f, 1)).toBe(false);
    expect(canGift(f, 2)).toBe(true);
  });

  it('remembers loved and liked gifts once found, so the Friends page can show them', () => {
    const f = fresh();
    give(hazel, f, 'bread', 1); give(hazel, f, 'sock', 2); give(hazel, f, 'bread', 3);
    expect(f.known).toEqual(['bread']);
  });

  it('reports a new heart when the points cross one', () => {
    const f: Friend = { points: TUNING.friendship.pointsPerHeart - 2, talkedDay: 0, met: true };
    expect(give(hazel, f, 'bread', 1).heartUp).toBe(1);
    expect(give(hazel, f, 'honey', 2).heartUp).toBe(0);
  });
});

describe('hearts never drop', () => {
  it('across a season of chats and gifts of every kind, and through save and load', () => {
    const f = fresh();
    let last = 0;
    const items = ['bread', 'honey', 'mud', 'sock', 'clay', 'tart'];
    for (let day = 1; day <= 56; day += 1) {
      chat(f, day); chat(f, day);
      if (canGift(f, day)) give(hazel, f, items[day % items.length], day);
      expect(f.points).toBeGreaterThanOrEqual(last);
      expect(heartsOf(f.points)).toBeGreaterThanOrEqual(heartsOf(last));
      last = f.points;
      const save = stamp({ deviceId: 't', day, minutes: 600, fluff: { value: 1, max: 100, boost: 0 }, sparkles: 0, bag: [], tools: {}, area: 'burrow', puff: { x: 1, y: 1, facing: 'down' }, areas: {}, crops: [], flags: [], friends: { hazel: f }, onboarding: 0, chores: { day: '', keys: [], total: 0 }, settings: { sound: true, music: true, haptics: true, reducedMotion: false, relaxed: false, autoTool: true } });
      expect(migrate(JSON.parse(JSON.stringify(save)))!.friends.hazel.points).toBe(f.points);
    }
    expect(heartsOf(f.points)).toBe(10);
  });

  it('counts the first chat of each day only', () => {
    const f = fresh();
    expect(chat(f, 1)).toBe(TUNING.friendship.talk);
    expect(chat(f, 1)).toBe(0);
    expect(chat(f, 2)).toBe(TUNING.friendship.talk);
  });
});

describe('Hollowfern tastes', () => {
  it('names every item a neighbour loves, likes or dislikes, and each has a spring gift they like', () => {
    for (const n of pack.neighbours!) {
      for (const id of [...n.loves, ...n.likes, ...n.dislikes]) expect(pack.items[id]?.name, `${n.id} ${id}`).toBeTruthy();
      // Something they'd love or like that Puff can find or buy in spring.
      expect([...n.loves, ...n.likes].some((id) => ['radish', 'tart', 'radish_seeds', 'flowers', 'shell', 'book'].includes(id)), n.id).toBe(true);
      for (const t of ['loved', 'liked', 'neutral', 'disliked']) expect(pack.strings!['en-AU'][`${n.id}.gift.${t}`], `${n.id} ${t}`).toBeTruthy();
    }
  });
});
