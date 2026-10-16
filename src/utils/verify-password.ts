import { compare } from 'bcryptjs';
import { getPool } from '../db.js';

type PasswordSelect = {
  password_hash: string;
};

export async function verifyPassword(userId: string, password: string) {
  const pool = getPool();

  const sql = 'SELECT password_hash FROM users WHERE id = $1';

  const { rows } = await pool.query<PasswordSelect>(sql, [userId]);
  const user = rows[0];

  return compare(password, user['password_hash']);
}
