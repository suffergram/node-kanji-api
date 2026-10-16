import { Router } from 'express';

import { getPool } from '../db.js';

type Lesson = {
  id: number;
  data: string[];
  description: string;
};

type LessonRow = Lesson & {
  level: string;
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
