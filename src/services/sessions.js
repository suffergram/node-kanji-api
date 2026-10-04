const crypto = require('node:crypto');

const { getPool } = require('../db');

async function createSession(userId) {
  const pool = getPool();

  const id = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const sql = 'INSERT INTO sessions(id, user_id, expires_at) VALUES($1,$2,$3)';
  
  await pool.query(sql, [id, userId, expiresAt]);

  return { id, expiresAt };
}

module.exports = {
  createSession,
};
