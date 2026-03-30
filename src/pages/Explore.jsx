import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import PlaceCard from '../components/places/PlaceCard'
import CategoryChips from '../components/places/CategoryChips'
import FilterSheet from '../components/places/FilterSheet'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

export default function Explore() {
  const { user, isAuthenticated } = useAuth()

  const urlParams = new URLSearchParams(window.location.search)
  const initialCategory = urlParams.get('category') || 'all'

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [filters, setFilters] = useState({
    cities: [],
    price_ranges: [],
    tags: [],
    access_types: [],
  })

  // 1) Buscar locais publicados
  const { data: allPlaces = [], isLoading } = useQuery({
    queryKey: ['places', 'published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('average_rating', { ascending: false })
        .limit(100)

      if (error) throw error
      return data ?? []
    },
  })

  // 2) Buscar favoritos do usuário logado
  // Se não estiver logado, retorna array vazio e não quebra o PlaceCard.
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id || 'anon'],
    enabled: isAuthenticated && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('id, place_id')
        .eq('user_id', user.id)

      if (error) throw error
      return data ?? []
    },
  })

  // 3) Mapa de favoritos: place_id -> favoriteId
  const favMap = useMemo(() => {
    const map = {}
    favorites.forEach((f) => {
      map[f.place_id] = f.id
    })
    return map
  }, [favorites])

  // 4) Filtragem local (igual você já fazia)
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()

    return allPlaces.filter((place) => {
      if (category !== 'all' && place.category !== category) return false

      if (s) {
        const name = (place.name || '').toLowerCase()
        const city = (place.city || '').toLowerCase()
        const desc = (place.description_short || '').toLowerCase()
        if (!name.includes(s) && !city.includes(s) && !desc.includes(s)) return false
      }

      if (filters.cities.length > 0 && !filters.cities.includes(place.city)) return false
      if (filters.price_ranges.length > 0 && !filters.price_ranges.includes(place.price_range))
        return false

      if (filters.tags.length > 0) {
        const placeTags = Array.isArray(place.tags) ? place.tags : []
        if (!filters.tags.some((t) => placeTags.includes(t))) return false
      }

      if (filters.access_types.length > 0 && !filters.access_types.includes(place.access_type))
        return false

      return true
    })
  }, [allPlaces, category, search, filters])

  return (
    <div className="min-h-screen pb-4">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-100 px-5 pt-6 pb-4 space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Explorar</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <FilterSheet filters={filters} onApply={setFilters} />
          <CategoryChips selected={category} onSelect={setCategory} />
        </div>
      </div>

      <div className="px-5 pt-4">
        <p className="text-sm text-slate-500 mb-4">
          {filtered.length} {filtered.length === 1 ? 'local encontrado' : 'locais encontrados'}
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-semibold text-slate-700">Nenhum local encontrado</p>
            <p className="text-sm text-slate-500 mt-1">Tente outros filtros ou termos de busca</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {filtered.map((place, i) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PlaceCard
                    place={place}
                    isFavorited={!!favMap[place.id]}
                    favoriteId={favMap[place.id]}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}