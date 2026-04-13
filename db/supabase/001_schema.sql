-- ============================================================
-- Monocle Analytics Schema — Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- This is the SAME Supabase project used for auth (login).
-- ============================================================

-- Drop existing tables (safe re-run)
DROP TABLE IF EXISTS feedback    CASCADE;
DROP TABLE IF EXISTS tts_details CASCADE;
DROP TABLE IF EXISTS asr_details CASCADE;
DROP TABLE IF EXISTS errordetails CASCADE;
DROP TABLE IF EXISTS questions   CASCADE;
DROP TABLE IF EXISTS calls       CASCADE;
DROP TABLE IF EXISTS users       CASCADE;

-- ── users ──────────────────────────────────────────────────
CREATE TABLE users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  uid         varchar(64) UNIQUE NOT NULL,
  mobile      varchar(20),
  username    varchar(128),
  email       varchar(256),
  role        varchar(64)  DEFAULT 'farmer',
  farmer_id   varchar(64),
  first_seen_at timestamp,
  last_seen_at  timestamp,
  created_at    timestamp  DEFAULT now()
);

-- ── calls ──────────────────────────────────────────────────
CREATE TABLE calls (
  id                  serial      PRIMARY KEY,
  interaction_id      text        UNIQUE NOT NULL,
  user_id             text        REFERENCES users(uid),
  connectivity_status text,
  end_reason          text,
  duration_in_seconds numeric(10,2),
  start_datetime      timestamp,
  end_datetime        timestamp,
  language_name       text,
  num_messages        int          DEFAULT 0,
  channel_type        text         DEFAULT 'v2v',
  channel_direction   text         DEFAULT 'inbound',
  is_debug_call       boolean      DEFAULT false
);

-- ── questions ──────────────────────────────────────────────
CREATE TABLE questions (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  uid          varchar(64),
  sid          varchar(64),
  channel      varchar(256),
  questiontext text,
  answertext   text,
  created_at   timestamp DEFAULT now()
);

-- ── errordetails ───────────────────────────────────────────
CREATE TABLE errordetails (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  uid        varchar(64),
  sid        varchar(64),
  channel    varchar(256),
  errortext  text,
  created_at timestamp DEFAULT now()
);

-- ── asr_details ────────────────────────────────────────────
CREATE TABLE asr_details (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  uid        varchar(64),
  sid        varchar(64),
  channel    varchar(256),
  text       text,
  latencyms  numeric(10,2),
  success    boolean DEFAULT true,
  apiservice varchar(128),
  created_at timestamp DEFAULT now()
);

-- ── tts_details ────────────────────────────────────────────
CREATE TABLE tts_details (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  uid        varchar(64),
  sid        varchar(64),
  channel    varchar(256),
  text       text,
  latencyms  numeric(10,2),
  success    boolean DEFAULT true,
  apiservice varchar(128),
  created_at timestamp DEFAULT now()
);

-- ── feedback ───────────────────────────────────────────────
CREATE TABLE feedback (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  uid          varchar(64),
  sid          varchar(64),
  channel      varchar(256),
  feedbacktext text,
  questiontext text,
  answertext   text,
  feedbacktype text,
  created_at   timestamp DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_users_uid           ON users(uid);
CREATE INDEX idx_users_last_seen     ON users(last_seen_at);
CREATE INDEX idx_calls_user_id       ON calls(user_id);
CREATE INDEX idx_calls_start         ON calls(start_datetime);
CREATE INDEX idx_questions_uid       ON questions(uid);
CREATE INDEX idx_questions_sid       ON questions(sid);
CREATE INDEX idx_questions_channel   ON questions(channel);
CREATE INDEX idx_questions_created   ON questions(created_at);
CREATE INDEX idx_errordetails_uid    ON errordetails(uid);
CREATE INDEX idx_errordetails_created ON errordetails(created_at);
CREATE INDEX idx_asr_uid             ON asr_details(uid);
CREATE INDEX idx_asr_created         ON asr_details(created_at);
CREATE INDEX idx_tts_uid             ON tts_details(uid);
CREATE INDEX idx_tts_created         ON tts_details(created_at);
CREATE INDEX idx_feedback_uid        ON feedback(uid);
CREATE INDEX idx_feedback_created    ON feedback(created_at);
