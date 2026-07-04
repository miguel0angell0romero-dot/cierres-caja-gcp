import { useState } from 'react'
import { FormularioNuevaPassword } from './FormularioNuevaPassword'

export function CambiarPasswordModal({ onCerrar }: { onCerrar: () => void }) {
  const [exito, setExito] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">Cambiar contraseña</h2>

        {exito ? (
          <>
            <div className="rounded-lg bg-green-50 text-green-700 text-sm font-medium px-3 py-2">
              Contraseña actualizada correctamente.
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="w-full rounded-lg bg-violet-600 text-white font-medium py-2 hover:bg-violet-700"
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
              className="w-full text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
