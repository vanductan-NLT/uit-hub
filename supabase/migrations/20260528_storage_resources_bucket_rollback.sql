drop policy if exists "Users can delete own resource files" on storage.objects;
drop policy if exists "Public read access for resources" on storage.objects;
drop policy if exists "Authenticated users can upload resources" on storage.objects;

delete from storage.buckets where id = 'resources';
