import { useEffect, useRef, useState } from 'react'
import { Play, X } from 'lucide-react'

export default function MediaHorizontalScroll({ medias }) {
  const [activeMedia, setActiveMedia] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Zoom state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const lastTouchDistance = useRef(null)
  const lastTouchPosition = useRef(null)
  const startYToClose = useRef(null)

  if (!medias || medias.length === 0) return null

  /* =====================================================
     📵 BLOQUEIA SCROLL DO FUNDO
  ===================================================== */
  useEffect(() => {
    document.body.style.overflow = activeMedia ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [activeMedia])

  /* =====================================================
     👆 TOUCH HANDLERS (PINCH + ARRASTAR + FECHAR)
  ===================================================== */
  function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
      startYToClose.current = e.touches[0].clientY
    }

    if (e.touches.length === 2) {
      lastTouchDistance.current = getDistance(e.touches)
    }
  }

  function handleTouchMove(e) {
    // Pinch zoom
    if (e.touches.length === 2) {
      const newDistance = getDistance(e.touches)
      if (lastTouchDistance.current) {
        const delta = newDistance - lastTouchDistance.current
        setScale((prev) =>
          Math.min(Math.max(prev + delta * 0.005, 1), 4)
        )
      }
      lastTouchDistance.current = newDistance
      return
    }

    // Arrastar imagem
    if (scale > 1 && e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchPosition.current.x
      const dy = e.touches[0].clientY - lastTouchPosition.current.y
      setPosition((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }))
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
      return
    }

    // Swipe para fechar
    const deltaY = e.touches[0].clientY - startYToClose.current
    if (deltaY > 120 && scale === 1) {
      closeModal()
    }
  }

  /* =====================================================
     🖱️ ZOOM COM SCROLL (DESKTOP)
  ===================================================== */
  function handleWheel(e) {
    e.preventDefault()
    setScale((prev) =>
      Math.min(Math.max(prev - e.deltaY * 0.001, 1), 4)
    )
  }

  /* =====================================================
     FECHAR MODAL
  ===================================================== */
  function closeModal() {
    setActiveMedia(null)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    lastTouchDistance.current = null
  }

  return (
    <>
      {/* GALERIA */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {medias.map((media, index) => (
          <button
            key={media.id}
            onClick={() => {
              setActiveMedia(media)
              setActiveIndex(index)
            }}
            className="relative min-w-[220px] h-[160px] rounded-xl overflow-hidden snap-start bg-black"
          >
            {media.type === 'image' ? (
              <img
                src={media.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <>
                <video
                  src={media.url}
                  muted
                  playsInline
                  preload="none"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 rounded-full p-3">
                    <Play className="w-6 h-6 text-white" fill="white" />
                  </div>
                </div>
              </>
            )}
          </button>
        ))}
      </div>

      {/* FULLSCREEN */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onWheel={handleWheel}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: lastTouchDistance.current ? 'none' : 'transform 0.1s',
            }}
            className="max-w-full max-h-full"
          >
            {activeMedia.type === 'image' ? (
              <img
                src={activeMedia.url}
                alt=""
                className="max-w-full max-h-[90vh] object-contain"
              />
            ) : (
              <video
                src={activeMedia.url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[90vh]"
              />
            )}
          </div>

          {/* INDICADORES */}
          <div className="absolute bottom-6 flex gap-2">
            {medias.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === activeIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
