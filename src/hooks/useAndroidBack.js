import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { useLocation, useNavigate } from 'react-router-dom'

export function useAndroidBack() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const sub = App.addListener('backButton', () => {
      if (location.pathname !== '/') {
        navigate(-1)
      } else {
        App.exitApp()
      }
    })

    return () => sub.remove()
  }, [location.pathname])
}