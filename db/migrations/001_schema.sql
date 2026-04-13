-- =========================
-- Analytics PostgreSQL Schema
-- Run this against your standalone PostgreSQL database (NOT Supabase).
-- Supabase is only used for authentication and user profiles.
-- =========================

DROP TABLE IF EXISTS tool_calls, tts_logs, asr_logs, errors, questions, sessions, users;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  first_seen TIMESTAMP,
  last_seen TIMESTAMP,
  session_count INT,
  is_returning BOOLEAN
);

CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  total_events INT
);

CREATE TABLE questions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT,
  user_id TEXT,
  question_text TEXT,
  channel TEXT NOT NULL DEFAULT 'chat' CHECK (channel IN ('voice', 'chat')),
  created_at TIMESTAMP
);

CREATE TABLE errors (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT,
  user_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP
);

CREATE TABLE asr_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT,
  user_id TEXT,
  transcript TEXT,
  confidence FLOAT,
  created_at TIMESTAMP
);

CREATE TABLE tts_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT,
  user_id TEXT,
  text TEXT,
  created_at TIMESTAMP
);

CREATE TABLE tool_calls (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT,
  user_id TEXT,
  tool_name TEXT,
  created_at TIMESTAMP
);

-- =========================
-- Indexes
-- =========================

CREATE INDEX idx_sessions_user        ON sessions(user_id);
CREATE INDEX idx_sessions_start_time  ON sessions(start_time);
CREATE INDEX idx_questions_session    ON questions(session_id);
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_questions_channel    ON questions(channel);
CREATE INDEX idx_errors_created_at    ON errors(created_at);
CREATE INDEX idx_asr_logs_created_at  ON asr_logs(created_at);
CREATE INDEX idx_tts_logs_created_at  ON tts_logs(created_at);
CREATE INDEX idx_tool_calls_tool      ON tool_calls(tool_name);
CREATE INDEX idx_tool_calls_time      ON tool_calls(created_at);
CREATE INDEX idx_users_last_seen      ON users(last_seen);
CREATE INDEX idx_users_first_seen     ON users(first_seen);
