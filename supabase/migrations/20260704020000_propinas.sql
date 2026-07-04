-- PROPINAS (se cobran junto con la cuenta pero se entregan en efectivo al
-- mesero al final del turno, por eso se descuentan del efectivo esperado
-- igual que un gasto, sin importar el medio de pago original de la cuenta).
create table if not exists propinas (
  id uuid primary key default gen_random_uuid(),
  cierre_id uuid not null references cierres(id) on delete cascade,
  valor bigint not null default 0,
  nota text,
  created_at timestamptz default now()
);

alter table propinas enable row level security;

drop policy if exists propina_cajero on propinas;
create policy propina_cajero on propinas for all to authenticated
using ( exists (select 1 from cierres c where c.id = propinas.cierre_id and c.profile_id = auth.uid() and c.fecha = current_date) )
with check ( exists (select 1 from cierres c where c.id = propinas.cierre_id and c.profile_id = auth.uid() and c.fecha = current_date) );

drop policy if exists propina_select_admin on propinas;
create policy propina_select_admin on propinas for select to authenticated using (is_admin());

drop policy if exists propina_write_superadmin on propinas;
create policy propina_write_superadmin on propinas for all to authenticated using (is_super_admin()) with check (is_super_admin());
