import { useEffect, useState } from 'react'
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
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Propinas</h2>
          <button
            type="button"
            onClick={agregarPropina}
            className="text-sm font-medium text-violet-600 hover:text-violet-800"
          >
            + Agregar propina
          </button>
        </div>
        <p className="text-xs text-gray-400 -mt-2">
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

        <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold text-gray-900">
          <span>Total propinas</span>
          <span>{formatCOP(totalPropinas)}</span>
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
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Propinas</span>
          <span>- {formatCOP(totalPropinas)}</span>
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

      {mensajeBorrador && (
        <div className="rounded-lg bg-green-50 text-green-700 text-sm font-medium px-4 py-3 text-center">
          {mensajeBorrador}
        </div>
      )}

      <div className="space-y-2">
        {permitirBorrador && (
          <button
            type="button"
            onClick={() => onGuardarBorrador?.(datosActuales)}
            className="w-full rounded-lg border border-violet-600 text-violet-600 font-medium py-3 hover:bg-violet-50"
          >
            Guardar borrador
          </button>
        )}

        <button
          type="button"
          onClick={manejarGuardarClick}
          disabled={guardando}
          className="w-full rounded-lg bg-violet-600 text-white font-medium py-3 hover:bg-violet-700 disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : textoBoton}
        </button>
      </div>

      {mostrarConfirmacion && mensajeConfirmacion && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4 text-center">
            <h2 className="font-semibold text-gray-900 text-lg">¿Confirmar cierre de caja?</h2>
            <p className="text-sm text-gray-600">{mensajeConfirmacion}</p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={guardando}
                className="flex-1 rounded-lg border border-gray-300 text-gray-600 font-medium py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarGuardar}
                disabled={guardando}
                className="flex-1 rounded-lg bg-violet-600 text-white font-medium py-2 hover:bg-violet-700 disabled:opacity-50"
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
