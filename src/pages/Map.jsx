import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { Star, MapPin, Navigation } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { categoryLabels, categoryColors } from '../components/places/PlaceCard'
import CategoryChips from '../components/places/CategoryChips'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { supabase } from '@/api/supabaseClient'

// ✅ Corrige ícone padrão do Leaflet (quando usado com bundlers)
// Fix default marker icon (Leaflet + bundlers)
// Tipos TS não expõem _getIconUrl, mas existe em runtime.
delete /** @type {any} */ (L.Icon.Default).prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
// ✅ Ícone custom para localização do usuário
const userLocationIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px; border-radius: 50%;
    background: #3b82f6; border: 3px solid white;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

// Haversine distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Voa para a localização do usuário quando disponível
function FlyToUser({ userLocation }) {
  const map = useMap()
  useEffect(() => {
    if (userLocation) {
      map.flyTo(userLocation, 12, { duration: 1.5 })
    }
  }, [userLocation, map])
  return null
}

const NEARBY_RADIUS_KM = 20

export default function MapPage() {
  const [category, setCategory] = useState('all')
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(false)

  // ✅ Buscar lugares publicados no Supabase
  const { data: places = [], isLoading, isError, error } = useQuery({
    queryKey: ['places', 'map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('status', 'published')
        .order('average_rating', { ascending: false })
        .limit(100)

      if (error) throw error
      return data ?? []
    },
  })

  // ✅ Buscar geolocalização do usuário
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation([coords.latitude, coords.longitude]),
      () => setLocationError(true),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // ✅ Filtrar por categoria
  const filteredByCategory = useMemo(() => {
    return category === 'all' ? places : places.filter((p) => p.category === category)
  }, [places, category])

  // ✅ Só locais com coordenadas, e se tiver userLocation, filtra por raio
  const withCoords = useMemo(() => {
    return filteredByCategory.filter((p) => {
      if (p.latitude == null || p.longitude == null) return false

      if (!userLocation) return true

      return (
        calculateDistance(userLocation[0], userLocation[1], p.latitude, p.longitude) <=
        NEARBY_RADIUS_KM
      )
    })
  }, [filteredByCategory, userLocation])

  return (
    <div className="h-screen flex flex-col">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b px-5 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-900">Mapa</h1>

          {userLocation && (
            <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
              <Navigation className="w-3.5 h-3.5" />
              Locais próximos ({NEARBY_RADIUS_KM}km)
            </span>
          )}

          {!userLocation && locationError && (
            <span className="text-xs text-slate-400">Localização não disponível</span>
          )}
        </div>

        <CategoryChips selected={category} onSelect={setCategory} />
      </div>

      <div className="flex-1 relative">
        {isError && (
          <div className="absolute z-[999] top-4 left-4 right-4 bg-white border rounded-xl p-3 text-sm text-red-600 shadow">
            Erro ao carregar locais: {error?.message || 'Erro desconhecido'}
          </div>
        )}

        <MapContainer
          center={[0.0356, -51.0656]} // base Macapá
          zoom={9}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FlyToUser userLocation={userLocation} />

          {/* Marcador do usuário */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>
                <span className="font-semibold text-blue-600">Você está aqui</span>
              </Popup>
            </Marker>
          )}

          {/* Marcadores dos locais */}
          {!isLoading &&
            withCoords.map((place) => (
              <Marker key={place.id} position={[place.latitude, place.longitude]}>
                <Popup>
                  <div className="min-w-[200px]">
                    <Link to={`/PlaceDetail?id=${place.id}`} className="block">
                      {place.cover_photo && (
                        <img
                          src={place.cover_photo}
                          alt={place.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      )}

                      <h3 className="font-bold text-sm">{place.name}</h3>

                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {place.city}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={`text-[10px] px-1.5 py-0 ${
                            categoryColors[place.category] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {categoryLabels[place.category] || place.category}
                        </Badge>

                        {place.average_rating > 0 && (
                          <span className="flex items-center gap-0.5 text-xs">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {Number(place.average_rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  )
}