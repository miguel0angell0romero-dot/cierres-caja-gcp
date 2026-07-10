import { useEffect, useState } from 'react'
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
      <div className="rounded-xl bg-white p-4 shadow-sm flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Mes</label>
        <input
          type="month"
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {mensajeExito && <span className="text-sm text-green-600 font-medium">{mensajeExito}</span>}
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-2">Total combinado (los 3 negocios)</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {negocios.map((n) => (
              <div key={n.id} className="rounded-xl bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: n.color }} />
                  <h3 className="font-semibold text-gray-900">{n.nombre}</h3>
                </div>

                {esSuperAdmin && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={edicion[n.id] ?? ''}
                      onChange={(e) => setEdicion((prev) => ({ ...prev, [n.id]: e.target.value }))}
                      placeholder="Presupuesto del mes"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => guardarPresupuesto(n.id)}
                      disabled={guardandoId === n.id}
                      className="rounded-lg bg-violet-600 text-white text-sm font-medium px-3 py-2 hover:bg-violet-700 disabled:opacity-50"
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
    return <p className="text-sm text-gray-400">Sin presupuesto definido para este mes.</p>
  }

  if (esFuturo) {
    return (
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Presupuesto mensual</span>
          <span className="font-medium">{formatCOP(presupuesto)}</span>
        </div>
        <p className="text-gray-400">Este mes todavía no ha comenzado.</p>
      </div>
    )
  }

  const esperadoAFecha = presupuesto * fraccionMes
  const diferencia = ventaReal - esperadoAFecha
  const porcentajeAvance = presupuesto > 0 ? (ventaReal / presupuesto) * 100 : 0
  const porcentajeEsperado = fraccionMes * 100

  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">Presupuesto mensual</span>
        <span className="font-medium">{formatCOP(presupuesto)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Venta real a la fecha</span>
        <span className="font-medium">{formatCOP(ventaReal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">
          Esperado a la fecha (día {diasTranscurridos}/{diasDelMes})
        </span>
        <span className="font-medium">{formatCOP(esperadoAFecha)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">{diferencia >= 0 ? 'Por encima de lo esperado' : 'Colgados (por debajo)'}</span>
        <span className={`font-semibold ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCOP(Math.abs(diferencia))}
        </span>
      </div>
      <div className="pt-1">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Avance del presupuesto</span>
          <span>{porcentajeAvance.toFixed(0)}%</span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${porcentajeAvance >= porcentajeEsperado ? 'bg-green-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(100, porcentajeAvance)}%` }}
          />
          <div
            className="absolute top-0 h-full w-px bg-gray-500"
            style={{ left: `${Math.min(100, porcentajeEsperado)}%` }}
            title="Punto esperado a la fecha"
          />
        </div>
      </div>
    </div>
  )
}
