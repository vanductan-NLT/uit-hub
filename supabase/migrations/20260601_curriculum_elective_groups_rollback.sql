DROP INDEX IF EXISTS idx_curriculum_courses_group;

ALTER TABLE curriculum_courses
  DROP COLUMN IF EXISTS elective_group_key,
  DROP COLUMN IF EXISTS group_required_credits;
