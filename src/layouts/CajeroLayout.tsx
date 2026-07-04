import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { CambiarPasswordModal } from '../components/CambiarPasswordModal'

export function CajeroLayout() {
  const { profile, signOut } = useAuth()
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false)

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Cierres de Caja GCP</p>
          <p className="text-xs text-gray-500">{profile?.nombre}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarCambiarPassword(true)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Contraseña
          </button>
          <button
            onClick={signOut}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="p-4">
        <Outlet />
      </main>

      {mostrarCambiarPassword && (
        <CambiarPasswordModal onCerrar={() => setMostrarCambiarPassword(false)} />
      )}
    </div>
  )
}
