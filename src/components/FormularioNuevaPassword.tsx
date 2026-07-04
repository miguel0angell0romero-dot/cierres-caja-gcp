import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
        {enviando ? 'Guardando...' : 'Guardar nueva contraseña'}
      </button>
    </form>
  )
}
