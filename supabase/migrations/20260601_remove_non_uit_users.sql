-- Remove all users whose email is not under the UIT student domain.
-- Server-side validation now rejects such logins at /auth/callback and in
-- middleware, but legacy rows from the period before enforcement must be
-- purged so they cannot be referenced by stale sessions.
--
-- Deleting from auth.users cascades to public.user_profiles via the existing
-- FK with ON DELETE CASCADE; related rows (courses, resources, etc.) follow.

DELETE FROM auth.users
WHERE email IS NULL
   OR lower(email) NOT LIKE '%@gm.uit.edu.vn';
