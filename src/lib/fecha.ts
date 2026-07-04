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
