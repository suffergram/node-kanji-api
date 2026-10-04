const express = require('express');
const z = require('zod');
const bcrypt = require('bcryptjs');

const { HttpError } = require('../utils/http-error');
const { getPool } = require('../db');
const { createSession } = require('../services/sessions');
const { requireAuth } = require('../middleware/require-auth');

const router = express.Router();

const getCookieOptions = (session) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  expires: session.expiresAt,
});

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().nonempty().max(72),
});

router.post('/register', async (req, res) => {
  const pool = getPool();

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid email or password');
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const sql = `INSERT INTO users(email, password_hash) VALUES ($1,$2) RETURNING id`;
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

  const session = await createSession(user.id);

  res.cookie('sid', session.id, getCookieOptions(session));
  res.status(201).json({ id: user.id, email });
});

router.post('/login', async (req, res) => {
  const pool = getPool();

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid email or password');
  }

  const email = parsed.data.email.toLowerCase();

  const sql = 'SELECT id, email, password_hash FROM users WHERE email = $1';

  const { rows } = await pool.query(sql, [email]);
  const user = rows[0];

  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const passwordValidation = await bcrypt.compare(
    parsed.data.password,
    user['password_hash']
  );

  if (!passwordValidation) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const session = await createSession(user.id);

  res.cookie('sid', session.id, getCookieOptions(session));
  res.json({ id: user.id, email });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
