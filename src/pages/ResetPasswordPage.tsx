import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FormularioNuevaPassword } from '../components/FormularioNuevaPassword'

export function ResetPasswordPage() {
  const [exito, setExito] = useState(false)

  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-sm space-y-5 rounded-[20px] border border-gray-200 bg-white p-8 shadow-md dark:border-gray-800 dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Restablecer contraseña
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Elige tu nueva contraseña</p>
        </div>

        {exito ? (
          <>
            <div className="rounded-[14px] bg-green-50 px-3.5 py-2.5 text-center text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
              Contraseña actualizada. Ya puedes iniciar sesión.
            </div>
            <Link
              to="/login"
              className="block w-full rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 py-3 text-center font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.6)] transition hover:-translate-y-px hover:scale-[1.015]"
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
