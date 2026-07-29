-- Storage bucket para logos
insert into storage.buckets (id, name, public, avif_autodetection)
values ('logos', 'logos', true, false)
on conflict (id) do nothing;

create policy "Logos publico"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Upload logo"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
  );

create policy "Delete logo"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
  );
