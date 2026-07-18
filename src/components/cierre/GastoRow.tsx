import { X } from 'lucide-react'
import { CATEGORIAS_GASTO } from '../../lib/constantes'
import type { GastoLocal } from './types'

const inputCls =
  'rounded-[12px] border-[1.5px] border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20'

export function GastoRow({
  gasto,
  onCambiar,
  onQuitar,
}: {
  gasto: GastoLocal
  onCambiar: (gasto: GastoLocal) => void
  onQuitar: () => void
}) {
  return (
    <div className="space-y-2 rounded-[14px] border border-gray-200 p-3.5 dark:border-gray-700">
      <div className="flex gap-2">
        <select
          value={gasto.categoria}
          onChange={(e) => onCambiar({ ...gasto, categoria: e.target.value })}
          className={`flex-1 ${inputCls}`}
        >
          {CATEGORIAS_GASTO.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          step={1}
          placeholder="Valor"
          value={gasto.valor || ''}
          onChange={(e) => onCambiar({ ...gasto, valor: Number(e.target.value) })}
          className={`w-28 ${inputCls}`}
        />
        <button
          type="button"
          onClick={onQuitar}
          aria-label="Quitar gasto"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <X size={16} />
        </button>
      </div>

      <input
        type="text"
        placeholder="Nota (opcional)"
        value={gasto.nota}
        onChange={(e) => onCambiar({ ...gasto, nota: e.target.value })}
        className={`w-full ${inputCls}`}
      />

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onCambiar({ ...gasto, foto: e.target.files?.[0] ?? null })}
          className="flex-1 text-xs text-gray-500 file:mr-3 file:rounded-[10px] file:border-0 file:bg-violet-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-violet-700 dark:text-gray-400 dark:file:bg-violet-500/10 dark:file:text-violet-400"
        />
        {gasto.foto && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400">Foto lista ✓</span>
        )}
      </div>
    </div>
  )
}
