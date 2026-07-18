import { useEffect, useState } from 'react'
import { PiggyBank } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { formatCOP } from '../../lib/money'
import { hoyBogota } from '../../lib/fecha'
import { PantallaMensaje } from '../../components/PantallaMensaje'
import { GraficaPresupuesto } from './GraficaPresupuesto'

interface Negocio {
  id: string
  nombre: string
  color: string
}

export function PresupuestoPage() {
  const { profile } = useAuth()
  const esSuperAdmin = profile?.rol === 'super_admin'

  const hoy = hoyBogota()
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.slice(0, 7))

  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [presupuestos, setPresupuestos] = useState<Record<string, number>>({})
  const [ventasPorNegocio, setVentasPorNegocio] = useState<Record<string, number>>({})
  const [edicion, setEdicion] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('negocios')
      .select('id, nombre, color')
      .order('nombre')
      .then(({ data }) => setNegocios((data ?? []) as Negocio[]))
  }, [])

  const [anio, mes] = mesSeleccionado.split('-').map(Number)

  async function cargar() {
    if (!supabase) return
    setCargando(true)
    setError(null)

    const primerDia = `${mesSeleccionado}-01`
    const ultimoDiaNum = new Date(anio, mes, 0).getDate()
    const ultimoDia = `${mesSeleccionado}-${String(ultimoDiaNum).padStart(2, '0')}`

    const [presRes, cierresRes] = await Promise.all([
      supabase.from('presupuestos').select('negocio_id, monto').eq('anio', anio).eq('mes', mes),
      supabase
        .from('cierres')
        .select('negocio_id, venta_efectivo, venta_qr, venta_nequi, venta_datafono, venta_credito')
        .gte('fecha', primerDia)
        .lte('fecha', ultimoDia),
    ])

    if (presRes.error) {
      setError(presRes.error.message)
      setCargando(false)
      return
    }
    if (cierresRes.error) {
      setError(cierresRes.error.message)
      setCargando(false)
      return
    }

    const mapaPresupuestos: Record<string, number> = {}
    for (const p of presRes.data ?? []) mapaPresupuestos[p.negocio_id] = p.monto
    setPresupuestos(mapaPresupuestos)
    setEdicion(Object.fromEntries(Object.entries(mapaPresupuestos).map(([k, v]) => [k, String(v)])))

    const mapaVentas: Record<string, number> = {}
    for (const c of cierresRes.data ?? []) {
      const total = c.venta_efectivo + c.venta_qr + c.venta_nequi + c.venta_datafono + c.venta_credito
      mapaVentas[c.negocio_id] = (mapaVentas[c.negocio_id] ?? 0) + total
    }
    setVentasPorNegocio(mapaVentas)

    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSeleccionado])

  async function guardarPresupuesto(negocioId: string) {
    if (!supabase) return
    const monto = Number(edicion[negocioId]) || 0
    setGuardandoId(negocioId)
    setError(null)

    const { error: err } = await supabase
      .from('presupuestos')
      .upsert({ negocio_id: negocioId, anio, mes, monto }, { onConflict: 'negocio_id,anio,mes' })

    setGuardandoId(null)

    if (err) {
      setError(err.message)
      return
    }

    setMensajeExito('Presupuesto guardado ✓')
    setTimeout(() => setMensajeExito(null), 2000)
    cargar()
  }

  if (error) {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  const hoyAnio = Number(hoy.slice(0, 4))
  const hoyMes = Number(hoy.slice(5, 7))
  const hoyDia = Number(hoy.slice(8, 10))
  const diasDelMesSeleccionado = new Date(anio, mes, 0).getDate()

  const esFuturo = anio > hoyAnio || (anio === hoyAnio && mes > hoyMes)
  const diasTranscurridos = esFuturo
    ? 0
    : anio === hoyAnio && mes === hoyMes
      ? hoyDia
      : diasDelMesSeleccionado
  const fraccionMes = diasTranscurridos / diasDelMesSeleccionado

  const totalPresupuesto = Object.values(presupuestos).reduce((s, v) => s + v, 0)
  const totalVentas = Object.values(ventasPorNegocio).reduce((s, v) => s + v, 0)

  const datosGrafica = negocios.map((n) => ({
    negocio: n.nombre,
    presupuesto: presupuestos[n.id] ?? 0,
    esperado: Math.round((presupuestos[n.id] ?? 0) * fraccionMes),
    ventaReal: ventasPorNegocio[n.id] ?? 0,
  }))
  const hayDatosParaGrafica = datosGrafica.some((d) => d.presupuesto > 0 || d.ventaReal > 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <label className="text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">Mes</label>
        <input
          type="month"
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className="h-11 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
        />
        {mensajeExito && (
          <span className="animate-fade-up text-sm font-semibold text-green-600 dark:text-green-400">
            {mensajeExito}
          </span>
        )}
      </div>

      {cargando ? (
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
      ) : (
        <>
          <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
              <PiggyBank size={17} className="text-violet-600 dark:text-violet-400" /> Total combinado (los 3
              negocios)
            </h2>
            <TarjetaPresupuesto
              presupuesto={totalPresupuesto}
              ventaReal={totalVentas}
              fraccionMes={fraccionMes}
              diasTranscurridos={diasTranscurridos}
              diasDelMes={diasDelMesSeleccionado}
              esFuturo={esFuturo}
            />
          </div>

          {hayDatosParaGrafica && <GraficaPresupuesto datos={datosGrafica} />}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {negocios.map((n) => (
              <div
                key={n.id}
                className="space-y-3.5 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: n.color }} />
                  <h3 className="font-bold tracking-tight text-gray-900 dark:text-gray-50">{n.nombre}</h3>
                </div>

                {esSuperAdmin && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={edicion[n.id] ?? ''}
                      onChange={(e) => setEdicion((prev) => ({ ...prev, [n.id]: e.target.value }))}
                      placeholder="Presupuesto del mes"
                      className="h-10 flex-1 rounded-[12px] border-[1.5px] border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => guardarPresupuesto(n.id)}
                      disabled={guardandoId === n.id}
                      className="rounded-[12px] bg-gradient-to-br from-violet-600 to-sky-500 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.03] disabled:opacity-50"
                    >
                      {guardandoId === n.id ? '...' : 'Guardar'}
                    </button>
                  </div>
                )}

                <TarjetaPresupuesto
                  presupuesto={presupuestos[n.id] ?? 0}
                  ventaReal={ventasPorNegocio[n.id] ?? 0}
                  fraccionMes={fraccionMes}
                  diasTranscurridos={diasTranscurridos}
                  diasDelMes={diasDelMesSeleccionado}
                  esFuturo={esFuturo}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TarjetaPresupuesto({
  presupuesto,
  ventaReal,
  fraccionMes,
  diasTranscurridos,
  diasDelMes,
  esFuturo,
}: {
  presupuesto: number
  ventaReal: number
  fraccionMes: number
  diasTranscurridos: number
  diasDelMes: number
  esFuturo: boolean
}) {
  if (presupuesto === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">Sin presupuesto definido para este mes.</p>
  }

  if (esFuturo) {
    return (
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Presupuesto mensual</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCOP(presupuesto)}</span>
        </div>
        <p className="text-gray-400 dark:text-gray-500">Este mes todavía no ha comenzado.</p>
      </div>
    )
  }

  const esperadoAFecha = presupuesto * fraccionMes
  const diferencia = ventaReal - esperadoAFecha
  const porcentajeAvance = presupuesto > 0 ? (ventaReal / presupuesto) * 100 : 0
  const porcentajeEsperado = fraccionMes * 100

  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-400">Presupuesto mensual</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCOP(presupuesto)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-400">Venta real a la fecha</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCOP(ventaReal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-400">
          Esperado a la fecha (día {diasTranscurridos}/{diasDelMes})
        </span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCOP(esperadoAFecha)}</span>
      </div>
      <div className="flex justify-between border-t border-gray-100 pt-2.5 dark:border-gray-700">
        <span className="text-gray-500 dark:text-gray-400">
          {diferencia >= 0 ? 'Por encima de lo esperado' : 'Colgados (por debajo)'}
        </span>
        <span
          className={`font-bold ${diferencia >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {formatCOP(Math.abs(diferencia))}
        </span>
      </div>
      <div className="pt-1.5">
        <div className="mb-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Avance del presupuesto</span>
          <span className="font-semibold">{porcentajeAvance.toFixed(0)}%</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all ${porcentajeAvance >= porcentajeEsperado ? 'bg-green-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(100, porcentajeAvance)}%` }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-500 dark:bg-gray-300"
            style={{ left: `${Math.min(100, porcentajeEsperado)}%` }}
            title="Punto esperado a la fecha"
          />
        </div>
      </div>
    </div>
  )
}
