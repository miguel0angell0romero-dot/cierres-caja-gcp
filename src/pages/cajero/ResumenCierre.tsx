import { useRef, useState } from 'react'
import { CheckCircle2, Share2 } from 'lucide-react'
import { formatCOP } from '../../lib/money'
import { compartirElementoComoImagen } from '../../lib/compartir'

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

const seccionCls =
  'space-y-1 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800'
const tituloCls = 'mb-1.5 text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-50'

function Fila({ label, valor, resaltado }: { label: string; valor: string; resaltado?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={resaltado ? 'font-bold text-gray-900 dark:text-gray-50' : 'text-gray-800 dark:text-gray-200'}>
        {valor}
      </span>
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
  const contenidoRef = useRef<HTMLDivElement>(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const [errorCompartir, setErrorCompartir] = useState<string | null>(null)
  const [avisoDescarga, setAvisoDescarga] = useState(false)

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

  async function compartir() {
    if (!contenidoRef.current) return
    setCompartiendo(true)
    setErrorCompartir(null)
    setAvisoDescarga(false)

    const resultado = await compartirElementoComoImagen(contenidoRef.current, {
      nombreArchivo: `cierre-${negocioNombre}-${fecha}`.replace(/\s+/g, '-').toLowerCase(),
      titulo: `Cierre de caja — ${negocioNombre}`,
      texto: `Cierre de caja de ${negocioNombre} del ${fecha}`,
    })

    setCompartiendo(false)

    if (resultado.error) {
      setErrorCompartir(resultado.error)
    } else if (!resultado.compartido) {
      setAvisoDescarga(true)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div ref={contenidoRef} className="space-y-4 bg-gray-50 dark:bg-gray-900">
        <div className="animate-fade-up flex items-center justify-center gap-2 rounded-[14px] bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
          <CheckCircle2 size={16} /> Cierre guardado — {negocioNombre} — {fecha}
        </div>

        <section className={seccionCls}>
          <h2 className={tituloCls}>Ventas</h2>
          <Fila label="Efectivo" valor={formatCOP(cierre.venta_efectivo)} />
          <Fila label="QR" valor={formatCOP(cierre.venta_qr)} />
          <Fila label="Nequi/Daviplata" valor={formatCOP(cierre.venta_nequi)} />
          <Fila label="Datáfono" valor={formatCOP(cierre.venta_datafono)} />
          <Fila label="Crédito" valor={formatCOP(cierre.venta_credito)} />
          <Fila label="Total venta" valor={formatCOP(totalVenta)} resaltado />
        </section>

        <section className={seccionCls}>
          <h2 className={tituloCls}>Cuadre de datáfono</h2>
          <Fila label="Datáfono liquidado" valor={formatCOP(cierre.datafono_liquidado)} />
          <Fila label="Según sistema" valor={formatCOP(cierre.venta_datafono)} />
          <Fila label="Diferencia" valor={formatCOP(diferenciaDatafono)} resaltado />
        </section>

        {gastos.length > 0 && (
          <section className={seccionCls}>
            <h2 className={tituloCls}>Gastos en efectivo</h2>
            {gastos.map((g, i) => (
              <Fila key={i} label={g.categoria + (g.nota ? ` — ${g.nota}` : '')} valor={formatCOP(g.valor)} />
            ))}
            <Fila label="Total gastos" valor={formatCOP(totalGastos)} resaltado />
          </section>
        )}

        {propinas.length > 0 && (
          <section className={seccionCls}>
            <h2 className={tituloCls}>Propinas (entregadas al mesero)</h2>
            {propinas.map((p, i) => (
              <Fila key={i} label={p.nota || `Propina ${i + 1}`} valor={formatCOP(p.valor)} />
            ))}
            <Fila label="Total propinas" valor={formatCOP(totalPropinas)} resaltado />
          </section>
        )}

        <section className={seccionCls}>
          <h2 className={tituloCls}>Cuadre de efectivo</h2>
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

      {errorCompartir && (
        <div className="rounded-[14px] bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
          No se pudo compartir: {errorCompartir}
        </div>
      )}

      {avisoDescarga && (
        <div className="rounded-[14px] bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Tu navegador no permite compartir directo, así que se descargó la imagen del cierre —
          envíala manualmente por WhatsApp.
        </div>
      )}

      <button
        type="button"
        onClick={compartir}
        disabled={compartiendo}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-green-600 to-green-500 py-3.5 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(22,163,74,0.55)] transition hover:-translate-y-px hover:scale-[1.015] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
      >
        <Share2 size={16} /> {compartiendo ? 'Generando imagen...' : 'Compartir por WhatsApp'}
      </button>
    </div>
  )
}
