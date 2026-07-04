import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCOP } from '../../lib/money'
import { PantallaMensaje } from '../../components/PantallaMensaje'
import { EditarCierreModal } from './EditarCierreModal'
import type { CierreCompleto, NegocioResumen } from './types'

export function CierresPage() {
  const [negocios, setNegocios] = useState<NegocioResumen[]>([])
  const [filtroNegocio, setFiltroNegocio] = useState('todos')
  const [cierres, setCierres] = useState<CierreCompleto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cierreEditando, setCierreEditando] = useState<CierreCompleto | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('negocios')
      .select('id, nombre, codigo, color, base_efectivo')
      .order('nombre')
      .then(({ data }) => setNegocios((data ?? []) as NegocioResumen[]))
  }, [])

  async function cargarCierres() {
    if (!supabase) return
    setCargando(true)
    setError(null)

    let query = supabase
      .from('cierres')
      .select(
        '*, negocios(nombre, codigo), profiles(nombre), gastos(valor)'
      )
      .order('fecha', { ascending: false })

    if (filtroNegocio !== 'todos') {
      query = query.eq('negocio_id', filtroNegocio)
    }

    const { data, error: err } = await query

    if (err) {
      setError(err.message)
      setCargando(false)
      return
    }

    setCierres((data ?? []) as unknown as CierreCompleto[])
    setCargando(false)
  }

  useEffect(() => {
    cargarCierres()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroNegocio])

  if (error) {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Negocio</label>
        <select
          value={filtroNegocio}
          onChange={(e) => setFiltroNegocio(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="todos">Todos</option>
          {negocios.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
        {cargando ? (
          <p className="p-4 text-gray-500">Cargando...</p>
        ) : cierres.length === 0 ? (
          <p className="p-4 text-gray-500">No hay cierres registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Cajero</th>
                <th className="px-4 py-3 font-medium text-right">Total venta</th>
                <th className="px-4 py-3 font-medium text-right">Entrega</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {cierres.map((c) => {
                const totalVenta =
                  c.venta_efectivo + c.venta_qr + c.venta_nequi + c.venta_datafono + c.venta_credito
                const entrega = c.efectivo_contado - c.base_efectivo
                return (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">{c.fecha}</td>
                    <td className="px-4 py-3">{c.negocios?.nombre}</td>
                    <td className="px-4 py-3">{c.profiles?.nombre}</td>
                    <td className="px-4 py-3 text-right">{formatCOP(totalVenta)}</td>
                    <td className="px-4 py-3 text-right">{formatCOP(entrega)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setCierreEditando(c)}
                        className="text-violet-600 font-medium hover:text-violet-800"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {cierreEditando && (
        <EditarCierreModal
          cierre={cierreEditando}
          totalGastos={cierreEditando.gastos.reduce((s, g) => s + g.valor, 0)}
          onCerrar={() => setCierreEditando(null)}
          onGuardado={() => {
            setCierreEditando(null)
            cargarCierres()
          }}
        />
      )}
    </div>
  )
}
