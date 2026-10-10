import { compare } from 'bcryptjs';
import { getPool } from '../db.js';

export async function verifyPassword(userId, password) {
  const pool = getPool();

  const sql = 'SELECT password_hash FROM users WHERE id = $1';

  const { rows } = await pool.query(sql, [userId]);
  const user = rows[0];

  return compare(password, user['password_hash']);
}
