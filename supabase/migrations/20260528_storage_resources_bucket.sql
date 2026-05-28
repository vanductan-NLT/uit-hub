-- Create public storage bucket for study resource file uploads
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own files
create policy "Authenticated users can upload resources"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'resources' and (storage.foldername(name))[2] = auth.uid()::text);

-- Allow anyone to read public resource files
create policy "Public read access for resources"
  on storage.objects for select
  to public
  using (bucket_id = 'resources');

-- Allow users to delete their own uploads
create policy "Users can delete own resource files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);
