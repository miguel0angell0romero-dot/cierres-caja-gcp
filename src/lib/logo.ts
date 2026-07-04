import { supabase } from './supabase'

export function urlLogoNegocio(logoPath: string | null): string | null {
  if (!supabase || !logoPath) return null
  return supabase.storage.from('logos-negocios').getPublicUrl(logoPath).data.publicUrl
}
