-- Rollback for 20260519_005_add_role_to_profiles.sql
DROP POLICY IF EXISTS "Users and admins read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users and admins read courses" ON user_courses;
DROP FUNCTION IF EXISTS public.is_admin();
ALTER TABLE user_profiles DROP COLUMN IF EXISTS role;
