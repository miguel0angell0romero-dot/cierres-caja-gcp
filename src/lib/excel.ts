import * as XLSX from 'xlsx'

export function exportarExcel(
  nombreArchivo: string,
  hojas: { nombre: string; filas: Record<string, unknown>[] }[]
) {
  const libro = XLSX.utils.book_new()

  for (const hoja of hojas) {
    const worksheet = XLSX.utils.json_to_sheet(hoja.filas)
    XLSX.utils.book_append_sheet(libro, worksheet, hoja.nombre.slice(0, 31))
  }

  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`)
}
