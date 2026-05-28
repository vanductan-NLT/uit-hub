-- Add 'owner' role above 'admin'. Owner can assign any role to anyone;
-- admin can assign admin/student but never owner. First owner must be set
-- manually: UPDATE user_profiles SET role='owner' WHERE id='<uuid>';

-- 1. Widen the role check constraint to include 'owner'
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('student', 'admin', 'owner'));

-- 2. Let owner inherit admin read access (RLS policies + /admin gating both
--    rely on is_admin()). Owner counts as staff.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  );
$$;

-- 3. Close self-escalation hole. The "Users see own profile" FOR ALL policy
--    lets a user UPDATE their own row, including role, via the anon client.
--    Block any role change made by the row owner; role changes must go through
--    the service-role client (auth.uid() is NULL there, so the trigger allows).
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() = OLD.id THEN
    RAISE EXCEPTION 'Không thể tự thay đổi quyền của chính mình.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_change ON user_profiles;
CREATE TRIGGER trg_prevent_role_self_change
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_change();
