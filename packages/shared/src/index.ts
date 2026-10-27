export type RoomStage = 0 | 25 | 50 | 75 | 100;

export type ItemSlot = 'puff_tool' | 'puff_outfit';

/** DOM and native settings. The kitchen prototype does not write this yet (frontend plan F9). */
export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  captions: boolean;
  notifications: boolean;
  analytics: boolean;
}

/**
 * Synced save shape from docs/FRONTEND-PLAN.md §7.
 * mask_progress is the name both sides store. The playable kitchen still keeps
 * its own spot list in IndexedDB until the SaveBlob migration in F9.
 */
export interface SaveBlob {
  schemaVersion: 1;
  deviceId: string;
  rooms: Record<string, { stage: RoomStage; mask_progress: number }>;
  ownedItems: string[];
  equipped: Record<ItemSlot, string | null>;
  cosyDays: number;
  settings: Settings;
}

export const ROOM_CLEAN_THRESHOLD = 95;
export const ROOM_STAGES = [25, 50, 75, 100] as const;
export const DAILY_CHORE_REWARD_CAP = 5;

export const APP_BUNDLE_ID = 'com.pixelvortexgames.sweethomereset';
