import React, { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronRight, Compass, Plus } from 'lucide-react'
import PlaceCard from '../components/places/PlaceCard'
import { motion } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

const quickLinks = [
  { label: 'Balneários', emoji: '🏊', category: 'balneario', color: 'from-sky-400 to-sky-600' },
  { label: 'Hospedagem', emoji: '🏨', category: 'hotel_pousada', color: 'from-amber-400 to-amber-600' },
  { label: 'Natureza', emoji: '🌿', category: 'atrativo_natural', color: 'from-emerald-400 to-emerald-600' },
  { label: 'Cultural', emoji: '🏛️', category: 'atrativo_cultural', color: 'from-violet-400 to-violet-600' },
]

/**
 * Ajuste conforme seu Storage:
 * - BUCKET: nome do bucket (recomendado público para banner)
 * - HERO_PATH: caminho do arquivo dentro do bucket
 */
const BUCKET = 'place-media'
const HERO_PATH = 'front/MeioDoMundo.webp'

export default function Home() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth()

 // ---------- HERO (Supabase Storage) ----------
const [heroUrl, setHeroUrl] = useState(null)
const [heroError, setHeroError] = useState(null)

useEffect(() => {
  try {


    const { data } = supabase.storage.from(BUCKET).getPublicUrl(HERO_PATH)
    setHeroUrl(data?.publicUrl || null)
    setHeroError(null)
  } catch (err) {
    // getPublicUrl não retorna error, mas o try/catch captura problemas de runtime
    setHeroUrl(null)
    setHeroError(err?.message || 'Falha ao obter URL pública.')
  }
}, [])

  const heroStyle = useMemo(() => {
    if (!heroUrl) return undefined
    return {
      backgroundImage: `url('${heroUrl}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }, [heroUrl])

  // ---------- Destaques ----------
  const { data: featured = [] } = useQuery({
    queryKey: ['places', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('status', 'published')
        .eq('featured', true)
        .order('average_rating', { ascending: false })
        .limit(6)

      if (error) throw error
      return data ?? []
    },
  })

  // ---------- Recentes ----------
  const { data: recent = [] } = useQuery({
    queryKey: ['places', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      return data ?? []
    },
  })

  // ---------- Favoritos ----------
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

  const favMap = useMemo(() => {
    const map = {}
    favorites.forEach((f) => {
      map[f.place_id] = f.id
    })
    return map
  }, [favorites])

  return (
    <div className="min-h-screen">
      {/* HERO (com imagem do Supabase Storage + fallback em gradiente) */}
      <div
        className={[
          'relative text-white px-5 pt-12 pb-8 overflow-hidden',
          !heroUrl ? 'bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600' : '',
        ].join(' ')}
        style={heroStyle}
      >
        {/* Overlay para contraste do texto */}
        <div className="absolute inset-0 bg-emerald-950/40" />

        {/* Bolhas decorativas (opcionais) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full translate-y-1/2 -translate-x-1/4" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-emerald-300" />
            <span className="text-emerald-200 text-sm font-medium">Descubra o Amapá</span>
            {heroError && (
              <span className="text-[11px] bg-black/30 px-2 py-0.5 rounded-md ml-2">
                banner offline
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold leading-tight mb-2">
            Explore o melhor<br />do Amapá
          </h1>

          <p className="text-emerald-100 text-sm mb-6 max-w-xs">
            Balneários, natureza, cultura e muito mais no coração da Amazônia
          </p>

          <Link
            to="/Explore"
            className="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-white/20 hover:bg-white/25 transition-colors"
          >
            <Search className="w-5 h-5 text-emerald-200" />
            <span className="text-emerald-100 text-sm">Buscar locais, cidades...</span>
          </Link>
        </motion.div>
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-8 pb-6">
        {/* Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-3"
        >
          {quickLinks.map(({ label, emoji, category, color }) => (
            <Link
              key={category}
              to={`/Explore?category=${category}`}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-sm`}
              >
                {emoji}
              </div>
              <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </motion.div>

        {/* Featured */}
        {featured.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Destaques</h2>
              <Link
                to="/Explore"
                className="text-sm text-emerald-700 font-medium flex items-center gap-0.5"
              >
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 snap-x">
              {featured.map((place) => (
                <div key={place.id} className="min-w-[280px] snap-start">
                  <PlaceCard
                    place={place}
                    isFavorited={!!favMap[place.id]}
                    favoriteId={favMap[place.id]}
                  />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Adicionados recentemente</h2>
            </div>

            <div className="space-y-3">
              {recent.slice(0, 4).map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  compact
                  isFavorited={!!favMap[place.id]}
                  favoriteId={favMap[place.id]}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* CTA */}
        <Link
          to="/SuggestPlace"
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Conhece um lugar incrível?</h3>
            <p className="text-xs text-slate-500">Sugira um novo local e ajude outros turistas</p>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-500 ml-auto" />
        </Link>
      </div>
    </div>
  )
}