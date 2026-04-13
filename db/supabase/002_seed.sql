-- ============================================================
-- Monocle Analytics — Sample Seed Data for Supabase
-- Row counts (Supabase free-tier safe, ~500MB limit):
--   users       : 2,000
--   calls       : 5,000
--   questions   : 8,000
--   errordetails: 1,000
--   asr_details : 3,000
--   tts_details : 3,000
--   feedback    :   500
--   TOTAL       : ~22,500 rows  (~3 MB)
-- ============================================================

-- ── USERS (2,000) ──────────────────────────────────────────
INSERT INTO users (uid, mobile, username, email, role, farmer_id, first_seen_at, last_seen_at, created_at)
SELECT
  'UID' || lpad(i::text, 6, '0'),
  '9' || lpad((floor(random() * 900000000) + 100000000)::bigint::text, 9, '0'),
  (ARRAY[
    'Ramesh Kumar','Suresh Singh','Anjali Devi','Priya Sharma','Mohan Yadav',
    'Geeta Patel','Arjun Reddy','Kavita Nair','Vijay Gupta','Sunita Verma',
    'Ravi Tiwari','Meena Joshi','Anil Mehra','Pooja Mishra','Deepak Chauhan',
    'Lalita Bai','Santosh Pandey','Kamla Devi','Harish Bhatt','Usha Rani'
  ])[floor(random() * 20 + 1)] || ' ' || i,
  'user' || i || '@bharat.example.com',
  CASE WHEN random() < 0.92 THEN 'farmer' ELSE 'agent' END,
  'FID' || lpad(i::text, 6, '0'),
  now() - (random() * 365 * 2 || ' days')::interval,
  now() - (random() * 30 || ' days')::interval,
  now() - (random() * 365 * 2 || ' days')::interval
FROM generate_series(1, 2000) i;

-- ── CALLS (5,000) ──────────────────────────────────────────
INSERT INTO calls (
  interaction_id, user_id, connectivity_status, end_reason,
  duration_in_seconds, start_datetime, end_datetime,
  language_name, num_messages, channel_type, channel_direction, is_debug_call
)
SELECT
  'INT' || lpad(i::text, 8, '0'),
  'UID' || lpad((1 + (random() * 1999)::int)::text, 6, '0'),
  (ARRAY['connected','connected','connected','connected','failed','dropped'])[floor(random()*6+1)],
  (ARRAY['completed','completed','hangup','hangup','timeout','error','user_disconnect'])[floor(random()*7+1)],
  round((30 + random() * 870)::numeric, 2),
  ts,
  ts + ((30 + random() * 870) || ' seconds')::interval,
  (ARRAY[
    'Hindi','Hindi','Hindi','Marathi','Telugu','Kannada',
    'Tamil','Bengali','Punjabi','Gujarati','Odia','Malayalam'
  ])[floor(random()*12+1)],
  (2 + random() * 18)::int,
  'v2v',
  CASE WHEN random() < 0.85 THEN 'inbound' ELSE 'outbound' END,
  random() < 0.02
FROM (
  SELECT i, now() - (random() * 180 || ' days')::interval AS ts
  FROM generate_series(1, 5000) i
) t;

-- ── QUESTIONS (8,000) ─────────────────────────────────────
-- channel: telephony = voice, chat URL = chat (~55% voice, 45% chat)
INSERT INTO questions (uid, sid, channel, questiontext, answertext, created_at)
SELECT
  'UID' || lpad((1 + (random() * 1999)::int)::text, 6, '0'),
  'INT' || lpad((1 + (random() * 4999)::int)::text, 8, '0'),
  CASE WHEN random() < 0.55
    THEN 'BharatVistaar-telephony'
    ELSE 'BharatVistaar-https://chat-vistaar.da.gov.in'
  END,
  (ARRAY[
    'PM Kisan payment status kaise check karein?',
    'Mere account mein PM Kisan ka paisa nahi aaya',
    'PMFBY fasal bima ka status kya hai?',
    'Meri fasal bima claim kaise karein?',
    'Aaj ka mausam kaisa rahega?',
    'Gehu ka mandi bhav kya hai aaj?',
    'Soil health card kaise milega?',
    'Urea khad ki keemat kya hai?',
    'Kisan Credit Card ke liye apply kaise karein?',
    'Pradhan Mantri Kisan Maan Dhan Yojana kya hai?',
    'Drip irrigation subsidy kaise milegi?',
    'Sarso ka bhav aaj kya hai Rajasthan mein?',
    'Meri zameen ka khatauni kaise nikalu?',
    'Borewell ke liye subsidy available hai kya?',
    'Organic farming certification kaise milega?',
    'Meri PM Kisan installment kab aayegi?',
    'Pest attack se fasal kaise bachayein?',
    'Mushroom farming kaise shuru karein?',
    'Dairy farming loan kahan se milega?',
    'E-NAM par registration kaise karein?'
  ])[floor(random()*20+1)],
  (ARRAY[
    'Aapka PM Kisan payment 14th installment mein process ho raha hai.',
    'Kripaya apna Aadhaar number verify karein.',
    'Aapki PMFBY claim status: Under Review.',
    'Aaj mausam mostly cloudy rahega, halki barish ki sambhavna hai.',
    'Aaj Gehu ka MSP Rs. 2,275 per quintal hai.',
    'Soil health card ke liye apne nearest KVK se sampark karein.',
    'Kisan Credit Card ke liye apne nearest bank branch se sampark karein.',
    'Yeh yojana unorganised sector ke kisan majdoorno ke liye hai.',
    'Drip irrigation subsidy ke liye PM Krishi Sinchai Yojana apply karein.',
    'Aapki next installment 2 mahine mein aayegi.',
    'E-NAM par registration www.enam.gov.in par karein.',
    'Integrated pest management ke liye KVK se contact karein.'
  ])[floor(random()*12+1)],
  now() - (random() * 180 || ' days')::interval
FROM generate_series(1, 8000);

-- ── ERRORDETAILS (1,000) ───────────────────────────────────
INSERT INTO errordetails (uid, sid, channel, errortext, created_at)
SELECT
  'UID' || lpad((1 + (random() * 1999)::int)::text, 6, '0'),
  'INT' || lpad((1 + (random() * 4999)::int)::text, 8, '0'),
  CASE WHEN random() < 0.55
    THEN 'BharatVistaar-telephony'
    ELSE 'BharatVistaar-https://chat-vistaar.da.gov.in'
  END,
  (ARRAY[
    'OTP verification failed after 3 attempts',
    'Service temporarily unavailable, please try again',
    'Invalid Aadhaar number format',
    'Network timeout while fetching PM Kisan status',
    'User session expired',
    'Speech recognition confidence too low',
    'Backend API returned 500 error',
    'Invalid mobile number format',
    'Database connection timeout',
    'TTS service unreachable'
  ])[floor(random()*10+1)],
  now() - (random() * 180 || ' days')::interval
FROM generate_series(1, 1000);

-- ── ASR_DETAILS (3,000) ────────────────────────────────────
INSERT INTO asr_details (uid, sid, channel, text, latencyms, success, apiservice, created_at)
SELECT
  'UID' || lpad((1 + (random() * 1999)::int)::text, 6, '0'),
  'INT' || lpad((1 + (random() * 4999)::int)::text, 8, '0'),
  'BharatVistaar-telephony',
  (ARRAY[
    'pm kisan payment kab aayega',
    'mera fasal bima ka status batao',
    'aaj mausam kaisa hai',
    'gehu ka bhav kya hai',
    'soil health card chahiye',
    'kisan credit card ke liye kya karna hoga',
    'urea ki keemat kya hai',
    'sarso ka mandi bhav batao',
    'meri installment nahi aayi',
    'aadhaar link kaise karein',
    'pm kisan samman nidhi',
    'drip irrigation subsidy chahiye',
    'organic kheti kaise karein',
    'mushroom farming',
    'dairy loan chahiye'
  ])[floor(random()*15+1)],
  round((80 + random() * 920)::numeric, 2),
  random() > 0.08,
  (ARRAY['BharatASR-v2','BharatASR-v3','Google-STT','Azure-STT'])[floor(random()*4+1)],
  now() - (random() * 180 || ' days')::interval
FROM generate_series(1, 3000);

-- ── TTS_DETAILS (3,000) ────────────────────────────────────
INSERT INTO tts_details (uid, sid, channel, text, latencyms, success, apiservice, created_at)
SELECT
  'UID' || lpad((1 + (random() * 1999)::int)::text, 6, '0'),
  'INT' || lpad((1 + (random() * 4999)::int)::text, 8, '0'),
  'BharatVistaar-telephony',
  (ARRAY[
    'Aapka PM Kisan payment process ho raha hai.',
    'Kripaya ek minute wait karein.',
    'Aapki fasal bima claim approved ho gayi hai.',
    'Aaj mausam badal rahega, halki barish ki ummeed hai.',
    'Gehu ka aaj ka MSP Rs. 2,275 per quintal hai.',
    'Aapka Aadhaar successfully link ho gaya.',
    'Kripaya apna OTP enter karein.',
    'Aapka Kisan Credit Card application under review hai.',
    'Yeh service abhi available nahi hai, baad mein try karein.',
    'Dhanyawad! Aapka sawaal record kar liya gaya.',
    'Aapki request process ho rahi hai.',
    'Kripaya apna mobile number confirm karein.',
    'Aapka soil health card ready hai.',
    'Subsidy ke liye aavedan safaltapurvak submit ho gaya.'
  ])[floor(random()*14+1)],
  round((60 + random() * 440)::numeric, 2),
  random() > 0.04,
  (ARRAY['BharatTTS-v1','BharatTTS-v2','Google-TTS','Azure-Neural'])[floor(random()*4+1)],
  now() - (random() * 180 || ' days')::interval
FROM generate_series(1, 3000);

-- ── FEEDBACK (500) ─────────────────────────────────────────
INSERT INTO feedback (uid, sid, channel, feedbacktext, questiontext, answertext, feedbacktype, created_at)
SELECT
  'UID' || lpad((1 + (random() * 1999)::int)::text, 6, '0'),
  'INT' || lpad((1 + (random() * 4999)::int)::text, 8, '0'),
  CASE WHEN random() < 0.55
    THEN 'BharatVistaar-telephony'
    ELSE 'BharatVistaar-https://chat-vistaar.da.gov.in'
  END,
  (ARRAY[
    'Bahut achha jawab mila, shukriya!',
    'Jawab sahi tha lekin thoda aur detail chahiye tha.',
    'Meri problem solve ho gayi.',
    'Service bahut helpful hai.',
    'Samajh mein nahi aaya, please baar baar bolein.',
    'Bahut slow response tha.',
    'Bilkul sahi information mili.',
    'Thoda aur clearly explain karein.'
  ])[floor(random()*8+1)],
  (ARRAY[
    'PM Kisan status kaise check karein?',
    'Fasal bima ka paise kab milega?',
    'Mausam ki jankari chahiye.',
    'Kisan credit card ke liye kya karna hoga?'
  ])[floor(random()*4+1)],
  (ARRAY[
    'Aapka PM Kisan payment process ho raha hai.',
    'Claim approved ho gaya.',
    'Aaj barish ki sambhavna hai.',
    'Bank branch mein sampark karein.'
  ])[floor(random()*4+1)],
  (ARRAY['positive','positive','positive','neutral','negative'])[floor(random()*5+1)],
  now() - (random() * 180 || ' days')::interval
FROM generate_series(1, 500);

-- ── Row count verification ─────────────────────────────────
SELECT 'users'       AS tbl, count(*) FROM users
UNION ALL SELECT 'calls',       count(*) FROM calls
UNION ALL SELECT 'questions',   count(*) FROM questions
UNION ALL SELECT 'errordetails',count(*) FROM errordetails
UNION ALL SELECT 'asr_details', count(*) FROM asr_details
UNION ALL SELECT 'tts_details', count(*) FROM tts_details
UNION ALL SELECT 'feedback',    count(*) FROM feedback
ORDER BY tbl;
