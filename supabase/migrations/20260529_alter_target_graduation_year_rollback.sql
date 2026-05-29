-- Rollback target_graduation_year type to INTEGER
ALTER TABLE user_profiles ALTER COLUMN target_graduation_year TYPE INTEGER USING round(target_graduation_year)::INTEGER;
