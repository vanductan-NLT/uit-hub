-- Add training_type to user_profiles
-- Values: 'chinh-quy' | 'tu-xa'
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS training_type VARCHAR(20) NOT NULL DEFAULT 'chinh-quy';
