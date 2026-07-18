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
      <div className="space-y-1.5">
        <label className="block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">Desde</label>
        <input
          type="date"
          value={desde}
          max={hasta}
          onChange={(e) => onCambiarDesde(e.target.value)}
          className="h-11 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">Hasta</label>
        <input
          type="date"
          value={hasta}
          min={desde}
          onChange={(e) => onCambiarHasta(e.target.value)}
          className="h-11 rounded-[14px] border-[1.5px] border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-violet-500/20"
        />
      </div>
    </div>
  )
}
