import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { formatCOP } from '../../lib/money'
import { hoyBogota } from '../../lib/fecha'
import { guardarCierreCompleto } from '../../lib/guardarCierre'
import { FormularioCierre } from '../../components/cierre/FormularioCierre'
import type { DatosCierreFormulario } from '../../components/cierre/types'
import type { NegocioResumen } from './types'

interface CajeroOpcion {
  id: string
  nombre: string
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
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  const negocio = negocios.find((n) => n.id === negocioId)
  const baseEfectivo = negocio?.base_efectivo ?? 0

  async function guardar(datos: DatosCierreFormulario) {
    if (!supabase || !profile || !negocioId || !cajeroId) return

    setErrorMotivo(null)
    setErrorGuardado(null)

    if (!motivo.trim()) {
      setErrorMotivo('El motivo es obligatorio.')
      return
    }

    setGuardando(true)

    const resultado = await guardarCierreCompleto({
      negocioId,
      profileId: cajeroId,
      fecha,
      baseEfectivo,
      datos,
    })

    if ('error' in resultado) {
      setErrorGuardado(resultado.error)
      setGuardando(false)
      return
    }

    const { error: auditoriaError } = await supabase.from('auditoria').insert({
      cierre_id: resultado.cierreId,
      profile_id: profile.id,
      motivo: motivo.trim(),
      cambios: [
        { campo: 'Creación', antes: 'No existía', despues: 'Cierre cargado manualmente por un administrador' },
      ],
    })

    setGuardando(false)

    if (auditoriaError) {
      setErrorGuardado(`Cierre creado, pero falló el registro de auditoría: ${auditoriaError.message}`)
      return
    }

    onGuardado()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full my-8 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">Cargar cierre anterior</h2>
        <p className="text-sm text-gray-500 -mt-2">
          Mismo formulario que usa el cajero, para poder registrar un cierre de una fecha pasada.
        </p>

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

        <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm flex justify-between">
          <span className="text-gray-500">Base efectivo del negocio</span>
          <span className="font-medium">{formatCOP(baseEfectivo)}</span>
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
          {errorMotivo && (
            <p className="text-sm font-medium text-red-600">{errorMotivo}</p>
          )}
        </div>

        <FormularioCierre
          baseEfectivo={baseEfectivo}
          onGuardar={guardar}
          guardando={guardando}
          textoBoton="Cargar cierre"
          errorGuardado={errorGuardado}
        />

        <button
          type="button"
          onClick={onCerrar}
          className="w-full text-sm font-medium text-gray-500 hover:text-gray-900 py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
