# Plan técnico — Sistema de Cierres de Caja GCP

**Objetivo:** app web (PC + móvil, instalable como PWA) para registrar los cierres de caja diarios de tres negocios y consolidar los recaudos en tiempo real, con costo de operación **$0**.

Este documento está pensado para entregárselo a **Claude Code** como guía de construcción. La maqueta visual de referencia es el archivo `cierres-caja-gcp-prototipo.html` (usarlo como referencia de UX/UI y de la lógica de cuadre).

---

## 1. Negocios y reglas de negocio (ya definidas)

Negocios: **Carbón de Piedra** (CDP), **CP Gourmet** (CPG), **Buffalo BS** (BFB).

Un **cierre por negocio por día**. La moneda es COP y se guarda como entero (sin decimales).

Ventas por medio de pago (según sistema/POS): **Efectivo, QR, Nequi/Daviplata, Datáfono, Crédito**.

Reglas confirmadas:

- Las **propinas** ya vienen incluidas en la factura: **no** se registran ni se separan.
- **No** existen "pagos fuera de caja".
- Los **gastos** son **solo en efectivo** (categorías: Alimentos, Bebidas, Insumos, Aseo, Nómina, Otros) y cada gasto puede llevar una **foto de soporte**.
- La **base en efectivo** de cada negocio la define el administrador y se precarga en el cierre.
- El cajero puede **detallar pago por pago** en QR y Nequi/Daviplata para verificar contra el total del sistema (certeza del 100%).

### Cuadre de efectivo
```
Efectivo esperado = Base + Ventas en efectivo − Gastos en efectivo
Diferencia efectivo = Efectivo contado − Efectivo esperado   (+ sobrante / − faltante)
Entrega (depósito) = Efectivo contado − Base
```

### Cuadre de datáfono (nuevo)
```
Diferencia datáfono = Datáfono liquidado (cierre del terminal) − Datáfono según sistema
```
El cuadre de datáfono es informativo/control; **no** modifica la entrega de efectivo.

---

## 2. Roles y permisos

**Cajero**
- Inicia sesión con usuario y contraseña.
- Solo puede **registrar** el cierre del punto que tenga **asignado para ese día**.
- **No** ve historial de cierres ni datos de otros negocios (restricción a nivel de base de datos, no solo de interfaz).

**Administrador**
- Ve el consolidado y el detalle de los tres negocios, con acumulados en tiempo real.
- Filtra por **rango de fechas personalizado**.
- **Edita** cierres; cada cambio queda en un **log de auditoría** (quién, cuándo, qué campo, antes → después y motivo).
- **Crea y elimina cajeros** y los **asigna a los puntos por día** (calendario de turnos).
- Define la **base en efectivo** de cada negocio.

---

## 3. Stack tecnológico (todo en plan gratuito)

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **React + Vite + TypeScript + Tailwind CSS** | SPA liviana, ideal para un panel; rápida de construir con Claude Code. |
| PWA | **vite-plugin-pwa** | Instalable en celular y PC, ícono propio, pantalla completa, shell offline. |
| Backend/DB | **Supabase** (PostgreSQL) | Base de datos, autenticación, almacenamiento y seguridad por fila (RLS) en un solo servicio gratis. |
| Auth | **Supabase Auth** (email + contraseña) | Login con usuario/contraseña, sin construir backend propio. |
| Fotos de gastos | **Supabase Storage** (bucket privado) | Guardar imágenes de soporte con permisos por rol. |
| Creación/borrado de cajeros | **Supabase Edge Functions** (Deno) | Crear usuarios requiere clave de servicio; se hace en una función segura del lado servidor. |
| Gráficas | **Recharts** (o barras CSS como en el prototipo) | Visualización del consolidado. |
| Hosting | **Vercel** o **Netlify** | Despliegue gratuito del frontend, HTTPS y dominio incluidos. |

> **Costo:** la operación de la app es **$0** dentro de los límites del plan gratuito (más que suficiente para 3 restaurantes). Lo único que puede tener costo es el uso de **Claude Code** según tu plan de Claude.

---

## 4. Arquitectura

```
┌─────────────────────────────┐        ┌────────────────────────────┐
│  Frontend (React PWA)        │        │  Supabase                  │
│  Vercel/Netlify              │  HTTPS │                            │
│                              │ ─────► │  • Postgres + RLS          │
│  - Login                     │        │  • Auth (email/contraseña) │
│  - App Cajero (nuevo cierre) │        │  • Storage (fotos)         │
│  - App Admin (panel, cierres,│        │  • Edge Functions          │
│    auditoría, negocios,      │        │    (crear/eliminar cajeros)│
│    cajeros y turnos)         │        │                            │
└─────────────────────────────┘        └────────────────────────────┘
```

El frontend habla directo con Supabase usando la **clave anónima** (segura porque toda la protección está en las políticas RLS). Las operaciones privilegiadas (crear/eliminar usuarios) pasan por Edge Functions que validan que quien llama sea administrador.

---

## 5. Modelo de datos (esquema Supabase)

Dinero en `bigint` (pesos enteros). Todas las tablas con **RLS activado**.

```sql
-- NEGOCIOS (puntos de venta)
create table negocios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text not null unique,          -- CDP, CPG, BFB
  color text not null default '#6E4AD1',
  base_efectivo bigint not null default 0,
  activo boolean not null default true,
  created_at timestamptz default now()
);

-- PERFILES (1:1 con auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null default 'cajero' check (rol in ('admin','cajero')),
  activo boolean not null default true,
  created_at timestamptz default now()
);

-- ASIGNACIONES / TURNOS (qué cajero está en qué punto cada día)
create table asignaciones (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  negocio_id uuid not null references negocios(id) on delete cascade,
  fecha date not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique (profile_id, fecha)            -- un cajero, un punto por día
);

-- CIERRES (uno por negocio y día)
create table cierres (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  profile_id uuid not null references profiles(id),   -- quién cerró
  fecha date not null,
  base_efectivo bigint not null default 0,
  venta_efectivo bigint not null default 0,
  venta_qr bigint not null default 0,
  venta_nequi bigint not null default 0,
  venta_datafono bigint not null default 0,           -- según sistema
  venta_credito bigint not null default 0,
  datafono_liquidado bigint not null default 0,        -- según cierre del terminal
  efectivo_contado bigint not null default 0,
  detalle_otros text,
  recibe text,
  created_at timestamptz default now(),
  unique (negocio_id, fecha)
);

-- GASTOS (con foto de soporte)
create table gastos (
  id uuid primary key default gen_random_uuid(),
  cierre_id uuid not null references cierres(id) on delete cascade,
  categoria text not null,
  valor bigint not null default 0,
  foto_path text,                        -- ruta en Storage
  nota text,
  created_at timestamptz default now()
);

-- DETALLE DE PAGOS (QR / Nequi, pago por pago — opcional)
create table pagos_detalle (
  id uuid primary key default gen_random_uuid(),
  cierre_id uuid not null references cierres(id) on delete cascade,
  metodo text not null check (metodo in ('qr','nequi')),
  valor bigint not null default 0
);

-- AUDITORÍA (ediciones del administrador)
create table auditoria (
  id uuid primary key default gen_random_uuid(),
  cierre_id uuid not null references cierres(id) on delete cascade,
  profile_id uuid not null references profiles(id),   -- admin que editó
  motivo text not null,
  cambios jsonb not null,                -- [{campo, antes, despues}]
  created_at timestamptz default now()
);
```

Los valores calculados (total venta, total gastos, esperado, diferencias, entrega) se derivan en el frontend a partir de estas columnas; opcionalmente se pueden crear **vistas** en Postgres para el panel del admin.

---

## 6. Seguridad (RLS)

Función auxiliar para identificar administradores:

```sql
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and rol = 'admin' and activo);
$$;
```

Políticas clave (resumen):

**negocios** — lectura para cualquier usuario autenticado; escritura solo admin.
```sql
alter table negocios enable row level security;
create policy neg_read on negocios for select to authenticated using (true);
create policy neg_admin on negocios for all to authenticated using (is_admin()) with check (is_admin());
```

**profiles** — cada quien lee su perfil; el admin lee todos. (Alta/baja vía Edge Function).
```sql
alter table profiles enable row level security;
create policy prof_self on profiles for select to authenticated using (id = auth.uid() or is_admin());
create policy prof_admin_upd on profiles for update to authenticated using (is_admin()) with check (is_admin());
```

**asignaciones** — el cajero ve las suyas; el admin gestiona todas.
```sql
alter table asignaciones enable row level security;
create policy asg_read on asignaciones for select to authenticated using (profile_id = auth.uid() or is_admin());
create policy asg_admin on asignaciones for all to authenticated using (is_admin()) with check (is_admin());
```

**cierres** — el cajero **inserta** solo su cierre del día en el punto que tiene asignado; **no ve historial** (solo, como máximo, su propio cierre del día actual para la confirmación). El admin ve y edita todo.
```sql
alter table cierres enable row level security;

-- Cajero: crear cierre del punto asignado hoy
create policy cierre_insert_cajero on cierres for insert to authenticated
with check (
  profile_id = auth.uid()
  and exists (
    select 1 from asignaciones a
    where a.profile_id = auth.uid() and a.negocio_id = cierres.negocio_id and a.fecha = cierres.fecha
  )
);

-- Cajero: ver SOLO su propio cierre del día actual (sin historial)
create policy cierre_select_cajero on cierres for select to authenticated
using ( profile_id = auth.uid() and fecha = current_date );

-- Admin: ver y editar todo
create policy cierre_select_admin on cierres for select to authenticated using (is_admin());
create policy cierre_update_admin on cierres for update to authenticated using (is_admin()) with check (is_admin());
```

**gastos / pagos_detalle** — el cajero inserta/lee los del cierre que le pertenece hoy; el admin todo.
```sql
alter table gastos enable row level security;
create policy gasto_cajero on gastos for all to authenticated
using ( exists (select 1 from cierres c where c.id = gastos.cierre_id and c.profile_id = auth.uid() and c.fecha = current_date) )
with check ( exists (select 1 from cierres c where c.id = gastos.cierre_id and c.profile_id = auth.uid() and c.fecha = current_date) );
create policy gasto_admin on gastos for all to authenticated using (is_admin()) with check (is_admin());
-- (misma lógica para pagos_detalle)
```

**auditoria** — solo el admin escribe y lee.
```sql
alter table auditoria enable row level security;
create policy aud_admin on auditoria for all to authenticated using (is_admin()) with check (is_admin());
```

**Storage (bucket privado `soportes-gastos`):** ruta `{negocio_id}/{cierre_id}/{gasto_id}.jpg`. El cajero puede **subir** a sus cierres del día; el admin puede **leer** todo. Configurar políticas del bucket en el mismo sentido que las de `gastos`.

---

## 7. Módulos y pantallas

### 7.1 Cajero (móvil-first, sin historial)
- **Login.**
- Al entrar, la app busca la **asignación de hoy** del cajero → determina el punto y carga su **base**. Si no hay asignación, mensaje: "No tienes un punto asignado para hoy. Contacta al administrador."
- **Nuevo cierre** (una sola pantalla):
  1. *Ventas según sistema:* Efectivo, QR (con "detallar pagos"), Nequi/Daviplata (con "detallar pagos"), Datáfono, Crédito → Total venta automático.
  2. *Cuadre de datáfono:* campo "Datáfono liquidado (terminal)" y diferencia contra el sistema.
  3. *Gastos en efectivo:* lista dinámica (categoría + valor + **foto**), con total automático.
  4. *Cuadre de efectivo:* Base + Ventas efectivo − Gastos = Esperado; Efectivo contado → Diferencia (sobrante/faltante); Entrega = Contado − Base; campo "Recibe".
  5. **Guardar cierre** (bloqueado si ya existe cierre de ese punto/día).
- Tras guardar, muestra confirmación con el resumen. No hay lista de cierres anteriores.

### 7.2 Administrador
- **Panel consolidado:** KPIs (venta total, efectivo, tarjetas, apps), **rango de fechas personalizado**, recaudo por medio de pago (barras), y tarjetas por negocio. Botones de exportar (PDF/Excel).
- **Cierres (trazabilidad):** tabla de todos los cierres, filtro por negocio, botón **Editar** por fila → ventana con los valores + **motivo obligatorio** + cuadre recalculado en vivo. Al guardar, registra el diff en auditoría.
- **Auditoría:** tabla con fecha/hora, usuario, negocio, cierre, cambios (antes → después) y motivo.
- **Negocios:** editar la **base en efectivo** de cada punto.
- **Cajeros y turnos** (nuevo):
  - *Cajeros:* crear (nombre, email, contraseña), desactivar/eliminar. Ver lista con estado.
  - *Asignación por días:* calendario/tabla donde el admin asigna cada cajero a un punto por fecha (turnos). Debe permitir asignar el mismo cajero a distintos puntos en días distintos.

### 7.3 Exportación
- **Excel:** generar `.xlsx` en el navegador con SheetJS (gratis) del rango filtrado.
- **PDF:** generar con la impresión del navegador (`window.print()` con hoja de estilos) o con una librería como pdfmake.

---

## 8. Edge Functions (crear/eliminar cajeros)

Dos funciones Deno con la **service role key** (nunca expuesta al frontend). Cada una valida que quien llama sea admin leyendo su JWT.

- `admin-crear-cajero` → recibe `{ email, password, nombre }`; crea el usuario en Auth y su fila en `profiles` (rol `cajero`).
- `admin-eliminar-cajero` → recibe `{ profile_id }`; **desactiva** el cajero (`activo=false`) para conservar la integridad de cierres y auditoría. (Opcional: borrado definitivo si no tiene cierres asociados.)

---

## 9. Plan de construcción por fases (para Claude Code)

Trabajar por fases; probar cada una antes de seguir. Sugerencia de prompt inicial para Claude Code:

> "Vamos a construir la app descrita en este documento (`PLAN.md`). Usa React + Vite + TypeScript + Tailwind + Supabase. Empieza por la Fase 0 y no avances hasta que confirme."

**Fase 0 — Setup**
- Crear proyecto Vite (React+TS), Tailwind, `@supabase/supabase-js`, `vite-plugin-pwa`.
- Variables `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- *Listo cuando:* la app corre en local y conecta con Supabase.

**Fase 1 — Base de datos**
- Ejecutar el SQL de las secciones 5 y 6 (tablas, RLS, `is_admin()`).
- Sembrar los 3 negocios con sus bases; crear el primer usuario **admin** (desde el panel de Supabase) y su fila en `profiles` con rol `admin`.
- *Listo cuando:* las tablas existen y las políticas están activas.

**Fase 2 — Auth y shell por rol**
- Login (email/contraseña), manejo de sesión, rutas protegidas, y layout que cambie según `rol`.
- *Listo cuando:* admin y cajero ven interfaces distintas.

**Fase 3 — Cajero: nuevo cierre**
- Formulario completo con cuadre de **efectivo** y **datáfono** en vivo, detalle QR/Nequi, y gastos con **subida de foto a Storage**. Sin historial.
- Bloqueo de cierre duplicado por negocio/día. Carga de base y punto desde la asignación del día.
- *Listo cuando:* un cajero guarda un cierre real con foto y el cuadre calcula bien.

**Fase 4 — Admin: panel consolidado**
- KPIs, rango de fechas, barras por medio de pago, tarjetas por negocio.
- *Listo cuando:* los totales coinciden con los cierres guardados.

**Fase 5 — Admin: cierres + auditoría**
- Tabla de trazabilidad, edición con motivo obligatorio, y registro en `auditoria`. Vista de auditoría.
- *Listo cuando:* editar un cierre deja rastro completo.

**Fase 6 — Admin: cajeros y turnos**
- Edge Functions de alta/baja de cajeros. UI de gestión de cajeros. Calendario de asignación por día.
- *Listo cuando:* el admin crea un cajero, lo asigna a un punto para una fecha, y ese cajero solo puede cerrar ese punto ese día.

**Fase 7 — PWA y despliegue**
- Manifest, íconos, service worker (shell offline). Desplegar en Vercel/Netlify. Probar instalación en celular y PC.
- *Listo cuando:* se instala como app y funciona en móvil.

---

## 10. Requisitos previos y despliegue

**Cuentas gratuitas necesarias:** GitHub, Supabase, Vercel (o Netlify).

**Pasos de despliegue:**
1. Subir el repositorio a GitHub.
2. Crear proyecto en Supabase → correr el SQL → crear bucket `soportes-gastos` (privado) → desplegar las Edge Functions.
3. Conectar el repo en Vercel/Netlify → configurar variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) → deploy.
4. Probar en celular: abrir la URL y "Agregar a pantalla de inicio".

**Límites del plan gratuito de Supabase (referencia):** ~500 MB de base de datos, ~1 GB de almacenamiento, y decenas de miles de usuarios activos al mes. Para 3 negocios con un cierre diario y algunas fotos, sobra. Si el almacenamiento de fotos creciera mucho con los años, se puede comprimir la imagen antes de subir o archivar las antiguas.

---

## 11. Decisiones tomadas por defecto (ajustables)

- El "datáfono liquidado" se ingresa manualmente desde el cierre del terminal (no hay integración con el banco).
- Baja de cajeros = **desactivar** (no borrar), para no perder el historial ni la auditoría.
- Un cajero = un punto por día (regla `unique (profile_id, fecha)`). Si un punto pudiera tener dos cajeros el mismo día, se ajusta la restricción.
- El cajero puede ver, como máximo, su propio cierre del día en curso (para la confirmación), nunca días anteriores ni otros puntos.

Cualquiera de estos puntos se puede cambiar; están aislados para que sea fácil.
