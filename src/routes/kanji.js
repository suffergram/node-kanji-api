const express = require('express');

const { getPool } = require('../db');
const {
  KANJI_SELECT,
  isValidPositiveNumber,
  getLimit,
  getRandomClause,
  withLimit,
} = require('../utils/query');
const { send } = require('../utils/http');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const where = [];
    const params = [];

    if (isValidPositiveNumber(req.query.jlpt)) {
      params.push(Number(req.query.jlpt));
      where.push(`jlpt >= $${params.length}`);
    }

    if (req.query.kanji) {
      const list = String(req.query.kanji).split('').filter(Boolean);
      if (list.length) {
        params.push(list);
        where.push(`kanji = ANY($${params.length}::text[])`);
      }
    }

    let sql = `SELECT ${KANJI_SELECT} FROM kanji`;
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += getRandomClause(req);
    sql = withLimit(sql, params, getLimit(req));

    const { rows } = await pool.query(sql, params);
    send(res, rows);
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const id = parseInt(req.params.id);
    const { rows } = await pool.query(
      `SELECT ${KANJI_SELECT} FROM kanji WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!rows[0]) throw new Error('Not found');
    send(res, rows);
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

module.exports = router;