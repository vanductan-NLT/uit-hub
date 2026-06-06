-- Rollback for 20260607_001_user_profile_curriculum_link.sql
ALTER TABLE user_profiles DROP COLUMN IF EXISTS curriculum_id;
