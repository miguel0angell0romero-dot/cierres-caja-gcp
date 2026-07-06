export interface NegocioResumen {
  id: string
  nombre: string
  codigo: string
  color: string
  base_efectivo: number
  logo_path: string | null
}

export interface GastoDetalle {
  id: string
  categoria: string
  valor: number
  nota: string | null
  foto_path: string | null
}

export interface PropinaDetalle {
  id: string
  valor: number
  nota: string | null
}

export interface CierreCompleto {
  id: string
  negocio_id: string
  profile_id: string
  fecha: string
  base_efectivo: number
  venta_efectivo: number
  venta_qr: number
  venta_nequi: number
  venta_datafono: number
  venta_credito: number
  datafono_liquidado: number
  efectivo_contado: number
  detalle_otros: string | null
  recibe: string | null
  negocios: { nombre: string; codigo: string } | null
  profiles: { nombre: string } | null
  gastos: GastoDetalle[]
  propinas: PropinaDetalle[]
}

export const CAMPOS_EDITABLES = [
  'base_efectivo',
  'venta_efectivo',
  'venta_qr',
  'venta_nequi',
  'venta_datafono',
  'venta_credito',
  'datafono_liquidado',
  'efectivo_contado',
  'detalle_otros',
  'recibe',
] as const

export type CampoEditable = (typeof CAMPOS_EDITABLES)[number]

export const ETIQUETAS_CAMPO: Record<CampoEditable, string> = {
  base_efectivo: 'Base efectivo',
  venta_efectivo: 'Venta efectivo',
  venta_qr: 'Venta QR',
  venta_nequi: 'Venta Nequi/Daviplata',
  venta_datafono: 'Venta datáfono (sistema)',
  venta_credito: 'Venta crédito',
  datafono_liquidado: 'Datáfono liquidado (terminal)',
  efectivo_contado: 'Efectivo contado',
  detalle_otros: 'Notas adicionales',
  recibe: 'Recibe',
}
