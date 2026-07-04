import { formatCOP } from '../../lib/money'

export function TarjetaNegocio({
  nombre,
  color,
  totalVenta,
  totalGastos,
  totalEntrega,
  numCierres,
}: {
  nombre: string
  color: string
  totalVenta: number
  totalGastos: number
  totalEntrega: number
  numCierres: number
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="font-semibold text-gray-900">{nombre}</h3>
      </div>
      <Fila label="Venta total" valor={formatCOP(totalVenta)} />
      <Fila label="Gastos" valor={formatCOP(totalGastos)} />
      <Fila label="Entregas (depósitos)" valor={formatCOP(totalEntrega)} />
      <Fila label="Cierres registrados" valor={String(numCierres)} />
    </div>
  )
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{valor}</span>
    </div>
  )
}
