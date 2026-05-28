-- RLS policies for study_resources table
-- Assumes RLS is already enabled on the table

-- Students can submit new resources (status must be 'pending', submitted_by must match auth user)
create policy "Students can submit resources"
  on study_resources for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
  );

-- Anyone can read published resources
create policy "Public can read published resources"
  on study_resources for select
  to public
  using (status = 'published');

-- Authenticated users can also see their own submissions (any status)
create policy "Users can read own submissions"
  on study_resources for select
  to authenticated
  using (submitted_by = auth.uid());
