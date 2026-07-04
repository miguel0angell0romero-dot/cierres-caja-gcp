import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PantallaMensaje } from '../../components/PantallaMensaje'

interface CambioAuditoria {
  campo: string
  antes: string
  despues: string
}

interface AuditoriaFila {
  id: string
  motivo: string
  cambios: CambioAuditoria[]
  created_at: string
  profiles: { nombre: string } | null
  cierres: { fecha: string; negocios: { nombre: string } | null } | null
}

export function AuditoriaPage() {
  const [filas, setFilas] = useState<AuditoriaFila[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    supabase
      .from('auditoria')
      .select('id, motivo, cambios, created_at, profiles(nombre), cierres(fecha, negocios(nombre))')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else {
          setFilas((data ?? []) as unknown as AuditoriaFila[])
        }
        setCargando(false)
      })
  }, [])

  if (error) {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  if (cargando) {
    return <p className="text-gray-500">Cargando...</p>
  }

  if (filas.length === 0) {
    return <p className="text-gray-500">Aún no hay ediciones registradas.</p>
  }

  return (
    <div className="space-y-4">
      {filas.map((fila) => (
        <div key={fila.id} className="rounded-xl bg-white p-4 shadow-sm space-y-2">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="font-semibold text-gray-900">
              {fila.cierres?.negocios?.nombre} — {fila.cierres?.fecha}
            </span>
            <span className="text-gray-500">
              {new Date(fila.created_at).toLocaleString('es-CO')} — {fila.profiles?.nombre}
            </span>
          </div>

          <p className="text-sm text-gray-700">
            <span className="font-medium">Motivo:</span> {fila.motivo}
          </p>

          <div className="rounded-lg bg-gray-50 p-2 space-y-1">
            {fila.cambios.map((c, i) => (
              <div key={i} className="text-xs text-gray-600 flex flex-wrap gap-1">
                <span className="font-medium">{c.campo}:</span>
                <span className="line-through text-gray-400">{c.antes || '(vacío)'}</span>
                <span>→</span>
                <span className="text-gray-900">{c.despues || '(vacío)'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
