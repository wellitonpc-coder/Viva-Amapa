import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Heart, MapPin, ChevronRight } from 'lucide-react'
import { categoryLabels, categoryColors } from '../components/places/PlaceCard'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

export default function Favorites() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth()

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id || 'anon'],
    enabled: !!user?.id && isAuthenticated && !isLoadingAuth,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          place_id,
          created_at,
          place:places (
            id,
            name,
            city,
            category,
            neighborhood,
            cover_photo
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })

  if (!isLoadingAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen px-5 pt-8 pb-4">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Salvos</h1>

        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-rose-300" />
          </div>
          <p className="font-semibold text-slate-700">Entre para ver seus salvos</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Faça login para salvar e acessar seus locais favoritos.
          </p>
          <Link to="/Profile" className="text-sm text-emerald-700 font-medium">
            Ir para login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pt-8 pb-4">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Salvos</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-rose-300" />
          </div>
          <p className="font-semibold text-slate-700">Nenhum local salvo</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Explore e salve seus locais favoritos
          </p>
          <Link to="/Explore" className="text-sm text-emerald-700 font-medium">
            Explorar locais →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((fav, i) => {
            // ✅ AQUI: normaliza para objeto (se vier array)
            const place = Array.isArray(fav.place) ? fav.place[0] : fav.place
            if (!place) return null

            return (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/PlaceDetail?id=${place.id}`}
                  className="flex gap-3 p-3 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={
                        place.cover_photo ||
                        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
                      }
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm truncate">
                      {place.name}
                    </h4>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {place.city}
                      {place.neighborhood ? `, ${place.neighborhood}` : ''}
                    </p>

                    {place.category && (
                      <Badge
                        className={`text-[10px] px-1.5 py-0 mt-1.5 ${
                          categoryColors[place.category] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {categoryLabels[place.category] || place.category}
                      </Badge>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}