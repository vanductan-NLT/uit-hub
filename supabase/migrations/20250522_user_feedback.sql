-- User feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('bug', 'suggestion', 'praise', 'other')),
  message     text NOT NULL CHECK (char_length(message) >= 5),
  page        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: users can insert their own rows; nobody can read (admin via service role only)
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_feedback_insert_own"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can read all feedback
CREATE POLICY "user_feedback_admin_select"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );
