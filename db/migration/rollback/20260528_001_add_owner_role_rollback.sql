-- Rollback 20260528_001_add_owner_role.sql

-- 1. Drop the self-escalation trigger + function
DROP TRIGGER IF EXISTS trg_prevent_role_self_change ON user_profiles;
DROP FUNCTION IF EXISTS public.prevent_role_self_change();

-- 2. Revert is_admin() to admin-only
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Downgrade any existing owners so the narrower constraint can apply
UPDATE user_profiles SET role = 'admin' WHERE role = 'owner';

-- 4. Revert the role check constraint to student/admin only
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('student', 'admin'));
