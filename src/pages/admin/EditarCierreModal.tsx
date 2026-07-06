import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { formatCOP } from '../../lib/money'
import { comprimirImagen } from '../../lib/imagen'
import { CATEGORIAS_GASTO } from '../../lib/constantes'
import { GastoRow } from '../../components/cierre/GastoRow'
import { PropinaRow } from '../../components/cierre/PropinaRow'
import {
  CAMPOS_EDITABLES,
  ETIQUETAS_CAMPO,
  type CampoEditable,
  type CierreCompleto,
  type GastoDetalle,
  type PropinaDetalle,
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

interface GastoEditable {
  id: string
  categoria: string
  valor: number
  nota: string
  foto: File | null
  fotoPathOriginal: string | null
}

interface PropinaEditable {
  id: string
  valor: number
  nota: string
}

function aFormulario(cierre: CierreCompleto): ValoresForm {
  const valores = {} as ValoresForm
  for (const campo of CAMPOS_EDITABLES) {
    const valor = cierre[campo]
    valores[campo] = valor === null || valor === undefined ? '' : String(valor)
  }
  return valores
}

function gastosAFormulario(gastos: GastoDetalle[]): GastoEditable[] {
  return gastos.map((g) => ({
    id: g.id,
    categoria: g.categoria,
    valor: g.valor,
    nota: g.nota ?? '',
    foto: null,
    fotoPathOriginal: g.foto_path,
  }))
}

function propinasAFormulario(propinas: PropinaDetalle[]): PropinaEditable[] {
  return propinas.map((p) => ({ id: p.id, valor: p.valor, nota: p.nota ?? '' }))
}

function resumenCambiosGastos(originales: GastoDetalle[], editados: GastoEditable[]): string | null {
  const mapOriginal = new Map(originales.map((g) => [g.id, g]))
  const mapEditado = new Map(editados.map((g) => [g.id, g]))
  const partes: string[] = []

  for (const g of editados) {
    const original = mapOriginal.get(g.id)
    if (!original) {
      partes.push(`+ ${g.categoria} ${formatCOP(g.valor)}`)
    } else if (
      original.categoria !== g.categoria ||
      original.valor !== g.valor ||
      (original.nota ?? '') !== g.nota ||
      g.foto
    ) {
      partes.push(`~ ${g.categoria} ${formatCOP(g.valor)}`)
    }
  }
  for (const original of originales) {
    if (!mapEditado.has(original.id)) {
      partes.push(`- ${original.categoria} ${formatCOP(original.valor)}`)
    }
  }

  return partes.length > 0 ? partes.join('; ') : null
}

function resumenCambiosPropinas(originales: PropinaDetalle[], editadas: PropinaEditable[]): string | null {
  const mapOriginal = new Map(originales.map((p) => [p.id, p]))
  const mapEditada = new Map(editadas.map((p) => [p.id, p]))
  const partes: string[] = []

  for (const p of editadas) {
    const original = mapOriginal.get(p.id)
    if (!original) {
      partes.push(`+ ${p.nota || 'Propina'} ${formatCOP(p.valor)}`)
    } else if (original.valor !== p.valor || (original.nota ?? '') !== p.nota) {
      partes.push(`~ ${p.nota || 'Propina'} ${formatCOP(p.valor)}`)
    }
  }
  for (const original of originales) {
    if (!mapEditada.has(original.id)) {
      partes.push(`- ${original.nota || 'Propina'} ${formatCOP(original.valor)}`)
    }
  }

  return partes.length > 0 ? partes.join('; ') : null
}

export function EditarCierreModal({
  cierre,
  onCerrar,
  onGuardado,
}: {
  cierre: CierreCompleto
  onCerrar: () => void
  onGuardado: () => void
}) {
  const { profile } = useAuth()
  const [valores, setValores] = useState<ValoresForm>(aFormulario(cierre))
  const [gastosEdit, setGastosEdit] = useState<GastoEditable[]>(gastosAFormulario(cierre.gastos))
  const [propinasEdit, setPropinasEdit] = useState<PropinaEditable[]>(propinasAFormulario(cierre.propinas))
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

  const totalGastos = gastosEdit.reduce((s, g) => s + (g.valor || 0), 0)
  const totalPropinas = propinasEdit.reduce((s, p) => s + (p.valor || 0), 0)
  const totalVenta = ventaEfectivo + ventaQr + ventaNequi + ventaDatafono + ventaCredito
  const esperado = baseEfectivo + ventaEfectivo - totalGastos - totalPropinas
  const diferencia = efectivoContado - esperado
  const entrega = efectivoContado - baseEfectivo
  const diferenciaDatafono = datafonoLiquidado - ventaDatafono

  const cambios = CAMPOS_EDITABLES.map((campo) => {
    const original = cierre[campo]
    const originalStr = original === null || original === undefined ? '' : String(original)
    const nuevoStr = valores[campo]
    return { campo, antes: originalStr, despues: nuevoStr, cambio: originalStr !== nuevoStr }
  }).filter((c) => c.cambio)

  const resumenGastos = resumenCambiosGastos(cierre.gastos, gastosEdit)
  const resumenPropinas = resumenCambiosPropinas(cierre.propinas, propinasEdit)
  const hayCambios = cambios.length > 0 || !!resumenGastos || !!resumenPropinas

  function agregarGasto() {
    setGastosEdit((prev) => [
      ...prev,
      { id: crypto.randomUUID(), categoria: CATEGORIAS_GASTO[0], valor: 0, nota: '', foto: null, fotoPathOriginal: null },
    ])
  }

  function agregarPropina() {
    setPropinasEdit((prev) => [...prev, { id: crypto.randomUUID(), valor: 0, nota: '' }])
  }

  async function verFotoActual(path: string) {
    if (!supabase) return
    const { data } = await supabase.storage.from('soportes-gastos').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function guardar() {
    if (!supabase || !profile) return

    if (!hayCambios) {
      setError('No hay cambios para guardar.')
      return
    }
    if (!motivo.trim()) {
      setError('El motivo es obligatorio.')
      return
    }

    setGuardando(true)
    setError(null)

    if (cambios.length > 0) {
      const actualizacion: Record<string, string | number | null> = {}
      for (const c of cambios) {
        actualizacion[c.campo] = CAMPOS_NUMERICOS.has(c.campo) ? Number(c.despues) || 0 : c.despues || null
      }
      const { error: updateError } = await supabase.from('cierres').update(actualizacion).eq('id', cierre.id)
      if (updateError) {
        setError(updateError.message)
        setGuardando(false)
        return
      }
    }

    for (const g of gastosEdit) {
      const original = cierre.gastos.find((o) => o.id === g.id)
      let fotoPath = g.fotoPathOriginal

      if (g.foto) {
        const comprimida = await comprimirImagen(g.foto)
        const path = `${cierre.negocio_id}/${cierre.id}/${g.id}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('soportes-gastos')
          .upload(path, comprimida, { contentType: comprimida.type, upsert: true })
        if (uploadError) {
          setError(`Falló la foto de un gasto: ${uploadError.message}`)
          setGuardando(false)
          return
        }
        fotoPath = path
      }

      if (!original) {
        const { error: insertError } = await supabase.from('gastos').insert({
          id: g.id,
          cierre_id: cierre.id,
          categoria: g.categoria,
          valor: g.valor,
          nota: g.nota || null,
          foto_path: fotoPath,
        })
        if (insertError) {
          setError(`Falló agregar un gasto: ${insertError.message}`)
          setGuardando(false)
          return
        }
      } else if (
        original.categoria !== g.categoria ||
        original.valor !== g.valor ||
        (original.nota ?? '') !== g.nota ||
        g.foto
      ) {
        const { error: updateGastoError } = await supabase
          .from('gastos')
          .update({ categoria: g.categoria, valor: g.valor, nota: g.nota || null, foto_path: fotoPath })
          .eq('id', g.id)
        if (updateGastoError) {
          setError(`Falló actualizar un gasto: ${updateGastoError.message}`)
          setGuardando(false)
          return
        }
      }
    }

    const idsGastosActuales = new Set(gastosEdit.map((g) => g.id))
    const idsGastosAEliminar = cierre.gastos.filter((g) => !idsGastosActuales.has(g.id)).map((g) => g.id)
    if (idsGastosAEliminar.length > 0) {
      const { error: deleteError } = await supabase.from('gastos').delete().in('id', idsGastosAEliminar)
      if (deleteError) {
        setError(`Falló eliminar un gasto: ${deleteError.message}`)
        setGuardando(false)
        return
      }
    }

    for (const p of propinasEdit) {
      const original = cierre.propinas.find((o) => o.id === p.id)
      if (!original) {
        const { error: insertError } = await supabase
          .from('propinas')
          .insert({ id: p.id, cierre_id: cierre.id, valor: p.valor, nota: p.nota || null })
        if (insertError) {
          setError(`Falló agregar una propina: ${insertError.message}`)
          setGuardando(false)
          return
        }
      } else if (original.valor !== p.valor || (original.nota ?? '') !== p.nota) {
        const { error: updateError } = await supabase
          .from('propinas')
          .update({ valor: p.valor, nota: p.nota || null })
          .eq('id', p.id)
        if (updateError) {
          setError(`Falló actualizar una propina: ${updateError.message}`)
          setGuardando(false)
          return
        }
      }
    }

    const idsPropinasActuales = new Set(propinasEdit.map((p) => p.id))
    const idsPropinasAEliminar = cierre.propinas.filter((p) => !idsPropinasActuales.has(p.id)).map((p) => p.id)
    if (idsPropinasAEliminar.length > 0) {
      const { error: deleteError } = await supabase.from('propinas').delete().in('id', idsPropinasAEliminar)
      if (deleteError) {
        setError(`Falló eliminar una propina: ${deleteError.message}`)
        setGuardando(false)
        return
      }
    }

    const cambiosAuditoria = cambios.map((c) => ({
      campo: ETIQUETAS_CAMPO[c.campo],
      antes: c.antes,
      despues: c.despues,
    }))
    if (resumenGastos) cambiosAuditoria.push({ campo: 'Gastos', antes: '', despues: resumenGastos })
    if (resumenPropinas) cambiosAuditoria.push({ campo: 'Propinas', antes: '', despues: resumenPropinas })

    const { error: auditoriaError } = await supabase.from('auditoria').insert({
      cierre_id: cierre.id,
      profile_id: profile.id,
      motivo: motivo.trim(),
      cambios: cambiosAuditoria,
    })

    setGuardando(false)

    if (auditoriaError) {
      setError(`Cierre actualizado, pero falló el registro de auditoría: ${auditoriaError.message}`)
      return
    }

    onGuardado()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full my-8 p-6 space-y-4">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Gastos en efectivo</h3>
            <button
              type="button"
              onClick={agregarGasto}
              className="text-sm font-medium text-violet-600 hover:text-violet-800"
            >
              + Agregar gasto
            </button>
          </div>
          {gastosEdit.map((g) => (
            <div key={g.id} className="space-y-1">
              <GastoRow
                gasto={g}
                onCambiar={(actualizado) =>
                  setGastosEdit((prev) => prev.map((x) => (x.id === g.id ? { ...x, ...actualizado } : x)))
                }
                onQuitar={() => setGastosEdit((prev) => prev.filter((x) => x.id !== g.id))}
              />
              {g.fotoPathOriginal && !g.foto && (
                <button
                  type="button"
                  onClick={() => verFotoActual(g.fotoPathOriginal!)}
                  className="text-xs font-medium text-violet-600 hover:text-violet-800 ml-1"
                >
                  Ver foto actual
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Propinas</h3>
            <button
              type="button"
              onClick={agregarPropina}
              className="text-sm font-medium text-violet-600 hover:text-violet-800"
            >
              + Agregar propina
            </button>
          </div>
          {propinasEdit.map((p) => (
            <PropinaRow
              key={p.id}
              propina={p}
              onCambiar={(actualizada) =>
                setPropinasEdit((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...actualizada } : x)))
              }
              onQuitar={() => setPropinasEdit((prev) => prev.filter((x) => x.id !== p.id))}
            />
          ))}
        </div>

        <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total venta</span>
            <span>{formatCOP(totalVenta)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total gastos</span>
            <span>{formatCOP(totalGastos)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total propinas</span>
            <span>{formatCOP(totalPropinas)}</span>
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

        {hayCambios && (
          <div className="text-xs text-gray-500 space-y-0.5">
            {cambios.length > 0 && (
              <p>
                {cambios.length} campo(s) modificado(s): {cambios.map((c) => ETIQUETAS_CAMPO[c.campo]).join(', ')}
              </p>
            )}
            {resumenGastos && <p>Gastos: {resumenGastos}</p>}
            {resumenPropinas && <p>Propinas: {resumenPropinas}</p>}
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
            disabled={guardando || !hayCambios || !motivo.trim()}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
