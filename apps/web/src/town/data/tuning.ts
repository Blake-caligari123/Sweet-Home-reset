// Every gameplay number comes from claude/config/tuning.json (GDD v3 A8). Never hard-code them.
import raw from '../../../../../claude/config/tuning.json';

export interface Tuning {
  dayRealMinutes: number;
  /** Day 1 runs slower so the first half hour (A6) fits in it. */
  firstDayRealMinutes: number;
  gameMinutesPerTick: number;
  fluffStart: number;
  fluffMaxStep: number;
  fluffToolUse: number;
  fluffCharged: [number, number];
  fluffLowThreshold: number;
  dozeWakeFluffFraction: number;
  restoreThreshold: number;
  messHitsTier1: Record<string, number>;
  bagSlotsStart: number;
  gardenPlotStart: [number, number];
  realChoreReward: { sparkles: number; maxFluffBonus: number };
  realChoreCapPerDay: number;
  requestsPerDay: [number, number];
  requestExpiryDays: [number, number];
  relaxedMode: { fluffCostMultiplier: number; doze: boolean; requestExpiry: boolean };
  friendship: { talk: number; liked: number; loved: number; request: number; pointsPerHeart: number; letter: number };
  /** The free first spring (VISION §10): the last day before the full game needs the one unlock. */
  freeDays: number;
  /** After a "Not now", the unlock postcard comes back after this many rest nights. */
  unlockOfferRepeatNights: number;
  autosaveSeconds: number;
  townName: string;
  fountainName: string;
  walkTilesPerSecond?: number;
  walkTilesPerSecondTired?: number;
  /** Map travel costs game time, as walking would: this many minutes per door passed. */
  mapTravelMinutesPerHop: number;
  /** Moss's thank-you for finding every surprise find. */
  findSetSparkles: number;
  /** Tidy chains: how soon the next spot must clear to keep a chain going, how often it pays, how much (growing), and the most. */
  tidyChain: { windowMs: number; every: number; sparkles: number; maxSparkles: number };
  /** Spots each neighbour tidies each morning once Puff has restored their home (life/helpers.ts). */
  helperSpots: number;
  /** The town fund: what each neighbour chips in each morning, happy (or glowing) and otherwise. */
  townFund: { perHappy: number; perOther: number };
  /** Puff's own moods (NEXT-PHASE §5.2): a happy swing's share of the usual time, a curious Puff's share of cleans between finds. */
  puffMood: { happySwingShare: number; curiousFindShare: number; cosyBurrow: number; curiousPlaces: number };
  /** Puff's skills (skills/skills.ts): XP per action, how many a day earn full XP, the share after that,
   * the XP each level starts at, and each skill's perk per level above 1. */
  skills: { xp: number; fullXpPerDay: number; tiredXpShare: number; levelXp: number[]; perks: Record<'tidying' | 'farming' | 'cooking' | 'crafting' | 'exploring', number> };
  /** Pinch zoom: the closest and furthest view, in tiles across. */
  zoomTiles: [number, number];
  neighbourWalkTilesPerSecond?: number;
  colourRippleMs?: number;
  toolSwingMs?: number;
  putAwaySparkles?: number;
  cropDays?: Record<string, number>;
  /** Crops that grow back after picking: days from picked to ready again. */
  cropRegrowDays?: Record<string, number>;
  /** The year-one schedule (VISION §8): when each thing arrives. Read only through `isUnlocked`. */
  unlocks: Record<string, UnlockRule>;
  /** Grumbles (VISION §7): how many gather per area, helpers kept, how fast they amble. */
  grumbles: { perAreaMax: number; helpersMax: number; driftTilesPerSecond: number };
  /** How far behind Puff the pet trots, in world px. */
  petFollowPx: number;
  /** Light mess drifting back into restored places overnight: how much a night, and the most there can be. */
  messReturn: { perNight: number; maxFresh: number };
  /** Town Bloom: points needed for each level (level 1 at 0). */
  bloomLevels: number[];
  /** A surprise find turns up every this many cleans in a place. */
  findEveryCleans: number;
  /** Caves: days until broken rocks are back, Fluff a swing, swings per rock size. */
  caves: { resetDays: number; fluffPerSwing: number; rockHits: Record<string, number> };
  /** Rain: dry for the first days, then a chance per season (spring, summer, autumn, winter). */
  weather: { dryFirstDays: number; rainChance: number[] };
  /** The any-day tidy dash at the fair stall: how long and how many spots. */
  practiceDash: { seconds: number; spots: number };
}

/** Open on or after `day`, once story flag `flag` is set (either may be left out). */
export interface UnlockRule { day?: number; flag?: string }

export const TUNING: Tuning = raw as unknown as Tuning;

/** Values the frontend plan lists in its tuning table but tuning.json doesn't carry yet. */
export const WALK_SPEED = TUNING.walkTilesPerSecond ?? 4;
export const WALK_SPEED_TIRED = TUNING.walkTilesPerSecondTired ?? 3;
export const NEIGHBOUR_WALK_SPEED = TUNING.neighbourWalkTilesPerSecond ?? 2.5;
export const RIPPLE_MS = TUNING.colourRippleMs ?? 300;
export const SWING_MS = TUNING.toolSwingMs ?? 260;
export const PUTAWAY_SPARKLES = TUNING.putAwaySparkles ?? 5;
export const cropDays = (crop: string) => TUNING.cropDays?.[crop] ?? 3;
