import { Hono } from 'hono';
import { account, DELETE_PAGE } from './account';
import { apple } from './apple';
import { auth } from './auth';
import { billing } from './billing';
import { cleanUp } from './cron';
import type { App, Env } from './env';
import { events } from './events';
import { fail, headers, sameOrigin } from './guard';
import { sync } from './sync';

// The API (BACKEND-PLAN): optional accounts, sync, the one unlock and privacy. The game itself runs
// on the device and never waits on any of this.
const app = new Hono<App>();

app.use('*', headers);
app.use('/api/*', sameOrigin);

app.get('/api/health', (c) => c.json({ ok: true }));
app.route('/api/auth', auth);
app.route('/api/auth/apple', apple);
app.route('/api/me', account);
app.route('/api/save', sync);
app.route('/api', billing);
app.route('/api/events', events);
app.get('/delete-account', (c) => c.html(DELETE_PAGE));

app.notFound((c) => fail(c, 404, 'not_found'));
app.onError((_e, c) => fail(c, 500, 'server_error'));

export default {
  fetch: app.fetch,
  /** The daily Cron Trigger (wrangler.toml). */
  scheduled: (_event: ScheduledController, env: Env, ctx: ExecutionContext) => ctx.waitUntil(cleanUp(env.DB))
};

export { app };
