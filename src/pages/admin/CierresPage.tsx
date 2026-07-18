import { useEffect, useRef, useState } from 'react'
import { Download, Pencil, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
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

const UMBRAL_CUADRE = 1000

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
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="flex flex-wrap items-end gap-3.5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">
              Negocio
            </label>
            <select
              value={filtroNegocio}
              onChange={(e) => setFiltroNegocio(e.target.value)}
              className="h-11 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
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
              className="flex h-11 items-center gap-2 rounded-[14px] border border-violet-200 px-4 text-sm font-semibold text-violet-600 shadow-sm transition hover:-translate-y-px hover:scale-[1.015] hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10"
            >
              <Plus size={15} /> Cargar cierre anterior
            </button>
          )}
          <button
            type="button"
            onClick={exportar}
            disabled={cierres.length === 0}
            className="flex h-11 items-center gap-2 rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.6)] transition hover:-translate-y-px hover:scale-[1.015] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
          >
            <Download size={15} /> Exportar a Excel
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
        {cargando ? (
          <p className="p-5 text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : cierres.length === 0 ? (
          <p className="p-5 text-gray-500 dark:text-gray-400">No hay cierres registrados en este rango.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11.5px] font-bold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Negocio</th>
                  <th className="px-5 py-3">Cajero</th>
                  <th className="px-5 py-3 text-right">Total venta</th>
                  <th className="px-5 py-3 text-right">Entrega</th>
                  <th className="px-5 py-3">Cuadre</th>
                  {esSuperAdmin && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {cierres.map((c) => {
                  const totalVenta =
                    c.venta_efectivo + c.venta_qr + c.venta_nequi + c.venta_datafono + c.venta_credito
                  const entrega = c.efectivo_contado - c.base_efectivo
                  const totalGastos = c.gastos.reduce((s, g) => s + g.valor, 0)
                  const totalPropinas = c.propinas.reduce((s, p) => s + p.valor, 0)
                  const esperado = c.base_efectivo + c.venta_efectivo - totalGastos - totalPropinas
                  const diferencia = c.efectivo_contado - esperado
                  const cuadrado = Math.abs(diferencia) <= UMBRAL_CUADRE

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-50 transition last:border-0 hover:bg-gray-50 dark:border-gray-700/60 dark:hover:bg-gray-900/40"
                    >
                      <td className="h-[52px] px-5 text-gray-700 dark:text-gray-300">{c.fecha}</td>
                      <td className="px-5">
                        <span className="inline-flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: negocios.find((n) => n.id === c.negocio_id)?.color ?? '#94a3b8' }}
                          />
                          {c.negocios?.nombre}
                        </span>
                      </td>
                      <td className="px-5 text-gray-600 dark:text-gray-400">{c.profiles?.nombre}</td>
                      <td className="px-5 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCOP(totalVenta)}
                      </td>
                      <td
                        className={`px-5 text-right font-medium ${entrega < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}
                      >
                        {formatCOP(entrega)}
                      </td>
                      <td className="px-5">
                        {cuadrado ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            <TrendingUp size={11} /> Cuadrado
                          </span>
                        ) : diferencia < 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                            <TrendingDown size={11} /> Faltante
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            <TrendingUp size={11} /> Sobrante
                          </span>
                        )}
                      </td>
                      {esSuperAdmin && (
                        <td className="px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setCierreEditando(c)}
                              title="Editar"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-gray-400 transition hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCierreEliminando(c)}
                              title="Eliminar"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="animate-card-in w-full max-w-sm space-y-4 rounded-[20px] bg-white p-6 text-center shadow-lg dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">¿Eliminar este cierre?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {cierreEliminando.negocios?.nombre} — {cierreEliminando.fecha}
              <br />
              Esta acción es permanente: se borran también sus gastos, propinas y detalle de
              pagos, y no queda registro en auditoría. Úsalo solo para corregir cierres de
              prueba o duplicados por error.
            </p>

            {errorEliminar && (
              <div className="rounded-[14px] bg-red-50 px-3.5 py-2.5 text-left text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                {errorEliminar}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCierreEliminando(null)}
                disabled={eliminando}
                className="flex-1 rounded-[14px] border border-gray-200 py-2.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarCierre}
                disabled={eliminando}
                className="flex-1 rounded-[14px] bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
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
