// external modules

import 'dotenv/config';

import express, { json } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// project modules

import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { kanjiRouter } from './routes/kanji.js';
import { vocabRouter } from './routes/vocab.js';
import { searchRouter } from './routes/search.js';
import { lessonsRouter } from './routes/lessons.js';
import { HttpError } from './utils/http-error.js';

// app variables

export const app = express();

// app configuration

// Vercel puts one proxy in front of the app and overwrites X-Forwarded-For
// with the client IP, so trusting exactly one hop gives the real req.ip
app.set('trust proxy', 1);

app.use(cors());
app.use(json());
app.use(cookieParser());

// routes definitions

app.get('/', (req, res) => {
  res.writeHead(200);
  res.end(`
                            This is the Kanji App Api

  /-------------------------------------------------------------------------------/
  
  use  /kanji           to get all kanji
  ?jlpt                 to get kanji by jlpt level (1-5)
  ?kanji                to get a specific kanji
  ?limit                to set the amount of items
  ?random               to randomize the result (true, false)

  use  /kanji/:id       to get kanji with a specific id

  /-------------------------------------------------------------------------------/

  use  /vocab           to get all vocab
  ?jlpt                 to get word by jlpt level (1-5)
  ?word                 to get a specific word
  ?kanji                to get all vocab that includes the kanji (comma-separated list is supported)
  ?kanjiJlpt            to get vocab by kanji Jlpt level (1-5)
  ?limit                to set the amount of items
  ?random               to randomize the result (true, false)
  ?options              to get the data in special format with question and options

  use  /vocab/:id       to get vocab with a specific id

  /-------------------------------------------------------------------------------/

  use  /search/:query   to get an object of search results for the :query value

  /-------------------------------------------------------------------------------/

  use  /lessons          to get all lessons grouped by level (n5-n1)

  /-------------------------------------------------------------------------------/
  `);
});

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/lessons', lessonsRouter);
app.use('/kanji', kanjiRouter);
app.use('/vocab', vocabRouter);
app.use('/search', searchRouter);

app.use(() => {
  throw new HttpError(404, 'Not Found');
});

app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    const { status, message } = err;
    res.status(status).json({ error: message });
    return;
  }
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});
