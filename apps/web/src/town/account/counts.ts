// Anonymous play counts (GDD A10, BACKEND-PLAN step 15): a few event names with small numbers, a
// random install id and no cookie, so they can never be tied to a person. Only sent in builds
// with a server, and never when "Share anonymous play counts" is off in Pause.

export type CountName = 'day_started' | 'unlock_offered' | 'unlock_bought';

/** Counts wait a moment so a burst goes as one batch. */
const SEND_AFTER_MS = 2000;

const BATCH_MAX = 50;
const INSTALL_KEY = 'shr_install';

/** This install's random id, kept on the device (a fresh one if storage is blocked). */
export function installId() {
  try {
    const id = localStorage.getItem(INSTALL_KEY) ?? crypto.randomUUID();
    localStorage.setItem(INSTALL_KEY, id);
    return id;
  } catch { return crypto.randomUUID(); }
}

export class Counts {
  private queue: { name: CountName; props?: Record<string, number> }[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private origin: string, private enabled: () => boolean, private install: () => string = installId) {}

  add(name: CountName, props?: Record<string, number>) {
    if (!this.enabled() || this.queue.length >= BATCH_MAX) return;
    this.queue.push(props ? { name, props } : { name });
    this.timer ??= setTimeout(() => { this.timer = undefined; void this.flush(); }, SEND_AFTER_MS);
  }

  /** Send what's waiting; a failed send is simply dropped (they're only counts). */
  async flush() {
    const events = this.queue.splice(0);
    if (!events.length || !this.enabled()) return;
    try {
      await fetch(`${this.origin}/api/events`, { method: 'POST', credentials: 'omit', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ installId: this.install(), events }) });
    } catch { /* offline: fine */ }
  }
}
