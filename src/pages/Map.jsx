import React, { useState, useEffect, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import {
  Star,
  MapPin,
  LocateFixed,
  Clock,
} from 'lucide-react'
import CategoryChips from '@/components/places/CategoryChips'
import { Badge } from '@/components/ui/badge'
import { categoryLabels, categoryColors } from '@/components/places/PlaceCard'
import { supabase } from '@/api/supabaseClient'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* =========================
   FIX ÍCONES LEAFLET (Vite)
========================= */
delete L.Icon.Default.prototype['_getIconUrl']
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

/* =========================
   ÍCONE DO USUÁRIO
========================= */
const userLocationIcon = new L.DivIcon({
  html: `
    <div style="
      width:18px;height:18px;border-radius:50%;
      background:#3b82f6;border:3px solid white;
      box-shadow:0 0 0 3px rgba(59,130,246,0.35);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

/* =========================
   HAVERSINE DISTANCE (KM)
========================= */
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

/* =========================
   ABERTO AGORA
========================= */
function isOpenNow(opening) {
  if (!opening || !opening.includes('-')) return true
  const [open, close] = opening.split('-')

  const now = new Date()
  const current = now.getHours() * 60 + now.getMinutes()

  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)

  return current >= oh * 60 + om && current <= ch * 60 + cm
}

/* =========================
   INVALIDATE SIZE (CRÍTICO)
========================= */
function InvalidateSize() {
  const map = useMap()

  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize()
    }, 300)
    return () => clearTimeout(t)
  }, [map])

  return null
}

/* =========================
   FLY TO USER
========================= */
function FlyToUser({ userLocation, trigger }) {
  const map = useMap()

  useEffect(() => {
    if (userLocation && trigger) {
      map.flyTo(userLocation, 13, { duration: 1.2 })
    }
  }, [userLocation, trigger, map])

  return null
}

/* =========================
   MAP PAGE
========================= */
export default function MapPage() {
  const navigate = useNavigate()

  const [places, setPlaces] = useState([])
  const [category, setCategory] = useState('all')
  const [radiusKm, setRadiusKm] = useState(
    Number(localStorage.getItem('map-radius-km')) || 8
  )
  const [onlyOpen, setOnlyOpen] = useState(false)

  const [userLocation, setUserLocation] = useState(null)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [flyTrigger, setFlyTrigger] = useState(0)

  /* Persist radius */
  useEffect(() => {
    localStorage.setItem('map-radius-km', radiusKm.toString())
  }, [radiusKm])

  /* Geolocalização (estável para o botão) */
  useEffect(() => {
    if (!navigator.geolocation) {
      setHasLocationPermission(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude])
        setHasLocationPermission(true)
      },
      () => {
        // falhou ou foi negado, mas já sabemos que tentou
        setHasLocationPermission(true)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  /* Buscar lugares */
  useEffect(() => {
    async function loadPlaces() {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('status', 'published')

      if (!error && data) setPlaces(data)
    }

    loadPlaces()
  }, [])

  /* Filtros + ranking */
  const filteredPlaces = useMemo(() => {
    return places
      .filter(p => p.latitude && p.longitude)
      .filter(p => category === 'all' || p.category === category)
      .filter(p => !onlyOpen || isOpenNow(p.opening_hours))
      .filter(
        p =>
          !userLocation ||
          calculateDistance(
            userLocation[0],
            userLocation[1],
            p.latitude,
            p.longitude
          ) <= radiusKm
      )
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
  }, [places, category, onlyOpen, radiusKm, userLocation])

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="bg-white px-5 pt-6 pb-4 border-b">
        <h1 className="text-xl font-bold mb-3">Mapa</h1>

        <CategoryChips selected={category} onSelect={setCategory} />

        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={() => setOnlyOpen(!onlyOpen)}
            />
            <Clock className="w-4 h-4" />
            Aberto agora
          </label>

          <span className="text-xs text-slate-500">
            {filteredPlaces.length} locais encontrados
          </span>
        </div>

        <p className="text-xs text-slate-500 mt-2">
          Mostrar locais em até <strong>{radiusKm} km</strong>
        </p>

        <input
          type="range"
          min={1}
          max={30}
          value={radiusKm}
          onChange={e => setRadiusKm(Number(e.target.value))}
          className="w-full accent-emerald-600"
        />
      </div>

      {/* MAPA */}
      <div className="flex-1 relative min-h-0">
        <MapContainer
          center={[-0.0356, -51.0705]} // Macapá
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <InvalidateSize />
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FlyToUser userLocation={userLocation} trigger={flyTrigger} />

          {/* Usuário */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon} />
          )}

          {/* Lugares */}
          {filteredPlaces.map(place => (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              eventHandlers={{
                click: () =>
                  navigate(`/PlaceDetail?id=${place.id}`),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <h3 className="font-bold text-sm">{place.name}</h3>

                  <p className="text-xs flex gap-1 text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {place.city}
                  </p>

                  <div className="flex gap-2 mt-1">
                    <Badge
                      className={`text-[10px] ${
                        categoryColors[place.category] ||
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {categoryLabels[place.category]}
                    </Badge>

                    {place.average_rating > 0 && (
                      <span className="flex gap-0.5 items-center text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {place.average_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* BOTÃO CENTRALIZAR (ESTÁVEL) */}
        {hasLocationPermission && (
          <button
            onClick={() => {
              if (userLocation) setFlyTrigger(n => n + 1)
            }}
            className="absolute bottom-24 right-4 z-20
                       bg-white shadow-lg rounded-full p-3"
          >
            <LocateFixed className="w-5 h-5 text-emerald-600" />
          </button>
        )}
      </div>
    </div>
  )
}