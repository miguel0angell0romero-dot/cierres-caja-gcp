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

const inputCls =
  'w-full h-11 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20'
const labelCls = 'mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400'

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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="animate-card-in my-8 w-full max-w-lg space-y-4 rounded-[20px] bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Cargar cierre anterior</h2>
        <p className="-mt-2 text-sm text-gray-500 dark:text-gray-400">
          Mismo formulario que usa el cajero, para poder registrar un cierre de una fecha pasada.
        </p>

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className={labelCls}>Negocio</label>
            <select value={negocioId} onChange={(e) => setNegocioId(e.target.value)} className={inputCls}>
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Fecha</label>
            <input
              type="date"
              value={fecha}
              max={hoyBogota()}
              onChange={(e) => setFecha(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Cajero (a nombre de quién)</label>
            <select value={cajeroId} onChange={(e) => setCajeroId(e.target.value)} className={inputCls}>
              {cajeros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between rounded-[14px] bg-gray-50 px-3.5 py-2.5 text-sm dark:bg-gray-900/60">
          <span className="text-gray-500 dark:text-gray-400">Base efectivo del negocio</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCOP(baseEfectivo)}</span>
        </div>

        <div>
          <label className={labelCls}>Motivo de la carga manual (obligatorio)</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Ej: cierre de fecha X no registrado, se carga desde el registro en papel"
            className="w-full rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
          />
          {errorMotivo && (
            <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">{errorMotivo}</p>
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
          className="w-full py-2.5 text-sm font-semibold text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
