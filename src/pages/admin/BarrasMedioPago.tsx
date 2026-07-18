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
import { useTheme } from '../../lib/ThemeContext'

export function BarrasMedioPago({
  datos,
}: {
  datos: { medio: string; valor: number }[]
}) {
  const { tema } = useTheme()
  const oscuro = tema === 'dark'
  const colorEjes = oscuro ? '#8b97b4' : '#5b6b85'
  const colorGrilla = oscuro ? '#213050' : '#e3e8f0'

  return (
    <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
      <h2 className="mb-4 text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
        Recaudo por medio de pago
      </h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorGrilla} />
            <XAxis dataKey="medio" tick={{ fontSize: 12, fill: colorEjes }} />
            <YAxis
              tick={{ fontSize: 12, fill: colorEjes }}
              tickFormatter={(v) => new Intl.NumberFormat('es-CO').format(v)}
              width={70}
            />
            <Tooltip
              formatter={(v) => [formatCOP(Number(v)), 'Recaudo']}
              contentStyle={
                oscuro
                  ? { background: '#111a2c', border: '1px solid #213050', borderRadius: 12, color: '#eaf0fb' }
                  : { background: '#ffffff', border: '1px solid #e3e8f0', borderRadius: 12 }
              }
            />
            <Bar dataKey="valor" name="Recaudo" fill="#2563eb" radius={[8, 8, 3, 3]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
