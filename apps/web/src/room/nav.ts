export type Screen = 'title' | 'home' | 'room' | 'shop' | 'settings' | 'chores';
export type Overlay = 'pause' | 'restored' | null;
export type BackAction = 'pause' | 'resume' | 'home' | 'minimize' | 'none';

/** What the Android back button (and Escape on the web) does on each screen. */
export function backAction(screen: Screen, overlay: Overlay): BackAction {
  if (screen === 'room') {
    if (overlay === 'pause') return 'resume';
    if (overlay === 'restored') return 'none';
    return 'pause';
  }
  if (screen === 'shop' || screen === 'settings' || screen === 'chores') return 'home';
  return 'minimize';
}
