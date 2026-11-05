import { Router } from 'express';

import { getPool } from '../db.js';
import pilotLesson from '../../content/lessons/pilot-nature.json' with { type: 'json' };
import { HttpError } from '../utils/http-error.js';

type Lesson = {
  id: number;
  data: string[];
  description: string;
};

type LessonRow = Lesson & {
  level: string;
};

type LessonVocabRow = {
  id: number;
  kanji: string;
  kana: string | null;
  meaning: string | null;
  romaji: string | null;
};

export const lessonsRouter = Router();

lessonsRouter.get('/', async (req, res) => {
  const pool = getPool();
  const result = await pool.query<LessonRow>(
    'SELECT level, id, description, data FROM lessons ORDER BY level, id'
  );

  const levels = ['n5', 'n4', 'n3', 'n2', 'n1'];
  const content: Record<string, Lesson[]> = Object.fromEntries(
    levels.map((level) => [level, []])
  );

  for (const row of result.rows) {
    content[row.level].push({
      id: row.id,
      data: row.data,
      description: row.description,
    });
  }

  res.json(content);
});

lessonsRouter.get('/pilot-nature', async (req, res) => {
  const pool = getPool();
  const ids = pilotLesson.items.map((item) => item.vocabId);

  const sql = `SELECT id, kanji, kana, meaning, romaji FROM vocab WHERE id = ANY($1::int[])`;

  const { rows } = await pool.query<LessonVocabRow>(sql, [ids]);

  const lessons = pilotLesson.items.map((item) => {
    const word = rows.find((row) => row.id === item.vocabId);
    if (!word) {
      throw new HttpError(500, 'Lesson vocabulary is missing');
    }
    if (!word.kana?.trim()) {
      throw new HttpError(500, 'Lesson vocabulary reading is missing');
    }
    return {
      vocabId: item.vocabId,
      kanji: word.kanji,
      kana: word.kana,
      meaning: item.targetMeaning,
      romaji: word.romaji,
      note: item.note,
    };
  });

  res.json({ ...pilotLesson, items: lessons });
});
