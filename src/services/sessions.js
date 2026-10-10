import { randomBytes } from 'node:crypto';

import { getPool } from '../db.js';
import { toPublicUser } from '../utils/user.js';

export async function createSession(userId) {
  const pool = getPool();

  const id = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const sql = 'INSERT INTO sessions(id, user_id, expires_at) VALUES($1,$2,$3)';

  await pool.query(sql, [id, userId, expiresAt]);

  return { id, expiresAt };
}

export async function getSessionUser(sessionId) {
  const pool = getPool();

  const sql =
    'SELECT users.id, users.email, users.display_name FROM users JOIN sessions ON users.id = sessions.user_id WHERE sessions.id = $1 AND expires_at > now()';

  const { rows } = await pool.query(sql, [sessionId]);
  const user = rows[0];
  return user ? toPublicUser(user) : null;
}

export async function deleteSession(sessionId) {
  const pool = getPool();

  const sql = 'DELETE FROM sessions WHERE id = $1';

  await pool.query(sql, [sessionId]);
}

export async function deleteOtherSessions(userId, sessionId) {
  const pool = getPool();

  const sql = 'DELETE FROM sessions WHERE user_id = $1 AND id <> $2';

  await pool.query(sql, [userId, sessionId]);
}
