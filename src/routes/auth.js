import { Router } from 'express';
import { object, email as _email, string } from 'zod';
import { hash, compare } from 'bcryptjs';

import { HttpError } from '../utils/http-error.js';
import { getPool } from '../db.js';
import { createSession, deleteSession } from '../services/sessions.js';
import { requireAuth } from '../middleware/require-auth.js';
import { loginLimit, registerLimit } from '../middleware/auth-limit.js';
import { toPublicUser } from '../utils/user.js';
import { validate } from '../utils/validate.js';
import { getCookieOptions } from '../utils/cookies.js';

export const authRouter = Router();

const registerSchema = object({
  email: _email({ error: 'Enter a valid email address' }),
  password: string({ error: 'Invalid email or password' })
    .min(8, { error: 'Password must be at least 8 characters' })
    .max(72, { error: 'Password must be at most 72 characters' }),
  displayName: string({ error: 'Nickname must be a string or null' })
    .trim()
    .min(1, { error: 'Nickname cannot be empty' })
    .max(32, { error: 'Nickname must be at most 32 characters' })
    .optional()
    .nullable(),
});

const loginSchema = object({
  email: _email({ error: 'Invalid email or password' }),
  password: string({ error: 'Invalid email or password' })
    .nonempty({ error: 'Invalid email or password' })
    .max(72, { error: 'Invalid email or password' }),
});

authRouter.post('/register', registerLimit, async (req, res) => {
  const pool = getPool();

  const { email, password, displayName } = validate(registerSchema, req.body);

  const passwordHash = await hash(password, 12);

  const sql = `INSERT INTO users(email, password_hash, display_name) VALUES ($1,$2,$3) RETURNING id, email, display_name`;
  let user;
  try {
    const { rows } = await pool.query(sql, [
      email.toLowerCase(),
      passwordHash,
      displayName ?? null,
    ]);
    user = rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'This email is already in use');
    }
    throw error;
  }

  const session = await createSession(user.id);

  res.cookie('sid', session.id, getCookieOptions(session));
  res.status(201).json(toPublicUser(user));
});

authRouter.post('/login', loginLimit, async (req, res) => {
  const pool = getPool();

  const { email, password } = validate(loginSchema, req.body);

  const sql =
    'SELECT id, email, password_hash, display_name FROM users WHERE email = $1';

  const { rows } = await pool.query(sql, [email.toLowerCase()]);
  const user = rows[0];

  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const passwordValidation = await compare(password, user['password_hash']);

  if (!passwordValidation) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const session = await createSession(user.id);

  res.cookie('sid', session.id, getCookieOptions(session));
  res.json(toPublicUser(user));
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

authRouter.post('/logout', async (req, res) => {
  const { cookies } = req;

  if (cookies.sid) {
    await deleteSession(cookies.sid);
  }

  res.clearCookie('sid', getCookieOptions());
  res.status(204).end();
});
