const express = require('express');
const z = require('zod');
const bcrypt = require('bcryptjs');

const { getPool } = require('../db');
const { toPublicUser } = require('../utils/user');
const { requireAuth } = require('../middleware/require-auth');
const { validate } = require('../utils/validate');
const { HttpError } = require('../utils/http-error');
const { deleteOtherSessions } = require('../services/sessions');
const { changePasswordLimit } = require('../middleware/auth-limit');

const router = express.Router();

const usersSchema = z.object({
  displayName: z
    .string({ error: 'Nickname must be a string' })
    .trim()
    .min(1, { error: 'Nickname cannot be empty' })
    .max(32, { error: 'Nickname must be at most 32 characters' })
    .nullable(),
});

const passwordSchema = z.object({
  currentPassword: z
    .string({ error: 'Incorrect Password' })
    .max(72, { error: 'Password cannot exceed 72 characters' })
    .nonempty(),
  newPassword: z
    .string({ error: 'Incorrect Password' })
    .min(8, { error: 'Password must be at least 8 characters' })
    .max(72, { error: 'Password cannot exceed 72 characters' }),
});

router.patch('/me', requireAuth, async (req, res) => {
  const pool = getPool();
  const { displayName } = validate(usersSchema, req.body);

  const sql =
    'UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, email, display_name';

  const { rows } = await pool.query(sql, [displayName, req.user.id]);
  res.json(toPublicUser(rows[0]));
});

router.patch(
  '/me/password',
  requireAuth,
  changePasswordLimit,
  async (req, res) => {
    const pool = getPool();
    const { currentPassword, newPassword } = validate(passwordSchema, req.body);

    const selectSql = 'SELECT password_hash FROM users WHERE id = $1';

    const { rows } = await pool.query(selectSql, [req.user.id]);
    const user = rows[0];

    const currentPasswordValidation = await bcrypt.compare(
      currentPassword,
      user['password_hash']
    );

    if (!currentPasswordValidation) {
      throw new HttpError(403, 'Current password is incorrect');
    }

    const newPasswordValidation = await bcrypt.compare(
      newPassword,
      user['password_hash']
    );

    if (newPasswordValidation) {
      throw new HttpError(400, 'New password must be different');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updateSql = `UPDATE users SET password_hash = $1 WHERE id = $2`;

    await pool.query(updateSql, [passwordHash, req.user.id]);

    await deleteOtherSessions(req.user.id, req.cookies.sid);

    res.status(204).end();
  }
);

module.exports = router;
