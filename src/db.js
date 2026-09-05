// external modules

const { Pool } = require('pg');

// app variables

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
          'Create a .env file (see .env.example) or set it in Vercel.'
      );
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      allowExitOnIdle: true,
    });
  }

  return pool;
}

module.exports = { getPool };
