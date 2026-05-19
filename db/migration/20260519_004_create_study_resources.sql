-- =============================
-- STUDY RESOURCES (Module 4)
-- =============================
CREATE TABLE study_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('video', 'slide', 'exercise', 'exam')),
  source TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'pending', 'rejected')),
  submitted_by UUID REFERENCES auth.users(id),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================
-- INDEXES
-- =============================
CREATE INDEX idx_study_resources_course ON study_resources(course_id);
CREATE INDEX idx_study_resources_status ON study_resources(status);
CREATE INDEX idx_study_resources_type ON study_resources(resource_type);

-- =============================
-- RLS
-- =============================
ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;

-- Anyone can read published resources
CREATE POLICY "Public read published resources" ON study_resources
  FOR SELECT USING (status = 'published');

-- Authenticated users can submit pending resources
CREATE POLICY "Users can submit resources" ON study_resources
  FOR INSERT WITH CHECK (auth.uid() = submitted_by AND status = 'pending');

-- Admin full access (uses is_admin() from migration 005 — run 005 first)
CREATE POLICY "Admin full access on resources" ON study_resources
  FOR ALL USING (public.is_admin());
