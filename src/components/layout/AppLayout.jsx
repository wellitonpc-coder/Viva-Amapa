import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const HIDE_NAV_PATHS = ['/PlaceDetail', '/SuggestPlace', '/AdminModeration'];

export default function AppLayout() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white">
      <style>{`
        :root {
          --color-amapa-green: #065f46;
          --color-amapa-gold: #d97706;
          --color-amapa-river: #0284c7;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
      <main className={`${hideNav ? '' : 'pb-20'}`}>
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}