-- Fix infinite recursion in user_profiles RLS policies
-- The old "Admin reads all profiles" policy queried user_profiles from within
-- a user_profiles policy, causing infinite recursion. Replaced with a
-- SECURITY DEFINER function that bypasses RLS.

-- Drop old recursive policies (if they exist from migration 005)
DROP POLICY IF EXISTS "Admin reads all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin reads all courses" ON user_courses;

-- Drop in case of re-run
DROP POLICY IF EXISTS "Users and admins read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users and admins read courses" ON user_courses;

-- Recreate user_profiles read policy using is_admin() (no recursion)
CREATE POLICY "Users and admins read profiles" ON user_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Recreate user_courses read policy using is_admin()
CREATE POLICY "Users and admins read courses" ON user_courses
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
