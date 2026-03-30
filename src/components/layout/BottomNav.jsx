import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MapPin, Heart, User } from 'lucide-react';

const navItems = [
  { path: '/Home', icon: Home, label: 'Início' },
  { path: '/Explore', icon: Search, label: 'Explorar' },
  { path: '/Map', icon: MapPin, label: 'Mapa' },
  { path: '/Favorites', icon: Heart, label: 'Salvos' },
  { path: '/Profile', icon: User, label: 'Perfil' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-emerald-100 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || 
            (path === '/Home' && location.pathname === '/');
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-emerald-700' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-700' : ''}`}>
                {label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0 w-8 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}