import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, X } from 'lucide-react';

const CITIES = ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão', 'Porto Grande', 'Tartarugalzinho', 'Serra do Navio', 'Pedra Branca do Amapari', 'Ferreira Gomes', 'Calçoene', 'Pracuúba'];
const PRICE_RANGES = [
  { key: 'gratuito', label: 'Gratuito' },
  { key: 'barato', label: 'Barato ($)' },
  { key: 'moderado', label: 'Moderado ($$)' },
  { key: 'caro', label: 'Caro ($$$)' },
];
const TAGS = [
  { key: 'familia', label: '👨‍👩‍👧 Família' },
  { key: 'pet_friendly', label: '🐾 Pet Friendly' },
  { key: 'acessivel', label: '♿ Acessível' },
  { key: 'ecoturismo', label: '🌿 Ecoturismo' },
  { key: 'cultural', label: '🎭 Cultural' },
  { key: 'aventura', label: '🧗 Aventura' },
  { key: 'gastronomia', label: '🍽️ Gastronomia' },
  { key: 'rio', label: '🏊 Rio/Banho' },
  { key: 'trilha', label: '🥾 Trilha' },
];
const ACCESS = [
  { key: 'estrada_pavimentada', label: 'Estrada pavimentada' },
  { key: 'estrada_terra', label: 'Estrada de terra' },
  { key: 'embarcacao', label: 'Embarcação' },
  { key: 'trilha', label: 'Trilha' },
];

export default function FilterSheet({ filters, onApply }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(filters);

  const toggle = (key, value) => {
    setLocal(prev => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const activeCount = Object.values(filters).flat().filter(Boolean).length;

  const handleApply = () => {
    onApply(local);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = { cities: [], price_ranges: [], tags: [], access_types: [] };
    setLocal(cleared);
    onApply(cleared);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">Filtrar locais</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          <Section title="Cidade">
            <div className="flex flex-wrap gap-2">
              {CITIES.map(city => (
                <ChipToggle key={city} label={city} active={(local.cities || []).includes(city)} onToggle={() => toggle('cities', city)} />
              ))}
            </div>
          </Section>

          <Section title="Faixa de preço">
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map(({ key, label }) => (
                <ChipToggle key={key} label={label} active={(local.price_ranges || []).includes(key)} onToggle={() => toggle('price_ranges', key)} />
              ))}
            </div>
          </Section>

          <Section title="Características">
            <div className="flex flex-wrap gap-2">
              {TAGS.map(({ key, label }) => (
                <ChipToggle key={key} label={label} active={(local.tags || []).includes(key)} onToggle={() => toggle('tags', key)} />
              ))}
            </div>
          </Section>

          <Section title="Tipo de acesso">
            <div className="flex flex-wrap gap-2">
              {ACCESS.map(({ key, label }) => (
                <ChipToggle key={key} label={label} active={(local.access_types || []).includes(key)} onToggle={() => toggle('access_types', key)} />
              ))}
            </div>
          </Section>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClear} className="flex-1">Limpar</Button>
          <Button onClick={handleApply} className="flex-1 bg-emerald-700 hover:bg-emerald-800">Aplicar filtros</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function ChipToggle({ label, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
        active
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}