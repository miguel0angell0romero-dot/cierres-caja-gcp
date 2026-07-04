import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth, type Rol } from '../../lib/AuthContext'
import { PantallaMensaje } from '../../components/PantallaMensaje'

interface Usuario {
  id: string
  nombre: string
  email: string | null
  rol: Rol
  activo: boolean
}

const ETIQUETAS_ROL: Record<Rol, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin (consulta)',
  cajero: 'Cajero',
}

const COLORES_ROL: Record<Rol, string> = {
  super_admin: 'bg-violet-50 text-violet-700',
  admin: 'bg-blue-50 text-blue-700',
  cajero: 'bg-gray-100 text-gray-600',
}

export function UsuariosPage() {
  const { profile } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<Rol>('cajero')
  const [creando, setCreando] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)

  async function cargarUsuarios() {
    if (!supabase) return
    setCargando(true)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, nombre, email, rol, activo')
      .order('rol')
      .order('nombre')

    if (err) {
      setError(err.message)
    } else {
      setUsuarios((data ?? []) as Usuario[])
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  async function crearUsuario(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return

    setCreando(true)
    setErrorCrear(null)

    const { data, error: err } = await supabase.functions.invoke('admin-crear-usuario', {
      body: { email, password, nombre, rol },
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
    setRol('cajero')
    setCreando(false)
    cargarUsuarios()
  }

  async function alternarActivo(usuario: Usuario) {
    if (!supabase) return
    const { error: err } = await supabase
      .from('profiles')
      .update({ activo: !usuario.activo })
      .eq('id', usuario.id)

    if (!err) cargarUsuarios()
  }

  async function cambiarRol(usuario: Usuario, nuevoRol: Rol) {
    if (!supabase) return
    const { error: err } = await supabase
      .from('profiles')
      .update({ rol: nuevoRol })
      .eq('id', usuario.id)

    if (!err) cargarUsuarios()
  }

  if (error) {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  return (
    <div className="space-y-6">
      <form onSubmit={crearUsuario} className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Nuevo usuario</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as Rol)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="cajero">Cajero</option>
              <option value="admin">Admin (consulta)</option>
              <option value="super_admin">Super Admin</option>
            </select>
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
          {creando ? 'Creando...' : 'Crear usuario'}
        </button>
      </form>

      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
        {cargando ? (
          <p className="p-4 text-gray-500">Cargando...</p>
        ) : usuarios.length === 0 ? (
          <p className="p-4 text-gray-500">No hay usuarios creados todavía.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esUnoMismo = u.id === profile?.id
                return (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      {u.nombre}
                      {esUnoMismo && <span className="text-xs text-gray-400"> (tú)</span>}
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.rol}
                        disabled={esUnoMismo}
                        onChange={(e) => cambiarRol(u, e.target.value as Rol)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${COLORES_ROL[u.rol]} disabled:opacity-70`}
                      >
                        <option value="cajero">{ETIQUETAS_ROL.cajero}</option>
                        <option value="admin">{ETIQUETAS_ROL.admin}</option>
                        <option value="super_admin">{ETIQUETAS_ROL.super_admin}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          u.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => alternarActivo(u)}
                        disabled={esUnoMismo}
                        className="text-violet-600 font-medium hover:text-violet-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {u.activo ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
