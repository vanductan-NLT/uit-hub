-- Rollback for 20260519_006_fix_recursive_rls_policies.sql
DROP POLICY IF EXISTS "Users and admins read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users and admins read courses" ON user_courses;
