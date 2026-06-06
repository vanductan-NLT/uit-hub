-- Rollback for 20260607_002_dedup_political_courses.sql
UPDATE courses
SET is_active = true, updated_at = now()
WHERE id IN ('PHIL1', 'PHIL2', 'HCMT1', 'HCMT2', 'MLPE1', 'MLPE2');
