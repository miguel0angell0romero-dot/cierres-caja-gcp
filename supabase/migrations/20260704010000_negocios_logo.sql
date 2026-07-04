-- Columna para la ruta del logo de cada negocio
alter table negocios add column if not exists logo_path text;

-- Bucket público para los logos (no son datos sensibles, se muestran en la UI)
insert into storage.buckets (id, name, public)
values ('logos-negocios', 'logos-negocios', true)
on conflict (id) do nothing;

-- Solo Super Admin puede subir/reemplazar/borrar logos; la lectura es pública (bucket público)
drop policy if exists logos_write_superadmin on storage.objects;
create policy logos_write_superadmin on storage.objects for all to authenticated
using (bucket_id = 'logos-negocios' and is_super_admin())
with check (bucket_id = 'logos-negocios' and is_super_admin());
