-- Up Migration

CREATE TABLE IF NOT EXISTS kana (
  id          integer PRIMARY KEY,
  script      text    NOT NULL,
  kana        text    NOT NULL
);

CREATE TABLE IF NOT EXISTS kanji (
  id          integer PRIMARY KEY,
  jlpt        integer NOT NULL,
  kanji       text    NOT NULL,
  romaji_on   text,
  on_reading  text,
  romaji_kun  text,
  kun_reading text,
  meaning     text
);

CREATE TABLE IF NOT EXISTS vocab (
  id          integer PRIMARY KEY,
  jlpt        integer NOT NULL,
  kanji       text    NOT NULL,
  meaning     text,
  kana        text,
  romaji      text
);

CREATE TABLE IF NOT EXISTS lessons (
  level       text    NOT NULL,
  id          integer NOT NULL,
  description text,
  data        jsonb   NOT NULL,
  PRIMARY KEY (level, id)
);

-- Down Migration

-- baseline: не удаляем существующие таблицы