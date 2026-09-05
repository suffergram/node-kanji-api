const express = require('express');

const { getPool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
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

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(JSON.stringify(content));
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

module.exports = router;