import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { diasDeSemana, hoyBogota, lunesDeSemana, sumarDias } from '../../lib/fecha'
import { PantallaMensaje } from '../../components/PantallaMensaje'

interface Negocio {
  id: string
  nombre: string
  color: string
}

interface Cajero {
  id: string
  nombre: string
}

const NOMBRES_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function etiquetaDia(fechaIso: string, indice: number) {
  const [, mes, dia] = fechaIso.split('-')
  return `${NOMBRES_DIA[indice]} ${dia}/${mes}`
}

function clave(negocioId: string, fecha: string) {
  return `${negocioId}__${fecha}`
}

export function TurnosPage() {
  const { profile } = useAuth()
  const [lunes, setLunes] = useState(() => lunesDeSemana(hoyBogota()))
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [cajeros, setCajeros] = useState<Cajero[]>([])
  const [asignaciones, setAsignaciones] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardandoClave, setGuardandoClave] = useState<string | null>(null)

  const dias = diasDeSemana(lunes)
  const hoy = hoyBogota()

  useEffect(() => {
    if (!supabase) return

    Promise.all([
      supabase.from('negocios').select('id, nombre, color').order('nombre'),
      supabase.from('profiles').select('id, nombre').eq('rol', 'cajero').eq('activo', true).order('nombre'),
    ]).then(([negociosRes, cajerosRes]) => {
      if (negociosRes.error) {
        setError(negociosRes.error.message)
        return
      }
      if (cajerosRes.error) {
        setError(cajerosRes.error.message)
        return
      }
      setNegocios((negociosRes.data ?? []) as Negocio[])
      setCajeros((cajerosRes.data ?? []) as Cajero[])
    })
  }, [])

  async function cargarAsignaciones() {
    if (!supabase) return
    setCargando(true)

    const { data, error: err } = await supabase
      .from('asignaciones')
      .select('negocio_id, profile_id, fecha')
      .gte('fecha', lunes)
      .lte('fecha', sumarDias(lunes, 6))

    if (err) {
      setError(err.message)
      setCargando(false)
      return
    }

    const mapa: Record<string, string> = {}
    for (const a of data ?? []) {
      mapa[clave(a.negocio_id, a.fecha)] = a.profile_id
    }
    setAsignaciones(mapa)
    setCargando(false)
  }

  useEffect(() => {
    cargarAsignaciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lunes])

  async function asignar(negocioId: string, fecha: string, profileId: string) {
    if (!supabase || !profile) return
    const claveCelda = clave(negocioId, fecha)
    setGuardandoClave(claveCelda)
    setError(null)

    // Un negocio, un cajero por día: borra cualquier asignación previa de este negocio ese día.
    await supabase.from('asignaciones').delete().eq('negocio_id', negocioId).eq('fecha', fecha)

    if (profileId) {
      // Un cajero, un punto por día: borra cualquier otra asignación de este cajero ese día.
      await supabase.from('asignaciones').delete().eq('profile_id', profileId).eq('fecha', fecha)

      const { error: err } = await supabase.from('asignaciones').insert({
        negocio_id: negocioId,
        profile_id: profileId,
        fecha,
        created_by: profile.id,
      })

      if (err) {
        setError(err.message)
      }
    }

    await cargarAsignaciones()
    setGuardandoClave(null)
  }

  if (error) {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setLunes((l) => sumarDias(l, -7))}
          className="flex h-10 items-center gap-1.5 rounded-[12px] border border-gray-200 px-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/40"
        >
          <ChevronLeft size={15} /> Semana anterior
        </button>
        <button
          type="button"
          onClick={() => setLunes(lunesDeSemana(hoy))}
          className="flex h-10 items-center rounded-[12px] border border-gray-200 px-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/40"
        >
          Semana actual
        </button>
        <button
          type="button"
          onClick={() => setLunes((l) => sumarDias(l, 7))}
          className="flex h-10 items-center gap-1.5 rounded-[12px] border border-gray-200 px-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/40"
        >
          Semana siguiente <ChevronRight size={15} />
        </button>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {dias[0]} — {dias[6]}
        </span>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
        {cargando ? (
          <p className="p-5 text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11.5px] font-bold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                  <th className="sticky left-0 bg-gray-50 px-5 py-3 dark:bg-gray-900/40">Negocio</th>
                  {dias.map((d, i) => (
                    <th
                      key={d}
                      className={`px-2 py-3 text-center ${d === hoy ? 'text-violet-600 dark:text-violet-400' : ''}`}
                    >
                      {etiquetaDia(d, i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {negocios.map((n) => (
                  <tr
                    key={n.id}
                    className="border-b border-gray-50 transition last:border-0 hover:bg-gray-50 dark:border-gray-700/60 dark:hover:bg-gray-900/40"
                  >
                    <td className="sticky left-0 h-[52px] bg-white px-5 dark:bg-gray-800">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: n.color }} />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{n.nombre}</span>
                      </span>
                    </td>
                    {dias.map((d) => {
                      const claveCelda = clave(n.id, d)
                      return (
                        <td
                          key={d}
                          className={`px-2 py-2 ${d === hoy ? 'bg-violet-50/60 dark:bg-violet-500/10' : ''}`}
                        >
                          <select
                            value={asignaciones[claveCelda] ?? ''}
                            onChange={(e) => asignar(n.id, d, e.target.value)}
                            disabled={guardandoClave === claveCelda}
                            className="w-full rounded-[10px] border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none transition focus:border-violet-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="">Sin asignar</option>
                            {cajeros.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
