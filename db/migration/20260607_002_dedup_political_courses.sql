-- Deactivate stale duplicate political ("Lý luận chính trị") courses.
-- These pre-2019 codes duplicate the current SS-prefixed courses and only
-- pollute search; no user_courses reference them (verified via
-- scripts/diagnose-political-course-duplicates.ts), so this is a safe,
-- reversible soft-delete. Current courses kept active:
--   SS003 Tư tưởng HCM · SS007 Triết học · SS008 Kinh tế chính trị
--
-- Stale → current equivalence (for reference):
--   PHIL2  → SS007        HCMT1, HCMT2 → SS003        MLPE1, MLPE2 → SS008
--   PHIL1  (Những NLCB của CN Mác-Lênin) → split into SS007/SS008/SS009
UPDATE courses
SET is_active = false, updated_at = now()
WHERE id IN ('PHIL1', 'PHIL2', 'HCMT1', 'HCMT2', 'MLPE1', 'MLPE2');
