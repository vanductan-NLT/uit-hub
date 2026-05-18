-- Extend user_courses status check to include 'exempted' (môn miễn)
ALTER TABLE user_courses DROP CONSTRAINT IF EXISTS user_courses_status_check;
ALTER TABLE user_courses ADD CONSTRAINT user_courses_status_check
  CHECK (status IN ('completed', 'in_progress', 'failed', 'exempted'));
