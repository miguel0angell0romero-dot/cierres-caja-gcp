import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const enlaces = [
  { to: '/admin', label: 'Panel', end: true },
  { to: '/admin/cierres', label: 'Cierres' },
  { to: '/admin/auditoria', label: 'Auditoría' },
  { to: '/admin/cajeros', label: 'Cajeros' },
  { to: '/admin/turnos', label: 'Turnos' },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">Panel Administrador</p>
          <p className="text-sm text-gray-500">{profile?.nombre}</p>
        </div>
        <button
          onClick={signOut}
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          Cerrar sesión
        </button>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6 flex gap-4">
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.to}
            to={enlace.to}
            end={enlace.end}
            className={({ isActive }) =>
              `py-3 text-sm font-medium border-b-2 ${
                isActive
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`
            }
          >
            {enlace.label}
          </NavLink>
        ))}
      </nav>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
