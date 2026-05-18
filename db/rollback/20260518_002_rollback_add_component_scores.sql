-- Rollback for 20260518_002_add_component_scores.sql
ALTER TABLE user_courses DROP COLUMN IF EXISTS component_scores;
