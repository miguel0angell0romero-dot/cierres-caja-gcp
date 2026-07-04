import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Rol = 'admin' | 'cajero'

export interface Profile {
  id: string
  nombre: string
  rol: Rol
  activo: boolean
}

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileError: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      }
    )

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase) return

    if (!session) {
      setProfile(null)
      setProfileError(null)
      setLoading(false)
      return
    }

    let cancelado = false
    setLoading(true)
    setProfileError(null)

    supabase
      .from('profiles')
      .select('id, nombre, rol, activo')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelado) return

        if (error || !data) {
          setProfile(null)
          setProfileError('No se encontró tu perfil. Contacta al administrador.')
        } else if (!data.activo) {
          setProfile(null)
          setProfileError('Tu cuenta está desactivada. Contacta al administrador.')
        } else {
          setProfile(data as Profile)
        }
        setLoading(false)
      })

    return () => {
      cancelado = true
    }
  }, [session])

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: 'Supabase no está configurado.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, profileError, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
