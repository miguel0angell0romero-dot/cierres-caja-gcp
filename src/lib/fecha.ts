// Colombia no tiene horario de verano, así que un offset fijo (America/Bogota)
// es seguro para calcular "el día de hoy" de forma consistente con el
// current_date del servidor (ver ajuste de timezone en la base de datos).
export function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(
    new Date()
  )
}

export function primerDiaMesBogota(): string {
  const hoy = hoyBogota()
  return `${hoy.slice(0, 7)}-01`
}

function aFechaLocal(fechaIso: string): Date {
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function aIso(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function sumarDias(fechaIso: string, dias: number): string {
  const fecha = aFechaLocal(fechaIso)
  fecha.setDate(fecha.getDate() + dias)
  return aIso(fecha)
}

// Lunes de la semana que contiene fechaIso (semana Lunes→Domingo).
export function lunesDeSemana(fechaIso: string): string {
  const fecha = aFechaLocal(fechaIso)
  const diaSemana = fecha.getDay() // 0=domingo..6=sábado
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana
  fecha.setDate(fecha.getDate() + offset)
  return aIso(fecha)
}

export function diasDeSemana(lunesIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunesIso, i))
}
