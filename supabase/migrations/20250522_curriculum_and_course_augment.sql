-- ============================================================
-- Phase 2: Curriculum data model + course augmentation
-- Run once in Supabase SQL Editor (or via psql)
-- ============================================================

-- ── 1. Augment courses table ───────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS suggested_semester smallint;       -- 1..8 (từ CTĐT khoá)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_group     text;             -- ĐC|CSN|CN|CNTC (Loại MH từ daa)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS equivalents       text[] DEFAULT '{}'; -- mã môn tương đương

-- ── 2. Curricula (chương trình đào tạo theo khoá) ─────────
CREATE TABLE IF NOT EXISTS curricula (
  id                        text PRIMARY KEY,           -- e.g. "CNTT-K19", "KTPM-K20"
  major                     text NOT NULL,              -- "CNTT" | "KTPM" | …
  intake_year_from          smallint NOT NULL,          -- 2019 → K19
  total_credits_required    smallint NOT NULL DEFAULT 131,
  general_credits           smallint,
  foundation_credits        smallint,
  major_required_credits    smallint,
  major_elective_credits    smallint,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

-- ── 3. Curriculum ↔ Course mapping (gợi ý theo kỳ) ────────
CREATE TABLE IF NOT EXISTS curriculum_courses (
  curriculum_id    text        NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  course_id        text        NOT NULL REFERENCES courses(id)   ON DELETE CASCADE,
  requirement_type text        NOT NULL, -- general|foundation|required|elective
  suggested_semester smallint,           -- 1..8
  PRIMARY KEY (curriculum_id, course_id)
);

-- ── 4. Graduation requirements per curriculum ──────────────
CREATE TABLE IF NOT EXISTS graduation_requirements (
  curriculum_id   text    NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  key             text    NOT NULL, -- english|gdqp|gdtc|total_credits|gpa_min
  label           text    NOT NULL,
  threshold_value numeric,          -- e.g. 450 (TOEIC), 2.0 (GPA), 12 (credits)
  unit            text,             -- credits|score|boolean
  PRIMARY KEY (curriculum_id, key)
);

-- ── 5. User milestone completion (toggleable per user) ─────
CREATE TABLE IF NOT EXISTS user_milestones (
  user_id      uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key          text    NOT NULL, -- english|gdqp|gdtc
  is_completed boolean NOT NULL DEFAULT false,
  value        numeric,          -- actual score/credits if known
  note         text,
  updated_at   timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- ── 6. RLS policies ────────────────────────────────────────

-- curricula & graduation_requirements: public read, admin write
ALTER TABLE curricula               ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE graduation_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read curricula"
  ON curricula FOR SELECT USING (true);

CREATE POLICY "Public read curriculum_courses"
  ON curriculum_courses FOR SELECT USING (true);

CREATE POLICY "Public read graduation_requirements"
  ON graduation_requirements FOR SELECT USING (true);

CREATE POLICY "Users manage own milestones"
  ON user_milestones FOR ALL USING (auth.uid() = user_id);
