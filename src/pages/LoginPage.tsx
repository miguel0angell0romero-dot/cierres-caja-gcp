import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { ThemeToggle } from '../components/ThemeToggle'

function traducirError(mensaje: string) {
  if (mensaje.toLowerCase().includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  return mensaje
}

function FondoLogin() {
  return (
    <div className="login-backdrop pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-40 blur-[2px]">
        <div className="grid translate-y-[-10px] scale-105 grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 w-44 rounded-2xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mx-4 mt-4 h-2.5 w-3/5 rounded-full bg-gray-100 dark:bg-gray-700" />
              <div className="mx-4 mt-3 h-4 w-2/5 rounded-md bg-violet-100 dark:bg-violet-900/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12">
      <FondoLogin />

      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="animate-card-in relative w-full max-w-[404px] rounded-[20px] border border-black/5 bg-white/80 p-9 pb-8 shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-gray-800/70">
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-violet-600 to-sky-400 text-[15px] font-bold text-white shadow-sm">
            $
          </div>
          <div>
            <div className="text-sm font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              Cierres de Caja GCP
            </div>
            <div className="text-[11.5px] text-gray-500 dark:text-gray-400">Grupo Carbón de Piedra</div>
          </div>
        </div>

        {modo === 'recuperar' ? (
          <form onSubmit={handleRecuperar}>
            <h1 className="mb-1 text-[25px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Recuperar contraseña
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Te enviaremos un enlace a tu correo para restablecerla.
            </p>

            {correoEnviado ? (
              <div className="animate-fade-up rounded-[14px] bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                Revisa tu correo ({email}) y sigue el enlace para elegir una nueva contraseña.
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="email-recuperar"
                    className="mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400"
                  >
                    Correo
                  </label>
                  <div className="flex h-12 items-center gap-2.5 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 transition focus-within:border-violet-600 focus-within:ring-4 focus-within:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-violet-500/20">
                    <Mail size={17} className="shrink-0 text-gray-400" />
                    <input
                      id="email-recuperar"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tú@grupogcp.com"
                      className="h-full w-full border-0 bg-transparent text-[14.5px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-50"
                    />
                  </div>
                </div>

                {error && (
                  <div className="animate-fade-up mb-4 rounded-[14px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.6)] transition hover:-translate-y-px hover:scale-[1.015] hover:shadow-[0_16px_30px_-10px_rgba(37,99,235,0.65)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
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
              className="block w-full text-center text-sm font-medium text-gray-500 transition hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
            >
              Volver al login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 className="mb-1 text-[25px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Inicia sesión
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Entra con tu correo para registrar o consultar cierres.
            </p>

            <div className="mb-4">
              <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">
                Correo
              </label>
              <div className="flex h-12 items-center gap-2.5 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 transition focus-within:border-violet-600 focus-within:ring-4 focus-within:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-violet-500/20">
                <Mail size={17} className="shrink-0 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tú@grupogcp.com"
                  className="h-full w-full border-0 bg-transparent text-[14.5px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-50"
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400"
              >
                Contraseña
              </label>
              <div className="flex h-12 items-center gap-2.5 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 transition focus-within:border-violet-600 focus-within:ring-4 focus-within:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-violet-500/20">
                <Lock size={17} className="shrink-0 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-full w-full border-0 bg-transparent text-[14.5px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-50"
                />
              </div>
            </div>

            {error && (
              <div className="animate-fade-up mb-4 rounded-[14px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.6)] transition hover:-translate-y-px hover:scale-[1.015] hover:shadow-[0_16px_30px_-10px_rgba(37,99,235,0.65)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
            >
              {enviando ? 'Ingresando...' : 'Ingresar'}
              {!enviando && <ArrowRight size={16} />}
            </button>

            <button
              type="button"
              onClick={() => {
                setModo('recuperar')
                setError(null)
              }}
              className="block w-full text-center text-sm font-medium text-gray-500 transition hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        )}

        <div className="mt-5 flex justify-center">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-gray-500 dark:text-gray-400">
            <ShieldCheck size={13} className="text-green-500" /> Conexión cifrada · Supabase Auth
          </span>
        </div>
      </div>
    </div>
  )
}
