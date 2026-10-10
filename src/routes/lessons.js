import { Router } from 'express';

import { getPool } from '../db.js';
import { send } from '../utils/http.js';

export const lessonsRouter = Router();

lessonsRouter.get('/', async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT level, id, description, data FROM lessons ORDER BY level, id'
  );

  const levels = ['n5', 'n4', 'n3', 'n2', 'n1'];
  const content = Object.fromEntries(levels.map((level) => [level, []]));

  for (const row of result.rows) {
    content[row.level].push({
      id: row.id,
      data: row.data,
      description: row.description,
    });
  }

  send(res, content);
});
