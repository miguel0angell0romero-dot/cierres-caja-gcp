export interface GastoLocal {
  id: string
  categoria: string
  valor: number
  nota: string
  foto: File | null
}

export interface PropinaLocal {
  id: string
  valor: number
  nota: string
}

export interface DatosCierreFormulario {
  ventaEfectivo: number
  ventaQr: number
  ventaNequi: number
  ventaDatafono: number
  ventaCredito: number
  detalleQr: number[]
  detalleNequi: number[]
  mostrarDetalleQr: boolean
  mostrarDetalleNequi: boolean
  datafonoLiquidado: number
  gastos: GastoLocal[]
  propinas: PropinaLocal[]
  efectivoContado: number
  recibe: string
  detalleOtros: string
}
