const express = require('express');

const { getPool } = require('../db');
const { getOptions } = require('../services/get-options');
const {
  VOCAB_SELECT,
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

    if (req.query.word) {
      params.push(String(req.query.word));
      where.push(`kanji = $${params.length}`);
    }

    if (req.query.kanji) {
      const list = String(req.query.kanji)
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      if (list.length) {
        params.push(list);
        where.push(
          `EXISTS (SELECT 1 FROM unnest($${params.length}::text[]) k WHERE vocab.kanji LIKE '%' || k || '%')`
        );
      }
    }

    if (isValidPositiveNumber(req.query.kanjiJlpt)) {
      const jlpt = Number(req.query.kanjiJlpt);
      params.push(jlpt);
      where.push(`NOT EXISTS (
        SELECT 1
        FROM regexp_split_to_table(vocab.kanji, '') ch
        WHERE ch <> ALL (
          SELECT kanji FROM kanji WHERE jlpt >= $${params.length}
          UNION
          SELECT kana FROM kana
        )
      )`);
    }

    let sql = `SELECT ${VOCAB_SELECT} FROM vocab`;
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += getRandomClause(req);
    sql = withLimit(sql, params, getLimit(req));

    let content = (await pool.query(sql, params)).rows;

    if (isValidPositiveNumber(req.query.options) && Number(req.query.options) > 1) {
      content = await getOptions(pool, content, Number(req.query.options));
    }

    send(res, content);
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
      `SELECT ${VOCAB_SELECT} FROM vocab WHERE id = $1 LIMIT 1`,
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