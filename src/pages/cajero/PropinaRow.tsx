import type { PropinaLocal } from './types'

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
        className="w-28 rounded-lg border border-gray-300 px-2 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Nota (ej: mesero, mesa)"
        value={propina.nota}
        onChange={(e) => onCambiar({ ...propina, nota: e.target.value })}
        className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
      />
      <button
        type="button"
        onClick={onQuitar}
        aria-label="Quitar propina"
        className="text-red-500 hover:text-red-700 px-2"
      >
        ✕
      </button>
    </div>
  )
}
