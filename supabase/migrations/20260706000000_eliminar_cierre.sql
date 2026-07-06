-- Permite a Super Admin eliminar un cierre completo (gastos, propinas y
-- pagos_detalle se borran en cascada por las FK ya existentes). Se usa para
-- corregir cierres de prueba o duplicados por error.
drop policy if exists cierre_delete_superadmin on cierres;
create policy cierre_delete_superadmin on cierres for delete to authenticated using (is_super_admin());
