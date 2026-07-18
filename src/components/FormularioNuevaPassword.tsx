import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

const inputCls =
  'w-full h-11 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20'
const labelCls = 'mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400'

export function FormularioNuevaPassword({ onExito }: { onExito: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!supabase) return

    setEnviando(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setEnviando(false)

    if (err) {
      setError(err.message)
      return
    }

    onExito()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <label className={labelCls}>Nueva contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Confirmar contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className={inputCls}
        />
      </div>

      {error && (
        <div className="rounded-[14px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 py-3 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.6)] transition hover:-translate-y-px hover:scale-[1.015] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
      >
        {enviando ? 'Guardando...' : 'Guardar nueva contraseña'}
      </button>
    </form>
  )
}
