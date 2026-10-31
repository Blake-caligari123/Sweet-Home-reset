import type { RequestState } from './requests/requests';
import type { PlotState } from './build/build';
import type { Friend, TownSave, Unlock } from './data/save';
import type { Memory } from './life/memory';
import type { QuestLogState } from './quests/quests';
import type { PuffDay } from './skills/puff-mood';
import type { StallState } from './stall/stall';
import type { SkillLog } from './skills/skills';
import type { GrumbleState } from './grumbles/grumbles';
import type { Pet } from './pets/pets';
import type { Finds } from './bloom/bloom';
import type { Placed } from './decor/decor';
import type { CaveState } from './caves/caves';
import { Bag } from './play/bag';
import { Fluff } from './play/fluff';
import { DEFAULT_NAMES, type Names } from './play/names';
import { Onboarding } from './play/onboarding';
import type { Taken } from './play/pickups';

/** The parts of a save that hold Puff's progress. */
export type ProgressSave = Pick<TownSave, 'fluff' | 'sparkles' | 'bag' | 'tools' | 'crops' | 'flags' | 'friends' | 'onboarding' | 'onboardingAhead' | 'chores' | 'requests' | 'picked' | 'lastClean' | 'names' | 'plots' | 'grumbles' | 'pet' | 'bloom' | 'finds' | 'outfit' | 'decor' | 'caves' | 'townJobs' | 'dashBest' | 'unlock' | 'restNights' | 'cloudVersion' | 'visited' | 'memories' | 'dramas' | 'skills' | 'puffDay' | 'fund' | 'needsMet' | 'tokens' | 'quests' | 'stall'>;

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
  /** Snacks and the like taken today; back each morning. */
  picked: Taken = { day: 0, ids: [] };
  names: Names = { ...DEFAULT_NAMES };
  plots: Record<string, PlotState> = {};
  grumbles: GrumbleState = { day: 0, list: [] };
  pet: Pet | null = null;
  /** The Town Bloom level last celebrated (it only rises). */
  bloom = 1;
  /** Town jobs done (they count toward Town Bloom). */
  townJobs = 0;
  /** The most spots tidied in a practice dash. */
  dashBest = 0;
  /** The full game, once bought; nights rested at the end of the free spring. */
  unlock: Unlock = { owned: false };
  restNights = 0;
  /** The cloud save version this device last matched, once signed in. */
  cloudVersion: number | undefined = undefined;
  /** Places Puff has been, for the town map. */
  visited: string[] = ['burrow'];
  /** What the townsfolk remember Puff did; how far each drama has got. */
  memories: Memory[] = [];
  dramas: Record<string, number> = {};
  /** Puff's skill XP, and today's count of each kind of action. */
  skills: SkillLog = { xp: {}, day: 0, counts: {} };
  /** Today's snack and new places, for Puff's mood. */
  puffDay: PuffDay = { day: 0, ate: false, places: [] };
  /** The town fund, and the town needs met so far. */
  fund = 0;
  needsMet: string[] = [];
  /** Thank-you notes from each neighbour (neighbours/tokens.ts). */
  tokens: Record<string, number> = {};
  /** How far each quest has got (quests/quests.ts). */
  quests: QuestLogState = {};
  /** What's out on Puff's market stall (stall/stall.ts). */
  stall: StallState = { slots: [] };
  finds: Finds = { cleans: {}, found: [] };
  /** What Puff is wearing (an earned outfit), if anything. */
  outfit: string | null = null;
  /** Decor placed around town. */
  decor: Placed[] = [];
  caves: CaveState = { mined: [], resetDay: 0 };

  has(flag: string) { return this.flags.includes(flag); }
  /** Note a place Puff has been, for the town map. */
  visit(area: string) { if (!this.visited.includes(area)) this.visited.push(area); }
  /** Set a save flag (once). */
  flag(flag: string) { if (!this.flags.includes(flag)) this.flags.push(flag); }
  friendOf(id: string) { return (this.friends[id] ??= { points: 0, talkedDay: 0, met: false }); }

  toSave(): ProgressSave {
    return {
      fluff: { value: this.fluff.value, max: this.fluff.max, boost: this.fluff.boost }, sparkles: this.sparkles,
      bag: this.bag.slots, tools: this.tools, crops: this.crops, flags: this.flags, friends: this.friends,
      onboarding: this.onboarding.step, onboardingAhead: this.onboarding.ahead, chores: this.chores,
      requests: this.requests, picked: this.picked, lastClean: this.lastClean, names: this.names, plots: this.plots, grumbles: this.grumbles, pet: this.pet, bloom: this.bloom, finds: this.finds, outfit: this.outfit, decor: this.decor, caves: this.caves, townJobs: this.townJobs, dashBest: this.dashBest, unlock: this.unlock, restNights: this.restNights, cloudVersion: this.cloudVersion, visited: this.visited, memories: this.memories, dramas: this.dramas, skills: this.skills, puffDay: this.puffDay, fund: this.fund, needsMet: this.needsMet, tokens: this.tokens, quests: this.quests, stall: this.stall
    };
  }

  /** Take on a save's progress, filling gaps in older saves. */
  load(save: ProgressSave) {
    this.fluff = new Fluff(save.fluff.value, save.fluff.max, save.fluff.boost);
    this.sparkles = save.sparkles;
    this.bag = new Bag(save.bag.length ? save.bag : undefined);
    this.tools = { hands: 1, ...save.tools };
    this.crops = save.crops ?? [];
    this.flags = save.flags ?? [];
    this.friends = save.friends ?? {};
    this.onboarding = new Onboarding(save.onboarding ?? 0, save.onboardingAhead ?? {});
    this.chores = save.chores ?? this.chores;
    if (save.requests && typeof save.requests === 'object') this.requests = save.requests;
    this.lastClean = typeof save.lastClean === 'string' ? save.lastClean : 'none';
    this.picked = save.picked ?? { day: 0, ids: [] };
    this.names = { ...DEFAULT_NAMES, ...save.names };
    this.plots = save.plots ?? {};
    this.grumbles = save.grumbles ?? { day: 0, list: [] };
    this.pet = save.pet ?? null;
    this.bloom = save.bloom ?? 1;
    this.townJobs = save.townJobs ?? 0;
    this.dashBest = save.dashBest ?? 0;
    this.unlock = save.unlock?.owned ? save.unlock : { owned: false };
    this.restNights = save.restNights ?? 0;
    this.cloudVersion = typeof save.cloudVersion === 'number' ? save.cloudVersion : undefined;
    // Older saves never noted where Puff had been: the map starts at the burrow and fills in as they walk.
    this.visited = Array.isArray(save.visited) ? save.visited : ['burrow'];
    this.memories = Array.isArray(save.memories) ? save.memories : [];
    this.dramas = save.dramas ?? {};
    this.skills = save.skills?.xp ? save.skills : { xp: {}, day: 0, counts: {} };
    this.puffDay = Array.isArray(save.puffDay?.places) ? save.puffDay : { day: 0, ate: false, places: [] };
    this.fund = typeof save.fund === 'number' ? save.fund : 0;
    this.needsMet = Array.isArray(save.needsMet) ? save.needsMet : [];
    this.tokens = save.tokens && typeof save.tokens === 'object' ? save.tokens : {};
    this.quests = save.quests && typeof save.quests === 'object' ? save.quests : {};
    this.stall = Array.isArray(save.stall?.slots) ? save.stall : { slots: [] };
    this.finds = save.finds ?? { cleans: {}, found: [] };
    this.outfit = typeof save.outfit === 'string' ? save.outfit : null;
    this.decor = Array.isArray(save.decor) ? save.decor : [];
    this.caves = save.caves ?? { mined: [], resetDay: 0 };
  }
}
