-- Add component_scores JSONB to user_courses for M2 (GPA forecast)
-- Shape: { "GK": 7.5, "BT": 8.0, "TH": null }
-- Keys match course.components[i].name
ALTER TABLE user_courses
  ADD COLUMN IF NOT EXISTS component_scores JSONB NOT NULL DEFAULT '{}';
