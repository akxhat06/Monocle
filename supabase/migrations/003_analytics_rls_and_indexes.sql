-- Date-range filters for overview counts
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
CREATE INDEX IF NOT EXISTS idx_errors_created_at ON errors(created_at);
CREATE INDEX IF NOT EXISTS idx_asr_logs_created_at ON asr_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_tts_logs_created_at ON tts_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
CREATE INDEX IF NOT EXISTS idx_users_first_seen ON users(first_seen);

-- Logged-in Monocle users can read analytics tables (custom schema, not auth.users)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE asr_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tts_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_select_authenticated" ON users;
DROP POLICY IF EXISTS "analytics_select_authenticated" ON sessions;
DROP POLICY IF EXISTS "analytics_select_authenticated" ON questions;
DROP POLICY IF EXISTS "analytics_select_authenticated" ON errors;
DROP POLICY IF EXISTS "analytics_select_authenticated" ON asr_logs;
DROP POLICY IF EXISTS "analytics_select_authenticated" ON tts_logs;
DROP POLICY IF EXISTS "analytics_select_authenticated" ON tool_calls;

CREATE POLICY "analytics_select_authenticated" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "analytics_select_authenticated" ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "analytics_select_authenticated" ON questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "analytics_select_authenticated" ON errors FOR SELECT TO authenticated USING (true);
CREATE POLICY "analytics_select_authenticated" ON asr_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "analytics_select_authenticated" ON tts_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "analytics_select_authenticated" ON tool_calls FOR SELECT TO authenticated USING (true);
