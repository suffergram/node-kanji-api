export const KANJI_SELECT =
  'id, jlpt, kanji, romaji_on AS "romajiOn", on_reading AS "on", romaji_kun AS "romajiKun", kun_reading AS "kun", meaning';
export const VOCAB_SELECT = 'id, jlpt, kanji, meaning, kana, romaji';

export function isValidPositiveNumber(value) {
  return value && isFinite(Number(value)) && Number(value) > 0;
}

// The number of items requested via ?limit, or null when absent/invalid.
export function getLimit(req) {
  return isValidPositiveNumber(req.query.limit)
    ? Number(req.query.limit)
    : null;
}

// ORDER BY clause for ?random=true
export function getRandomClause(req) {
  return req.query.random === 'true' ? ' ORDER BY random()' : '';
}

// Append a LIMIT clause using the next parameter index. Mutates `params`.
export function withLimit(sql, params, limit) {
  if (!limit) return sql;
  params.push(limit);
  return `${sql} LIMIT $${params.length}`;
}
