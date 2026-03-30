import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  User,
  Heart,
  Plus,
  Shield,
  LogOut,
  ChevronRight,
  Map,
  Route,
  Mail,
  Lock,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

export default function Profile() {
  const {
    user,
    profile,
    isAdmin,
    isAuthenticated,
    isLoadingAuth,
    authError,
    signInWithPassword,
    signInWithMagicLink,
    signUp,
    logout,
  } = useAuth()

  // --- Login UI states ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'magic'
  const [submitting, setSubmitting] = useState(false)

  const displayName = useMemo(() => {
    return (
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.email ||
      'Visitante'
    )
  }, [profile, user])

  // --- Favorites count ---
  const { data: favoritesCount = 0 } = useQuery({
    queryKey: ['favoritesCount', user?.id || 'anon'],
    enabled: !!user?.id && isAuthenticated && !isLoadingAuth,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (error) throw error
      return count || 0
    },
  })

  // --- Suggestions count ---
  const { data: suggestionsCount = 0 } = useQuery({
    queryKey: ['mySuggestionsCount', user?.id || 'anon'],
    enabled: !!user?.id && isAuthenticated && !isLoadingAuth,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('place_suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)

      if (error) throw error
      return count || 0
    },
  })

  const menuItems = [
    { icon: Heart, label: 'Meus salvos', count: favoritesCount, path: '/Favorites' },
    { icon: Route, label: 'Meus roteiros', path: '/Itineraries' },
    { icon: Plus, label: 'Sugerir novo local', path: '/SuggestPlace' },
    { icon: Map, label: 'Minhas sugestões', count: suggestionsCount, path: '/MySuggestions' },
  ]

  const handleAuthAction = async () => {
    const cleanEmail = email.trim()
    if (!cleanEmail) return

    try {
      setSubmitting(true)

      if (mode === 'magic') {
        await signInWithMagicLink(cleanEmail)
        // Em magic link, o usuário vai confirmar pelo email.
        // Você pode exibir uma toast/aviso aqui se quiser.
        return
      }

      if (!password.trim()) return

      if (mode === 'signup') {
        await signUp(cleanEmail, password)
        // Dependendo do Supabase, pode exigir confirmação de email.
        return
      }

      // mode === 'login'
      await signInWithPassword(cleanEmail, password)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Estado: carregando auth ---
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen px-5 pt-8 pb-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  // --- Estado: não autenticado -> tela de login ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen px-5 pt-8 pb-10">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Perfil</h1>
        <p className="text-sm text-slate-500 mb-6">
          Entre para salvar locais, criar roteiros e enviar sugestões.
        </p>

        {authError && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {authError}
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'login' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('login')}
            >
              Entrar
            </Button>
            <Button
              type="button"
              variant={mode === 'signup' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('signup')}
            >
              Criar conta
            </Button>
            <Button
              type="button"
              variant={mode === 'magic' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('magic')}
            >
              Link
            </Button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 rounded-xl"
                type="email"
                autoComplete="email"
              />
            </div>

            {mode !== 'magic' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 rounded-xl"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </div>
            )}

            <Button
              onClick={handleAuthAction}
              disabled={submitting || !email.trim() || (mode !== 'magic' && !password.trim())}
              className="w-full bg-emerald-700 hover:bg-emerald-800 gap-2"
            >
              {mode === 'magic' ? (
                <>
                  <Send className="w-4 h-4" /> Enviar link
                </>
              ) : mode === 'signup' ? (
                <>Criar conta</>
              ) : (
                <>Entrar</>
              )}
            </Button>

            {mode === 'magic' && (
              <p className="text-xs text-slate-500">
                Você receberá um email com um link para entrar sem senha.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- Estado: autenticado -> perfil e menu ---
  return (
    <div className="min-h-screen px-5 pt-8 pb-4">
      {/* User Card */}
      <div className="bg-gradient-to-br from-emerald-700 to-teal-600 rounded-2xl p-5 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-lg truncate">{displayName}</h2>
            <p className="text-emerald-200 text-sm truncate">{user?.email}</p>

            {isAdmin && (
              <span className="inline-block mt-1 text-xs bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">
                Administrador
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2 mb-6">
        {menuItems.map(({ icon: Icon, label, count, path }) => (
          <Link
            key={path}
            to={path}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <Icon className="w-5 h-5 text-emerald-700" />
            <span className="flex-1 font-medium text-sm text-slate-800">{label}</span>

            {count !== undefined && (
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}

            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
        ))}

        {isAdmin && (
          <Link
            to="/AdminModeration"
            className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <Shield className="w-5 h-5 text-amber-600" />
            <span className="flex-1 font-medium text-sm text-amber-800">
              Painel de moderação
            </span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </Link>
        )}
      </div>

      <Button
        variant="outline"
        onClick={() => logout()}
        className="w-full gap-2 text-slate-500 border-slate-200"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </Button>
    </div>
  )
}