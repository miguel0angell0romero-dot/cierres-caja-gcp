import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { formatCOP } from '../../lib/money'
import {
  CAMPOS_EDITABLES,
  ETIQUETAS_CAMPO,
  type CampoEditable,
  type CierreCompleto,
} from './types'

const CAMPOS_NUMERICOS = new Set<CampoEditable>([
  'base_efectivo',
  'venta_efectivo',
  'venta_qr',
  'venta_nequi',
  'venta_datafono',
  'venta_credito',
  'datafono_liquidado',
  'efectivo_contado',
])

type ValoresForm = Record<CampoEditable, string>

function aFormulario(cierre: CierreCompleto): ValoresForm {
  const valores = {} as ValoresForm
  for (const campo of CAMPOS_EDITABLES) {
    const valor = cierre[campo]
    valores[campo] = valor === null || valor === undefined ? '' : String(valor)
  }
  return valores
}

export function EditarCierreModal({
  cierre,
  totalGastos,
  onCerrar,
  onGuardado,
}: {
  cierre: CierreCompleto
  totalGastos: number
  onCerrar: () => void
  onGuardado: () => void
}) {
  const { profile } = useAuth()
  const [valores, setValores] = useState<ValoresForm>(aFormulario(cierre))
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function numero(campo: CampoEditable) {
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
  const esperado = baseEfectivo + ventaEfectivo - totalGastos
  const diferencia = efectivoContado - esperado
  const entrega = efectivoContado - baseEfectivo
  const diferenciaDatafono = datafonoLiquidado - ventaDatafono

  const cambios = CAMPOS_EDITABLES.map((campo) => {
    const original = cierre[campo]
    const originalStr = original === null || original === undefined ? '' : String(original)
    const nuevoStr = valores[campo]
    return { campo, antes: originalStr, despues: nuevoStr, cambio: originalStr !== nuevoStr }
  }).filter((c) => c.cambio)

  async function guardar() {
    if (!supabase || !profile) return
    if (cambios.length === 0) {
      setError('No hay cambios para guardar.')
      return
    }
    if (!motivo.trim()) {
      setError('El motivo es obligatorio.')
      return
    }

    setGuardando(true)
    setError(null)

    const actualizacion: Record<string, string | number | null> = {}
    for (const c of cambios) {
      actualizacion[c.campo] = CAMPOS_NUMERICOS.has(c.campo)
        ? Number(c.despues) || 0
        : c.despues || null
    }

    const { error: updateError } = await supabase
      .from('cierres')
      .update(actualizacion)
      .eq('id', cierre.id)

    if (updateError) {
      setError(updateError.message)
      setGuardando(false)
      return
    }

    const { error: auditoriaError } = await supabase.from('auditoria').insert({
      cierre_id: cierre.id,
      profile_id: profile.id,
      motivo: motivo.trim(),
      cambios: cambios.map((c) => ({
        campo: ETIQUETAS_CAMPO[c.campo],
        antes: c.antes,
        despues: c.despues,
      })),
    })

    if (auditoriaError) {
      setError(`Cierre actualizado, pero falló el registro de auditoría: ${auditoriaError.message}`)
      setGuardando(false)
      return
    }

    setGuardando(false)
    onGuardado()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">
            Editar cierre — {cierre.negocios?.nombre}
          </h2>
          <p className="text-sm text-gray-500">{cierre.fecha}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CAMPOS_EDITABLES.map((campo) => (
            <div key={campo} className={campo === 'detalle_otros' ? 'col-span-2 space-y-1' : 'space-y-1'}>
              <label className="text-sm font-medium text-gray-700">{ETIQUETAS_CAMPO[campo]}</label>
              <input
                type={CAMPOS_NUMERICOS.has(campo) ? 'number' : 'text'}
                value={valores[campo]}
                onChange={(e) => setValores((prev) => ({ ...prev, [campo]: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total venta</span>
            <span>{formatCOP(totalVenta)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Gastos (no editables aquí)</span>
            <span>{formatCOP(totalGastos)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Esperado</span>
            <span>{formatCOP(esperado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{diferencia >= 0 ? 'Sobrante' : 'Faltante'}</span>
            <span className={diferencia === 0 ? '' : diferencia > 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCOP(Math.abs(diferencia))}
            </span>
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
          <label className="text-sm font-medium text-gray-700">Motivo del cambio (obligatorio)</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {cambios.length > 0 && (
          <div className="text-xs text-gray-500">
            {cambios.length} campo(s) modificado(s): {cambios.map((c) => ETIQUETAS_CAMPO[c.campo]).join(', ')}
          </div>
        )}

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
            disabled={guardando || cambios.length === 0 || !motivo.trim()}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
