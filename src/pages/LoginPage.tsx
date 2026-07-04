import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

function traducirError(mensaje: string) {
  if (mensaje.toLowerCase().includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  return mensaje
}

export function LoginPage() {
  const { session, signIn } = useAuth()
  const [modo, setModo] = useState<'login' | 'recuperar'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [correoEnviado, setCorreoEnviado] = useState(false)

  if (session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const { error: mensajeError } = await signIn(email, password)

    if (mensajeError) {
      setError(traducirError(mensajeError))
      setEnviando(false)
    }
  }

  async function handleRecuperar(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return

    setEnviando(true)
    setError(null)

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    })

    setEnviando(false)

    if (err) {
      setError(err.message)
      return
    }

    setCorreoEnviado(true)
  }

  if (modo === 'recuperar') {
    return (
      <div className="min-h-svh flex items-center justify-center bg-gray-50 px-4">
        <form
          onSubmit={handleRecuperar}
          className="max-w-sm w-full rounded-xl bg-white p-8 shadow-md space-y-5"
        >
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Recuperar contraseña</h1>
            <p className="text-gray-500 text-sm mt-1">
              Te enviaremos un enlace a tu correo para restablecerla
            </p>
          </div>

          {correoEnviado ? (
            <div className="rounded-lg bg-green-50 text-green-700 text-sm font-medium px-3 py-2 text-center">
              Revisa tu correo ({email}) y sigue el enlace para elegir una nueva contraseña.
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label htmlFor="email-recuperar" className="text-sm font-medium text-gray-700">
                  Correo
                </label>
                <input
                  id="email-recuperar"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 text-sm font-medium px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-violet-600 text-white font-medium py-2 hover:bg-violet-700 disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setModo('login')
              setError(null)
              setCorreoEnviado(false)
            }}
            className="block w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Volver al login
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full rounded-xl bg-white p-8 shadow-md space-y-5"
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Cierres de Caja GCP
          </h1>
          <p className="text-gray-500 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm font-medium px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-violet-600 text-white font-medium py-2 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <button
          type="button"
          onClick={() => {
            setModo('recuperar')
            setError(null)
          }}
          className="block w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </div>
  )
}
