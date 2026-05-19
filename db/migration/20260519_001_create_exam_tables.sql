-- Module 3: Exam Schedule & Reverse Study Planning
-- Tables: exam_schedules, study_sessions

-- ── EXAM SCHEDULES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id),
  class_code TEXT,
  exam_period TEXT NOT NULL CHECK (exam_period IN ('GK', 'CK')),
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME,
  exam_time_raw TEXT,
  room TEXT,
  exam_type TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id, exam_period)
);

CREATE INDEX IF NOT EXISTS idx_exam_schedules_user_id ON exam_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_user_semester ON exam_schedules(user_id, semester);

ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exam schedules"
  ON exam_schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── STUDY SESSIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_exam_id ON study_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, session_date);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own study sessions"
  ON study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
