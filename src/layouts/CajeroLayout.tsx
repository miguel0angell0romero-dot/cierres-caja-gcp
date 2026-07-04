import { Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export function CajeroLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Cierres de Caja GCP</p>
          <p className="text-xs text-gray-500">{profile?.nombre}</p>
        </div>
        <button
          onClick={signOut}
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          Salir
        </button>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
