import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Star,
  Navigation,
  Shield,
  CloudSun,
  Accessibility,
  AlertTriangle,
  ChevronRight,
  Send,
} from 'lucide-react'
import MediaHorizontalScroll from '@/components/MediaHorizontalScroll'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { categoryLabels, categoryColors } from '../components/places/PlaceCard'
import StarRating from '../components/places/StarRating'
import { toast } from 'sonner'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

export default function PlaceDetail() {
  const urlParams = new URLSearchParams(window.location.search)
  const placeId = urlParams.get('id')
  const queryClient = useQueryClient()

  const { user, profile, isAuthenticated, isLoadingAuth } = useAuth()

  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')

  // --- 1) Buscar place ---
  const { data: place, isLoading: isLoadingPlace } = useQuery({
    queryKey: ['place', placeId],
    enabled: !!placeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('id', placeId)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })

  // --- 2) Reviews publicadas ---
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', placeId],
    enabled: !!placeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('place_id', placeId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data ?? []
    },
  })
  // --- 2.1) Mídias do lugar (fotos e vídeos) ---
    const { data: medias = [] } = useQuery({
      queryKey: ['place-medias', placeId],
      enabled: !!placeId,
      queryFn: async () => {
    const { data, error } = await supabase
      .from('place_media')
      .select('id, type, url')
      .eq('place_id', placeId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
      },  
  })

  // --- 3) Próximos (mesma cidade) ---
  const { data: nearby = [] } = useQuery({
    queryKey: ['nearby', place?.city],
    enabled: !!place?.city,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('status', 'published')
        .eq('city', place.city)
        .order('average_rating', { ascending: false })
        .limit(6)

      if (error) throw error
      const list = (data ?? []).filter((p) => p.id !== placeId).slice(0, 4)
      return list
    },
  })

  // --- 4) Favoritos do usuário ---
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id || 'anon'],
    enabled: !!user?.id && isAuthenticated && !isLoadingAuth,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('id, place_id')
        .eq('user_id', user.id)

      if (error) throw error
      return data ?? []
    },
  })

  const favoriteId = useMemo(() => {
    const fav = favorites.find((f) => f.place_id === placeId)
    return fav?.id || null
  }, [favorites, placeId])

  const isFavorited = !!favoriteId

  // --- 5) Toggle favorito ---
  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user?.id) {
        toast.error('Faça login para salvar favoritos.')
        throw new Error('Not authenticated')
      }

      if (isFavorited && favoriteId) {
        const { error } = await supabase.from('favorites').delete().eq('id', favoriteId).eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('favorites').insert({
          user_id: user.id,
          place_id: placeId,
        })
        if (error) throw error
      }
      return true
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favorites', user?.id || 'anon'] })
    },
    onError: (e) => {
      if (e?.message !== 'Not authenticated') toast.error(e?.message || 'Erro ao atualizar favorito.')
    },
  })

  // --- 6) Enviar review ---
  const submitReview = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user?.id) {
        toast.error('Faça login para avaliar.')
        throw new Error('Not authenticated')
      }
      if (!placeId) throw new Error('placeId ausente')
      if (newRating === 0) throw new Error('Selecione uma nota')

      const authorName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.email ||
        'Visitante'

      // 1) Insere review (publicada no MVP)
      const { error: reviewErr } = await supabase.from('reviews').insert({
        place_id: placeId,
        user_id: user.id,
        rating: newRating,
        comment: newComment?.trim() || null,
        author_name: authorName,
        status: 'published',
      })

      if (reviewErr) throw reviewErr

      // 2) Atualiza agregados no place (MVP)
      // Evita consulta extra; usa valores atuais do place se existir
      if (place) {
        const currentCount = Number(place.review_count || 0)
        const currentAvg = Number(place.average_rating || 0)
        const newCount = currentCount + 1
        const newAvg = (currentAvg * currentCount + newRating) / newCount

        await supabase
          .from('places')
          .update({
            review_count: newCount,
            average_rating: Number(newAvg.toFixed(2)),
          })
          .eq('id', placeId)
      }

      return true
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reviews', placeId] })
      await queryClient.invalidateQueries({ queryKey: ['place', placeId] })
      setNewRating(0)
      setNewComment('')
      toast.success('Avaliação enviada!')
    },
    onError: (e) => {
      if (e?.message !== 'Not authenticated') toast.error(e?.message || 'Erro ao enviar avaliação.')
    },
  })

  if (isLoadingPlace || !place) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  const tagLabels = {
    familia: '👨‍👩‍👧 Família',
    pet_friendly: '🐾 Pet',
    acessivel: '♿ Acessível',
    ecoturismo: '🌿 Eco',
    cultural: '🎭 Cultural',
    aventura: '🧗 Aventura',
    gastronomia: '🍽️ Gastronomia',
    rio: '🏊 Rio',
    trilha: '🥾 Trilha',
    praia_fluvial: '🏖️ Praia',
  }

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Hero Image */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={place.cover_photo || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => toggleFav.mutate()}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center"
              aria-label="Favoritar"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                toast.success('Link copiado!')
              }}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center"
              aria-label="Compartilhar"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-5 right-5">
          <Badge className={`${categoryColors[place.category] || 'bg-slate-100 text-slate-700'} border-0 mb-2`}>
            {categoryLabels[place.category] || place.category}
          </Badge>
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">{place.name}</h1>
          <p className="text-white/90 text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {place.city}
            {place.neighborhood ? `, ${place.neighborhood}` : ''}
          </p>
        </div>
      </div>

      <div className="px-5 space-y-6 mt-5">
        {/* Quick Info */}
        <div className="flex items-center gap-4">
          {Number(place.average_rating) > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-lg">{Number(place.average_rating).toFixed(1)}</span>
              <span className="text-sm text-slate-400">({place.review_count || 0})</span>
            </div>
          )}

          {place.price_range && (
            <Badge variant="outline" className="text-emerald-700 border-emerald-200">
              {place.price_range === 'gratuito'
                ? 'Gratuito'
                : place.price_range === 'barato'
                  ? '$ Barato'
                  : place.price_range === 'moderado'
                    ? '$$ Moderado'
                    : '$$$ Caro'}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {Array.isArray(place.tags) && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {place.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                {tagLabels[tag] || tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {place.description_full && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Sobre</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{place.description_full}</p>
          </div>
        )}
        {/* Galeria de fotos e vídeos */}
          <MediaHorizontalScroll medias={medias} />

        {/* Info Cards */}
        <div className="grid gap-3">
          <InfoRow icon={Clock} label="Horários" value={place.opening_hours} />
          <InfoRow icon={Navigation} label="Como chegar" value={place.how_to_get_there} />
          {place.price_details && <InfoRow icon={Star} label="Preços" value={place.price_details} />}
          {place.infrastructure && <InfoRow icon={Shield} label="Infraestrutura" value={place.infrastructure} />}
          {place.safety_info && (
            <InfoRow icon={AlertTriangle} label="Segurança" value={place.safety_info} color="text-amber-600" />
          )}
          {place.seasonality && <InfoRow icon={CloudSun} label="Melhor época" value={place.seasonality} />}
          {place.accessibility_info && <InfoRow icon={Accessibility} label="Acessibilidade" value={place.accessibility_info} />}
          {place.rules && <InfoRow icon={Shield} label="Regras" value={place.rules} />}
          {place.local_tips && (
            <InfoRow icon={MessageCircle} label="Dicas locais" value={place.local_tips} color="text-emerald-600" />
          )}
        </div>

        {/* Contact */}
        {(place.contact_phone || place.contact_whatsapp) && (
          <div className="flex gap-3">
            {place.contact_phone && (
              <a href={`tel:${place.contact_phone}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="w-4 h-4" />
                  Ligar
                </Button>
              </a>
            )}

            {place.contact_whatsapp && (
              <a
                href={`https://wa.me/${place.contact_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Reviews */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-4">Avaliações</h3>

          <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">Deixe sua avaliação</p>

            {!isAuthenticated && !isLoadingAuth ? (
              <div className="text-sm text-slate-600">
                Faça login para avaliar.{' '}
                <Link to="/Profile" className="text-emerald-700 font-medium">
                  Ir para login →
                </Link>
              </div>
            ) : (
              <>
                <StarRating rating={newRating} onRate={setNewRating} size="lg" />
                <Textarea
                  placeholder="Conte sua experiência..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-white min-h-[80px]"
                />
                <Button
                  onClick={() => submitReview.mutate()}
                  disabled={newRating === 0 || submitReview.isPending}
                  className="bg-emerald-700 hover:bg-emerald-800 gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar avaliação
                </Button>
              </>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-slate-800">{review.author_name}</span>
                    <StarRating rating={review.rating} readonly size="sm" />
                  </div>
                  {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Nenhuma avaliação ainda. Seja o primeiro!</p>
          )}
        </div>

        {/* Nearby */}
        {nearby.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Próximos em {place.city}</h3>
            <div className="space-y-2">
              {nearby.map((p) => (
                <Link
                  key={p.id}
                  to={`/PlaceDetail?id=${p.id}`}
                  className="flex gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={p.cover_photo || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200'}
                    alt={p.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{categoryLabels[p.category] || p.category}</p>

                    {Number(p.average_rating) > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-slate-600">{Number(p.average_rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, color = 'text-emerald-700' }) {
  if (!value) return null
  return (
    <div className="flex gap-3 p-3 bg-slate-50 rounded-xl">
      <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
      <div>
        <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
      </div>
    </div>
  )
}