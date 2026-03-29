'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  images: string[]
  startIndex?: number
  onClose: () => void
}

export default function Lightbox({ images, startIndex = 0, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex)
  const [zoom, setZoom] = useState(1)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [images.length, onClose])

  if (!mounted) return null

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,.92)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'scaleIn .25s ease forwards',
      }}
    >
      {/* Close */}
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer', color: '#fff', zIndex: 2 }}>
        <X size={20} />
      </button>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 2 }}>
        <button onClick={() => setZoom(z => Math.min(z + 0.5, 3))} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.8rem' }}>
          <ZoomIn size={16} />{Math.round(zoom * 100)}%
        </button>
        <button onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#fff' }}>
          <ZoomOut size={16} />
        </button>
      </div>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 12, padding: 12, cursor: 'pointer', color: '#fff', zIndex: 2 }}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % images.length)}
            style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 12, padding: 12, cursor: 'pointer', color: '#fff', zIndex: 2 }}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Image */}
      <img
        src={images[idx]}
        alt=""
        style={{
          maxWidth: '85vw', maxHeight: '80vh', objectFit: 'contain',
          borderRadius: 12, transform: `scale(${zoom})`,
          transition: 'transform .2s ease',
          userSelect: 'none',
        }}
        draggable={false}
      />

      {/* Dots */}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 8 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 24 : 8, height: 8, borderRadius: 99,
                background: i === idx ? 'var(--primary)' : 'rgba(255,255,255,.3)',
                border: 'none', cursor: 'pointer',
                transition: 'all .2s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
