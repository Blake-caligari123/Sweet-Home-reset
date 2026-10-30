// The game's side of the optional server (BACKEND-PLAN steps 2, 4, 7 and 14). On the web the
// session is a cookie; the phone apps keep a Bearer token. Every call fails soft: the game never
// waits on the network, and a failed call just means "not right now".

export interface Me { id: string; email: string | null; fullGame: boolean }
export interface CloudSave { version: number; blob: string; savedAt: string | null; deviceId: string }
/** A save landed (its new version), clashed with the cloud copy, or couldn't be sent right now. */
export type Put = { version: number } | { conflict: CloudSave | null } | 'error';

const TOKEN_KEY = 'shr_session';

export class Api {
  constructor(private origin: string, private native: boolean) {}

  private get token() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
  private set token(v: string | null) { try { if (v) localStorage.setItem(TOKEN_KEY, v); else localStorage.removeItem(TOKEN_KEY); } catch { /* private window */ } }

  private async call(path: string, init: RequestInit & { json?: unknown } = {}) {
    const headers = new Headers(init.headers);
    if (init.json !== undefined) headers.set('content-type', 'application/json');
    if (this.native && this.token) headers.set('authorization', `Bearer ${this.token}`);
    try {
      return await fetch(`${this.origin}${path}`, { ...init, headers, credentials: 'include', body: init.json !== undefined ? JSON.stringify(init.json) : init.body });
    } catch { return null; }
  }

  /** Email a sign-in link. `age_required` means a new account needs the 16+ box. */
  async start(email: string, ageConfirmed: boolean): Promise<'sent' | 'age_required' | 'bad_email' | 'unavailable'> {
    const res = await this.call('/api/auth/start', { method: 'POST', json: { email, ageConfirmed } });
    if (res?.ok) return 'sent';
    const error = res && (await res.json().catch(() => ({})) as { error?: string }).error;
    return error === 'age_required' || error === 'bad_email' ? error : 'unavailable';
  }

  /** Use the link's token: starts a session. */
  async verify(token: string) {
    const res = await this.call('/api/auth/verify', { method: 'POST', json: { token } });
    if (!res?.ok) return false;
    this.token = (await res.json() as { token: string }).token;
    return true;
  }

  async me(): Promise<Me | null> { const res = await this.call('/api/me'); return res?.ok ? res.json() as Promise<Me> : null; }

  async signOut() { await this.call('/api/auth/logout', { method: 'POST' }); this.token = null; }

  async cloud(): Promise<CloudSave | null | 'error'> {
    const res = await this.call('/api/save');
    if (res?.status === 404) return null;
    return res?.ok ? res.json() as Promise<CloudSave> : 'error';
  }

  async put(baseVersion: number, blob: string, deviceId: string, savedAt: string, schemaVersion: number): Promise<Put> {
    const res = await this.call('/api/save', { method: 'PUT', json: { baseVersion, blob, deviceId, savedAt, schemaVersion } });
    if (res?.ok) return { version: (await res.json() as { version: number }).version };
    if (res?.status === 409) return { conflict: (await res.json() as { server: CloudSave | null }).server };
    return 'error';
  }

  /** Everything the server keeps, as a file to save. */
  async exportData() { const res = await this.call('/api/me/export'); return res?.ok ? res.blob() : null; }

  async deleteAccount() {
    const res = await this.call('/api/me', { method: 'DELETE' });
    if (!res?.ok) return null;
    this.token = null;
    return (await res.json() as { storeNote: string }).storeNote;
  }
}
