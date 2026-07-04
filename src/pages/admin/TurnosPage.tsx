import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { hoyBogota } from '../../lib/fecha'
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

export function TurnosPage() {
  const { profile } = useAuth()
  const [fecha, setFecha] = useState(hoyBogota())
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [cajeros, setCajeros] = useState<Cajero[]>([])
  const [asignaciones, setAsignaciones] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardandoNegocio, setGuardandoNegocio] = useState<string | null>(null)

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
      .select('negocio_id, profile_id')
      .eq('fecha', fecha)

    if (err) {
      setError(err.message)
      setCargando(false)
      return
    }

    const mapa: Record<string, string> = {}
    for (const a of data ?? []) {
      mapa[a.negocio_id] = a.profile_id
    }
    setAsignaciones(mapa)
    setCargando(false)
  }

  useEffect(() => {
    cargarAsignaciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  async function asignar(negocioId: string, profileId: string) {
    if (!supabase || !profile) return
    setGuardandoNegocio(negocioId)
    setError(null)

    // Un negocio, un cajero por día: borra cualquier asignación previa de este negocio hoy.
    await supabase.from('asignaciones').delete().eq('negocio_id', negocioId).eq('fecha', fecha)

    if (profileId) {
      // Un cajero, un punto por día: borra cualquier otra asignación de este cajero hoy.
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
    setGuardandoNegocio(null)
  }

  if (error) {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm space-y-1">
        <label className="text-sm font-medium text-gray-700">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="block rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
        {cargando ? (
          <p className="p-4 text-gray-500">Cargando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Cajero asignado</th>
              </tr>
            </thead>
            <tbody>
              {negocios.map((n) => (
                <tr key={n.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: n.color }} />
                      {n.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={asignaciones[n.id] ?? ''}
                      onChange={(e) => asignar(n.id, e.target.value)}
                      disabled={guardandoNegocio === n.id}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {cajeros.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
