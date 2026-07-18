import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { urlLogoNegocio } from '../../lib/logo'
import { PantallaMensaje } from '../../components/PantallaMensaje'
import type { NegocioResumen } from './types'

interface EdicionNegocio {
  nombre: string
  color: string
  base_efectivo: string
  logo: File | null
}

const inputCls =
  'w-full h-11 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20'
const labelCls = 'mb-1.5 block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400'

export function NegociosPage() {
  const [negocios, setNegocios] = useState<NegocioResumen[]>([])
  const [ediciones, setEdiciones] = useState<Record<string, EdicionNegocio>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  async function cargar() {
    if (!supabase) return
    setCargando(true)
    const { data, error: err } = await supabase
      .from('negocios')
      .select('id, nombre, codigo, color, base_efectivo, logo_path')
      .order('nombre')

    if (err) {
      setError(err.message)
      setCargando(false)
      return
    }

    const lista = (data ?? []) as NegocioResumen[]
    setNegocios(lista)
    setEdiciones(
      Object.fromEntries(
        lista.map((n) => [
          n.id,
          { nombre: n.nombre, color: n.color, base_efectivo: String(n.base_efectivo), logo: null },
        ])
      )
    )
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  function actualizarEdicion(id: string, cambios: Partial<EdicionNegocio>) {
    setEdiciones((prev) => ({ ...prev, [id]: { ...prev[id], ...cambios } }))
  }

  async function guardar(negocio: NegocioResumen) {
    if (!supabase) return
    const edicion = ediciones[negocio.id]
    if (!edicion) return

    setGuardandoId(negocio.id)
    setError(null)
    setMensajeExito(null)

    let logoPath = negocio.logo_path

    if (edicion.logo) {
      const extension = edicion.logo.name.split('.').pop() || 'png'
      const path = `${negocio.id}-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('logos-negocios')
        .upload(path, edicion.logo, { contentType: edicion.logo.type })

      if (uploadError) {
        setError(`No se pudo subir el logo: ${uploadError.message}`)
        setGuardandoId(null)
        return
      }

      logoPath = path
    }

    const { error: updateError } = await supabase
      .from('negocios')
      .update({
        nombre: edicion.nombre,
        color: edicion.color,
        base_efectivo: Number(edicion.base_efectivo) || 0,
        logo_path: logoPath,
      })
      .eq('id', negocio.id)

    setGuardandoId(null)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMensajeExito(`${edicion.nombre} actualizado ✓`)
    setTimeout(() => setMensajeExito(null), 2500)
    cargar()
  }

  if (error) {
    return <PantallaMensaje tipo="error">{error}</PantallaMensaje>
  }

  if (cargando) {
    return <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
  }

  return (
    <div className="space-y-4">
      {mensajeExito && (
        <div className="animate-fade-up rounded-[14px] bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
          {mensajeExito}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {negocios.map((n) => {
          const edicion = ediciones[n.id]
          if (!edicion) return null
          const logoActualUrl = urlLogoNegocio(n.logo_path)
          const logoPreviewUrl = edicion.logo ? URL.createObjectURL(edicion.logo) : logoActualUrl

          return (
            <div
              key={n.id}
              className="space-y-3.5 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt={`Logo de ${n.nombre}`}
                    className="h-14 w-14 rounded-[14px] border border-gray-200 object-cover dark:border-gray-700"
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-[14px] font-bold text-white"
                    style={{ backgroundColor: edicion.color }}
                  >
                    {n.codigo}
                  </div>
                )}
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{n.codigo}</span>
              </div>

              <div>
                <label className={labelCls}>Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => actualizarEdicion(n.id, { logo: e.target.files?.[0] ?? null })}
                  className="w-full text-xs text-gray-500 file:mr-3 file:rounded-[10px] file:border-0 file:bg-violet-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-violet-700 dark:text-gray-400 dark:file:bg-violet-500/10 dark:file:text-violet-400"
                />
              </div>

              <div>
                <label className={labelCls}>Nombre</label>
                <input
                  type="text"
                  value={edicion.nombre}
                  onChange={(e) => actualizarEdicion(n.id, { nombre: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Color</label>
                  <input
                    type="color"
                    value={edicion.color}
                    onChange={(e) => actualizarEdicion(n.id, { color: e.target.value })}
                    className="h-11 w-full rounded-[14px] border-[1.5px] border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className={labelCls}>Base efectivo</label>
                  <input
                    type="number"
                    min={0}
                    value={edicion.base_efectivo}
                    onChange={(e) => actualizarEdicion(n.id, { base_efectivo: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => guardar(n)}
                disabled={guardandoId === n.id}
                className="flex h-11 w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.6)] transition hover:-translate-y-px hover:scale-[1.015] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
              >
                {guardandoId === n.id ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
