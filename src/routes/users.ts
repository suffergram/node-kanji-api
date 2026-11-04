import { raw, Router } from 'express';
import { object, string, email as _email } from 'zod';
import { hash } from 'bcryptjs';
import { DatabaseError } from 'pg';

import { getPool } from '../db.js';
import { toPublicUser, type UserRow } from '../utils/user.js';
import { requireAuth } from '../middleware/require-auth.js';
import { validate } from '../utils/validate.js';
import { HttpError } from '../utils/http-error.js';
import { deleteOtherSessions } from '../services/sessions.js';
import { sensitiveLimit } from '../middleware/auth-limit.js';
import { verifyPassword } from '../utils/verify-password.js';
import { getCookieOptions } from '../utils/cookies.js';
import { getAuthUser } from '../utils/get-auth-user.js';
import { isValidImage } from '../utils/is-valid-image.js';
import { isValidId } from '../utils/is-valid-id.js';

type AvatarSelect = {
  image: Buffer;
  mime_type: string;
};

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
  const user = getAuthUser(req);
  const pool = getPool();
  const { displayName } = validate(profileSchema, req.body);

  const sql =
    'UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, email, display_name, avatar_updated_at';

  const { rows } = await pool.query<UserRow>(sql, [displayName, user.id]);
  res.json(toPublicUser(rows[0]));
});

usersRouter.patch(
  '/me/password',
  requireAuth,
  sensitiveLimit,
  async (req, res) => {
    const user = getAuthUser(req);
    const pool = getPool();
    const { currentPassword, newPassword } = validate(passwordSchema, req.body);
    const isCurrentPasswordValid = await verifyPassword(
      user.id,
      currentPassword
    );

    if (!isCurrentPasswordValid) {
      throw new HttpError(403, 'Current password is incorrect');
    }

    const isNewPasswordValid = await verifyPassword(user.id, newPassword);

    if (isNewPasswordValid) {
      throw new HttpError(400, 'New password must be different');
    }

    const passwordHash = await hash(newPassword, 12);
    const sql = 'UPDATE users SET password_hash = $1 WHERE id = $2';

    await pool.query(sql, [passwordHash, user.id]);
    await deleteOtherSessions(user.id, req.cookies.sid);

    res.status(204).end();
  }
);

usersRouter.patch(
  '/me/email',
  requireAuth,
  sensitiveLimit,
  async (req, res) => {
    const user = getAuthUser(req);
    const pool = getPool();
    const { email, currentPassword } = validate(emailSchema, req.body);
    const isPasswordValid = await verifyPassword(user.id, currentPassword);

    if (!isPasswordValid) {
      throw new HttpError(403, 'Current password is incorrect');
    }

    const sql =
      'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, display_name, avatar_updated_at';

    let userRow;
    try {
      const { rows } = await pool.query<UserRow>(sql, [
        email.toLowerCase(),
        user.id,
      ]);
      userRow = rows[0];
    } catch (error) {
      if (error instanceof DatabaseError && error.code === '23505') {
        throw new HttpError(409, 'This email is already in use');
      }
      throw error;
    }

    await deleteOtherSessions(user.id, req.cookies.sid);
    res.json(toPublicUser(userRow));
  }
);

usersRouter.delete('/me', requireAuth, sensitiveLimit, async (req, res) => {
  const user = getAuthUser(req);
  const pool = getPool();

  const { currentPassword } = validate(currentPasswordSchema, req.body);
  const isPasswordValid = await verifyPassword(user.id, currentPassword);

  if (!isPasswordValid) {
    throw new HttpError(403, 'Current password is incorrect');
  }

  const sql = 'DELETE FROM users WHERE id = $1';

  await pool.query(sql, [user.id]);

  res.clearCookie('sid', getCookieOptions());
  res.status(204).end();
});

usersRouter.get('/:id/avatar', async (req, res) => {
  const pool = getPool();

  if (!isValidId(req.params.id)) {
    throw new HttpError(400, 'Invalid ID');
  }

  const sql = 'SELECT image, mime_type FROM user_avatars WHERE user_id = $1';

  const { rows } = await pool.query<AvatarSelect>(sql, [req.params.id]);
  if (!rows[0]) {
    throw new HttpError(404, 'Avatar not found');
  }

  const { image, mime_type } = rows[0];

  res.type(mime_type);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const version = req.query.v;
  const hasVersion = typeof version === 'string' && /^\d+$/.test(version);

  res.setHeader(
    'Cache-Control',
    hasVersion ? 'public, max-age=31536000, immutable' : 'no-cache'
  );

  res.send(image);
});

usersRouter.put(
  '/me/avatar',
  requireAuth,
  raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '200kb' }),
  async (req, res) => {
    if (
      !req.body ||
      !(req.body instanceof Buffer) ||
      !isValidImage(req.body, req.headers['content-type'] ?? '')
    ) {
      throw new HttpError(400, 'Invalid image');
    }

    const user = getAuthUser(req);
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'INSERT INTO user_avatars (user_id, image, mime_type) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET image = EXCLUDED.image, mime_type = EXCLUDED.mime_type, updated_at = now()',
        [user.id, req.body, req.headers['content-type'] ?? '']
      );
      const { rows } = await client.query<UserRow>(
        'UPDATE users SET avatar_updated_at = now() WHERE id = $1 RETURNING id, email, display_name, avatar_updated_at',
        [user.id]
      );

      await client.query('COMMIT');
      res.json(toPublicUser(rows[0]));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
);

usersRouter.delete('/me/avatar', requireAuth, async (req, res) => {
  const user = getAuthUser(req);
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM user_avatars WHERE user_id = $1', [
      user.id,
    ]);
    const { rows } = await client.query<UserRow>(
      'UPDATE users SET avatar_updated_at = NULL WHERE id = $1 RETURNING id, email, display_name, avatar_updated_at',
      [user.id]
    );

    await client.query('COMMIT');
    res.json(toPublicUser(rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
