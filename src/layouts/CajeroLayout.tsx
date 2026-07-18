import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { KeyRound, LogOut } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { CambiarPasswordModal } from '../components/CambiarPasswordModal'
import { ThemeToggle } from '../components/ThemeToggle'

export function CajeroLayout() {
  const { profile, signOut } = useAuth()
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false)

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/85 px-4 py-3 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/85">
        <div>
          <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Cierres de Caja GCP
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMostrarCambiarPassword(true)}
            title="Contraseña"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] border border-gray-200 bg-white text-gray-500 transition hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-50"
          >
            <KeyRound size={16} />
          </button>
          <button
            type="button"
            onClick={signOut}
            title="Salir"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-red-500/30 dark:hover:text-red-400"
          >
            <LogOut size={16} />
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
