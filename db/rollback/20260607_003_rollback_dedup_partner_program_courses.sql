-- Rollback for 20260607_003_dedup_partner_program_courses.sql
-- Re-activate the partner-program / foreign-track course rows. All CNBU*/CSBU*/
-- MSIS* rows were active before the forward migration, so reactivating the same
-- families restores the prior state.
UPDATE courses
SET is_active = true, updated_at = now()
WHERE is_active = false
  AND (id LIKE 'CNBU%' OR id LIKE 'CSBU%' OR id LIKE 'MSIS%');
