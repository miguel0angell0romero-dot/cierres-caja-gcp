import { Plus, X } from 'lucide-react'
import { formatCOP } from '../../lib/money'

export function DetallePagos({
  valores,
  onCambiar,
  total,
}: {
  valores: number[]
  onCambiar: (valores: number[]) => void
  total: number
}) {
  const suma = valores.reduce((a, b) => a + b, 0)
  const coincide = suma === total

  function actualizar(i: number, valor: number) {
    onCambiar(valores.map((v, idx) => (idx === i ? valor : v)))
  }

  return (
    <div className="mt-2.5 space-y-2 border-t border-gray-100 pt-2.5 dark:border-gray-700">
      {valores.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={1}
            value={v || ''}
            onChange={(e) => actualizar(i, Number(e.target.value))}
            className="flex-1 rounded-[12px] border-[1.5px] border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
          />
          <button
            type="button"
            onClick={() => onCambiar(valores.filter((_, idx) => idx !== i))}
            aria-label="Quitar pago"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onCambiar([...valores, 0])}
        className="flex items-center gap-1 text-sm font-semibold text-violet-600 transition hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
      >
        <Plus size={14} /> Agregar pago
      </button>
      {valores.length > 0 && (
        <p
          className={`text-xs ${coincide ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
        >
          Suma detalle: {formatCOP(suma)}
          {coincide ? ' ✓ coincide con el total' : ` (total ingresado: ${formatCOP(total)})`}
        </p>
      )}
    </div>
  )
}
