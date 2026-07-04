import type { ReactNode } from 'react'

const estilos = {
  info: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-700',
} as const

export function PantallaMensaje({
  tipo,
  children,
}: {
  tipo: keyof typeof estilos
  children: ReactNode
}) {
  return (
    <div className="min-h-svh flex items-center justify-center bg-gray-50 px-4">
      <div
        className={`max-w-md w-full rounded-xl p-6 shadow-md text-center text-sm font-medium ${estilos[tipo]}`}
      >
        {children}
      </div>
    </div>
  )
}
