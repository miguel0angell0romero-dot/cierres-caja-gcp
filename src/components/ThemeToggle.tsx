import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'

export function ThemeToggle() {
  const { tema, alternarTema } = useTheme()

  return (
    <button
      type="button"
      onClick={alternarTema}
      title={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] border border-gray-200 bg-white text-gray-500 transition hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-50"
    >
      {tema === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
