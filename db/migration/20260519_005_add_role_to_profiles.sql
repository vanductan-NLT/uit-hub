-- Add role column to user_profiles for admin access control
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student'
  CHECK (role IN ('student', 'admin'));

-- Security definer function to check admin role without triggering RLS recursion
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

-- Admin can read all user_profiles (for student overview)
-- Uses is_admin() function to avoid infinite recursion in RLS
CREATE POLICY "Users and admins read profiles" ON user_profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- Admin can read all user_courses (for student progress)
CREATE POLICY "Users and admins read courses" ON user_courses
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );
