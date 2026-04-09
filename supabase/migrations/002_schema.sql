-- =========================
-- SCHEMA CREATION
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
-- USERS (~5K)
-- =========================

INSERT INTO users (id, first_seen, last_seen, session_count, is_returning)
SELECT
'user_' || i,
NOW() - (random() * INTERVAL '21 days'),
NOW() + (random() * INTERVAL '7 days'),
(random() * 10)::INT,
(random() > 0.4)
FROM generate_series(1, 5000) i;

-- =========================
-- SESSIONS (~20K)
-- =========================

INSERT INTO sessions (session_id, user_id, start_time, end_time, total_events)
SELECT
'sess_' || i,
'user_' || (1 + (random() * 4999)::INT),
ts,
ts + (random() * INTERVAL '30 minutes'),
(random() * 20)::INT
FROM (
SELECT
i,
NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days') AS ts
FROM generate_series(1, 20000) i
) t;

-- =========================
-- QUESTIONS (~50K)
-- =========================

INSERT INTO questions (session_id, user_id, question_text, created_at)
SELECT
'sess_' || (1 + (random() * 19999)::INT),
'user_' || (1 + (random() * 4999)::INT),
(ARRAY[
'PM Kisan payment not received',
'How to check PMFBY status',
'Weather forecast today',
'Mandi price for wheat',
'Soil health card status'
])[floor(random()*5 + 1)],
NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 50000);

-- =========================
-- ERRORS (~10K)
-- =========================

INSERT INTO errors (session_id, user_id, error_message, created_at)
SELECT
'sess_' || (1 + (random() * 19999)::INT),
'user_' || (1 + (random() * 4999)::INT),
(ARRAY[
'OTP failed',
'Service unavailable',
'Invalid input',
'Timeout error'
])[floor(random()*4 + 1)],
NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 10000);

-- =========================
-- ASR LOGS (~30K)
-- =========================

INSERT INTO asr_logs (session_id, user_id, transcript, confidence, created_at)
SELECT
'sess_' || (1 + (random() * 19999)::INT),
'user_' || (1 + (random() * 4999)::INT),
(ARRAY[
'pm kisan status batao',
'weather kya hai',
'fasal bima check karo'
])[floor(random()*3 + 1)],
round(random()::numeric, 2),
NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 30000);

-- =========================
-- TTS LOGS (~30K)
-- =========================

INSERT INTO tts_logs (session_id, user_id, text, created_at)
SELECT
'sess_' || (1 + (random() * 19999)::INT),
'user_' || (1 + (random() * 4999)::INT),
(ARRAY[
'Your PM Kisan payment is pending',
'Weather is cloudy today',
'Your request is processed'
])[floor(random()*3 + 1)],
NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 30000);

-- =========================
-- TOOL CALLS (~50K)
-- =========================

INSERT INTO tool_calls (session_id, user_id, tool_name, created_at)
SELECT
'sess_' || (1 + (random() * 19999)::INT),
'user_' || (1 + (random() * 4999)::INT),
(ARRAY[
'get_scheme_info',
'initiate_pm_kisan_status_check',
'check_pm_kisan_status_with_otp',
'initiate_pmfby_status_check',
'check_pmfby_status_with_otp',
'check_shc_status',
'submit_pmkisan_grievance',
'grievance_status',
'search_terms',
'search_documents',
'search_videos',
'search_pests_diseases',
'weather_forecast',
'get_mandi_prices',
'search_commodity',
'forward_geocode',
'reverse_geocode'
])[floor(random()*17 + 1)],
NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 50000);

-- =========================
-- INDEXES (IMPORTANT)
-- =========================

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_questions_session ON questions(session_id);
CREATE INDEX idx_tool_calls_tool ON tool_calls(tool_name);
CREATE INDEX idx_tool_calls_time ON tool_calls(created_at);
