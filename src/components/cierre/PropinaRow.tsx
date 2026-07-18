import { X } from 'lucide-react'
import type { PropinaLocal } from './types'

const inputCls =
  'rounded-[12px] border-[1.5px] border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20'

export function PropinaRow({
  propina,
  onCambiar,
  onQuitar,
}: {
  propina: PropinaLocal
  onCambiar: (propina: PropinaLocal) => void
  onQuitar: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        step={1}
        placeholder="Valor"
        value={propina.valor || ''}
        onChange={(e) => onCambiar({ ...propina, valor: Number(e.target.value) })}
        className={`w-28 ${inputCls}`}
      />
      <input
        type="text"
        placeholder="Nota (ej: mesero, mesa)"
        value={propina.nota}
        onChange={(e) => onCambiar({ ...propina, nota: e.target.value })}
        className={`flex-1 ${inputCls}`}
      />
      <button
        type="button"
        onClick={onQuitar}
        aria-label="Quitar propina"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
      >
        <X size={16} />
      </button>
    </div>
  )
}
