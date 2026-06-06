-- Soft-deactivate partner-program / foreign-track course rows that duplicate
-- the mainstream UIT catalog and pollute course search + curriculum matching.
--
-- Three code families are involved, none used by the mainstream CNTT programs:
--   CNBU*  — networking partner-program track (duplicates IT/NT subjects)
--   CSBU*  — computer-science partner-program track (duplicates IT/CS subjects)
--   MSIS*  — foreign MIS program track (duplicates IS/SE subjects)
--
-- 30 of these rows also carry impossible credit values (65/69/80 TC) from a
-- catalog-import bug that summed the theory+practice credit sub-columns; the
-- legitimate UIT maximum is a 14 TC thesis (CE506), which is left untouched.
--
-- Safe, reversible soft-delete: every affected row has zero user_courses and
-- zero curriculum_courses references (verified via
-- scripts/diagnose-junk-courses.ts), so no student record or curriculum link
-- is orphaned. Mainstream equivalents stay active, e.g.:
--   CNBU108 / CSBU108 Hệ điều hành → IT007
--   CSBU107 Lập trình hướng đối tượng → IT002
--   MSIS3303 Phân tích thiết kế hệ thống → SE207
UPDATE courses
SET is_active = false, updated_at = now()
WHERE is_active = true
  AND (id LIKE 'CNBU%' OR id LIKE 'CSBU%' OR id LIKE 'MSIS%');
