import { formatCOP } from '../../lib/money'

export function KpiCard({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1">{formatCOP(valor)}</p>
    </div>
  )
}
