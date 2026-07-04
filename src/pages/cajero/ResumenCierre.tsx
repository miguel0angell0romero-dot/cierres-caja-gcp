import { formatCOP } from '../../lib/money'

interface CierreResumenData {
  base_efectivo: number
  venta_efectivo: number
  venta_qr: number
  venta_nequi: number
  venta_datafono: number
  venta_credito: number
  datafono_liquidado: number
  efectivo_contado: number
  recibe: string | null
}

interface GastoResumenData {
  categoria: string
  valor: number
  nota: string | null
}

interface PropinaResumenData {
  valor: number
  nota: string | null
}

function Fila({ label, valor, resaltado }: { label: string; valor: string; resaltado?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className={resaltado ? 'font-semibold text-gray-900' : 'text-gray-800'}>{valor}</span>
    </div>
  )
}

export function ResumenCierre({
  negocioNombre,
  fecha,
  cierre,
  gastos,
  propinas,
}: {
  negocioNombre: string
  fecha: string
  cierre: CierreResumenData
  gastos: GastoResumenData[]
  propinas: PropinaResumenData[]
}) {
  const totalVenta =
    cierre.venta_efectivo +
    cierre.venta_qr +
    cierre.venta_nequi +
    cierre.venta_datafono +
    cierre.venta_credito
  const totalGastos = gastos.reduce((sum, g) => sum + g.valor, 0)
  const totalPropinas = propinas.reduce((sum, p) => sum + p.valor, 0)
  const esperado = cierre.base_efectivo + cierre.venta_efectivo - totalGastos - totalPropinas
  const diferencia = cierre.efectivo_contado - esperado
  const entrega = cierre.efectivo_contado - cierre.base_efectivo
  const diferenciaDatafono = cierre.datafono_liquidado - cierre.venta_datafono

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="rounded-xl bg-green-50 text-green-700 text-sm font-medium px-4 py-3 text-center">
        Cierre guardado — {negocioNombre} — {fecha}
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm space-y-1">
        <h2 className="font-semibold text-gray-900 mb-1">Ventas</h2>
        <Fila label="Efectivo" valor={formatCOP(cierre.venta_efectivo)} />
        <Fila label="QR" valor={formatCOP(cierre.venta_qr)} />
        <Fila label="Nequi/Daviplata" valor={formatCOP(cierre.venta_nequi)} />
        <Fila label="Datáfono" valor={formatCOP(cierre.venta_datafono)} />
        <Fila label="Crédito" valor={formatCOP(cierre.venta_credito)} />
        <Fila label="Total venta" valor={formatCOP(totalVenta)} resaltado />
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm space-y-1">
        <h2 className="font-semibold text-gray-900 mb-1">Cuadre de datáfono</h2>
        <Fila label="Datáfono liquidado" valor={formatCOP(cierre.datafono_liquidado)} />
        <Fila label="Según sistema" valor={formatCOP(cierre.venta_datafono)} />
        <Fila
          label="Diferencia"
          valor={formatCOP(diferenciaDatafono)}
          resaltado
        />
      </section>

      {gastos.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow-sm space-y-1">
          <h2 className="font-semibold text-gray-900 mb-1">Gastos en efectivo</h2>
          {gastos.map((g, i) => (
            <Fila key={i} label={g.categoria + (g.nota ? ` — ${g.nota}` : '')} valor={formatCOP(g.valor)} />
          ))}
          <Fila label="Total gastos" valor={formatCOP(totalGastos)} resaltado />
        </section>
      )}

      {propinas.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow-sm space-y-1">
          <h2 className="font-semibold text-gray-900 mb-1">Propinas (entregadas al mesero)</h2>
          {propinas.map((p, i) => (
            <Fila key={i} label={p.nota || `Propina ${i + 1}`} valor={formatCOP(p.valor)} />
          ))}
          <Fila label="Total propinas" valor={formatCOP(totalPropinas)} resaltado />
        </section>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm space-y-1">
        <h2 className="font-semibold text-gray-900 mb-1">Cuadre de efectivo</h2>
        <Fila label="Base" valor={formatCOP(cierre.base_efectivo)} />
        <Fila label="Ventas efectivo" valor={formatCOP(cierre.venta_efectivo)} />
        <Fila label="Gastos" valor={`- ${formatCOP(totalGastos)}`} />
        <Fila label="Propinas" valor={`- ${formatCOP(totalPropinas)}`} />
        <Fila label="Esperado" valor={formatCOP(esperado)} resaltado />
        <Fila label="Contado" valor={formatCOP(cierre.efectivo_contado)} />
        <Fila
          label={diferencia >= 0 ? 'Sobrante' : 'Faltante'}
          valor={formatCOP(Math.abs(diferencia))}
          resaltado
        />
        <Fila label="Entrega" valor={formatCOP(entrega)} resaltado />
        {cierre.recibe && <Fila label="Recibe" valor={cierre.recibe} />}
      </section>
    </div>
  )
}
