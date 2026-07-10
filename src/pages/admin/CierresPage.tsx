import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { formatCOP } from '../../lib/money'
import { exportarExcel } from '../../lib/excel'
import { hoyBogota, primerDiaMesBogota } from '../../lib/fecha'
import { PantallaMensaje } from '../../components/PantallaMensaje'
import { RangoFechas } from '../../components/RangoFechas'
import { EditarCierreModal } from './EditarCierreModal'
import { CargarCierreModal } from './CargarCierreModal'
import type { CierreCompleto, NegocioResumen } from './types'

interface CajeroOpcion {
  id: string
  nombre: string
}

export function CierresPage() {
  const { profile } = useAuth()
  const esSuperAdmin = profile?.rol === 'super_admin'

  const [negocios, setNegocios] = useState<NegocioResumen[]>([])
  const [cajeros, setCajeros] = useState<CajeroOpcion[]>([])
  const [filtroNegocio, setFiltroNegocio] = useState('todos')
  const [desde, setDesde] = useState(primerDiaMesBogota())
  const [hasta, setHasta] = useState(hoyBogota())
  const [cierres, setCierres] = useState<CierreCompleto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cierreEditando, setCierreEditando] = useState<CierreCompleto | null>(null)
  const [mostrarCargarCierre, setMostrarCargarCierre] = useState(false)
  const [cierreEliminando, setCierreEliminando] = useState<CierreCompleto | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)
  const cargaIdRef = useRef(0)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('negocios')
      .select('id, nombre, codigo, color, base_efectivo, logo_path')
      .order('nombre')
      .then(({ data }) => setNegocios((data ?? []) as NegocioResumen[]))

    supabase
      .from('profiles')
      .select('id, nombre')
      .eq('rol', 'cajero')
      .order('nombre')
      .then(({ data }) => setCajeros((data ?? []) as CajeroOpcion[]))
  }, [])

  async function cargarCierres() {
    if (!supabase) return
    const idActual = ++cargaIdRef.current
    setCargando(true)
    setError(null)

    let query = supabase
      .from('cierres')
      .select(
        '*, negocios(nombre, codigo), profiles(nombre), gastos(id, categoria, valor, nota, foto_path), propinas(id, valor, nota)'
      )
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })

    if (filtroNegocio !== 'todos') {
      query = query.eq('negocio_id', filtroNegocio)
    }

    const { data, error: err } = await query

    // Si mientras esperábamos la respuesta ya se disparó una carga más
    // reciente (p. ej. cambiaron "Desde" y "Hasta" seguido), se ignora este
    // resultado desactualizado para no pisar el de la consulta más nueva.
    if (idActual !== cargaIdRef.current) return

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
  }, [filtroNegocio, desde, hasta])

  function exportar() {
    const filas = cierres.map((c) => {
      const totalGastos = c.gastos.reduce((s, g) => s + g.valor, 0)
      const totalPropinas = c.propinas.reduce((s, p) => s + p.valor, 0)
      const esperado = c.base_efectivo + c.venta_efectivo - totalGastos - totalPropinas
      return {
        Fecha: c.fecha,
        Negocio: c.negocios?.nombre ?? '',
        Cajero: c.profiles?.nombre ?? '',
        Base: c.base_efectivo,
        'Venta efectivo': c.venta_efectivo,
        'Venta QR': c.venta_qr,
        'Venta Nequi': c.venta_nequi,
        'Venta datáfono': c.venta_datafono,
        'Venta crédito': c.venta_credito,
        'Total venta':
          c.venta_efectivo + c.venta_qr + c.venta_nequi + c.venta_datafono + c.venta_credito,
        'Datáfono liquidado': c.datafono_liquidado,
        'Diferencia datáfono': c.datafono_liquidado - c.venta_datafono,
        Gastos: totalGastos,
        Propinas: totalPropinas,
        Esperado: esperado,
        'Efectivo contado': c.efectivo_contado,
        Diferencia: c.efectivo_contado - esperado,
        Entrega: c.efectivo_contado - c.base_efectivo,
        Recibe: c.recibe ?? '',
        Notas: c.detalle_otros ?? '',
      }
    })

    exportarExcel(`cierres_${desde}_a_${hasta}`, [{ nombre: 'Cierres', filas }])
  }

  async function eliminarCierre() {
    if (!supabase || !cierreEliminando) return
    setEliminando(true)
    setErrorEliminar(null)

    const { error: err } = await supabase.from('cierres').delete().eq('id', cierreEliminando.id)

    setEliminando(false)

    if (err) {
      setErrorEliminar(err.message)
      return
    }

    setCierreEliminando(null)
    cargarCierres()
  }

  if (error) {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
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
          <RangoFechas desde={desde} hasta={hasta} onCambiarDesde={setDesde} onCambiarHasta={setHasta} />
        </div>

        <div className="flex gap-2">
          {esSuperAdmin && (
            <button
              type="button"
              onClick={() => setMostrarCargarCierre(true)}
              className="rounded-lg border border-violet-600 text-violet-600 text-sm font-medium px-4 py-2 hover:bg-violet-50"
            >
              + Cargar cierre anterior
            </button>
          )}
          <button
            type="button"
            onClick={exportar}
            disabled={cierres.length === 0}
            className="rounded-lg bg-violet-600 text-white text-sm font-medium px-4 py-2 hover:bg-violet-700 disabled:opacity-50"
          >
            Exportar a Excel
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
        {cargando ? (
          <p className="p-4 text-gray-500">Cargando...</p>
        ) : cierres.length === 0 ? (
          <p className="p-4 text-gray-500">No hay cierres registrados en este rango.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Cajero</th>
                <th className="px-4 py-3 font-medium text-right">Total venta</th>
                <th className="px-4 py-3 font-medium text-right">Entrega</th>
                {esSuperAdmin && <th className="px-4 py-3 font-medium"></th>}
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
                    {esSuperAdmin && (
                      <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setCierreEditando(c)}
                          className="text-violet-600 font-medium hover:text-violet-800"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setCierreEliminando(c)}
                          className="text-red-600 font-medium hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
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
          onCerrar={() => setCierreEditando(null)}
          onGuardado={() => {
            setCierreEditando(null)
            cargarCierres()
          }}
        />
      )}

      {cierreEliminando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4 text-center">
            <h2 className="font-semibold text-gray-900 text-lg">¿Eliminar este cierre?</h2>
            <p className="text-sm text-gray-600">
              {cierreEliminando.negocios?.nombre} — {cierreEliminando.fecha}
              <br />
              Esta acción es permanente: se borran también sus gastos, propinas y detalle de
              pagos, y no queda registro en auditoría. Úsalo solo para corregir cierres de
              prueba o duplicados por error.
            </p>

            {errorEliminar && (
              <div className="rounded-lg bg-red-50 text-red-700 text-sm font-medium px-3 py-2 text-left">
                {errorEliminar}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCierreEliminando(null)}
                disabled={eliminando}
                className="flex-1 rounded-lg border border-gray-300 text-gray-600 font-medium py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarCierre}
                disabled={eliminando}
                className="flex-1 rounded-lg bg-red-600 text-white font-medium py-2 hover:bg-red-700 disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarCargarCierre && (
        <CargarCierreModal
          negocios={negocios}
          cajeros={cajeros}
          onCerrar={() => setMostrarCargarCierre(false)}
          onGuardado={() => {
            setMostrarCargarCierre(false)
            cargarCierres()
          }}
        />
      )}
    </div>
  )
}
