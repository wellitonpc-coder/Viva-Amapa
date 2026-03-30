import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/api/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        setIsLoadingAuth(true)
        setAuthError(null)

        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        if (!mounted) return
        setSession(data.session ?? null)
        setUser(data.session?.user ?? null)
      } catch (e) {
        if (!mounted) return
        setSession(null)
        setUser(null)
        setAuthError(e?.message ?? 'Falha ao iniciar autenticação')
      } finally {
        if (!mounted) return
        setIsLoadingAuth(false)
      }
    }

    init()

    // ⚠️ IMPORTANTE:
    // - mantenha o callback leve e síncrono
    // - não faça awaits longos aqui (isso reduz chance de lock “preso”)
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession ?? null)
      setUser(newSession?.user ?? null)
      // se precisar buscar perfil no banco, veja o item 3 abaixo
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe?.()
    }
  }, [])

  const logout = async () => {
    setAuthError(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthError(error.message)
      throw error
    }
    setSession(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      session,
      user,
      isAuthenticated: !!user,
      isLoadingAuth,
      authError,
      logout,
    }),
    [session, user, isLoadingAuth, authError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}