import { Hono } from 'hono';

export interface Env { DB: D1Database }

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (context) => context.json({ ok: true }));

app.notFound((context) => context.json({ error: 'not_found' }, 404));

export default app;
