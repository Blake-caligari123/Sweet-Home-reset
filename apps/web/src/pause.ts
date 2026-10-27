interface PauseOptions {
  onChange(paused: boolean): void;
  minimize(): void;
}

// Back opens pause; back again while paused sends the app to the background without losing the room.
export function createPauseController({ onChange, minimize }: PauseOptions) {
  let paused = false;

  function set(next: boolean) {
    if (paused === next) return;
    paused = next;
    onChange(paused);
  }

  return {
    get paused() { return paused; },
    open() { set(true); },
    resume() { set(false); },
    back() {
      if (paused) minimize();
      else set(true);
    }
  };
}
