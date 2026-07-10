import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCOP } from '../../lib/money'

export function GraficaPresupuesto({
  datos,
}: {
  datos: { negocio: string; presupuesto: number; esperado: number; ventaReal: number }[]
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-gray-900 mb-4">Presupuesto vs. venta real por negocio</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="negocio" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => new Intl.NumberFormat('es-CO').format(v)}
              width={70}
            />
            <Tooltip formatter={(v) => formatCOP(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="presupuesto" name="Presupuesto" fill="#c4b5fd" radius={[6, 6, 0, 0]} />
            <Bar dataKey="esperado" name="Esperado a la fecha" fill="#fbbf24" radius={[6, 6, 0, 0]} />
            <Bar dataKey="ventaReal" name="Venta real" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
