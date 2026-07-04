import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type Rol } from '../lib/AuthContext'

export function RequireRole({ rol }: { rol: Rol }) {
  const { profile } = useAuth()

  if (profile?.rol !== rol) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
