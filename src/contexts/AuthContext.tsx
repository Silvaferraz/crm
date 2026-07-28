import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types'

interface AuthContextValue {
  user: Usuario | null
  loading: boolean
  signIn: (usuario: string, senha: string) => Promise<{ tenantsVinculados?: { id: string; nome: string; slug: string }[]; erro?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        carregarUsuario(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        carregarUsuario(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function carregarUsuario(authUserId: string) {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (data) {
      setUser(data as Usuario)
    }
    setLoading(false)
  }

  const signIn = useCallback(async (usuario: string, senha: string) => {
    const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
      email: usuario,
      password: senha,
    })

    if (error || !authUser) {
      return { erro: error?.message ?? 'Erro ao fazer login' }
    }

    const { data: vinculos } = await supabase
      .from('usuarios')
      .select('tenant_id, tenants!inner(id, nome, slug)')
      .eq('auth_user_id', authUser.id)

    if (!vinculos || vinculos.length === 0) {
      await supabase.auth.signOut()
      return { erro: 'Usuário sem vínculo com nenhum negócio' }
    }

    const tenantsVinculados = (vinculos as unknown as { tenant_id: string; tenants: { id: string; nome: string; slug: string } }[])
      .map(v => v.tenants)

    if (tenantsVinculados.length === 1) {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .eq('tenant_id', tenantsVinculados[0].id)
        .maybeSingle()

      if (userData) setUser(userData as Usuario)
      return {}
    }

    return { tenantsVinculados }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
