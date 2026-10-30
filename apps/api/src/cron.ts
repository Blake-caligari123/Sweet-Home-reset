// The daily clean-up (BACKEND-PLAN steps 4, 14 and 15), run by a Cron Trigger: accounts deleted more
// than 30 days ago go for good, save history older than 30 days, events older than 13 months, and
// spent sign-in links, sessions and rate-limit counters.

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export async function cleanUp(db: D1Database) {
  const gone = daysAgo(30);
  const now = new Date().toISOString();
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE expires_at < ? OR user_id IN (SELECT id FROM users WHERE deleted_requested_at IS NOT NULL)').bind(now),
    db.prepare('DELETE FROM saves WHERE user_id IN (SELECT id FROM users WHERE deleted_requested_at < ?)').bind(gone),
    db.prepare('DELETE FROM save_history WHERE kept_at < ? OR user_id IN (SELECT id FROM users WHERE deleted_requested_at < ?)').bind(gone, gone),
    db.prepare('DELETE FROM users WHERE deleted_requested_at < ?').bind(gone),
    db.prepare('DELETE FROM events WHERE at < ?').bind(daysAgo(396)),
    db.prepare('DELETE FROM magic_links WHERE expires_at < ?').bind(now),
    db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(Math.floor(Date.now() / 1000) - 86_400)
  ]);
}
