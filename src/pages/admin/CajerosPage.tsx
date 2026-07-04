import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { PantallaMensaje } from '../../components/PantallaMensaje'

interface Cajero {
  id: string
  nombre: string
  email: string | null
  activo: boolean
}

export function CajerosPage() {
  const [cajeros, setCajeros] = useState<Cajero[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creando, setCreando] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)

  async function cargarCajeros() {
    if (!supabase) return
    setCargando(true)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, nombre, email, activo')
      .eq('rol', 'cajero')
      .order('nombre')

    if (err) {
      setError(err.message)
    } else {
      setCajeros((data ?? []) as Cajero[])
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarCajeros()
  }, [])

  async function crearCajero(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return

    setCreando(true)
    setErrorCrear(null)

    const { data, error: err } = await supabase.functions.invoke('admin-crear-cajero', {
      body: { email, password, nombre },
    })

    if (err) {
      setErrorCrear(err.message)
      setCreando(false)
      return
    }

    if (data?.error) {
      setErrorCrear(data.error)
      setCreando(false)
      return
    }

    setNombre('')
    setEmail('')
    setPassword('')
    setCreando(false)
    cargarCajeros()
  }

  async function alternarActivo(cajero: Cajero) {
    if (!supabase) return
    const { error: err } = await supabase
      .from('profiles')
      .update({ activo: !cajero.activo })
      .eq('id', cajero.id)

    if (!err) {
      cargarCajeros()
    }
  }

  if (error) {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  return (
    <div className="space-y-6">
      <form onSubmit={crearCajero} className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Nuevo cajero</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {errorCrear && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm font-medium px-3 py-2">
            {errorCrear}
          </div>
        )}

        <button
          type="submit"
          disabled={creando}
          className="rounded-lg bg-violet-600 text-white text-sm font-medium px-4 py-2 hover:bg-violet-700 disabled:opacity-50"
        >
          {creando ? 'Creando...' : 'Crear cajero'}
        </button>
      </form>

      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
        {cargando ? (
          <p className="p-4 text-gray-500">Cargando...</p>
        ) : cajeros.length === 0 ? (
          <p className="p-4 text-gray-500">No hay cajeros creados todavía.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {cajeros.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">{c.nombre}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        c.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => alternarActivo(c)}
                      className="text-violet-600 font-medium hover:text-violet-800"
                    >
                      {c.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
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
