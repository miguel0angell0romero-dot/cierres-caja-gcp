import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { hoyBogota, primerDiaMesBogota } from '../../lib/fecha'
import { exportarExcel } from '../../lib/excel'
import { urlLogoNegocio } from '../../lib/logo'
import { PantallaMensaje } from '../../components/PantallaMensaje'
import { RangoFechas } from '../../components/RangoFechas'
import { KpiCard } from './KpiCard'
import { BarrasMedioPago } from './BarrasMedioPago'
import { TarjetaNegocio } from './TarjetaNegocio'

interface CierreFila {
  negocio_id: string
  venta_efectivo: number
  venta_qr: number
  venta_nequi: number
  venta_datafono: number
  venta_credito: number
  base_efectivo: number
  efectivo_contado: number
  negocios: { nombre: string; codigo: string; color: string; logo_path: string | null } | null
  gastos: { valor: number }[]
}

type Estado = 'cargando' | 'listo' | 'error'

export function PanelConsolidado() {
  const [desde, setDesde] = useState(primerDiaMesBogota())
  const [hasta, setHasta] = useState(hoyBogota())
  const [estado, setEstado] = useState<Estado>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [cierres, setCierres] = useState<CierreFila[]>([])

  useEffect(() => {
    if (!supabase) return
    let cancelado = false

    async function cargar() {
      if (!supabase) return
      setEstado('cargando')

      const { data, error: err } = await supabase
        .from('cierres')
        .select(
          'negocio_id, venta_efectivo, venta_qr, venta_nequi, venta_datafono, venta_credito, base_efectivo, efectivo_contado, negocios(nombre, codigo, color, logo_path), gastos(valor)'
        )
        .gte('fecha', desde)
        .lte('fecha', hasta)

      if (cancelado) return

      if (err) {
        setError(err.message)
        setEstado('error')
        return
      }

      setCierres((data ?? []) as unknown as CierreFila[])
      setEstado('listo')
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [desde, hasta])

  if (estado === 'error') {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  const totalEfectivo = cierres.reduce((s, c) => s + c.venta_efectivo, 0)
  const totalQr = cierres.reduce((s, c) => s + c.venta_qr, 0)
  const totalNequi = cierres.reduce((s, c) => s + c.venta_nequi, 0)
  const totalDatafono = cierres.reduce((s, c) => s + c.venta_datafono, 0)
  const totalCredito = cierres.reduce((s, c) => s + c.venta_credito, 0)
  const totalVenta = totalEfectivo + totalQr + totalNequi + totalDatafono + totalCredito
  const totalApps = totalQr + totalNequi

  const datosBarras = [
    { medio: 'Efectivo', valor: totalEfectivo },
    { medio: 'QR', valor: totalQr },
    { medio: 'Nequi', valor: totalNequi },
    { medio: 'Datáfono', valor: totalDatafono },
    { medio: 'Crédito', valor: totalCredito },
  ]

  const porNegocio = new Map<
    string,
    {
      nombre: string
      color: string
      logoUrl: string | null
      totalVenta: number
      totalGastos: number
      totalEntrega: number
      numCierres: number
    }
  >()

  for (const c of cierres) {
    const nombre = c.negocios?.nombre ?? 'Sin negocio'
    const color = c.negocios?.color ?? '#6E4AD1'
    const logoUrl = urlLogoNegocio(c.negocios?.logo_path ?? null)
    const clave = c.negocio_id
    const actual = porNegocio.get(clave) ?? {
      nombre,
      color,
      logoUrl,
      totalVenta: 0,
      totalGastos: 0,
      totalEntrega: 0,
      numCierres: 0,
    }
    actual.totalVenta += c.venta_efectivo + c.venta_qr + c.venta_nequi + c.venta_datafono + c.venta_credito
    actual.totalGastos += c.gastos.reduce((s, g) => s + g.valor, 0)
    actual.totalEntrega += c.efectivo_contado - c.base_efectivo
    actual.numCierres += 1
    porNegocio.set(clave, actual)
  }

  function exportar() {
    const filasResumen = [
      { Concepto: 'Venta total', Valor: totalVenta },
      { Concepto: 'Efectivo', Valor: totalEfectivo },
      { Concepto: 'QR', Valor: totalQr },
      { Concepto: 'Nequi/Daviplata', Valor: totalNequi },
      { Concepto: 'Datáfono', Valor: totalDatafono },
      { Concepto: 'Crédito', Valor: totalCredito },
    ]

    const filasNegocios = Array.from(porNegocio.values()).map((n) => ({
      Negocio: n.nombre,
      'Venta total': n.totalVenta,
      Gastos: n.totalGastos,
      'Entregas (depósitos)': n.totalEntrega,
      'Cierres registrados': n.numCierres,
    }))

    exportarExcel(`consolidado_${desde}_a_${hasta}`, [
      { nombre: 'Resumen', filas: filasResumen },
      { nombre: 'Por negocio', filas: filasNegocios },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm flex flex-wrap items-end justify-between gap-4">
        <RangoFechas desde={desde} hasta={hasta} onCambiarDesde={setDesde} onCambiarHasta={setHasta} />
        <button
          type="button"
          onClick={exportar}
          disabled={cierres.length === 0}
          className="rounded-lg bg-violet-600 text-white text-sm font-medium px-4 py-2 hover:bg-violet-700 disabled:opacity-50"
        >
          Exportar a Excel
        </button>
      </div>

      {estado === 'cargando' ? (
        <p className="text-gray-500">Cargando...</p>
      ) : cierres.length === 0 ? (
        <p className="text-gray-500">No hay cierres registrados en este rango de fechas.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard titulo="Venta total" valor={totalVenta} />
            <KpiCard titulo="Efectivo" valor={totalEfectivo} />
            <KpiCard titulo="Tarjetas (datáfono)" valor={totalDatafono} />
            <KpiCard titulo="Apps (QR + Nequi)" valor={totalApps} />
          </div>

          <BarrasMedioPago datos={datosBarras} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from(porNegocio.entries()).map(([id, n]) => (
              <TarjetaNegocio
                key={id}
                nombre={n.nombre}
                color={n.color}
                logoUrl={n.logoUrl}
                totalVenta={n.totalVenta}
                totalGastos={n.totalGastos}
                totalEntrega={n.totalEntrega}
                numCierres={n.numCierres}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
