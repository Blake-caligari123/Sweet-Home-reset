export type RoomStage = 0 | 25 | 50 | 75 | 100;

export interface SaveBlob {
  schemaVersion: 1;
  deviceId: string;
  rooms: Record<string, { stage: RoomStage; maskProgress: number }>;
  ownedItems: string[];
  cosyDays: number;
}

export const ROOM_CLEAN_THRESHOLD = 95;
export const DAILY_CHORE_REWARD_CAP = 5;

/** The town save's schema version (the game writes it; the API refuses anything newer). */
export const TOWN_SAVE_SCHEMA = 3;
/** The largest save the API keeps (BACKEND-PLAN §2: under 256 KB). */
export const SAVE_MAX_BYTES = 256 * 1024;
