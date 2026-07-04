export interface BorradorGasto {
  id: string
  categoria: string
  valor: number
  nota: string
}

export interface BorradorPropina {
  id: string
  valor: number
  nota: string
}

export interface BorradorCierre {
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
  gastos: BorradorGasto[]
  propinas?: BorradorPropina[]
  efectivoContado: number
  recibe: string
  detalleOtros: string
}

function claveBorrador(negocioId: string, fecha: string) {
  return `borrador-cierre-${negocioId}-${fecha}`
}

export function guardarBorrador(negocioId: string, fecha: string, datos: BorradorCierre) {
  try {
    localStorage.setItem(claveBorrador(negocioId, fecha), JSON.stringify(datos))
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — se ignora.
  }
}

export function leerBorrador(negocioId: string, fecha: string): BorradorCierre | null {
  try {
    const crudo = localStorage.getItem(claveBorrador(negocioId, fecha))
    return crudo ? (JSON.parse(crudo) as BorradorCierre) : null
  } catch {
    return null
  }
}

export function borrarBorrador(negocioId: string, fecha: string) {
  try {
    localStorage.removeItem(claveBorrador(negocioId, fecha))
  } catch {
    // ignorar
  }
}
