import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-lg font-medium text-slate-700 mb-1">Página não encontrada</p>
        <p className="text-sm text-slate-500 mb-8">Parece que você se perdeu na Amazônia!</p>
        <Link to="/Home">
          <Button className="bg-emerald-700 hover:bg-emerald-800 gap-2">
            <Home className="w-4 h-4" />Voltar ao início
          </Button>
        </Link>
      </div>
    </div>
  );
}