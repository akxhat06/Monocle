-- =========================
-- Seed Data (~185K rows total) — dev/staging only
-- =========================

-- USERS (~5K)
INSERT INTO users (id, first_seen, last_seen, session_count, is_returning)
SELECT
  'user_' || i,
  NOW() - (random() * INTERVAL '21 days'),
  NOW() + (random() * INTERVAL '7 days'),
  (random() * 10)::INT,
  (random() > 0.4)
FROM generate_series(1, 5000) i;

-- SESSIONS (~20K)
INSERT INTO sessions (session_id, user_id, start_time, end_time, total_events)
SELECT
  'sess_' || i,
  'user_' || (1 + (random() * 4999)::INT),
  ts,
  ts + (random() * INTERVAL '30 minutes'),
  (random() * 20)::INT
FROM (
  SELECT i, NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days') AS ts
  FROM generate_series(1, 20000) i
) t;

-- QUESTIONS (~50K) — with voice/chat channel split (~40% voice, ~60% chat)
INSERT INTO questions (session_id, user_id, question_text, channel, created_at)
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
  CASE WHEN random() < 0.40 THEN 'voice' ELSE 'chat' END,
  NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 50000);

-- ERRORS (~10K)
INSERT INTO errors (session_id, user_id, error_message, created_at)
SELECT
  'sess_' || (1 + (random() * 19999)::INT),
  'user_' || (1 + (random() * 4999)::INT),
  (ARRAY['OTP failed', 'Service unavailable', 'Invalid input', 'Timeout error'])[floor(random()*4 + 1)],
  NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 10000);

-- ASR LOGS (~30K)
INSERT INTO asr_logs (session_id, user_id, transcript, confidence, created_at)
SELECT
  'sess_' || (1 + (random() * 19999)::INT),
  'user_' || (1 + (random() * 4999)::INT),
  (ARRAY['pm kisan status batao', 'weather kya hai', 'fasal bima check karo'])[floor(random()*3 + 1)],
  round(random()::numeric, 2),
  NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 30000);

-- TTS LOGS (~30K)
INSERT INTO tts_logs (session_id, user_id, text, created_at)
SELECT
  'sess_' || (1 + (random() * 19999)::INT),
  'user_' || (1 + (random() * 4999)::INT),
  (ARRAY['Your PM Kisan payment is pending', 'Weather is cloudy today', 'Your request is processed'])[floor(random()*3 + 1)],
  NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 30000);

-- TOOL CALLS (~50K)
INSERT INTO tool_calls (session_id, user_id, tool_name, created_at)
SELECT
  'sess_' || (1 + (random() * 19999)::INT),
  'user_' || (1 + (random() * 4999)::INT),
  (ARRAY[
    'get_scheme_info', 'initiate_pm_kisan_status_check', 'check_pm_kisan_status_with_otp',
    'initiate_pmfby_status_check', 'check_pmfby_status_with_otp', 'check_shc_status',
    'submit_pmkisan_grievance', 'grievance_status', 'search_terms', 'search_documents',
    'search_videos', 'search_pests_diseases', 'weather_forecast', 'get_mandi_prices',
    'search_commodity', 'forward_geocode', 'reverse_geocode'
  ])[floor(random()*17 + 1)],
  NOW() - INTERVAL '21 days' + (random() * INTERVAL '28 days')
FROM generate_series(1, 50000);
