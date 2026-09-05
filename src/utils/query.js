const KANJI_SELECT =
  'id, jlpt, kanji, romaji_on AS "romajiOn", on_reading AS "on", romaji_kun AS "romajiKun", kun_reading AS "kun", meaning';
const VOCAB_SELECT = 'id, jlpt, kanji, meaning, kana, romaji';

function isValidPositiveNumber(value) {
  return value && isFinite(Number(value)) && Number(value) > 0;
}

// The number of items requested via ?limit, or null when absent/invalid.
function getLimit(req) {
  return isValidPositiveNumber(req.query.limit) ? Number(req.query.limit) : null;
}

// ORDER BY clause for ?random=true
function getRandomClause(req) {
  return req.query.random === 'true' ? ' ORDER BY random()' : '';
}

// Append a LIMIT clause using the next parameter index. Mutates `params`.
function withLimit(sql, params, limit) {
  if (!limit) return sql;
  params.push(limit);
  return `${sql} LIMIT $${params.length}`;
}

module.exports = {
  KANJI_SELECT,
  VOCAB_SELECT,
  isValidPositiveNumber,
  getLimit,
  getRandomClause,
  withLimit,
};