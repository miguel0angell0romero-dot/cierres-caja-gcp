import { useState } from 'react'
import { FormularioNuevaPassword } from './FormularioNuevaPassword'

export function CambiarPasswordModal({ onCerrar }: { onCerrar: () => void }) {
  const [exito, setExito] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="animate-card-in w-full max-w-sm space-y-4 rounded-[20px] bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Cambiar contraseña</h2>

        {exito ? (
          <>
            <div className="rounded-[14px] bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
              Contraseña actualizada correctamente.
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="w-full rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 py-2.5 font-semibold text-white shadow-sm transition hover:scale-[1.02]"
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <FormularioNuevaPassword onExito={() => setExito(true)} />
            <button
              type="button"
              onClick={onCerrar}
              className="w-full text-sm font-semibold text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
