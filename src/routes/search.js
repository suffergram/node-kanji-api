const express = require('express');

const { getPool } = require('../db');
const { KANJI_SELECT, VOCAB_SELECT } = require('../utils/query');
const { send } = require('../utils/http');

const router = express.Router();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

router.get('/:query', async (req, res) => {
  try {
    const pool = getPool();
    const pattern = `%${String(req.params.query).toLowerCase()}%`;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitKanji = clamp(
      parseInt(req.query.limitKanji, 10) || 20,
      1,
      50
    );
    const limitVocab = clamp(
      parseInt(req.query.limitVocab, 10) || 20,
      1,
      100
    );
    const offsetKanji = (page - 1) * limitKanji;
    const offsetVocab = (page - 1) * limitVocab;

    const {
      rows: [{ count: kanjiTotal }],
    } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM kanji
       WHERE kanji ILIKE $1
          OR meaning ILIKE $1
          OR replace(kun_reading, ' ', '') ILIKE $1
          OR replace(on_reading, ' ', '') ILIKE $1`,
      [pattern]
    );

    const {
      rows: [{ count: vocabTotal }],
    } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM vocab
       WHERE kanji ILIKE $1
          OR kana ILIKE $1
          OR meaning ILIKE $1
          OR romaji ILIKE $1`,
      [pattern]
    );

    const { rows: kanjiRows } = await pool.query(
      `SELECT ${KANJI_SELECT} FROM kanji
       WHERE kanji ILIKE $1
          OR meaning ILIKE $1
          OR replace(kun_reading, ' ', '') ILIKE $1
          OR replace(on_reading, ' ', '') ILIKE $1
       ORDER BY id
       LIMIT $2 OFFSET $3`,
      [pattern, limitKanji, offsetKanji]
    );

    const kanjiItems = [];
    for (const item of kanjiRows) {
      const { rows: ref } = await pool.query(
        `SELECT ${VOCAB_SELECT} FROM vocab WHERE kanji ILIKE $1 LIMIT 20`,
        [`%${item.kanji}%`]
      );
      kanjiItems.push({ ...item, ref });
    }

    const { rows: vocabItems } = await pool.query(
      `SELECT ${VOCAB_SELECT} FROM vocab
       WHERE kanji ILIKE $1
          OR kana ILIKE $1
          OR meaning ILIKE $1
          OR romaji ILIKE $1
       ORDER BY id
       LIMIT $2 OFFSET $3`,
      [pattern, limitVocab, offsetVocab]
    );

    const content = {
      kanji: { items: kanjiItems, total: kanjiTotal },
      vocab: { items: vocabItems, total: vocabTotal },
    };

    send(res, [content]);
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

module.exports = router;