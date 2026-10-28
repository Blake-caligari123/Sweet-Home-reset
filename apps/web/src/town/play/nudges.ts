import type { TownState } from '../state';

/**
 * When there's no tip or job to show, the tracker points to the newest thing to try (VISION §8: a
 * new thing every couple of days), until Puff has tried it. Returns a string id, or null.
 */
export function nudge(state: TownState, arrived: (key: string) => boolean, letterHint: string | null = null): string | null {
  if (letterHint) return letterHint;
  if (arrived('building') && !Object.keys(state.plots).length) return 'build.hint';
  if (arrived('grumble_dust') && !state.has('grumble_friend')) return 'grumble.hint';
  if (arrived('pet') && !state.pet) return 'pet.hint';
  if (arrived('footbridge') && !state.plots.plot_footbridge) return 'repair.hint';
  if (arrived('invite_sorrel') && !Object.values(state.plots).some((p) => p.buildingId === 'cottage_sorrel')) return 'invite.hint';
  return null;
}
