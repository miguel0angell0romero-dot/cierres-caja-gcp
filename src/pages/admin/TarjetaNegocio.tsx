import { formatCOP } from '../../lib/money'

export function TarjetaNegocio({
  nombre,
  color,
  logoUrl,
  totalVenta,
  totalGastos,
  totalPropinas,
  totalEntrega,
  numCierres,
}: {
  nombre: string
  color: string
  logoUrl: string | null
  totalVenta: number
  totalGastos: number
  totalPropinas: number
  totalEntrega: number
  numCierres: number
}) {
  return (
    <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-800">
      <div className="mb-3.5 flex items-center gap-2.5">
        {logoUrl ? (
          <img src={logoUrl} alt={nombre} className="h-7 w-7 rounded-lg object-cover" />
        ) : (
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        )}
        <h3 className="font-bold tracking-tight text-gray-900 dark:text-gray-50">{nombre}</h3>
        <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500">
          {numCierres} {numCierres === 1 ? 'cierre' : 'cierres'}
        </span>
      </div>
      <Fila label="Venta total" valor={formatCOP(totalVenta)} />
      <Fila label="Gastos" valor={formatCOP(totalGastos)} />
      <Fila label="Propinas" valor={formatCOP(totalPropinas)} />
      <Fila
        label="Entregas (depósitos)"
        valor={formatCOP(totalEntrega)}
        destacado
        positivo={totalEntrega >= 0}
      />
    </div>
  )
}

function Fila({
  label,
  valor,
  destacado,
  positivo,
}: {
  label: string
  valor: string
  destacado?: boolean
  positivo?: boolean
}) {
  return (
    <div
      className={`flex justify-between py-1.5 text-[13px] ${
        destacado ? 'mt-1 border-t border-gray-100 pt-2.5 dark:border-gray-700' : ''
      }`}
    >
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={
          destacado
            ? `text-sm font-bold ${positivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`
            : 'font-semibold text-gray-800 dark:text-gray-200'
        }
      >
        {valor}
      </span>
    </div>
  )
}
