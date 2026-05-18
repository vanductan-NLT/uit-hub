-- =============================
-- 1. COURSE CATALOG (seed từ courses_weighted.json)
-- =============================
CREATE TABLE courses (
  id TEXT PRIMARY KEY,                        -- mã môn: "IT001"
  name TEXT NOT NULL,                         -- "Nhập môn lập trình"
  name_en TEXT,                               -- "Introduction to programming"
  credits INTEGER NOT NULL,
  department TEXT,
  course_type TEXT CHECK (course_type IN ('required', 'elective', 'general')),
  prerequisites TEXT[] DEFAULT '{}',
  components JSONB DEFAULT '[]',              -- [{name:"Quá trình", weight:0.2}, ...]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================
-- 2. SINH VIÊN ĐÃ HỌC
-- =============================
CREATE TABLE user_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id),
  score NUMERIC(4,2) CHECK (score >= 0 AND score <= 10),
  semester TEXT,                              -- "HK1-2023-2024"
  academic_year TEXT,                         -- "2023-2024"
  status TEXT DEFAULT 'completed'
    CHECK (status IN ('completed', 'in_progress', 'failed')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- =============================
-- 3. USER PROFILE
-- =============================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT,                            -- MSSV
  full_name TEXT,
  major TEXT DEFAULT 'CNTT',
  intake_year INTEGER,
  target_graduation_year INTEGER,
  total_credits_required INTEGER DEFAULT 131,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================
-- INDEXES
-- =============================
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX idx_courses_active ON courses(is_active);

-- =============================
-- RLS
-- =============================
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own courses" ON user_courses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Anyone can read active courses" ON courses
  FOR SELECT USING (is_active = true);
