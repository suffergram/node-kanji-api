// external modules

const express = require('express');
const cors = require('cors');
const { kanji } = require('./src/data/kanji/kanji');
const { vocab } = require('./src/data/vocab/vocab');
const { hiragana, katakana } = require('./src/data/kana/kana');
const { lessons } = require('./src/data/lessons/lessons');
const { shuffleArray } = require('./src/services/shuffle-array');
const { getOptions } = require('./src/services/get-options');

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

app.get('/lessons', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(JSON.stringify(lessons));
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

app.get('/kanji', (req, res) => {
  try {
    let content = [...kanji];

    if (req.query) {

      if (req.query.kanji) {
        content = [];
        for (let item of req.query.kanji) {
          content.push(...kanji.filter(k => k.kanji === item));
        }
      }

      if (req.query.random && req.query.random === 'true') {
        content = shuffleArray(content);
      }

      if (req.query.jlpt && isFinite(Number(req.query.jlpt)) && Number(req.query.jlpt) > 0)
        content = content.filter(item => item.jlpt >= Number(req.query.jlpt));

      if (req.query.limit && isFinite(Number(req.query.limit)) && Number(req.query.limit) > 0) {
        content = content.slice(0, Number(req.query.limit));
      }

    }

    if (content.length === 1) content = content[0];
    if (content.length === 0) throw new Error('Not found');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(JSON.stringify(content));
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

app.get('/kanji/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const content = kanji.filter(item => item.id === id)[0];

    if (!content) throw new Error('Not found');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(JSON.stringify(content));
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

app.get('/vocab', (req, res) => {
  try {
    let content = [...vocab];

    if (req.query) {

      if (req.query.random && req.query.random === 'true') {
        content = shuffleArray(content);
      }

      if (req.query.jlpt && isFinite(Number(req.query.jlpt)) && Number(req.query.jlpt) > 0) {
        content = content.filter(item => item.jlpt >= Number(req.query.jlpt));
      }

      if (req.query.kanjiJlpt && isFinite(Number(req.query.kanjiJlpt)) && Number(req.query.kanjiJlpt) > 0) {
        const kana = [...hiragana.map(item => item.kana), ...katakana.map(item => item.kana)];
        const kanjiByJlpt = kanji.filter(item => item.jlpt >= req.query.kanjiJlpt).map(item => item.kanji).concat(kana);
        content = content.filter(item => item.kanji.split('').every(kana => kanjiByJlpt.includes(kana)));
      }

      if (req.query.word) {
        content = content.filter(item => item.kanji === req.query.word);
      }

      if (req.query.kanji) {
        const kanjiList = req.query.kanji
          .split(',')
          .map(k => k.trim())
          .filter(Boolean);
        content = content.filter(item =>
          kanjiList.some(k => item.kanji.includes(k))
        );
      }

      if (req.query.limit && isFinite(Number(req.query.limit)) && Number(req.query.limit) > 0) {
        content = content.slice(0, Number(req.query.limit));
      }

      if (req.query.options && isFinite(Number(req.query.options)) && Number(req.query.options) > 1) {
        content = getOptions(content, req.query.options);
      }

    }

    if (content.length === 1) content = content[0];
    if (content.length === 0) throw new Error('Not found');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(JSON.stringify(content));
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

app.get('/vocab/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const content = vocab.filter(item => item.id === id)[0];

    if (!content) throw new Error('Not found');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(JSON.stringify(content));
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});

app.get('/search/:query', (req, res) => {
  try {
    const query = req.params.query;

    const search = query.toLowerCase();
    const regex = /[()\.\s]/g;

    const kanjiResult = [...kanji].filter(item =>
      item.kanji.includes(search) ||
      item.kun.replace(regex, '').includes(search) ||
      item.on.replace(regex, '').includes(search) ||
      item.meaning.toLowerCase().includes(search) ||
      item.romajiKun.toLowerCase().replace(regex, '').includes(search) ||
      item.romajiOn.toLowerCase().replace(regex, '').includes(search)
    ).map(kanji => ({
      ...kanji,
      ref: vocab.filter(item => item.kanji.includes(kanji.kanji))
    }));

    const vocabResult = [...vocab].filter(item =>
      item.kanji.includes(search) ||
      item.kana.replace(regex, '').includes(search) ||
      item.meaning.toLowerCase().includes(search) ||
      item.romaji.toLowerCase().includes(search)
    );

    const content = {};
    kanjiResult.length > 0 && (content.kanji = kanjiResult);
    vocabResult.length > 0 && (content.vocab = vocabResult);

    if (!content.kanji && !content.vocab) throw new Error('Not found');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(JSON.stringify(content));
  } catch (error) {
    res.writeHead(404);
    res.end(error.message);
  }
});


// server activation

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
