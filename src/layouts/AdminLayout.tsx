import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { CambiarPasswordModal } from '../components/CambiarPasswordModal'

const enlaces = [
  { to: '/admin', label: 'Panel', end: true, soloSuperAdmin: false },
  { to: '/admin/cierres', label: 'Cierres', end: false, soloSuperAdmin: false },
  { to: '/admin/auditoria', label: 'Auditoría', end: false, soloSuperAdmin: false },
  { to: '/admin/usuarios', label: 'Usuarios', end: false, soloSuperAdmin: true },
  { to: '/admin/turnos', label: 'Turnos', end: false, soloSuperAdmin: true },
  { to: '/admin/negocios', label: 'Negocios', end: false, soloSuperAdmin: true },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false)
  const esSuperAdmin = profile?.rol === 'super_admin'

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">
            {esSuperAdmin ? 'Super Administrador' : 'Administrador (consulta)'}
          </p>
          <p className="text-sm text-gray-500">{profile?.nombre}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMostrarCambiarPassword(true)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Cambiar contraseña
          </button>
          <button
            onClick={signOut}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6 flex gap-4">
        {enlaces
          .filter((enlace) => !enlace.soloSuperAdmin || esSuperAdmin)
          .map((enlace) => (
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

      {mostrarCambiarPassword && (
        <CambiarPasswordModal onCerrar={() => setMostrarCambiarPassword(false)} />
      )}
    </div>
  )
}
