const { KANJI_DIFF, KANA_DIFF } = require('../constants/constants');

const KANJI_SELECT =
  'id, jlpt, kanji, romaji_on AS "romajiOn", on_reading AS "on", romaji_kun AS "romajiKun", kun_reading AS "kun", meaning';
const VOCAB_SELECT = 'id, jlpt, kanji, meaning, kana, romaji';

// Build `amount` answer options for every vocab item using only TWO queries:
//   1) one query fetches all kanji characters used across the questions;
//   2) one query (CROSS JOIN LATERAL) fetches options for all questions at once.
async function getOptions(pool, items, amount = 4) {
  const need = amount - 1;
  if (!items.length) return [];

  // All unique kanji characters across every question.
  const allChars = [...new Set(items.flatMap((item) => item.kanji.split('')))];
  const { rows: allKanji } = await pool.query(KANJI_SELECT_FOR_CHARS, [allChars]);

  // One query: for each question (row from unnest), a LATERAL subquery picks
  // its random options. Returns rows tagged with the question id.
  const { rows: optionRows } = await pool.query(OPTIONS_SQL, [
    items.map((item) => item.id),
    items.map((item) => item.jlpt - 1),
    items.map((item) => item.kanji.length),
    items.map((item) => item.kana.length),
    need,
  ]);

  const optionsById = new Map();
  for (const row of optionRows) {
    const { question_id, ...option } = row;
    const qid = Number(question_id);
    if (!optionsById.has(qid)) optionsById.set(qid, []);
    optionsById.get(qid).push(option);
  }

  return items.map((item) => {
    const charSet = new Set(item.kanji.split(''));
    return {
      question: item,
      kanji: allKanji.filter((k) => charSet.has(k.kanji)),
      options: optionsById.get(item.id) || [],
    };
  });
}

const KANJI_SELECT_FOR_CHARS = `SELECT ${KANJI_SELECT} FROM kanji WHERE kanji = ANY($1::text[])`;

const OPTIONS_SQL = `SELECT
  q.question_id,
  v.id, v.jlpt, v.kanji, v.meaning, v.kana, v.romaji
FROM unnest($1::int[], $2::int[], $3::int[], $4::int[])
  AS q(question_id, q_jlpt, q_kanji_len, q_kana_len)
CROSS JOIN LATERAL (
  SELECT id, jlpt, kanji, meaning, kana, romaji
  FROM vocab
  WHERE vocab.id <> q.question_id
  ORDER BY
    CASE WHEN jlpt >= q.q_jlpt
           AND abs(char_length(kanji) - q.q_kanji_len) <= ${KANJI_DIFF}
           AND abs(char_length(kana) - q.q_kana_len) <= ${KANA_DIFF}
         THEN 0 ELSE 1 END,
    random()
  LIMIT $5
) v`;

module.exports = {
  getOptions,
};
