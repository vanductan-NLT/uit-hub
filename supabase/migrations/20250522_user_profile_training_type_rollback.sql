-- Rollback: remove training_type from user_profiles
ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS training_type;
