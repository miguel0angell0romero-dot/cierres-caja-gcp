import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { hoyBogota } from '../../lib/fecha'
import { formatCOP } from '../../lib/money'
import { CATEGORIAS_GASTO } from '../../lib/constantes'
import { PantallaMensaje } from '../../components/PantallaMensaje'
import { GastoRow } from './GastoRow'
import { DetallePagos } from './DetallePagos'
import { ResumenCierre } from './ResumenCierre'
import type { GastoLocal } from './types'

interface NegocioAsignado {
  id: string
  nombre: string
  codigo: string
  base_efectivo: number
}

interface GastoGuardado {
  categoria: string
  valor: number
  nota: string | null
}

interface CierreGuardado {
  base_efectivo: number
  venta_efectivo: number
  venta_qr: number
  venta_nequi: number
  venta_datafono: number
  venta_credito: number
  datafono_liquidado: number
  efectivo_contado: number
  recibe: string | null
  gastos: GastoGuardado[]
}

type Estado = 'cargando' | 'sin-asignacion' | 'ya-guardado' | 'listo' | 'error'

function numero(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function NuevoCierrePage() {
  const { session } = useAuth()
  const hoy = useMemo(() => hoyBogota(), [])

  const [estado, setEstado] = useState<Estado>('cargando')
  const [negocio, setNegocio] = useState<NegocioAsignado | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [cierreGuardado, setCierreGuardado] = useState<CierreGuardado | null>(null)

  const [ventaEfectivo, setVentaEfectivo] = useState(0)
  const [ventaQr, setVentaQr] = useState(0)
  const [ventaNequi, setVentaNequi] = useState(0)
  const [ventaDatafono, setVentaDatafono] = useState(0)
  const [ventaCredito, setVentaCredito] = useState(0)
  const [detalleQr, setDetalleQr] = useState<number[]>([])
  const [detalleNequi, setDetalleNequi] = useState<number[]>([])
  const [mostrarDetalleQr, setMostrarDetalleQr] = useState(false)
  const [mostrarDetalleNequi, setMostrarDetalleNequi] = useState(false)
  const [datafonoLiquidado, setDatafonoLiquidado] = useState(0)
  const [gastos, setGastos] = useState<GastoLocal[]>([])
  const [efectivoContado, setEfectivoContado] = useState(0)
  const [recibe, setRecibe] = useState('')
  const [detalleOtros, setDetalleOtros] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !session) return
    let cancelado = false

    async function cargar() {
      if (!supabase || !session) return

      const { data: asignacion, error: asgError } = await supabase
        .from('asignaciones')
        .select('negocio_id, negocios (id, nombre, codigo, base_efectivo)')
        .eq('profile_id', session.user.id)
        .eq('fecha', hoy)
        .maybeSingle()

      if (cancelado) return

      if (asgError) {
        setErrorCarga(asgError.message)
        setEstado('error')
        return
      }

      const negocioAsignado = (
        asignacion as unknown as { negocios: NegocioAsignado } | null
      )?.negocios

      if (!negocioAsignado) {
        setEstado('sin-asignacion')
        return
      }

      setNegocio(negocioAsignado)

      const { data: cierreExistente, error: cierreError } = await supabase
        .from('cierres')
        .select('*, gastos(categoria, valor, nota)')
        .eq('negocio_id', negocioAsignado.id)
        .eq('profile_id', session.user.id)
        .eq('fecha', hoy)
        .maybeSingle()

      if (cancelado) return

      if (cierreError) {
        setErrorCarga(cierreError.message)
        setEstado('error')
        return
      }

      if (cierreExistente) {
        setCierreGuardado(cierreExistente as unknown as CierreGuardado)
        setEstado('ya-guardado')
        return
      }

      setEstado('listo')
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [session, hoy])

  const totalVenta = ventaEfectivo + ventaQr + ventaNequi + ventaDatafono + ventaCredito
  const totalGastos = gastos.reduce((sum, g) => sum + (g.valor || 0), 0)
  const baseEfectivo = negocio?.base_efectivo ?? 0
  const esperado = baseEfectivo + ventaEfectivo - totalGastos
  const diferencia = efectivoContado - esperado
  const entrega = efectivoContado - baseEfectivo
  const diferenciaDatafono = datafonoLiquidado - ventaDatafono

  function agregarGasto() {
    setGastos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), categoria: CATEGORIAS_GASTO[0], valor: 0, nota: '', foto: null },
    ])
  }

  async function guardarCierre() {
    if (!supabase || !session || !negocio) return

    setGuardando(true)
    setErrorGuardado(null)

    try {
      const cierreId = crypto.randomUUID()

      const { error: cierreError } = await supabase.from('cierres').insert({
        id: cierreId,
        negocio_id: negocio.id,
        profile_id: session.user.id,
        fecha: hoy,
        base_efectivo: baseEfectivo,
        venta_efectivo: ventaEfectivo,
        venta_qr: ventaQr,
        venta_nequi: ventaNequi,
        venta_datafono: ventaDatafono,
        venta_credito: ventaCredito,
        datafono_liquidado: datafonoLiquidado,
        efectivo_contado: efectivoContado,
        detalle_otros: detalleOtros || null,
        recibe: recibe || null,
      })

      if (cierreError) {
        if (cierreError.code === '23505') {
          throw new Error('Ya existe un cierre guardado para este negocio hoy.')
        }
        throw new Error(cierreError.message)
      }

      const gastosGuardados: GastoGuardado[] = []

      for (const gasto of gastos) {
        let fotoPath: string | null = null

        if (gasto.foto) {
          const path = `${negocio.id}/${cierreId}/${gasto.id}.jpg`
          const { error: uploadError } = await supabase.storage
            .from('soportes-gastos')
            .upload(path, gasto.foto, { contentType: gasto.foto.type })

          if (uploadError) {
            throw new Error(`Cierre guardado, pero falló la foto de un gasto: ${uploadError.message}`)
          }
          fotoPath = path
        }

        const { error: gastoError } = await supabase.from('gastos').insert({
          id: gasto.id,
          cierre_id: cierreId,
          categoria: gasto.categoria,
          valor: gasto.valor,
          foto_path: fotoPath,
          nota: gasto.nota || null,
        })

        if (gastoError) {
          throw new Error(`Cierre guardado, pero falló un gasto: ${gastoError.message}`)
        }

        gastosGuardados.push({ categoria: gasto.categoria, valor: gasto.valor, nota: gasto.nota || null })
      }

      const pagos = [
        ...detalleQr.map((valor) => ({ cierre_id: cierreId, metodo: 'qr', valor })),
        ...detalleNequi.map((valor) => ({ cierre_id: cierreId, metodo: 'nequi', valor })),
      ]

      if (pagos.length > 0) {
        const { error: pagosError } = await supabase.from('pagos_detalle').insert(pagos)
        if (pagosError) {
          throw new Error(`Cierre guardado, pero falló el detalle de pagos: ${pagosError.message}`)
        }
      }

      setCierreGuardado({
        base_efectivo: baseEfectivo,
        venta_efectivo: ventaEfectivo,
        venta_qr: ventaQr,
        venta_nequi: ventaNequi,
        venta_datafono: ventaDatafono,
        venta_credito: ventaCredito,
        datafono_liquidado: datafonoLiquidado,
        efectivo_contado: efectivoContado,
        recibe: recibe || null,
        gastos: gastosGuardados,
      })
      setEstado('ya-guardado')
    } catch (e) {
      setErrorGuardado(e instanceof Error ? e.message : 'Error desconocido al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  if (estado === 'cargando') {
    return <PantallaMensaje tipo="info">Cargando tu punto asignado...</PantallaMensaje>
  }

  if (estado === 'error') {
    return <PantallaMensaje tipo="error">{errorCarga}</PantallaMensaje>
  }

  if (estado === 'sin-asignacion') {
    return (
      <PantallaMensaje tipo="info">
        No tienes un punto asignado para hoy. Contacta al administrador.
      </PantallaMensaje>
    )
  }

  if (estado === 'ya-guardado' && cierreGuardado && negocio) {
    return (
      <ResumenCierre
        negocioNombre={negocio.nombre}
        fecha={hoy}
        cierre={cierreGuardado}
        gastos={cierreGuardado.gastos}
      />
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-8">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="font-semibold text-gray-900">{negocio?.nombre}</p>
        <p className="text-sm text-gray-500">
          {hoy} — Base: {formatCOP(baseEfectivo)}
        </p>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Ventas según sistema</h2>

        <Campo label="Efectivo" value={ventaEfectivo} onChange={setVentaEfectivo} />

        <div>
          <Campo label="QR" value={ventaQr} onChange={setVentaQr} />
          <button
            type="button"
            onClick={() => setMostrarDetalleQr((v) => !v)}
            className="text-xs font-medium text-violet-600 mt-1"
          >
            {mostrarDetalleQr ? 'Ocultar detalle' : 'Detallar pagos'}
          </button>
          {mostrarDetalleQr && (
            <DetallePagos valores={detalleQr} onCambiar={setDetalleQr} total={ventaQr} />
          )}
        </div>

        <div>
          <Campo label="Nequi/Daviplata" value={ventaNequi} onChange={setVentaNequi} />
          <button
            type="button"
            onClick={() => setMostrarDetalleNequi((v) => !v)}
            className="text-xs font-medium text-violet-600 mt-1"
          >
            {mostrarDetalleNequi ? 'Ocultar detalle' : 'Detallar pagos'}
          </button>
          {mostrarDetalleNequi && (
            <DetallePagos valores={detalleNequi} onCambiar={setDetalleNequi} total={ventaNequi} />
          )}
        </div>

        <Campo label="Datáfono" value={ventaDatafono} onChange={setVentaDatafono} />
        <Campo label="Crédito" value={ventaCredito} onChange={setVentaCredito} />

        <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold text-gray-900">
          <span>Total venta</span>
          <span>{formatCOP(totalVenta)}</span>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Cuadre de datáfono</h2>
        <Campo label="Datáfono liquidado (terminal)" value={datafonoLiquidado} onChange={setDatafonoLiquidado} />
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Diferencia (liquidado − sistema)</span>
          <span className={diferenciaDatafono === 0 ? 'text-gray-800' : 'text-amber-600 font-medium'}>
            {formatCOP(diferenciaDatafono)}
          </span>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Gastos en efectivo</h2>
          <button
            type="button"
            onClick={agregarGasto}
            className="text-sm font-medium text-violet-600 hover:text-violet-800"
          >
            + Agregar gasto
          </button>
        </div>

        {gastos.map((g) => (
          <GastoRow
            key={g.id}
            gasto={g}
            onCambiar={(actualizado) =>
              setGastos((prev) => prev.map((x) => (x.id === g.id ? actualizado : x)))
            }
            onQuitar={() => setGastos((prev) => prev.filter((x) => x.id !== g.id))}
          />
        ))}

        <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold text-gray-900">
          <span>Total gastos</span>
          <span>{formatCOP(totalGastos)}</span>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Cuadre de efectivo</h2>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Base</span>
          <span>{formatCOP(baseEfectivo)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Ventas efectivo</span>
          <span>{formatCOP(ventaEfectivo)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Gastos</span>
          <span>- {formatCOP(totalGastos)}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
          <span>Esperado</span>
          <span>{formatCOP(esperado)}</span>
        </div>

        <Campo label="Efectivo contado" value={efectivoContado} onChange={setEfectivoContado} />

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{diferencia >= 0 ? 'Sobrante' : 'Faltante'}</span>
          <span className={diferencia === 0 ? 'text-gray-800' : diferencia > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {formatCOP(Math.abs(diferencia))}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900">
          <span>Entrega</span>
          <span>{formatCOP(entrega)}</span>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Recibe</label>
          <input
            type="text"
            value={recibe}
            onChange={(e) => setRecibe(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm space-y-2">
        <label className="text-sm font-medium text-gray-700">Notas adicionales (opcional)</label>
        <textarea
          value={detalleOtros}
          onChange={(e) => setDetalleOtros(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </section>

      {errorGuardado && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm font-medium px-4 py-3">
          {errorGuardado}
        </div>
      )}

      <button
        type="button"
        onClick={guardarCierre}
        disabled={guardando}
        className="w-full rounded-lg bg-violet-600 text-white font-medium py-3 hover:bg-violet-700 disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Guardar cierre'}
      </button>
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (valor: number) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        min={0}
        step={1}
        value={value || ''}
        onChange={(e) => onChange(numero(e.target.value))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  )
}
