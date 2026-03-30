import React from 'react'
import { Link } from 'react-router-dom'
import { Star, MapPin, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

const categoryLabels = {
  balneario: 'Balneário',
  hotel_pousada: 'Hospedagem',
  restaurante: 'Restaurante',
  atrativo_natural: 'Natureza',
  atrativo_cultural: 'Cultural',
  evento: 'Evento',
  artesanato: 'Artesanato',
  servico: 'Serviço',
}

const categoryColors = {
  balneario: 'bg-sky-100 text-sky-800',
  hotel_pousada: 'bg-amber-100 text-amber-800',
  restaurante: 'bg-orange-100 text-orange-800',
  atrativo_natural: 'bg-emerald-100 text-emerald-800',
  atrativo_cultural: 'bg-violet-100 text-violet-800',
  evento: 'bg-rose-100 text-rose-800',
  artesanato: 'bg-pink-100 text-pink-800',
  servico: 'bg-slate-100 text-slate-800',
}

export default function PlaceCard({ place, isFavorited, favoriteId, compact = false }) {
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()

  const toggleFav = useMutation({
    mutationFn: async () => {
      // Se ainda não tiver login, você pode:
      // - bloquear o favoritar, ou
      // - redirecionar pra tela de perfil/login
      if (!isAuthenticated || !user?.id) {
        throw new Error('Você precisa estar logado para favoritar.')
      }

      if (isFavorited) {
        // Remover favorito
        // Se você já tem o favoriteId, remove por ID.
        // Se não tiver (fallback), remove por (user_id, place_id)
        if (favoriteId) {
          const { error } = await supabase.from('favorites').delete().eq('id', favoriteId)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('place_id', place.id)
          if (error) throw error
        }
      } else {
        // Adicionar favorito
        // (Recomendado) salvar apenas user_id + place_id.
        // Campos redundantes (nome, cidade etc.) podem existir, mas não são necessários.
        const payload = {
          user_id: user.id,
          place_id: place.id,
        }

        const { error } = await supabase.from('favorites').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: async () => {
      // Atualiza favoritos no cache para refletir coração cheio/vazio
      await queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const imageFallbackCompact =
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
  const imageFallback =
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'

  if (compact) {
    return (
      <Link
        to={`/PlaceDetail?id=${place.id}`}
        className="flex gap-3 p-3 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-shadow"
      >
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={place.cover_photo || imageFallbackCompact}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm truncate">{place.name}</h4>

          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {place.city}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              className={`text-[10px] px-1.5 py-0 ${
                categoryColors[place.category] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {categoryLabels[place.category] || place.category}
            </Badge>

            {place.average_rating > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {Number(place.average_rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/PlaceDetail?id=${place.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
        <div className="relative h-48 overflow-hidden">
          <img
            src={place.cover_photo || imageFallback}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleFav.mutate()
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
              }`}
            />
          </button>

          <Badge
            className={`absolute top-3 left-3 ${
              categoryColors[place.category] || 'bg-slate-100 text-slate-700'
            } border-0 text-xs`}
          >
            {categoryLabels[place.category] || place.category}
          </Badge>

          {place.featured && (
            <Badge className="absolute bottom-3 left-3 bg-amber-500 text-white border-0 text-xs">
              ⭐ Destaque
            </Badge>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-slate-900 text-lg leading-tight">{place.name}</h3>

          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {place.city}
            {place.neighborhood ? `, ${place.neighborhood}` : ''}
          </p>

          {place.description_short && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{place.description_short}</p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              {place.average_rating > 0 && (
                <>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-sm text-slate-800">
                    {Number(place.average_rating).toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400">({place.review_count || 0})</span>
                </>
              )}
            </div>

            {place.price_range && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                {place.price_range === 'gratuito'
                  ? 'Gratuito'
                  : place.price_range === 'barato'
                    ? '$'
                    : place.price_range === 'moderado'
                      ? '$$'
                      : '$$$'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export { categoryLabels, categoryColors }