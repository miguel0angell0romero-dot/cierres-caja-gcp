import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RequireRole } from './components/RequireRole'
import { LoginPage } from './pages/LoginPage'
import { AdminLayout } from './layouts/AdminLayout'
import { CajeroLayout } from './layouts/CajeroLayout'
import { NuevoCierrePage } from './pages/cajero/NuevoCierrePage'
import { PanelConsolidado } from './pages/admin/PanelConsolidado'
import { CierresPage } from './pages/admin/CierresPage'
import { AuditoriaPage } from './pages/admin/AuditoriaPage'
import { CajerosPage } from './pages/admin/CajerosPage'
import { TurnosPage } from './pages/admin/TurnosPage'

function InicioRedirect() {
  const { profile } = useAuth()
  return <Navigate to={profile?.rol === 'admin' ? '/admin' : '/cajero'} replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<InicioRedirect />} />

            <Route element={<RequireRole rol="admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<PanelConsolidado />} />
                <Route path="cierres" element={<CierresPage />} />
                <Route path="auditoria" element={<AuditoriaPage />} />
                <Route path="cajeros" element={<CajerosPage />} />
                <Route path="turnos" element={<TurnosPage />} />
              </Route>
            </Route>

            <Route element={<RequireRole rol="cajero" />}>
              <Route path="/cajero" element={<CajeroLayout />}>
                <Route index element={<NuevoCierrePage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
