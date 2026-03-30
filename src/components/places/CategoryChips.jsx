import React from 'react';
import { Waves, Building2, Utensils, Trees, Landmark, Calendar, Palette, Wrench } from 'lucide-react';

const categories = [
  { key: 'all', label: 'Todos', icon: null },
  { key: 'balneario', label: 'Balneários', icon: Waves },
  { key: 'hotel_pousada', label: 'Hospedagem', icon: Building2 },
  { key: 'restaurante', label: 'Restaurantes', icon: Utensils },
  { key: 'atrativo_natural', label: 'Natureza', icon: Trees },
  { key: 'atrativo_cultural', label: 'Cultural', icon: Landmark },
  { key: 'evento', label: 'Eventos', icon: Calendar },
  { key: 'artesanato', label: 'Artesanato', icon: Palette },
];

export default function CategoryChips({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(({ key, label, icon: Icon }) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
              isActive
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-200'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}