import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { formatCOP } from '../../lib/money'
import { CATEGORIAS_GASTO } from '../../lib/constantes'
import { GastoRow } from './GastoRow'
import { PropinaRow } from './PropinaRow'
import { DetallePagos } from './DetallePagos'
import type { DatosCierreFormulario, GastoLocal, PropinaLocal } from './types'

function numero(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const seccionCls =
  'space-y-3.5 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800'
const tituloCls = 'text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-50'

// Formulario completo de cierre (ventas, detalle QR/Nequi, gastos con foto,
// propinas y cuadre de efectivo/datáfono). Lo usan tanto el cajero (para su
// cierre del día) como el Super Admin (para cargar un cierre de una fecha
// anterior), con las mismas opciones en ambos casos.
export function FormularioCierre({
  baseEfectivo,
  valoresIniciales,
  onCambiar,
  onGuardar,
  guardando,
  textoBoton = 'Guardar cierre',
  mensajeConfirmacion,
  permitirBorrador = false,
  onGuardarBorrador,
  mensajeBorrador,
  errorGuardado,
}: {
  baseEfectivo: number
  valoresIniciales?: DatosCierreFormulario
  onCambiar?: (datos: DatosCierreFormulario) => void
  onGuardar: (datos: DatosCierreFormulario) => void | Promise<void>
  guardando: boolean
  textoBoton?: string
  mensajeConfirmacion?: string | null
  permitirBorrador?: boolean
  onGuardarBorrador?: (datos: DatosCierreFormulario) => void
  mensajeBorrador?: string | null
  errorGuardado?: string | null
}) {
  const [ventaEfectivo, setVentaEfectivo] = useState(valoresIniciales?.ventaEfectivo ?? 0)
  const [ventaQr, setVentaQr] = useState(valoresIniciales?.ventaQr ?? 0)
  const [ventaNequi, setVentaNequi] = useState(valoresIniciales?.ventaNequi ?? 0)
  const [ventaDatafono, setVentaDatafono] = useState(valoresIniciales?.ventaDatafono ?? 0)
  const [ventaCredito, setVentaCredito] = useState(valoresIniciales?.ventaCredito ?? 0)
  const [detalleQr, setDetalleQr] = useState<number[]>(valoresIniciales?.detalleQr ?? [])
  const [detalleNequi, setDetalleNequi] = useState<number[]>(valoresIniciales?.detalleNequi ?? [])
  const [mostrarDetalleQr, setMostrarDetalleQr] = useState(valoresIniciales?.mostrarDetalleQr ?? false)
  const [mostrarDetalleNequi, setMostrarDetalleNequi] = useState(
    valoresIniciales?.mostrarDetalleNequi ?? false
  )
  const [datafonoLiquidado, setDatafonoLiquidado] = useState(valoresIniciales?.datafonoLiquidado ?? 0)
  const [gastos, setGastos] = useState<GastoLocal[]>(valoresIniciales?.gastos ?? [])
  const [propinas, setPropinas] = useState<PropinaLocal[]>(valoresIniciales?.propinas ?? [])
  const [efectivoContado, setEfectivoContado] = useState(valoresIniciales?.efectivoContado ?? 0)
  const [recibe, setRecibe] = useState(valoresIniciales?.recibe ?? '')
  const [detalleOtros, setDetalleOtros] = useState(valoresIniciales?.detalleOtros ?? '')
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const datosActuales: DatosCierreFormulario = {
    ventaEfectivo,
    ventaQr,
    ventaNequi,
    ventaDatafono,
    ventaCredito,
    detalleQr,
    detalleNequi,
    mostrarDetalleQr,
    mostrarDetalleNequi,
    datafonoLiquidado,
    gastos,
    propinas,
    efectivoContado,
    recibe,
    detalleOtros,
  }

  useEffect(() => {
    onCambiar?.(datosActuales)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ventaEfectivo,
    ventaQr,
    ventaNequi,
    ventaDatafono,
    ventaCredito,
    detalleQr,
    detalleNequi,
    mostrarDetalleQr,
    mostrarDetalleNequi,
    datafonoLiquidado,
    gastos,
    propinas,
    efectivoContado,
    recibe,
    detalleOtros,
  ])

  const totalVenta = ventaEfectivo + ventaQr + ventaNequi + ventaDatafono + ventaCredito
  const totalGastos = gastos.reduce((sum, g) => sum + (g.valor || 0), 0)
  const totalPropinas = propinas.reduce((sum, p) => sum + (p.valor || 0), 0)
  const esperado = baseEfectivo + ventaEfectivo - totalGastos - totalPropinas
  const diferencia = efectivoContado - esperado
  const entrega = efectivoContado - baseEfectivo
  const diferenciaDatafono = datafonoLiquidado - ventaDatafono

  function agregarGasto() {
    setGastos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), categoria: CATEGORIAS_GASTO[0], valor: 0, nota: '', foto: null },
    ])
  }

  function agregarPropina() {
    setPropinas((prev) => [...prev, { id: crypto.randomUUID(), valor: 0, nota: '' }])
  }

  function manejarGuardarClick() {
    if (mensajeConfirmacion) {
      setMostrarConfirmacion(true)
    } else {
      onGuardar(datosActuales)
    }
  }

  async function confirmarGuardar() {
    try {
      await onGuardar(datosActuales)
    } finally {
      setMostrarConfirmacion(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className={seccionCls}>
        <h2 className={tituloCls}>Ventas según sistema</h2>

        <Campo label="Efectivo" value={ventaEfectivo} onChange={setVentaEfectivo} />

        <div>
          <Campo label="QR" value={ventaQr} onChange={setVentaQr} />
          <button
            type="button"
            onClick={() => setMostrarDetalleQr((v) => !v)}
            className="mt-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400"
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
            className="mt-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400"
          >
            {mostrarDetalleNequi ? 'Ocultar detalle' : 'Detallar pagos'}
          </button>
          {mostrarDetalleNequi && (
            <DetallePagos valores={detalleNequi} onCambiar={setDetalleNequi} total={ventaNequi} />
          )}
        </div>

        <Campo label="Datáfono" value={ventaDatafono} onChange={setVentaDatafono} />
        <Campo label="Crédito" value={ventaCredito} onChange={setVentaCredito} />

        <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900 dark:border-gray-700 dark:text-gray-50">
          <span>Total venta</span>
          <span>{formatCOP(totalVenta)}</span>
        </div>
      </section>

      <section className={seccionCls}>
        <h2 className={tituloCls}>Cuadre de datáfono</h2>
        <Campo label="Datáfono liquidado (terminal)" value={datafonoLiquidado} onChange={setDatafonoLiquidado} />
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Diferencia (liquidado − sistema)</span>
          <span
            className={
              diferenciaDatafono === 0
                ? 'text-gray-800 dark:text-gray-200'
                : 'font-semibold text-amber-600 dark:text-amber-400'
            }
          >
            {formatCOP(diferenciaDatafono)}
          </span>
        </div>
      </section>

      <section className={seccionCls}>
        <div className="flex items-center justify-between">
          <h2 className={tituloCls}>Gastos en efectivo</h2>
          <button
            type="button"
            onClick={agregarGasto}
            className="flex items-center gap-1 text-sm font-semibold text-violet-600 transition hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <Plus size={14} /> Agregar gasto
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

        <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900 dark:border-gray-700 dark:text-gray-50">
          <span>Total gastos</span>
          <span>{formatCOP(totalGastos)}</span>
        </div>
      </section>

      <section className={seccionCls}>
        <div className="flex items-center justify-between">
          <h2 className={tituloCls}>Propinas</h2>
          <button
            type="button"
            onClick={agregarPropina}
            className="flex items-center gap-1 text-sm font-semibold text-violet-600 transition hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <Plus size={14} /> Agregar propina
          </button>
        </div>
        <p className="-mt-2 text-xs text-gray-400 dark:text-gray-500">
          Se cobran junto con la cuenta y se entregan en efectivo al mesero: se descuentan del
          efectivo esperado.
        </p>

        {propinas.map((p) => (
          <PropinaRow
            key={p.id}
            propina={p}
            onCambiar={(actualizada) =>
              setPropinas((prev) => prev.map((x) => (x.id === p.id ? actualizada : x)))
            }
            onQuitar={() => setPropinas((prev) => prev.filter((x) => x.id !== p.id))}
          />
        ))}

        <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900 dark:border-gray-700 dark:text-gray-50">
          <span>Total propinas</span>
          <span>{formatCOP(totalPropinas)}</span>
        </div>
      </section>

      <section className={seccionCls}>
        <h2 className={tituloCls}>Cuadre de efectivo</h2>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Base</span>
          <span className="text-gray-800 dark:text-gray-200">{formatCOP(baseEfectivo)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Ventas efectivo</span>
          <span className="text-gray-800 dark:text-gray-200">{formatCOP(ventaEfectivo)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Gastos</span>
          <span className="text-gray-800 dark:text-gray-200">- {formatCOP(totalGastos)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Propinas</span>
          <span className="text-gray-800 dark:text-gray-200">- {formatCOP(totalPropinas)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-2.5 font-bold text-gray-900 dark:border-gray-700 dark:text-gray-50">
          <span>Esperado</span>
          <span>{formatCOP(esperado)}</span>
        </div>

        <Campo label="Efectivo contado" value={efectivoContado} onChange={setEfectivoContado} />

        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{diferencia >= 0 ? 'Sobrante' : 'Faltante'}</span>
          <span
            className={
              diferencia === 0
                ? 'text-gray-800 dark:text-gray-200'
                : diferencia > 0
                  ? 'font-semibold text-green-600 dark:text-green-400'
                  : 'font-semibold text-red-600 dark:text-red-400'
            }
          >
            {formatCOP(Math.abs(diferencia))}
          </span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 dark:text-gray-50">
          <span>Entrega</span>
          <span>{formatCOP(entrega)}</span>
        </div>

        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">
            Recibe
          </label>
          <input
            type="text"
            value={recibe}
            onChange={(e) => setRecibe(e.target.value)}
            className="h-11 w-full rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
          />
        </div>
      </section>

      <section className={seccionCls}>
        <label className="block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">
          Notas adicionales (opcional)
        </label>
        <textarea
          value={detalleOtros}
          onChange={(e) => setDetalleOtros(e.target.value)}
          rows={2}
          className="w-full rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
        />
      </section>

      {errorGuardado && (
        <div className="animate-fade-up rounded-[14px] bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {errorGuardado}
        </div>
      )}

      {mensajeBorrador && (
        <div className="animate-fade-up rounded-[14px] bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
          {mensajeBorrador}
        </div>
      )}

      <div className="space-y-2.5">
        {permitirBorrador && (
          <button
            type="button"
            onClick={() => onGuardarBorrador?.(datosActuales)}
            className="w-full rounded-[14px] border border-violet-200 py-3 font-semibold text-violet-600 transition hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10"
          >
            Guardar borrador
          </button>
        )}

        <button
          type="button"
          onClick={manejarGuardarClick}
          disabled={guardando}
          className="w-full rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 py-3.5 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.6)] transition hover:-translate-y-px hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
        >
          {guardando ? 'Guardando...' : textoBoton}
        </button>
      </div>

      {mostrarConfirmacion && mensajeConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="animate-card-in w-full max-w-sm space-y-4 rounded-[20px] bg-white p-6 text-center shadow-lg dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">¿Confirmar cierre de caja?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{mensajeConfirmacion}</p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={guardando}
                className="flex-1 rounded-[14px] border border-gray-200 py-2.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarGuardar}
                disabled={guardando}
                className="flex-1 rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 py-2.5 font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Sí, cerrar caja'}
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <input
        type="number"
        min={0}
        step={1}
        value={value || ''}
        onChange={(e) => onChange(numero(e.target.value))}
        className="h-11 w-full rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
      />
    </div>
  )
}
