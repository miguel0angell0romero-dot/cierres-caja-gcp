import { CATEGORIAS_GASTO } from '../../lib/constantes'
import type { GastoLocal } from './types'

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
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      <div className="flex gap-2">
        <select
          value={gasto.categoria}
          onChange={(e) => onCambiar({ ...gasto, categoria: e.target.value })}
          className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
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
          className="w-28 rounded-lg border border-gray-300 px-2 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onQuitar}
          aria-label="Quitar gasto"
          className="text-red-500 hover:text-red-700 px-2"
        >
          ✕
        </button>
      </div>

      <input
        type="text"
        placeholder="Nota (opcional)"
        value={gasto.nota}
        onChange={(e) => onCambiar({ ...gasto, nota: e.target.value })}
        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
      />

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onCambiar({ ...gasto, foto: e.target.files?.[0] ?? null })}
          className="text-xs text-gray-500 flex-1"
        />
        {gasto.foto && <span className="text-xs text-green-600">Foto lista ✓</span>}
      </div>
    </div>
  )
}
