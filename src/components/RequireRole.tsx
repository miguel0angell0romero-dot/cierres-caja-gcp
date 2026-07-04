import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type Rol } from '../lib/AuthContext'

export function RequireRole({ roles }: { roles: Rol[] }) {
  const { profile } = useAuth()

  if (!profile || !roles.includes(profile.rol)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
