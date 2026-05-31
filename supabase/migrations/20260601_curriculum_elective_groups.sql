-- Add elective-group columns to curriculum_courses so the parser can mark
-- courses that belong to a "choose N of M" group (e.g. graduation thesis
-- options) instead of treating every row as a standalone required course.
--
-- elective_group_key: slug shared by all alternatives of one group, NULL
--   means the row is a regular standalone course.
-- group_required_credits: credit total the user must accumulate from the
--   group to satisfy it (typically the credits of one alternative).

ALTER TABLE curriculum_courses
  ADD COLUMN IF NOT EXISTS elective_group_key text,
  ADD COLUMN IF NOT EXISTS group_required_credits numeric(4, 1);

CREATE INDEX IF NOT EXISTS idx_curriculum_courses_group
  ON curriculum_courses (curriculum_id, elective_group_key)
  WHERE elective_group_key IS NOT NULL;
