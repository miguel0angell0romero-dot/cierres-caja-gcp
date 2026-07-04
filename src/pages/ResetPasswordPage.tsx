import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FormularioNuevaPassword } from '../components/FormularioNuevaPassword'

export function ResetPasswordPage() {
  const [exito, setExito] = useState(false)

  return (
    <div className="min-h-svh flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full rounded-xl bg-white p-8 shadow-md space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Restablecer contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">Elige tu nueva contraseña</p>
        </div>

        {exito ? (
          <>
            <div className="rounded-lg bg-green-50 text-green-700 text-sm font-medium px-3 py-2 text-center">
              Contraseña actualizada. Ya puedes iniciar sesión.
            </div>
            <Link
              to="/login"
              className="block text-center w-full rounded-lg bg-violet-600 text-white font-medium py-2 hover:bg-violet-700"
            >
              Ir al login
            </Link>
          </>
        ) : (
          <FormularioNuevaPassword onExito={() => setExito(true)} />
        )}
      </div>
    </div>
  )
}
