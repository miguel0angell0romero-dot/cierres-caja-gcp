import { useEffect, useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
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
  super_admin: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  admin: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  cajero: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

const inputCls =
  'w-full h-11 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20'
const labelCls = 'mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400'

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
      <form
        onSubmit={crearUsuario}
        className="space-y-4 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800"
      >
        <h2 className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-50">Nuevo usuario</h2>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Correo</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Contraseña</label>
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value as Rol)} className={inputCls}>
              <option value="cajero">Cajero</option>
              <option value="admin">Admin (consulta)</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>

        {errorCrear && (
          <div className="rounded-[14px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {errorCrear}
          </div>
        )}

        <button
          type="submit"
          disabled={creando}
          className="flex h-11 items-center gap-2 rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.6)] transition hover:-translate-y-px hover:scale-[1.015] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
        >
          <UserPlus size={16} /> {creando ? 'Creando...' : 'Crear usuario'}
        </button>
      </form>

      <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
        {cargando ? (
          <p className="p-5 text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : usuarios.length === 0 ? (
          <p className="p-5 text-gray-500 dark:text-gray-400">No hay usuarios creados todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11.5px] font-bold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Correo</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const esUnoMismo = u.id === profile?.id
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 transition last:border-0 hover:bg-gray-50 dark:border-gray-700/60 dark:hover:bg-gray-900/40"
                    >
                      <td className="h-[52px] px-5 text-gray-900 dark:text-gray-100">
                        {u.nombre}
                        {esUnoMismo && <span className="text-xs text-gray-400"> (tú)</span>}
                      </td>
                      <td className="px-5 text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="px-5">
                        <select
                          value={u.rol}
                          disabled={esUnoMismo}
                          onChange={(e) => cambiarRol(u, e.target.value as Rol)}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${COLORES_ROL[u.rol]} disabled:opacity-70`}
                        >
                          <option value="cajero">{ETIQUETAS_ROL.cajero}</option>
                          <option value="admin">{ETIQUETAS_ROL.admin}</option>
                          <option value="super_admin">{ETIQUETAS_ROL.super_admin}</option>
                        </select>
                      </td>
                      <td className="px-5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            u.activo
                              ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 text-right">
                        <button
                          type="button"
                          onClick={() => alternarActivo(u)}
                          disabled={esUnoMismo}
                          className="font-semibold text-violet-600 transition hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-violet-400 dark:hover:text-violet-300"
                        >
                          {u.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
