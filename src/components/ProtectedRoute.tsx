import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { PantallaMensaje } from './PantallaMensaje'

export function ProtectedRoute() {
  const { session, profile, loading, profileError, signOut } = useAuth()

  if (loading) {
    return <PantallaMensaje tipo="info">Cargando...</PantallaMensaje>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profileError || !profile) {
    return (
      <PantallaMensaje tipo="error">
        <p>{profileError ?? 'No se pudo cargar tu perfil.'}</p>
        <button
          onClick={signOut}
          className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-900 underline"
        >
          Cerrar sesión
        </button>
      </PantallaMensaje>
    )
  }

  return <Outlet />
}
