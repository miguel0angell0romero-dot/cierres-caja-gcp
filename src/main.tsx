import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabaseConfigurado } from './lib/supabase'

function ConfiguracionFaltante() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-4 rounded-[20px] border border-gray-200 bg-white p-8 text-center shadow-md dark:border-gray-800 dark:bg-gray-800">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Cierres de Caja GCP</h1>
        <div className="rounded-[14px] bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
          Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{supabaseConfigurado ? <App /> : <ConfiguracionFaltante />}</StrictMode>
)
