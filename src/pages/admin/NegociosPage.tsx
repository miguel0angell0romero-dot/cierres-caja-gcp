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
    return <p className="text-gray-500">Cargando...</p>
  }

  return (
    <div className="space-y-4">
      {mensajeExito && (
        <div className="rounded-lg bg-green-50 text-green-700 text-sm font-medium px-4 py-3 text-center">
          {mensajeExito}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {negocios.map((n) => {
          const edicion = ediciones[n.id]
          if (!edicion) return null
          const logoActualUrl = urlLogoNegocio(n.logo_path)
          const logoPreviewUrl = edicion.logo ? URL.createObjectURL(edicion.logo) : logoActualUrl

          return (
            <div key={n.id} className="rounded-xl bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt={`Logo de ${n.nombre}`}
                    className="h-14 w-14 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div
                    className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: edicion.color }}
                  >
                    {n.codigo}
                  </div>
                )}
                <span className="text-xs text-gray-400">{n.codigo}</span>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => actualizarEdicion(n.id, { logo: e.target.files?.[0] ?? null })}
                  className="text-xs text-gray-500 w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={edicion.nombre}
                  onChange={(e) => actualizarEdicion(n.id, { nombre: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Color</label>
                  <input
                    type="color"
                    value={edicion.color}
                    onChange={(e) => actualizarEdicion(n.id, { color: e.target.value })}
                    className="w-full h-9 rounded-lg border border-gray-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Base efectivo</label>
                  <input
                    type="number"
                    min={0}
                    value={edicion.base_efectivo}
                    onChange={(e) => actualizarEdicion(n.id, { base_efectivo: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => guardar(n)}
                disabled={guardandoId === n.id}
                className="w-full rounded-lg bg-violet-600 text-white text-sm font-medium py-2 hover:bg-violet-700 disabled:opacity-50"
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
