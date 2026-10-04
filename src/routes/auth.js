const express = require('express');
const z = require('zod');
const bcrypt = require('bcryptjs');

const { HttpError } = require('../utils/http-error');
const { getPool } = require('../db');

const router = express.Router();

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

router.post('/register', async (req, res) => {
  const pool = getPool();

  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(400, 'Email or password not valid');
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const sql = `INSERT INTO users(email, password_hash) values ($1,$2) RETURNING id`;
  let user;
  try {
    const { rows } = await pool.query(sql, [email, passwordHash]);
    user = rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Email already registered');
    }
    throw error;
  }

  res.status(201).json({ id: user.id, email });
});

module.exports = router;
