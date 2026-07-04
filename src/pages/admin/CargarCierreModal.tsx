import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { formatCOP } from '../../lib/money'
import { hoyBogota } from '../../lib/fecha'
import type { NegocioResumen } from './types'

interface CajeroOpcion {
  id: string
  nombre: string
}

const CAMPOS_NUMERICOS = [
  'base_efectivo',
  'venta_efectivo',
  'venta_qr',
  'venta_nequi',
  'venta_datafono',
  'venta_credito',
  'datafono_liquidado',
  'efectivo_contado',
] as const

const ETIQUETAS: Record<(typeof CAMPOS_NUMERICOS)[number], string> = {
  base_efectivo: 'Base efectivo',
  venta_efectivo: 'Venta efectivo',
  venta_qr: 'Venta QR',
  venta_nequi: 'Venta Nequi/Daviplata',
  venta_datafono: 'Venta datáfono (sistema)',
  venta_credito: 'Venta crédito',
  datafono_liquidado: 'Datáfono liquidado (terminal)',
  efectivo_contado: 'Efectivo contado',
}

export function CargarCierreModal({
  negocios,
  cajeros,
  onCerrar,
  onGuardado,
}: {
  negocios: NegocioResumen[]
  cajeros: CajeroOpcion[]
  onCerrar: () => void
  onGuardado: () => void
}) {
  const { profile } = useAuth()
  const [negocioId, setNegocioId] = useState(negocios[0]?.id ?? '')
  const [cajeroId, setCajeroId] = useState(cajeros[0]?.id ?? '')
  const [fecha, setFecha] = useState(hoyBogota())
  const [valores, setValores] = useState<Record<string, string>>({})
  const [detalleOtros, setDetalleOtros] = useState('')
  const [recibe, setRecibe] = useState('')
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function numero(campo: string) {
    return Number(valores[campo]) || 0
  }

  const baseEfectivo = numero('base_efectivo')
  const ventaEfectivo = numero('venta_efectivo')
  const ventaQr = numero('venta_qr')
  const ventaNequi = numero('venta_nequi')
  const ventaDatafono = numero('venta_datafono')
  const ventaCredito = numero('venta_credito')
  const datafonoLiquidado = numero('datafono_liquidado')
  const efectivoContado = numero('efectivo_contado')

  const totalVenta = ventaEfectivo + ventaQr + ventaNequi + ventaDatafono + ventaCredito
  const esperado = baseEfectivo + ventaEfectivo
  const diferencia = efectivoContado - esperado
  const entrega = efectivoContado - baseEfectivo
  const diferenciaDatafono = datafonoLiquidado - ventaDatafono

  async function guardar() {
    if (!supabase || !profile || !negocioId || !cajeroId) return

    if (!motivo.trim()) {
      setError('El motivo es obligatorio.')
      return
    }

    setGuardando(true)
    setError(null)

    const cierreId = crypto.randomUUID()

    const { error: err } = await supabase.from('cierres').insert({
      id: cierreId,
      negocio_id: negocioId,
      profile_id: cajeroId,
      fecha,
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

    if (err) {
      if (err.code === '23505') {
        setError('Ya existe un cierre guardado para ese negocio en esa fecha.')
      } else {
        setError(err.message)
      }
      setGuardando(false)
      return
    }

    const { error: auditoriaError } = await supabase.from('auditoria').insert({
      cierre_id: cierreId,
      profile_id: profile.id,
      motivo: motivo.trim(),
      cambios: [{ campo: 'Creación', antes: 'No existía', despues: 'Cierre cargado manualmente por un administrador' }],
    })

    setGuardando(false)

    if (auditoriaError) {
      setError(`Cierre creado, pero falló el registro de auditoría: ${auditoriaError.message}`)
      return
    }

    onGuardado()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">Cargar cierre anterior</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Negocio</label>
            <select
              value={negocioId}
              onChange={(e) => setNegocioId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              value={fecha}
              max={hoyBogota()}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-sm font-medium text-gray-700">Cajero (a nombre de quién)</label>
            <select
              value={cajeroId}
              onChange={(e) => setCajeroId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {cajeros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CAMPOS_NUMERICOS.map((campo) => (
            <div key={campo} className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{ETIQUETAS[campo]}</label>
              <input
                type="number"
                min={0}
                value={valores[campo] ?? ''}
                onChange={(e) => setValores((prev) => ({ ...prev, [campo]: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Recibe</label>
            <input
              type="text"
              value={recibe}
              onChange={(e) => setRecibe(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-sm font-medium text-gray-700">Notas adicionales</label>
            <input
              type="text"
              value={detalleOtros}
              onChange={(e) => setDetalleOtros(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total venta</span>
            <span>{formatCOP(totalVenta)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Esperado (sin gastos)</span>
            <span>{formatCOP(esperado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{diferencia >= 0 ? 'Sobrante' : 'Faltante'}</span>
            <span>{formatCOP(Math.abs(diferencia))}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Entrega</span>
            <span>{formatCOP(entrega)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Diferencia datáfono</span>
            <span>{formatCOP(diferenciaDatafono)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Motivo de la carga manual (obligatorio)</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Ej: cierre de fecha X no registrado, se carga desde el registro en papel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm font-medium px-3 py-2">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || !negocioId || !cajeroId}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Cargar cierre'}
          </button>
        </div>
      </div>
    </div>
  )
}
