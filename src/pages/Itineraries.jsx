import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Route, Plus, MapPin, Calendar, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

export default function Itineraries() {
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoadingAuth } = useAuth()

  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')

  // 1) Listar roteiros do usuário
  const { data: itineraries = [], isLoading } = useQuery({
    queryKey: ['itineraries', user?.id || 'anon'],
    enabled: !!user?.id && isAuthenticated && !isLoadingAuth,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })

  // Se não estiver logado, mostra CTA
  if (!isLoadingAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen px-5 pt-8 pb-24">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Meus Roteiros</h1>

        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Route className="w-7 h-7 text-emerald-300" />
          </div>
          <p className="font-semibold text-slate-700">Entre para criar seus roteiros</p>
          <p className="text-sm text-slate-500 mt-1">
            Faça login para salvar e organizar roteiros de viagem.
          </p>

          <Button className="mt-4 bg-emerald-700 hover:bg-emerald-800" onClick={() => window.location.assign('/Profile')}>
            Ir para login
          </Button>
        </div>
      </div>
    )
  }

  // 2) Criar roteiro
  const createItinerary = useMutation({
    mutationFn: async () => {
      const cleanTitle = title.trim()
      if (!cleanTitle) throw new Error('Informe um nome para o roteiro.')

      const payload = {
        user_id: user.id,
        title: cleanTitle,
        places: [],          // json/jsonb (array)
        duration_days: 1,    // número
      }

      const { error } = await supabase.from('itineraries').insert(payload)
      if (error) throw error
      return true
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['itineraries', user.id] })
      setTitle('')
      setShowCreate(false)
      toast.success('Roteiro criado!')
    },
    onError: (e) => {
      toast.error(e?.message || 'Erro ao criar roteiro.')
    },
  })

  // 3) Deletar roteiro
  const deleteItinerary = useMutation({
    mutationFn: async (id) => {
      // Por segurança: garante que só delete o do usuário
      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['itineraries', user.id] })
      toast.success('Roteiro removido!')
    },
    onError: (e) => {
      toast.error(e?.message || 'Erro ao remover roteiro.')
    },
  })

  return (
    <div className="min-h-screen px-5 pt-8 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Meus Roteiros</h1>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 gap-1">
              <Plus className="w-4 h-4" />
              Novo
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar roteiro</DialogTitle>
            </DialogHeader>

            <Input
              placeholder="Nome do roteiro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Button
              onClick={() => createItinerary.mutate()}
              disabled={!title.trim() || createItinerary.isPending}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              Criar
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : itineraries.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Route className="w-7 h-7 text-emerald-300" />
          </div>
          <p className="font-semibold text-slate-700">Nenhum roteiro</p>
          <p className="text-sm text-slate-500 mt-1">Crie roteiros para planejar sua viagem</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itineraries.map((it) => (
            <div key={it.id} className="p-4 bg-white rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-900">{it.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {(it.places?.length || 0)} locais
                    {it.duration_days ? (
                      <>
                        <Calendar className="w-3 h-3 ml-2" />
                        {it.duration_days} dia(s)
                      </>
                    ) : null}
                  </p>
                </div>

                <button
                  onClick={() => deleteItinerary.mutate(it.id)}
                  className="p-2 text-slate-400 hover:text-red-500"
                  aria-label="Excluir roteiro"
                  disabled={deleteItinerary.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}