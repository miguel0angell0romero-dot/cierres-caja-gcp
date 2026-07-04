import { useEffect, useState } from 'react'
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
      <div className="rounded-xl bg-white p-4 shadow-sm flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setLunes((l) => sumarDias(l, -7))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          ← Semana anterior
        </button>
        <button
          type="button"
          onClick={() => setLunes(lunesDeSemana(hoy))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Semana actual
        </button>
        <button
          type="button"
          onClick={() => setLunes((l) => sumarDias(l, 7))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Semana siguiente →
        </button>
        <span className="text-sm text-gray-500">
          {dias[0]} — {dias[6]}
        </span>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
        {cargando ? (
          <p className="p-4 text-gray-500">Cargando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium sticky left-0 bg-white">Negocio</th>
                {dias.map((d, i) => (
                  <th
                    key={d}
                    className={`px-2 py-3 font-medium text-center ${d === hoy ? 'text-violet-600' : ''}`}
                  >
                    {etiquetaDia(d, i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {negocios.map((n) => (
                <tr key={n.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: n.color }} />
                      {n.nombre}
                    </span>
                  </td>
                  {dias.map((d) => {
                    const claveCelda = clave(n.id, d)
                    return (
                      <td key={d} className={`px-2 py-2 ${d === hoy ? 'bg-violet-50/40' : ''}`}>
                        <select
                          value={asignaciones[claveCelda] ?? ''}
                          onChange={(e) => asignar(n.id, d, e.target.value)}
                          disabled={guardandoClave === claveCelda}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
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
        )}
      </div>
    </div>
  )
}
