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
