import type { LucideIcon } from 'lucide-react'
import { formatCOP } from '../../lib/money'

const acentos = {
  violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
  green: { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
} as const

export function KpiCard({
  titulo,
  valor,
  icono: Icono,
  acento = 'violet',
}: {
  titulo: string
  valor: number
  icono: LucideIcon
  acento?: keyof typeof acentos
}) {
  const colores = acentos[acento]
  return (
    <div className="animate-fade-up rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-800">
      <div
        className={`flex h-[38px] w-[38px] items-center justify-center rounded-[11px] ${colores.bg} ${colores.text}`}
      >
        <Icono size={18} />
      </div>
      <p className="mt-4 text-[13px] font-medium text-gray-500 dark:text-gray-400">{titulo}</p>
      <p className="mt-1 text-[26px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
        {formatCOP(valor)}
      </p>
    </div>
  )
}
