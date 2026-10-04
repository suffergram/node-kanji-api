-- Up Migration

CREATE TABLE users (
  id              bigint        GENERATED   ALWAYS AS IDENTITY  PRIMARY KEY,
  email           text          NOT NULL    UNIQUE,
  password_hash   text          NOT NULL,
  created_at      timestamptz   NOT NULL    DEFAULT   now()
);

CREATE TABLE sessions (
  id              text          PRIMARY KEY,
  user_id         bigint        NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz   NOT NULL    DEFAULT   now(),
  expires_at      timestamptz   NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);

-- Down Migration

DROP TABLE sessions;

DROP TABLE users;