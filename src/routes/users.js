const express = require('express');
const z = require('zod');

const { getPool } = require('../db');
const { toPublicUser } = require('../utils/user');
const { requireAuth } = require('../middleware/require-auth');
const { validate } = require('../utils/validate');

const router = express.Router();

const usersSchema = z.object({
  displayName: z
    .string({ error: 'Nickname must be a string' })
    .trim()
    .min(1, { error: 'Nickname cannot be empty' })
    .max(32, { error: 'Nickname must be at most 32 characters' })
    .nullable(),
});

router.patch('/me', requireAuth, async (req, res) => {
  const pool = getPool();
  const { displayName } = validate(usersSchema, req.body);

  const sql =
    'UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, email, display_name';

  const { rows } = await pool.query(sql, [displayName, req.user.id]);
  res.json(toPublicUser(rows[0]));
});

module.exports = router;
