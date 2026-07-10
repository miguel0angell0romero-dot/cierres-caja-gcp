import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RequireRole } from './components/RequireRole'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AdminLayout } from './layouts/AdminLayout'
import { CajeroLayout } from './layouts/CajeroLayout'
import { NuevoCierrePage } from './pages/cajero/NuevoCierrePage'
import { PanelConsolidado } from './pages/admin/PanelConsolidado'
import { CierresPage } from './pages/admin/CierresPage'
import { AuditoriaPage } from './pages/admin/AuditoriaPage'
import { UsuariosPage } from './pages/admin/UsuariosPage'
import { TurnosPage } from './pages/admin/TurnosPage'
import { NegociosPage } from './pages/admin/NegociosPage'
import { PresupuestoPage } from './pages/admin/PresupuestoPage'

function InicioRedirect() {
  const { profile } = useAuth()
  return <Navigate to={profile?.rol === 'cajero' ? '/cajero' : '/admin'} replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<InicioRedirect />} />

            <Route element={<RequireRole roles={['admin', 'super_admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<PanelConsolidado />} />
                <Route path="cierres" element={<CierresPage />} />
                <Route path="auditoria" element={<AuditoriaPage />} />
                <Route path="presupuesto" element={<PresupuestoPage />} />

                <Route element={<RequireRole roles={['super_admin']} />}>
                  <Route path="usuarios" element={<UsuariosPage />} />
                  <Route path="turnos" element={<TurnosPage />} />
                  <Route path="negocios" element={<NegociosPage />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RequireRole roles={['cajero']} />}>
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
