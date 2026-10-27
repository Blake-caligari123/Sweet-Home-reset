export interface HomeRoom {
  id: string;
  title: string;
  /** False until that room's pack data and scene exist. Copy stays warm either way. */
  playable: boolean;
}

/** Room ids use hyphens. Art files use the same words with underscores (docs/ASSET-PROMPTS.md). */
export const HOME_ROOMS: HomeRoom[] = [
  { id: 'kitchen-nook', title: 'Kitchen Nook', playable: true },
  { id: 'living-room', title: 'Living Room', playable: false },
  { id: 'bedroom', title: 'Bedroom', playable: false }
];
