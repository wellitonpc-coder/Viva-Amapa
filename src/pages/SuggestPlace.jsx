import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, MapPin, Clock, Info, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { Link } from 'react-router-dom'

const STEPS = ['Básico', 'Localização', 'Detalhes', 'Revisão']

const CATEGORIES = [
  { key: 'balneario', label: '🏊 Balneário' },
  { key: 'hotel_pousada', label: '🏨 Hotel/Pousada' },
  { key: 'restaurante', label: '🍽️ Restaurante' },
  { key: 'atrativo_natural', label: '🌿 Atrativo Natural' },
  { key: 'atrativo_cultural', label: '🏛️ Atrativo Cultural' },
  { key: 'evento', label: '📅 Evento' },
  { key: 'artesanato', label: '🎨 Artesanato' },
]

const CITIES = [
  'Macapá',
  'Santana',
  'Laranjal do Jari',
  'Oiapoque',
  'Mazagão',
  'Porto Grande',
  'Tartarugalzinho',
  'Serra do Navio',
  'Pedra Branca do Amapari',
  'Ferreira Gomes',
  'Calçoene',
  'Pracuúba',
]

const TAGS = [
  { key: 'familia', label: '👨‍👩‍👧 Família' },
  { key: 'pet_friendly', label: '🐾 Pet Friendly' },
  { key: 'acessivel', label: '♿ Acessível' },
  { key: 'ecoturismo', label: '🌿 Ecoturismo' },
  { key: 'cultural', label: '🎭 Cultural' },
  { key: 'aventura', label: '🧗 Aventura' },
  { key: 'gastronomia', label: '🍽️ Gastronomia' },
  { key: 'rio', label: '🏊 Rio' },
  { key: 'trilha', label: '🥾 Trilha' },
]

const ACCESS_TYPES = [
  { key: 'estrada_pavimentada', label: 'Estrada pavimentada' },
  { key: 'estrada_terra', label: 'Estrada de terra' },
  { key: 'embarcacao', label: 'Embarcação' },
  { key: 'trilha', label: 'Trilha' },
  { key: 'misto', label: 'Misto' },
]

const PRICE_RANGES = [
  { key: 'gratuito', label: 'Gratuito' },
  { key: 'barato', label: 'Barato ($)' },
  { key: 'moderado', label: 'Moderado ($$)' },
  { key: 'caro', label: 'Caro ($$$)' },
]

export default function SuggestPlace() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    category: '',
    city: '',
    neighborhood: '',

    description_short: '',
    description_full: '',

    how_to_get_there: '',
    contact_phone: '',
    contact_whatsapp: '',

    opening_hours: '',
    price_range: '',
    tags: [],
    access_type: '',

    // opcionais (já previstos no schema)
    services: [],

    // geolocalização (muito útil)
    latitude: null,
    longitude: null,
  })

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const toggleTag = (tag) =>
    set(
      'tags',
      form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]
    )

  const canNext = () => {
    if (step === 0) return !!form.name && !!form.category && !!form.city
    return true
  }

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada neste dispositivo.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude)
        set('longitude', pos.coords.longitude)
        toast.success('Localização preenchida!')
      },
      () => toast.error('Não foi possível obter sua localização.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user?.id) {
        throw new Error('Faça login para enviar sugestões.')
      }

      // payload alinhado ao schema PlaceSuggestion
      const payload = {
        name: form.name.trim(),
        category: form.category,
        city: form.city,
        neighborhood: form.neighborhood?.trim() || null,

        description_short: form.description_short?.trim() || null,
        description_full: form.description_full?.trim() || null,

        how_to_get_there: form.how_to_get_there?.trim() || null,

        contact_phone: form.contact_phone?.trim() || null,
        contact_whatsapp: form.contact_whatsapp?.trim() || null,

        opening_hours: form.opening_hours?.trim() || null,
        price_range: form.price_range || null,

        tags: form.tags?.length ? form.tags : null,
        access_type: form.access_type || null,
        services: form.services?.length ? form.services : null,

        latitude: typeof form.latitude === 'number' ? form.latitude : null,
        longitude: typeof form.longitude === 'number' ? form.longitude : null,

        status: 'pending',
        suggestion_type: 'new_place',

        // MUITO IMPORTANTE: vínculo com o usuário Supabase
        created_by: user.id,
      }

      const { error } = await supabase.from('place_suggestions').insert(payload)
      if (error) throw error

      return true
    },
    onSuccess: () => {
      toast.success('Sugestão enviada para moderação!')
      window.history.back()
    },
    onError: (e) => {
      toast.error(e?.message || 'Erro ao enviar sugestão.')
    },
  })

  // Se ainda está carregando auth
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Se não está logado, mostra CTA
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white px-5 pt-8 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900">Sugerir novo local</h1>
            <p className="text-xs text-slate-500">É necessário estar logado</p>
          </div>
        </div>

        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔐</p>
          <p className="font-semibold text-slate-700">Faça login para enviar sugestões</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Suas sugestões ficam vinculadas ao seu perfil e você acompanha o status.
          </p>

          <Link to="/Profile">
            <Button className="bg-emerald-700 hover:bg-emerald-800">Ir para login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 bg-white border-b px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : window.history.back())}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900">Sugerir novo local</h1>
            <p className="text-xs text-slate-500">
              Passo {step + 1} de {STEPS.length}: {STEPS[step]}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= step ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-5 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* STEP 0: Básico */}
            {step === 0 && (
              <>
                <Field label="Nome do local *" icon={MapPin}>
                  <Input
                    placeholder="Ex: Balneário do Curiaú"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </Field>

                <Field label="Categoria *">
                  <Select value={form.category} onValueChange={(v) => set('category', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Cidade *">
                  <Select value={form.city} onValueChange={(v) => set('city', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Bairro / Localidade">
                  <Input
                    placeholder="Ex: Centro, Zona Rural..."
                    value={form.neighborhood}
                    onChange={(e) => set('neighborhood', e.target.value)}
                  />
                </Field>
              </>
            )}

            {/* STEP 1: Localização */}
            {step === 1 && (
              <>
                <Field label="Descrição curta" icon={Info}>
                  <Input
                    placeholder="Uma frase sobre o local (até 200 caracteres)"
                    value={form.description_short}
                    onChange={(e) => set('description_short', e.target.value)}
                    maxLength={200}
                  />
                  <p className="text-xs text-slate-400 mt-1">{form.description_short.length}/200</p>
                </Field>

                <Field label="Como chegar">
                  <Textarea
                    placeholder="Descreva como chegar ao local (estrada, rio, referências)"
                    value={form.how_to_get_there}
                    onChange={(e) => set('how_to_get_there', e.target.value)}
                    className="min-h-[80px]"
                  />
                </Field>

                <Field label="Tipo de acesso">
                  <Select value={form.access_type} onValueChange={(v) => set('access_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Como se chega ao local?" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_TYPES.map((a) => (
                        <SelectItem key={a.key} value={a.key}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Coordenadas (opcional)</p>
                      <p className="text-xs text-slate-500">
                        Ajuda a encontrar no mapa e recomendar “locais próximos”.
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={getMyLocation}>
                      <Navigation className="w-4 h-4" />
                      Usar minha localização
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Input
                      placeholder="Latitude"
                      value={form.latitude ?? ''}
                      onChange={(e) =>
                        set('latitude', e.target.value ? Number(e.target.value) : null)
                      }
                    />
                    <Input
                      placeholder="Longitude"
                      value={form.longitude ?? ''}
                      onChange={(e) =>
                        set('longitude', e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: Detalhes */}
            {step === 2 && (
              <>
                <Field label="Horários" icon={Clock}>
                  <Input
                    placeholder="Ex: Ter a Dom, 9h às 18h"
                    value={form.opening_hours}
                    onChange={(e) => set('opening_hours', e.target.value)}
                  />
                </Field>

                <Field label="Faixa de preço">
                  <Select value={form.price_range} onValueChange={(v) => set('price_range', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_RANGES.map((p) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Contato (telefone)">
                  <Input
                    placeholder="(96) 99999-0000"
                    value={form.contact_phone}
                    onChange={(e) => set('contact_phone', e.target.value)}
                  />
                </Field>

                <Field label="WhatsApp">
                  <Input
                    placeholder="5596999990000"
                    value={form.contact_whatsapp}
                    onChange={(e) => set('contact_whatsapp', e.target.value)}
                  />
                </Field>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Características</p>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleTag(key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          form.tags.includes(key)
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* STEP 3: Revisão */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <h3 className="font-bold text-emerald-800 mb-1">Revisão final</h3>
                  <p className="text-sm text-emerald-700">Confira os dados antes de enviar</p>
                </div>

                <ReviewItem label="Nome" value={form.name} />
                <ReviewItem
                  label="Categoria"
                  value={CATEGORIES.find((c) => c.key === form.category)?.label}
                />
                <ReviewItem label="Cidade" value={form.city} />

                {form.neighborhood && <ReviewItem label="Bairro" value={form.neighborhood} />}
                {form.description_short && <ReviewItem label="Descrição" value={form.description_short} />}
                {form.how_to_get_there && <ReviewItem label="Como chegar" value={form.how_to_get_there} />}
                {form.opening_hours && <ReviewItem label="Horários" value={form.opening_hours} />}
                {form.price_range && (
                  <ReviewItem
                    label="Preço"
                    value={PRICE_RANGES.find((p) => p.key === form.price_range)?.label}
                  />
                )}

                {(form.latitude != null || form.longitude != null) && (
                  <ReviewItem
                    label="Coordenadas"
                    value={`${form.latitude ?? ''} ${form.longitude ?? ''}`.trim()}
                  />
                )}

                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {TAGS.find((tg) => tg.key === t)?.label || t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 bg-white border-t px-5 py-4">
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="w-full bg-emerald-700 hover:bg-emerald-800 gap-2"
          >
            Próximo <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => submit.mutate()}
            disabled={submit.isPending}
            className="w-full bg-amber-600 hover:bg-amber-700 gap-2"
          >
            <Check className="w-4 h-4" />
            Enviar sugestão para aprovação
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * @param {{ label: string, icon?: any, children: any }} props
 */
function Field({ label, icon: Icon = null, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
        {Icon ? <Icon className="w-4 h-4 text-emerald-600" /> : null}
        {label}
      </label>
      {children}
    </div>
  )
}


function ReviewItem({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right max-w-[60%]">{value}</span>
    </div>
  )
}
``