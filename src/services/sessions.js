const crypto = require('node:crypto');

const { getPool } = require('../db');
const { toPublicUser } = require('../utils/user');

async function createSession(userId) {
  const pool = getPool();

  const id = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const sql = 'INSERT INTO sessions(id, user_id, expires_at) VALUES($1,$2,$3)';

  await pool.query(sql, [id, userId, expiresAt]);

  return { id, expiresAt };
}

async function getSessionUser(sessionId) {
  const pool = getPool();

  const sql =
    'SELECT users.id, users.email, users.display_name FROM users JOIN sessions ON users.id = sessions.user_id WHERE sessions.id = $1 AND expires_at > now()';

  const { rows } = await pool.query(sql, [sessionId]);
  const user = rows[0];
  return user ? toPublicUser(user) : null;
}

async function deleteSession(sessionId) {
  const pool = getPool();

  const sql = 'DELETE FROM sessions WHERE id = $1';

  await pool.query(sql, [sessionId]);
}

module.exports = {
  createSession,
  getSessionUser,
  deleteSession,
};
