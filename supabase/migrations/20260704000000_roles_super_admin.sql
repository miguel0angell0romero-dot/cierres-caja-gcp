-- 1) Ampliar los roles permitidos (admite super_admin)
do $$
declare
  nombre_restriccion text;
begin
  select conname into nombre_restriccion
  from pg_constraint
  where conrelid = 'profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%rol%';
  if nombre_restriccion is not null then
    execute format('alter table profiles drop constraint %I', nombre_restriccion);
  end if;
end $$;

alter table profiles add constraint profiles_rol_check check (rol in ('super_admin','admin','cajero'));

-- 2) Promover la cuenta inicial a super_admin
update profiles set rol = 'super_admin' where id = '5486d621-a087-4a8f-99c6-ac8547e4677a';

-- 3) Funciones auxiliares (is_admin ahora significa "admin o super_admin")
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and rol in ('admin','super_admin') and activo);
$$;

create or replace function is_super_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and rol = 'super_admin' and activo);
$$;

-- 4) negocios: escritura solo super_admin
drop policy if exists neg_admin on negocios;
create policy neg_admin on negocios for all to authenticated using (is_super_admin()) with check (is_super_admin());

-- 5) profiles: gestionar usuarios (activar/desactivar, cambiar rol) solo super_admin
drop policy if exists prof_admin_upd on profiles;
create policy prof_admin_upd on profiles for update to authenticated using (is_super_admin()) with check (is_super_admin());

-- 6) asignaciones: gestionar turnos solo super_admin (la lectura sigue abierta a cualquier admin)
drop policy if exists asg_admin on asignaciones;
create policy asg_admin on asignaciones for all to authenticated using (is_super_admin()) with check (is_super_admin());

-- 7) cierres: editar solo super_admin; nueva politica para cargar cierres anteriores
drop policy if exists cierre_update_admin on cierres;
create policy cierre_update_admin on cierres for update to authenticated using (is_super_admin()) with check (is_super_admin());

drop policy if exists cierre_insert_admin on cierres;
create policy cierre_insert_admin on cierres for insert to authenticated
with check (is_super_admin());

-- 8) gastos: lectura para cualquier admin, escritura solo super_admin
drop policy if exists gasto_admin on gastos;
drop policy if exists gasto_select_admin on gastos;
drop policy if exists gasto_write_superadmin on gastos;
create policy gasto_select_admin on gastos for select to authenticated using (is_admin());
create policy gasto_write_superadmin on gastos for all to authenticated using (is_super_admin()) with check (is_super_admin());

-- 9) pagos_detalle: misma logica que gastos
drop policy if exists pago_admin on pagos_detalle;
drop policy if exists pago_select_admin on pagos_detalle;
drop policy if exists pago_write_superadmin on pagos_detalle;
create policy pago_select_admin on pagos_detalle for select to authenticated using (is_admin());
create policy pago_write_superadmin on pagos_detalle for all to authenticated using (is_super_admin()) with check (is_super_admin());

-- 10) auditoria: lectura para cualquier admin, escritura solo super_admin
drop policy if exists aud_admin on auditoria;
drop policy if exists aud_select_admin on auditoria;
drop policy if exists aud_insert_superadmin on auditoria;
create policy aud_select_admin on auditoria for select to authenticated using (is_admin());
create policy aud_insert_superadmin on auditoria for insert to authenticated with check (is_super_admin());

-- 11) storage soportes-gastos: lectura para cualquier admin, escritura solo super_admin
drop policy if exists soportes_admin on storage.objects;
drop policy if exists soportes_select_admin on storage.objects;
drop policy if exists soportes_write_superadmin on storage.objects;
create policy soportes_select_admin on storage.objects for select to authenticated using (bucket_id = 'soportes-gastos' and is_admin());
create policy soportes_write_superadmin on storage.objects for all to authenticated using (bucket_id = 'soportes-gastos' and is_super_admin()) with check (bucket_id = 'soportes-gastos' and is_super_admin());
