import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  CalendarDays,
  KeyRound,
  LayoutGrid,
  LogOut,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { CambiarPasswordModal } from '../components/CambiarPasswordModal'
import { ThemeToggle } from '../components/ThemeToggle'

const enlaces = [
  { to: '/admin', label: 'Panel', end: true, soloSuperAdmin: false, icono: LayoutGrid },
  { to: '/admin/cierres', label: 'Cierres', end: false, soloSuperAdmin: false, icono: Receipt },
  { to: '/admin/auditoria', label: 'Auditoría', end: false, soloSuperAdmin: false, icono: ShieldCheck },
  { to: '/admin/presupuesto', label: 'Presupuesto', end: false, soloSuperAdmin: false, icono: PiggyBank },
  { to: '/admin/usuarios', label: 'Usuarios', end: false, soloSuperAdmin: true, icono: Users },
  { to: '/admin/turnos', label: 'Turnos', end: false, soloSuperAdmin: true, icono: CalendarDays },
  { to: '/admin/negocios', label: 'Negocios', end: false, soloSuperAdmin: true, icono: Store },
]

function iniciales(nombre: string | undefined) {
  if (!nombre) return '—'
  const partes = nombre.trim().split(/\s+/)
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false)
  const esSuperAdmin = profile?.rol === 'super_admin'

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white/85 px-6 py-4 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/85">
        <div>
          <p className="font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {esSuperAdmin ? 'Super Administrador' : 'Administrador (consulta)'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.nombre}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMostrarCambiarPassword(true)}
            title="Cambiar contraseña"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] border border-gray-200 bg-white text-gray-500 transition hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-50"
          >
            <KeyRound size={16} />
          </button>
          <button
            type="button"
            onClick={signOut}
            title="Cerrar sesión"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-red-500/30 dark:hover:text-red-400"
          >
            <LogOut size={16} />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-violet-600 to-sky-400 text-[13px] font-bold text-white shadow-sm">
            {iniciales(profile?.nombre)}
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
        {enlaces
          .filter((enlace) => !enlace.soloSuperAdmin || esSuperAdmin)
          .map((enlace) => {
            const Icono = enlace.icono
            return (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 border-b-2 py-3 text-[13.5px] font-semibold transition ${
                    isActive
                      ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                      : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                  }`
                }
              >
                <Icono size={15} />
                {enlace.label}
              </NavLink>
            )
          })}
      </nav>

      <main className="mx-auto max-w-[1180px] p-6">
        <Outlet />
      </main>

      {mostrarCambiarPassword && (
        <CambiarPasswordModal onCerrar={() => setMostrarCambiarPassword(false)} />
      )}
    </div>
  )
}
