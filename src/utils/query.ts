import type { Request } from 'express';

export type KanjiSelect = {
  id: number;
  jlpt: number;
  kanji: string;
  romajiOn: string;
  on: string;
  romajiKun: string;
  kun: string;
  meaning: string;
};

export type VocabSelect = {
  id: number;
  jlpt: number;
  kanji: string;
  meaning: string;
  kana: string;
  romaji: string;
};

export const KANJI_SELECT =
  'id, jlpt, kanji, romaji_on AS "romajiOn", on_reading AS "on", romaji_kun AS "romajiKun", kun_reading AS "kun", meaning';
export const VOCAB_SELECT = 'id, jlpt, kanji, meaning, kana, romaji';

export function isValidPositiveNumber(value: string) {
  return value && isFinite(Number(value)) && Number(value) > 0;
}

// The number of items requested via ?limit, or null when absent/invalid.
export function getLimit(req: Request) {
  return isValidPositiveNumber(String(req.query.limit))
    ? Number(req.query.limit)
    : null;
}

// ORDER BY clause for ?random=true
export function getRandomClause(req: Request) {
  return req.query.random === 'true' ? ' ORDER BY random()' : '';
}

// Append a LIMIT clause using the next parameter index. Mutates `params`.
export function withLimit(
  sql: string,
  params: unknown[],
  limit: number | null
) {
  if (!limit) return sql;
  params.push(limit);
  return `${sql} LIMIT $${params.length}`;
}
