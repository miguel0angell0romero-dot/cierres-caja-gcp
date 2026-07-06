import { supabase } from './supabase'
import { comprimirImagen } from './imagen'
import type { DatosCierreFormulario } from '../components/cierre/types'

export type ResultadoGuardarCierre = { cierreId: string } | { error: string }

export async function guardarCierreCompleto({
  negocioId,
  profileId,
  fecha,
  baseEfectivo,
  datos,
}: {
  negocioId: string
  profileId: string
  fecha: string
  baseEfectivo: number
  datos: DatosCierreFormulario
}): Promise<ResultadoGuardarCierre> {
  if (!supabase) return { error: 'Supabase no está configurado.' }

  const cierreId = crypto.randomUUID()

  const { error: cierreError } = await supabase.from('cierres').insert({
    id: cierreId,
    negocio_id: negocioId,
    profile_id: profileId,
    fecha,
    base_efectivo: baseEfectivo,
    venta_efectivo: datos.ventaEfectivo,
    venta_qr: datos.ventaQr,
    venta_nequi: datos.ventaNequi,
    venta_datafono: datos.ventaDatafono,
    venta_credito: datos.ventaCredito,
    datafono_liquidado: datos.datafonoLiquidado,
    efectivo_contado: datos.efectivoContado,
    detalle_otros: datos.detalleOtros || null,
    recibe: datos.recibe || null,
  })

  if (cierreError) {
    if (cierreError.code === '23505') {
      return { error: 'Ya existe un cierre guardado para este negocio en esa fecha.' }
    }
    return { error: cierreError.message }
  }

  for (const gasto of datos.gastos) {
    let fotoPath: string | null = null

    if (gasto.foto) {
      const fotoComprimida = await comprimirImagen(gasto.foto)
      const path = `${negocioId}/${cierreId}/${gasto.id}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('soportes-gastos')
        .upload(path, fotoComprimida, { contentType: fotoComprimida.type })

      if (uploadError) {
        return { error: `Cierre guardado, pero falló la foto de un gasto: ${uploadError.message}` }
      }
      fotoPath = path
    }

    const { error: gastoError } = await supabase.from('gastos').insert({
      id: gasto.id,
      cierre_id: cierreId,
      categoria: gasto.categoria,
      valor: gasto.valor,
      foto_path: fotoPath,
      nota: gasto.nota || null,
    })

    if (gastoError) {
      return { error: `Cierre guardado, pero falló un gasto: ${gastoError.message}` }
    }
  }

  if (datos.propinas.length > 0) {
    const { error: propinasError } = await supabase.from('propinas').insert(
      datos.propinas.map((p) => ({
        id: p.id,
        cierre_id: cierreId,
        valor: p.valor,
        nota: p.nota || null,
      }))
    )

    if (propinasError) {
      return { error: `Cierre guardado, pero falló una propina: ${propinasError.message}` }
    }
  }

  const pagos = [
    ...datos.detalleQr.map((valor) => ({ cierre_id: cierreId, metodo: 'qr', valor })),
    ...datos.detalleNequi.map((valor) => ({ cierre_id: cierreId, metodo: 'nequi', valor })),
  ]

  if (pagos.length > 0) {
    const { error: pagosError } = await supabase.from('pagos_detalle').insert(pagos)
    if (pagosError) {
      return { error: `Cierre guardado, pero falló el detalle de pagos: ${pagosError.message}` }
    }
  }

  return { cierreId }
}
