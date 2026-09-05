const express = require('express');

const { getPool } = require('../db');
const { KANJI_SELECT, VOCAB_SELECT } = require('../utils/query');
const { send } = require('../utils/http');

const router = express.Router();

router.get('/:query', async (req, res) => {
  try {
    const pool = getPool();
    const pattern = `%${String(req.params.query).toLowerCase()}%`;

    const { rows: kanjiRows } = await pool.query(
      `SELECT ${KANJI_SELECT} FROM kanji
       WHERE kanji ILIKE $1
          OR meaning ILIKE $1
          OR replace(kun_reading, ' ', '') ILIKE $1
          OR replace(on_reading, ' ', '') ILIKE $1
       LIMIT 20`,
      [pattern]
    );

    const kanjiResult = [];
    for (const item of kanjiRows) {
      const { rows: ref } = await pool.query(
        `SELECT ${VOCAB_SELECT} FROM vocab WHERE kanji ILIKE $1 LIMIT 20`,
        [`%${item.kanji}%`]
      );
      kanjiResult.push({ ...item, ref });
    }

    const { rows: vocabResult } = await pool.query(
      `SELECT ${VOCAB_SELECT} FROM vocab
       WHERE kanji ILIKE $1
          OR kana ILIKE $1
          OR meaning ILIKE $1
          OR romaji ILIKE $1
       LIMIT 20`,
      [pattern]
    );

    const content = {};
    kanjiResult.length > 0 && (content.kanji = kanjiResult);
    vocabResult.length > 0 && (content.vocab = vocabResult);

    if (!content.kanji && !content.vocab) throw new Error('Not found');
    send(res, [content]);
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

module.exports = router;