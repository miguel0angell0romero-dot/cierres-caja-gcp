import { toBlob } from 'html-to-image'

export type ResultadoCompartir = { compartido: boolean; error?: string }

// Convierte un elemento del DOM en imagen y la comparte con el menú nativo del
// dispositivo (ahí el usuario elige WhatsApp u otra app). Si el navegador no
// soporta compartir archivos, descarga la imagen para enviarla a mano.
export async function compartirElementoComoImagen(
  elemento: HTMLElement,
  { nombreArchivo, titulo, texto }: { nombreArchivo: string; titulo?: string; texto?: string }
): Promise<ResultadoCompartir> {
  try {
    const blob = await toBlob(elemento, { pixelRatio: 2, backgroundColor: '#f9fafb' })
    if (!blob) return { compartido: false, error: 'No se pudo generar la imagen.' }

    const archivo = new File([blob], `${nombreArchivo}.png`, { type: 'image/png' })

    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], title: titulo, text: texto })
      return { compartido: true }
    }

    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `${nombreArchivo}.png`
    enlace.click()
    URL.revokeObjectURL(url)
    return { compartido: false }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      // El usuario cerró el menú de compartir sin elegir nada: no es un error.
      return { compartido: false }
    }
    return { compartido: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
