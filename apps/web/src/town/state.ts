import type { RequestState } from './requests/requests';
import type { Friend } from './data/save';
import { Bag } from './play/bag';
import { Fluff } from './play/fluff';
import { Onboarding } from './play/onboarding';

export interface Crop { area: string; x: number; y: number; crop: string; days: number; watered: boolean }

/**
 * Puff's progress: everything the save keeps apart from the clock, areas and where Puff stands.
 * One object shared by the game and its features (conversations, jobs, sheets); loading a save
 * replaces its fields, never the object, so every feature can keep a reference to it.
 */
export class TownState {
  sparkles = 0;
  bag = new Bag();
  fluff = new Fluff();
  tools: Record<string, number> = { hands: 1, duster: 1 };
  crops: Crop[] = [];
  flags: string[] = [];
  friends: Record<string, Friend> = {};
  requests: RequestState = { day: 0, list: [] };
  onboarding = new Onboarding();
  chores = { day: '', keys: [] as string[], total: 0 };
  /** The last kind of mess cleaned today, for the morning letter. */
  lastClean = 'none';

  has(flag: string) { return this.flags.includes(flag); }
  /** Set a save flag (once). */
  flag(flag: string) { if (!this.flags.includes(flag)) this.flags.push(flag); }
  friendOf(id: string) { return (this.friends[id] ??= { points: 0, talkedDay: 0, met: false }); }
}
