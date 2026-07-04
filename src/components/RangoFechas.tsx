export function RangoFechas({
  desde,
  hasta,
  onCambiarDesde,
  onCambiarHasta,
}: {
  desde: string
  hasta: string
  onCambiarDesde: (valor: string) => void
  onCambiarHasta: (valor: string) => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Desde</label>
        <input
          type="date"
          value={desde}
          max={hasta}
          onChange={(e) => onCambiarDesde(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Hasta</label>
        <input
          type="date"
          value={hasta}
          min={desde}
          onChange={(e) => onCambiarHasta(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}
