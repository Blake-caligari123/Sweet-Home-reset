import type { TownState } from '../state';

/** The Grumble families after dust, each pointed to until Puff first befriends one. */
const LATER_GRUMBLES = ['cobweb', 'mud', 'soot', 'reed'];

/** Repairs as they come due: [unlock key, plot, tracker hint]. */
const REPAIRS = [['footbridge', 'plot_footbridge', 'repair.hint'], ['overgrown_path', 'plot_overgrown_path', 'repair.overgrown_path.hint'], ['sea_steps', 'plot_sea_steps', 'repair.sea_steps.hint'], ['hill_steps', 'plot_hill_steps', 'repair.hill_steps.hint']];

/** Newcomers invited by letter, until their cottage is under way: [unlock key, building, tracker hint]. */
const NEWCOMERS = [['invite_sorrel', 'cottage_sorrel', 'invite.hint'], ['invite_fig', 'cottage_fig', 'invite.fig.hint'], ['invite_wren', 'cottage_wren', 'invite.wren.hint'], ['invite_juniper', 'cottage_juniper', 'invite.juniper.hint']];

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
  for (const [key, building, hint] of NEWCOMERS) if (arrived(key) && !Object.values(state.plots).some((p) => p.buildingId === building)) return hint;
  return null;
}
