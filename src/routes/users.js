import { Router } from 'express';
import { object, string, email as _email } from 'zod';
import { hash } from 'bcryptjs';

import { getPool } from '../db.js';
import { toPublicUser } from '../utils/user.js';
import { requireAuth } from '../middleware/require-auth.js';
import { validate } from '../utils/validate.js';
import { HttpError } from '../utils/http-error.js';
import { deleteOtherSessions } from '../services/sessions.js';
import { sensitiveLimit } from '../middleware/auth-limit.js';
import { verifyPassword } from '../utils/verify-password.js';
import { getCookieOptions } from '../utils/cookies.js';

export const usersRouter = Router();

const profileSchema = object({
  displayName: string({ error: 'Nickname must be a string' })
    .trim()
    .min(1, { error: 'Nickname cannot be empty' })
    .max(32, { error: 'Nickname must be at most 32 characters' })
    .nullable(),
});

const passwordSchema = object({
  currentPassword: string({ error: 'Password is required' })
    .max(72, { error: 'Password must be at most 72 characters' })
    .nonempty(),
  newPassword: string({ error: 'Password is required' })
    .min(8, { error: 'Password must be at least 8 characters' })
    .max(72, { error: 'Password must be at most 72 characters' }),
});

const emailSchema = object({
  email: _email({ error: 'Enter a valid email address' }),
  currentPassword: string({ error: 'Password is required' })
    .max(72, { error: 'Password must be at most 72 characters' })
    .nonempty(),
});

const currentPasswordSchema = object({
  currentPassword: string({ error: 'Password is required' })
    .max(72, { error: 'Password must be at most 72 characters' })
    .nonempty(),
});

usersRouter.patch('/me', requireAuth, async (req, res) => {
  const pool = getPool();
  const { displayName } = validate(profileSchema, req.body);

  const sql =
    'UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, email, display_name';

  const { rows } = await pool.query(sql, [displayName, req.user.id]);
  res.json(toPublicUser(rows[0]));
});

usersRouter.patch('/me/password', requireAuth, sensitiveLimit, async (req, res) => {
  const pool = getPool();
  const { currentPassword, newPassword } = validate(passwordSchema, req.body);
  const isCurrentPasswordValid = await verifyPassword(
    req.user.id,
    currentPassword
  );

  if (!isCurrentPasswordValid) {
    throw new HttpError(403, 'Current password is incorrect');
  }

  const isNewPasswordValid = await verifyPassword(req.user.id, newPassword);

  if (isNewPasswordValid) {
    throw new HttpError(400, 'New password must be different');
  }

  const passwordHash = await hash(newPassword, 12);
  const sql = 'UPDATE users SET password_hash = $1 WHERE id = $2';

  await pool.query(sql, [passwordHash, req.user.id]);
  await deleteOtherSessions(req.user.id, req.cookies.sid);

  res.status(204).end();
});

usersRouter.patch('/me/email', requireAuth, sensitiveLimit, async (req, res) => {
  const pool = getPool();
  const { email, currentPassword } = validate(emailSchema, req.body);
  const isPasswordValid = await verifyPassword(req.user.id, currentPassword);

  if (!isPasswordValid) {
    throw new HttpError(403, 'Current password is incorrect');
  }

  const sql =
    'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, display_name';

  let user;
  try {
    const { rows } = await pool.query(sql, [email.toLowerCase(), req.user.id]);
    user = rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'This email is already in use');
    }
    throw error;
  }

  await deleteOtherSessions(req.user.id, req.cookies.sid);
  res.json(toPublicUser(user));
});

usersRouter.delete('/me', requireAuth, sensitiveLimit, async (req, res) => {
  const pool = getPool();

  const { currentPassword } = validate(currentPasswordSchema, req.body);
  const isPasswordValid = await verifyPassword(req.user.id, currentPassword);

  if (!isPasswordValid) {
    throw new HttpError(403, 'Current password is incorrect');
  }

  const sql = 'DELETE FROM users WHERE id = $1';

  await pool.query(sql, [req.user.id]);

  res.clearCookie('sid', getCookieOptions());
  res.status(204).end();
});
