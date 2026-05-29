-- Alter target_graduation_year type to NUMERIC to support float values (like 2025.5 for 3.5 years study)
ALTER TABLE user_profiles ALTER COLUMN target_graduation_year TYPE NUMERIC(5,1);
