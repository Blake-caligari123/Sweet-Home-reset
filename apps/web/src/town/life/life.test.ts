import { describe, expect, it } from 'vitest';
import { advanceDrama, dramaStage, type DramaDef } from './dramas';
import { recalls, remember, type Memory } from './memory';
import { moodOf } from './mood';

const calm = { homeTidy: 0.5, talkedToday: false, gift: null, friendNear: false, likesWeather: false, drama: false } as const;

describe('moods', () => {
  it('rise with a tidy home, a chat, a gift they like, a friend nearby and their kind of weather', () => {
    expect(moodOf(calm)).toBe('okay');
    expect(moodOf({ ...calm, homeTidy: 1, talkedToday: true })).toBe('happy');
    expect(moodOf({ ...calm, homeTidy: 1, talkedToday: true, gift: 'loved', friendNear: true })).toBe('glowing');
  });

  it('dip with a messy home or a falling-out, but a chat with Puff always helps', () => {
    expect(moodOf({ ...calm, homeTidy: 0, drama: true })).toBe('low');
    expect(moodOf({ ...calm, homeTidy: 0, drama: true, talkedToday: true, gift: 'liked' })).not.toBe('low');
  });
});

describe('memories', () => {
  it('keeps the newest first, once each, and forgets after two weeks', () => {
    let list: Memory[] = [];
    list = remember(list, { what: 'tidied_home', who: 'bea', day: 3 });
    list = remember(list, { what: 'restored_square', who: 'town', day: 4 });
    list = remember(list, { what: 'tidied_home', who: 'bea', day: 5 });
    expect(list.map((m) => `${m.what}:${m.day}`)).toEqual(['tidied_home:5', 'restored_square:4']);
    expect(recalls(list, 'bea', 6)).toEqual(['tidied_home', 'restored_square']);
    expect(recalls(list, 'pip', 6)).toEqual(['restored_square']);
    expect(recalls(list, 'bea', 25)).toEqual([]);
  });
});

describe('dramas', () => {
  const noise: DramaDef = { id: 'noise', between: ['pip', 'moss'], fromDay: 9, steps: [{ talkTo: 'moss', line: 'a' }, { talkTo: 'pip', line: 'b' }, { talkTo: 'moss', line: 'c' }], mendedFlag: 'quiet_hour' };

  it('starts on its day, needs Puff to talk to each side in turn, then is mended', () => {
    expect(dramaStage(noise, {}, 8)).toBe('waiting');
    expect(dramaStage(noise, {}, 9)).toBe('brewing');
    let s: Record<string, number> = {};
    expect(advanceDrama(noise, s, 'pip', 9)).toBeNull(); // Moss first
    let step = advanceDrama(noise, s, 'moss', 9)!; s = step.state;
    expect(step.line).toBe('a');
    step = advanceDrama(noise, s, 'pip', 9)!; s = step.state;
    step = advanceDrama(noise, s, 'moss', 9)!; s = step.state;
    expect(step.mended).toBe(true);
    expect(dramaStage(noise, s, 10)).toBe('mended');
    expect(advanceDrama(noise, s, 'moss', 10)).toBeNull();
  });
});
