// external modules

require('dotenv').config();

const express = require('express');
const cors = require('cors');

// project modules

const kanjiRouter = require('./src/routes/kanji');
const vocabRouter = require('./src/routes/vocab');
const searchRouter = require('./src/routes/search');
const lessonsRouter = require('./src/routes/lessons');

// app variables

const app = express();
const port = 4000;

// app configuration

app.use(cors());

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

app.use('/lessons', lessonsRouter);
app.use('/kanji', kanjiRouter);
app.use('/vocab', vocabRouter);
app.use('/search', searchRouter);

// server activation

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

module.exports = app;
