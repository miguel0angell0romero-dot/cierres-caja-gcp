import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
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
    return <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
  }

  if (filas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
        <ShieldCheck size={22} className="text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">Aún no hay ediciones registradas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filas.map((fila) => (
        <div
          key={fila.id}
          className="animate-fade-up rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800"
        >
          <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
            <span className="font-bold text-gray-900 dark:text-gray-50">
              {fila.cierres?.negocios?.nombre} — {fila.cierres?.fecha}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {new Date(fila.created_at).toLocaleString('es-CO')} — {fila.profiles?.nombre}
            </span>
          </div>

          <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Motivo:</span> {fila.motivo}
          </p>

          <div className="space-y-1 rounded-[14px] bg-gray-50 p-3 dark:bg-gray-900/60">
            {fila.cambios.map((c, i) => (
              <div key={i} className="flex flex-wrap gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{c.campo}:</span>
                <span className="text-gray-400 line-through dark:text-gray-500">{c.antes || '(vacío)'}</span>
                <span>→</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{c.despues || '(vacío)'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
