-- Up Migration

CREATE TABLE user_avatars (
  user_id         bigint        REFERENCES users(id) ON DELETE CASCADE    PRIMARY KEY,
  image           bytea         NOT NULL,
  mime_type       text          NOT NULL    CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  updated_at      timestamptz   NOT NULL    DEFAULT now()
);

ALTER TABLE users ADD COLUMN avatar_updated_at timestamptz;

-- Down Migration

DROP TABLE user_avatars;

ALTER TABLE users DROP COLUMN avatar_updated_at;
