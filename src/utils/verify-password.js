const { getPool } = require('../db');
const bcrypt = require('bcryptjs');

async function verifyPassword(userId, password) {
  const pool = getPool();

  const sql = 'SELECT password_hash FROM users WHERE id = $1';

  const { rows } = await pool.query(sql, [userId]);
  const user = rows[0];

  return bcrypt.compare(password, user['password_hash']);
}

module.exports = {
  verifyPassword,
};
