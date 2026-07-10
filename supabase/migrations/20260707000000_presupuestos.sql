-- PRESUPUESTOS: meta mensual de venta por negocio, definida manualmente por
-- el Super Admin, para comparar en tiempo real contra la venta real.
create table if not exists presupuestos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  anio int not null,
  mes int not null check (mes between 1 and 12),
  monto bigint not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (negocio_id, anio, mes)
);

alter table presupuestos enable row level security;

drop policy if exists presupuesto_select_admin on presupuestos;
create policy presupuesto_select_admin on presupuestos for select to authenticated using (is_admin());

drop policy if exists presupuesto_write_superadmin on presupuestos;
create policy presupuesto_write_superadmin on presupuestos for all to authenticated using (is_super_admin()) with check (is_super_admin());
