-- ============================================================
-- ROLLBACK: Phase 2 curriculum data model
-- Run ONLY to undo 20250522_curriculum_and_course_augment.sql
-- ============================================================

-- 1. Drop new tables (order matters — FK deps first)
DROP TABLE IF EXISTS user_milestones         CASCADE;
DROP TABLE IF EXISTS graduation_requirements  CASCADE;
DROP TABLE IF EXISTS curriculum_courses       CASCADE;
DROP TABLE IF EXISTS curricula                CASCADE;

-- 2. Remove augmentation columns from courses
ALTER TABLE courses DROP COLUMN IF EXISTS suggested_semester;
ALTER TABLE courses DROP COLUMN IF EXISTS course_group;
ALTER TABLE courses DROP COLUMN IF EXISTS equivalents;
