-- Bind each user to the curriculum (CTĐT) they imported.
-- Lets the roadmap load curriculum by a stored id instead of rebuilding
-- "{MAJOR}-K{intake}" from the profile, which silently mismatched whenever
-- intake_year was null or major differed — leaving "Chưa có CTĐT" forever.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS curriculum_id text
  REFERENCES curricula(id) ON DELETE SET NULL;
