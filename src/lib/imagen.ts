// Redimensiona y recomprime una foto en el navegador antes de subirla, para
// no llenar el 1 GB gratuito de Storage con fotos de cámara sin comprimir
// (una foto de celular puede pesar 2-4 MB; esto la deja en unos cientos de KB).
export async function comprimirImagen(
  archivo: File,
  { maxAncho = 1280, calidad = 0.7 }: { maxAncho?: number; calidad?: number } = {}
): Promise<File> {
  if (!archivo.type.startsWith('image/')) return archivo

  try {
    const bitmap = await createImageBitmap(archivo)
    const escala = Math.min(1, maxAncho / bitmap.width)
    const ancho = Math.round(bitmap.width * escala)
    const alto = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext('2d')
    if (!ctx) return archivo

    ctx.drawImage(bitmap, 0, 0, ancho, alto)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', calidad)
    )
    if (!blob) return archivo

    const nombreBase = archivo.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${nombreBase}.jpg`, { type: 'image/jpeg' })
  } catch {
    // Si algo falla (formato raro, navegador viejo, etc.), se sube la original.
    return archivo
  }
}
