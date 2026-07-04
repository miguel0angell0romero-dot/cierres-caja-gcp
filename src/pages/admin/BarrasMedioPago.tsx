import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCOP } from '../../lib/money'

export function BarrasMedioPago({
  datos,
}: {
  datos: { medio: string; valor: number }[]
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-gray-900 mb-4">Recaudo por medio de pago</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="medio" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => new Intl.NumberFormat('es-CO').format(v)}
              width={70}
            />
            <Tooltip formatter={(v) => [formatCOP(Number(v)), 'Recaudo']} />
            <Bar dataKey="valor" name="Recaudo" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
