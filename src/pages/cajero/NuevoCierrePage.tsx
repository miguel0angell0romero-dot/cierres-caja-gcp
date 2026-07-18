import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { hoyBogota } from '../../lib/fecha'
import { formatCOP } from '../../lib/money'
import { PantallaMensaje } from '../../components/PantallaMensaje'
import { FormularioCierre } from '../../components/cierre/FormularioCierre'
import { ResumenCierre } from './ResumenCierre'
import { guardarBorrador, leerBorrador, borrarBorrador } from './borrador'
import { urlLogoNegocio } from '../../lib/logo'
import { guardarCierreCompleto } from '../../lib/guardarCierre'
import type { DatosCierreFormulario } from '../../components/cierre/types'

interface NegocioAsignado {
  id: string
  nombre: string
  codigo: string
  base_efectivo: number
  logo_path: string | null
}

interface GastoGuardado {
  categoria: string
  valor: number
  nota: string | null
}

interface PropinaGuardada {
  valor: number
  nota: string | null
}

interface CierreGuardado {
  base_efectivo: number
  venta_efectivo: number
  venta_qr: number
  venta_nequi: number
  venta_datafono: number
  venta_credito: number
  datafono_liquidado: number
  efectivo_contado: number
  recibe: string | null
  gastos: GastoGuardado[]
  propinas: PropinaGuardada[]
}

type Estado = 'cargando' | 'sin-asignacion' | 'ya-guardado' | 'listo' | 'error'

export function NuevoCierrePage() {
  const { session } = useAuth()
  const hoy = useMemo(() => hoyBogota(), [])

  const [estado, setEstado] = useState<Estado>('cargando')
  const [negocio, setNegocio] = useState<NegocioAsignado | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [cierreGuardado, setCierreGuardado] = useState<CierreGuardado | null>(null)
  const [valoresIniciales, setValoresIniciales] = useState<DatosCierreFormulario | undefined>(undefined)
  const [avisoRestaurado, setAvisoRestaurado] = useState(false)
  const [mensajeBorrador, setMensajeBorrador] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !session) return
    let cancelado = false

    async function cargar() {
      if (!supabase || !session) return

      const { data: asignacion, error: asgError } = await supabase
        .from('asignaciones')
        .select('negocio_id, negocios (id, nombre, codigo, base_efectivo, logo_path)')
        .eq('profile_id', session.user.id)
        .eq('fecha', hoy)
        .maybeSingle()

      if (cancelado) return

      if (asgError) {
        setErrorCarga(asgError.message)
        setEstado('error')
        return
      }

      const negocioAsignado = (
        asignacion as unknown as { negocios: NegocioAsignado } | null
      )?.negocios

      if (!negocioAsignado) {
        setEstado('sin-asignacion')
        return
      }

      setNegocio(negocioAsignado)

      const { data: cierreExistente, error: cierreError } = await supabase
        .from('cierres')
        .select('*, gastos(categoria, valor, nota), propinas(valor, nota)')
        .eq('negocio_id', negocioAsignado.id)
        .eq('profile_id', session.user.id)
        .eq('fecha', hoy)
        .maybeSingle()

      if (cancelado) return

      if (cierreError) {
        setErrorCarga(cierreError.message)
        setEstado('error')
        return
      }

      if (cierreExistente) {
        setCierreGuardado(cierreExistente as unknown as CierreGuardado)
        setEstado('ya-guardado')
        return
      }

      const borrador = leerBorrador(negocioAsignado.id, hoy)
      if (borrador) {
        setValoresIniciales({
          ventaEfectivo: borrador.ventaEfectivo,
          ventaQr: borrador.ventaQr,
          ventaNequi: borrador.ventaNequi,
          ventaDatafono: borrador.ventaDatafono,
          ventaCredito: borrador.ventaCredito,
          detalleQr: borrador.detalleQr,
          detalleNequi: borrador.detalleNequi,
          mostrarDetalleQr: borrador.mostrarDetalleQr,
          mostrarDetalleNequi: borrador.mostrarDetalleNequi,
          datafonoLiquidado: borrador.datafonoLiquidado,
          gastos: borrador.gastos.map((g) => ({ ...g, foto: null })),
          propinas: borrador.propinas ?? [],
          efectivoContado: borrador.efectivoContado,
          recibe: borrador.recibe,
          detalleOtros: borrador.detalleOtros,
        })
        setAvisoRestaurado(true)
      }

      setEstado('listo')
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [session, hoy])

  function manejarCambio(datos: DatosCierreFormulario) {
    if (!negocio) return
    guardarBorrador(negocio.id, hoy, {
      ...datos,
      gastos: datos.gastos.map((g) => ({ id: g.id, categoria: g.categoria, valor: g.valor, nota: g.nota })),
      propinas: datos.propinas.map((p) => ({ id: p.id, valor: p.valor, nota: p.nota })),
    })
  }

  function manejarGuardarBorrador(datos: DatosCierreFormulario) {
    manejarCambio(datos)
    setMensajeBorrador('Borrador guardado ✓')
    setTimeout(() => setMensajeBorrador(null), 2500)
  }

  async function manejarGuardarCierre(datos: DatosCierreFormulario) {
    if (!session || !negocio) return

    setGuardando(true)
    setErrorGuardado(null)

    const resultado = await guardarCierreCompleto({
      negocioId: negocio.id,
      profileId: session.user.id,
      fecha: hoy,
      baseEfectivo: negocio.base_efectivo,
      datos,
    })

    setGuardando(false)

    if ('error' in resultado) {
      setErrorGuardado(resultado.error)
      return
    }

    borrarBorrador(negocio.id, hoy)

    setCierreGuardado({
      base_efectivo: negocio.base_efectivo,
      venta_efectivo: datos.ventaEfectivo,
      venta_qr: datos.ventaQr,
      venta_nequi: datos.ventaNequi,
      venta_datafono: datos.ventaDatafono,
      venta_credito: datos.ventaCredito,
      datafono_liquidado: datos.datafonoLiquidado,
      efectivo_contado: datos.efectivoContado,
      recibe: datos.recibe || null,
      gastos: datos.gastos.map((g) => ({ categoria: g.categoria, valor: g.valor, nota: g.nota || null })),
      propinas: datos.propinas.map((p) => ({ valor: p.valor, nota: p.nota || null })),
    })
    setEstado('ya-guardado')
  }

  if (estado === 'cargando') {
    return <PantallaMensaje tipo="info">Cargando tu punto asignado...</PantallaMensaje>
  }

  if (estado === 'error') {
    return <PantallaMensaje tipo="error">{errorCarga}</PantallaMensaje>
  }

  if (estado === 'sin-asignacion') {
    return (
      <PantallaMensaje tipo="info">
        No tienes un punto asignado para hoy. Contacta al administrador.
      </PantallaMensaje>
    )
  }

  if (estado === 'ya-guardado' && cierreGuardado && negocio) {
    return (
      <ResumenCierre
        negocioNombre={negocio.nombre}
        fecha={hoy}
        cierre={cierreGuardado}
        gastos={cierreGuardado.gastos}
        propinas={cierreGuardado.propinas}
      />
    )
  }

  const baseEfectivo = negocio?.base_efectivo ?? 0

  return (
    <div className="mx-auto max-w-md space-y-4 pb-8">
      <div className="flex items-center gap-3 rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        {urlLogoNegocio(negocio?.logo_path ?? null) && (
          <img
            src={urlLogoNegocio(negocio?.logo_path ?? null)!}
            alt={negocio?.nombre}
            className="h-12 w-12 rounded-[14px] object-cover"
          />
        )}
        <div>
          <p className="font-bold tracking-tight text-gray-900 dark:text-gray-50">{negocio?.nombre}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hoy} — Base: {formatCOP(baseEfectivo)}
          </p>
        </div>
      </div>

      {avisoRestaurado && (
        <div className="rounded-[14px] bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Se restauró un borrador guardado en este dispositivo. Si habías adjuntado fotos de
          gastos, debes volver a seleccionarlas.
        </div>
      )}

      <FormularioCierre
        baseEfectivo={baseEfectivo}
        valoresIniciales={valoresIniciales}
        onCambiar={manejarCambio}
        onGuardar={manejarGuardarCierre}
        guardando={guardando}
        textoBoton="Guardar cierre"
        mensajeConfirmacion="¿Está seguro que va a realizar el cierre de caja? Una vez que dé aceptar no se podrán realizar cambios."
        permitirBorrador
        onGuardarBorrador={manejarGuardarBorrador}
        mensajeBorrador={mensajeBorrador}
        errorGuardado={errorGuardado}
      />
    </div>
  )
}
