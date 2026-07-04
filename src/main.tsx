import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabaseConfigurado } from './lib/supabase'

function ConfiguracionFaltante() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full rounded-xl bg-white p-8 shadow-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Cierres de Caja GCP</h1>
        <div className="rounded-lg px-4 py-3 text-sm font-medium bg-gray-100 text-gray-600">
          Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{supabaseConfigurado ? <App /> : <ConfiguracionFaltante />}</StrictMode>
)
