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
    <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
      {valores.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={1}
            value={v || ''}
            onChange={(e) => actualizar(i, Number(e.target.value))}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => onCambiar(valores.filter((_, idx) => idx !== i))}
            aria-label="Quitar pago"
            className="text-red-500 hover:text-red-700 px-2"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onCambiar([...valores, 0])}
        className="text-sm font-medium text-violet-600 hover:text-violet-800"
      >
        + Agregar pago
      </button>
      {valores.length > 0 && (
        <p className={`text-xs ${coincide ? 'text-green-600' : 'text-amber-600'}`}>
          Suma detalle: {formatCOP(suma)}
          {coincide ? ' ✓ coincide con el total' : ` (total ingresado: ${formatCOP(total)})`}
        </p>
      )}
    </div>
  )
}
