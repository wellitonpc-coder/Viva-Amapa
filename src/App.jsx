import React from "react"
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from "@/lib/query-client"

import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"

import AppLayout from "./components/layout/AppLayout"

// Pages
import Home from "./pages/Home"
import Explore from "./pages/Explore"
import PlaceDetail from "./pages/PlaceDetail"
import Map from "./pages/Map"
import Favorites from "./pages/Favorites"
import Profile from "./pages/Profile"
import SuggestPlace from "./pages/SuggestPlace"
import AdminModeration from "./pages/AdminModeration"
import Itineraries from "./pages/Itineraries"
import MySuggestions from "./pages/MySuggestions"
import PageNotFound from "./lib/PageNotFound"

// Auth
import { AuthProvider } from "@/lib/AuthContext"

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Layout Route */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/Home" replace />} />

              <Route path="/Home" element={<Home />} />
              <Route path="/Explore" element={<Explore />} />
              <Route path="/PlaceDetail" element={<PlaceDetail />} />
              <Route path="/Map" element={<Map />} />

              <Route path="/Favorites" element={<Favorites />} />
              <Route path="/Itineraries" element={<Itineraries />} />
              <Route path="/MySuggestions" element={<MySuggestions />} />
              <Route path="/SuggestPlace" element={<SuggestPlace />} />
              <Route path="/AdminModeration" element={<AdminModeration />} />

              <Route path="/Profile" element={<Profile />} />
            </Route>

            {/* 404 fora do layout (ou dentro, se você preferir) */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>

          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}
