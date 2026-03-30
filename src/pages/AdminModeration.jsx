import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, X, Clock, Eye, MapPin, AlertCircle, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  needs_revision: 'bg-blue-100 text-blue-800',
}

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  needs_revision: 'Revisão',
}

const BUCKET = 'place-media'

export default function AdminModeration() {
  const queryClient = useQueryClient()
  const { isAdmin, isLoadingAuth } = useAuth()

  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')

  // Guard UI (segurança real fica no RLS)
  if (!isLoadingAuth && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border rounded-2xl p-6 max-w-md w-full text-center">
          <p className="text-3xl mb-2">🔒</p>
          <h2 className="font-bold text-slate-900">Acesso restrito</h2>
          <p className="text-sm text-slate-600 mt-2">
            Esta área é exclusiva para administradores/moderadores.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  // 1) Listar sugestões
  const {
    data: suggestions = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['suggestions'],
    enabled: !isLoadingAuth && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_suggestions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data ?? []
    },
  })

  // 2) Atualizar status (rejeitar / pedir revisão)
  const updateSuggestionStatus = useMutation({
    /**
     * @param {{ id: string, status: 'rejected'|'needs_revision'|'pending'|'approved' }} vars
     */
    mutationFn: async (vars) => {
      const { id, status } = vars

      const payload = {
        status,
        reviewer_notes: notes?.trim() || null,
        reviewed_at: status === 'pending' ? null : new Date().toISOString(),
      }

      const { error } = await supabase
        .from('place_suggestions')
        .update(payload)
        .eq('id', id)

      if (error) throw error
      return true
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      setSelected(null)
      setNotes('')
      toast.success('Sugestão atualizada!')
    },
    onError: (e) => toast.error(e?.message || 'Erro ao atualizar sugestão.'),
  })

  // 3) Atualizar mídia da sugestão (cover_photo / photos)
  const updateSuggestionMedia = useMutation({
    /**
     * @param {{ id: string, cover_photo?: string|null, photos?: string[]|null }} vars
     */
    mutationFn: async (vars) => {
      const { id, cover_photo, photos } = vars

      const payload = {}
      if (cover_photo !== undefined) payload.cover_photo = cover_photo
      if (photos !== undefined) payload.photos = photos

      const { error } = await supabase
        .from('place_suggestions')
        .update(payload)
        .eq('id', id)

      if (error) throw error
      return true
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      toast.success('Fotos atualizadas na sugestão!')
    },
    onError: (e) => toast.error(e?.message || 'Erro ao salvar fotos.'),
  })

  // 4) Aprovar/publicar via RPC (atomic)
  const approveSuggestion = useMutation({
    /**
     * @param {any} suggestion
     */
    mutationFn: async (suggestion) => {
      const { data, error } = await supabase.rpc('approve_place_suggestion', {
        p_suggestion_id: suggestion.id,
        p_reviewer_notes: notes?.trim() || null,
      })

      if (error) throw error
      return data // uuid do place criado/atualizado
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      await queryClient.invalidateQueries({ queryKey: ['places'] })
      setSelected(null)
      setNotes('')
      toast.success('Local aprovado e publicado!')
    },
    onError: (e) => {
      toast.error(
        e?.message ||
          "Erro ao aprovar/publicar. Se for 'RPC not found', rode NOTIFY pgrst, 'reload schema' no SQL Editor."
      )
    },
  })

  const pending = useMemo(() => suggestions.filter((s) => s.status === 'pending'), [suggestions])
  const reviewed = useMemo(() => suggestions.filter((s) => s.status !== 'pending'), [suggestions])

  // Helpers: upload
  const handleUploadCover = async (file) => {
    if (!selected?.id) return
    const { publicUrl } = await uploadToBucket(file, `suggestions/${selected.id}/cover`)
    // salva no banco
    updateSuggestionMedia.mutate({ id: selected.id, cover_photo: publicUrl })
    // atualiza UI local
    setSelected((prev) => ({ ...prev, cover_photo: publicUrl }))
  }

  const handleUploadGallery = async (file) => {
    if (!selected?.id) return
    const { publicUrl } = await uploadToBucket(file, `suggestions/${selected.id}/gallery`)
    const current = Array.isArray(selected.photos) ? selected.photos : []
    const next = [...current, publicUrl]
    updateSuggestionMedia.mutate({ id: selected.id, photos: next })
    setSelected((prev) => ({ ...prev, photos: next }))
  }

  const removeGalleryPhoto = (url) => {
    if (!selected?.id) return
    const current = Array.isArray(selected.photos) ? selected.photos : []
    const next = current.filter((p) => p !== url)
    updateSuggestionMedia.mutate({ id: selected.id, photos: next.length ? next : null })
    setSelected((prev) => ({ ...prev, photos: next }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-slate-900">Moderação</h1>
          <p className="text-xs text-slate-500">{pending.length} pendente(s)</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {isError && (
          <div className="bg-white border rounded-2xl p-4 text-sm text-red-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              <p className="font-semibold">Erro ao carregar sugestões</p>
              <p className="text-red-500/80">{error?.message || 'Erro desconhecido'}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="pending">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="pending" className="flex-1">
              <Clock className="w-4 h-4 mr-1" />
              Pendentes ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              Revisados ({reviewed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">✅</p>
                <p className="font-medium text-slate-600">Nenhuma sugestão pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((s) => (
                  <SuggestionCard key={s.id} suggestion={s} onSelect={() => setSelected(s)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewed">
            <div className="space-y-3">
              {reviewed.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} onSelect={() => setSelected(s)} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="min-w-0">
                <h2 className="font-bold text-lg text-slate-900 truncate">{selected.name}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selected.city}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelected(null)
                  setNotes('')
                }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Badge className={`${statusColors[selected.status] || 'bg-slate-100 text-slate-700'} mb-3`}>
              {statusLabels[selected.status] || selected.status}
            </Badge>

            {/* Preview capa */}
            {selected.cover_photo && (
              <img
                src={selected.cover_photo}
                alt="Capa"
                className="w-full h-44 object-cover rounded-2xl border border-slate-100 mb-4"
              />
            )}

            <div className="space-y-3 text-sm mb-6">
              {selected.category && <InfoLine label="Categoria" value={selected.category} />}
              {selected.description_short && <InfoLine label="Descrição" value={selected.description_short} />}
              {selected.how_to_get_there && <InfoLine label="Como chegar" value={selected.how_to_get_there} />}
              {selected.opening_hours && <InfoLine label="Horários" value={selected.opening_hours} />}
              {selected.price_range && <InfoLine label="Preço" value={selected.price_range} />}
              {selected.contact_phone && <InfoLine label="Telefone" value={selected.contact_phone} />}
              {selected.tags?.length > 0 && <InfoLine label="Tags" value={selected.tags.join(', ')} />}
              {selected.created_by && <InfoLine label="Enviado por" value={selected.created_by} />}
            </div>

            {/* Upload admin (somente quando pendente) */}
            {selected.status === 'pending' && (
              <div className="space-y-3 mb-5">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <ImagePlus className="w-4 h-4" />
                        Fotos (admin)
                      </p>
                      <p className="text-xs text-slate-500">
                        Upload direto no bucket <b>{BUCKET}</b>.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <FilePickButton
                        label="Capa"
                        onFile={handleUploadCover}
                        disabled={approveSuggestion.isPending || updateSuggestionMedia.isPending}
                      />
                      <FilePickButton
                        label="Galeria"
                        onFile={handleUploadGallery}
                        disabled={approveSuggestion.isPending || updateSuggestionMedia.isPending}
                      />
                    </div>
                  </div>

                  {/* Galeria preview */}
                  {Array.isArray(selected.photos) && selected.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {selected.photos.map((url) => (
                        <div key={url} className="relative">
                          <img
                            src={url}
                            alt="Foto"
                            className="w-full h-20 object-cover rounded-xl border border-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryPhoto(url)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow"
                            aria-label="Remover foto"
                          >
                            <X className="w-3 h-3 text-slate-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ações só em pendente */}
            {selected.status === 'pending' && (
              <>
                <Textarea
                  placeholder="Notas do moderador (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mb-4"
                />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => updateSuggestionStatus.mutate({ id: selected.id, status: 'rejected' })}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={updateSuggestionStatus.isPending || approveSuggestion.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      updateSuggestionStatus.mutate({ id: selected.id, status: 'needs_revision' })
                    }
                    className="flex-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                    disabled={updateSuggestionStatus.isPending || approveSuggestion.isPending}
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Revisão
                  </Button>
                </div>

                <Button
                  onClick={() => approveSuggestion.mutate(selected)}
                  className="w-full mt-3 bg-emerald-700 hover:bg-emerald-800"
                  disabled={updateSuggestionStatus.isPending || approveSuggestion.isPending}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Aprovar e publicar
                </Button>
              </>
            )}

            {/* Se revisado, mostrar notas */}
            {selected.status !== 'pending' && selected.reviewer_notes && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-3">
                <p className="text-sm font-semibold text-slate-800 mb-1">Notas do moderador</p>
                <p className="text-sm text-slate-600">{selected.reviewer_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SuggestionCard({ suggestion, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{suggestion.name}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {suggestion.city}
          </p>
        </div>

        <Badge className={`text-xs ${statusColors[suggestion.status] || 'bg-slate-100 text-slate-700'}`}>
          {statusLabels[suggestion.status] || suggestion.status}
        </Badge>
      </div>

      {suggestion.description_short && (
        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{suggestion.description_short}</p>
      )}

      {suggestion.created_by && (
        <p className="text-xs text-slate-400 mt-2">por {suggestion.created_by}</p>
      )}
    </button>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-50">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-slate-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

/**
 * Botão que abre o seletor de arquivo e dispara callback.
 * @param {{ label: string, onFile: (file: File) => void, disabled?: boolean }} props
 */
function FilePickButton({ label, onFile, disabled = false }) {
  const onChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    onFile(file)
    e.target.value = ''
  }

  return (
    <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer
      ${disabled ? 'opacity-50 cursor-not-allowed bg-white' : 'bg-white hover:bg-slate-50'}
    `}>
      <ImagePlus className="w-4 h-4" />
      {label}
      <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={disabled} />
    </label>
  )
}

/**
 * Upload helper: envia arquivo ao Storage e retorna URL pública.
 * Requer bucket público para usar getPublicUrl.
 * @param {File} file
 * @param {string} folderPrefix
 */
async function uploadToBucket(file, folderPrefix) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const fileName = `${crypto.randomUUID()}.${ext}`
  const path = `${folderPrefix}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = data?.publicUrl
  if (!publicUrl) throw new Error('Falha ao obter URL pública.')

  return { publicUrl, path }
}
