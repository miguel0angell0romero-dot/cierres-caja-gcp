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
import { useTheme } from '../../lib/ThemeContext'

export function GraficaPresupuesto({
  datos,
}: {
  datos: { negocio: string; presupuesto: number; esperado: number; ventaReal: number }[]
}) {
  const { tema } = useTheme()
  const oscuro = tema === 'dark'
  const colorEjes = oscuro ? '#8b97b4' : '#5b6b85'
  const colorGrilla = oscuro ? '#213050' : '#e3e8f0'

  return (
    <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
      <h2 className="mb-4 text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
        Presupuesto vs. venta real por negocio
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorGrilla} />
            <XAxis dataKey="negocio" tick={{ fontSize: 12, fill: colorEjes }} />
            <YAxis
              tick={{ fontSize: 12, fill: colorEjes }}
              tickFormatter={(v) => new Intl.NumberFormat('es-CO').format(v)}
              width={70}
            />
            <Tooltip
              formatter={(v) => formatCOP(Number(v))}
              contentStyle={
                oscuro
                  ? { background: '#111a2c', border: '1px solid #213050', borderRadius: 12, color: '#eaf0fb' }
                  : { background: '#ffffff', border: '1px solid #e3e8f0', borderRadius: 12 }
              }
            />
            <Legend wrapperStyle={{ fontSize: 12, color: colorEjes }} />
            <Bar dataKey="presupuesto" name="Presupuesto" fill="#bbd3ff" radius={[6, 6, 0, 0]} />
            <Bar dataKey="esperado" name="Esperado a la fecha" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="ventaReal" name="Venta real" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
