import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Clock, Check, X, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-800', icon: Check },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: X },
  needs_revision: { label: 'Precisa revisão', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
}

export default function MySuggestions() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth()

  const { data: suggestions = [], isLoading, isError, error } = useQuery({
    queryKey: ['mySuggestions', user?.id || 'anon'],
    enabled: !!user?.id && isAuthenticated && !isLoadingAuth,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_suggestions')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data ?? []
    },
  })

  // Se não estiver logado, mostra CTA para login
  if (!isLoadingAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen px-5 pt-8 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Minhas sugestões</h1>
        </div>

        <div className="text-center py-20">
          <p className="text-4xl mb-3">🔐</p>
          <p className="font-semibold text-slate-700">Entre para ver suas sugestões</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Faça login para acompanhar o status das sugestões enviadas.
          </p>

          <Link to="/Profile">
            <Button className="bg-emerald-700 hover:bg-emerald-800">Ir para login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pt-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => window.history.back()}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Minhas sugestões</h1>
      </div>

      {isError && (
        <div className="p-4 bg-white rounded-2xl border border-red-200 text-red-600 text-sm mb-4">
          Erro ao carregar sugestões: {error?.message || 'Erro desconhecido'}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-semibold text-slate-700">Nenhuma sugestão enviada</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Suas sugestões de locais aparecerão aqui
          </p>

          <Link to="/SuggestPlace" className="text-sm text-emerald-700 font-medium">
            Enviar uma sugestão →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => {
            const config = statusConfig[s.status] || statusConfig.pending
            const StatusIcon = config.icon

            return (
              <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{s.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {s.city}
                    </p>
                  </div>

                  <Badge className={`text-xs ${config.color} flex items-center gap-1`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </Badge>
                </div>

                {s.reviewer_notes && (
                  <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg">
                    💬 Moderador: {s.reviewer_notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
