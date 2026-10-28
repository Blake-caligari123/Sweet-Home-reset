import type { TownState } from '../state';

/** The Grumble families after dust, each pointed to until Puff first befriends one. */
const LATER_GRUMBLES = ['cobweb', 'mud', 'soot'];

/** Repairs as they come due: [unlock key, plot, tracker hint]. */
const REPAIRS = [['footbridge', 'plot_footbridge', 'repair.hint'], ['sea_steps', 'plot_sea_steps', 'repair.sea_steps.hint']];

/**
 * When there's no tip or job to show, the tracker points to the newest thing to try (VISION §8: a
 * new thing every couple of days), until Puff has tried it. Returns a string id, or null.
 */
export function nudge(state: TownState, arrived: (key: string) => boolean, letterHint: string | null = null): string | null {
  if (letterHint) return letterHint;
  if (arrived('building') && !Object.keys(state.plots).length) return 'build.hint';
  if (arrived('grumble_dust') && !state.has('grumble_friend')) return 'grumble.hint';
  if (arrived('pet') && !state.pet) return 'pet.hint';
  for (const f of LATER_GRUMBLES) if (arrived(`grumble_${f}`) && !state.has(`grumble_friend_${f}`)) return `grumble.${f}.hint`;
  for (const [key, plot, hint] of REPAIRS) if (arrived(key) && !state.plots[plot]) return hint;
  if (arrived('invite_sorrel') && !Object.values(state.plots).some((p) => p.buildingId === 'cottage_sorrel')) return 'invite.hint';
  return null;
}
