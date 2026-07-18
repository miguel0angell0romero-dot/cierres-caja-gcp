import type { ReactNode } from 'react'

const estilos = {
  info: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  error: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
} as const

export function PantallaMensaje({
  tipo,
  children,
}: {
  tipo: keyof typeof estilos
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div
        className={`w-full max-w-md rounded-[20px] p-6 text-center text-sm font-medium shadow-md ${estilos[tipo]}`}
      >
        {children}
      </div>
    </div>
  )
}
