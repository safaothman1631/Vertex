'use client'
import { useRef, useEffect, useState } from 'react'
import FadeIn from '@/components/ui/FadeIn'
import { useT } from '@/contexts/locale'

export default function Spline3DSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Skip heavy WebGL on phones and tablets
    if (window.innerWidth < 768) return

    let disposed = false
    const loadTimeout = setTimeout(() => { if (!disposed) setLoaded(true) }, 15000)

    import('@splinetool/runtime').then(({ Application }) => {
      if (disposed) return
      const app = new Application(canvas)
      app.load('/models/robot.splinecode')
        .then(() => { if (!disposed) { clearTimeout(loadTimeout); setLoaded(true) } })
        .catch(() => { if (!disposed) { clearTimeout(loadTimeout); setLoaded(true) } })
    }).catch(() => { if (!disposed) setLoaded(true) })

    return () => { disposed = true; clearTimeout(loadTimeout) }
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    function purge() {
      wrap!.querySelectorAll('a').forEach((a) => a.remove())
    }

    const observer = new MutationObserver(purge)
    observer.observe(wrap, { childList: true, subtree: true })

    let rafId: number
    function loop() { purge(); rafId = requestAnimationFrame(loop) }
    rafId = requestAnimationFrame(loop)

    const stopTimer = setTimeout(() => {
      cancelAnimationFrame(rafId)
      const slowId = setInterval(purge, 2000)
      ;(wrap as unknown as Record<string, unknown>).__slowId = slowId
    }, 15000)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
      clearTimeout(stopTimer)
      const slowId = (wrap as unknown as Record<string, unknown>).__slowId
      if (slowId) clearInterval(slowId as ReturnType<typeof setInterval>)
    }
  }, [])

  const t = useT()

  return (
    <section className="spline-3d-section">
      <div className="spline-bg-glow spline-bg-glow-1" />
      <div className="spline-bg-glow spline-bg-glow-2" />

      <div className="container">
        <FadeIn>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <h2 className="section-title">
              {t.hero.titleLine1}{' '}
              <span className="gradient-text">{t.hero.titleHighlight}</span>
            </h2>
            <p className="section-sub">{t.hero.desc}</p>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="spline-viewer-wrap" ref={wrapRef}>
            <div className="spline-glass-frame" />

            {/* Mobile fallback - CSS shows on phones < 480px */}
            <div className="spline-mobile-fallback" aria-hidden="true">
              <div className="spline-mobile-glow" />
              <svg className="spline-mobile-icon" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="50" stroke="url(#g1)" strokeWidth="2" opacity="0.4" />
                <circle cx="60" cy="60" r="35" stroke="url(#g1)" strokeWidth="1.5" opacity="0.3" />
                <circle cx="60" cy="60" r="18" fill="url(#g2)" opacity="0.6" />
                <path
                  d="M60 20 L70 45 L97 45 L75 62 L83 88 L60 72 L37 88 L45 62 L23 45 L50 45 Z"
                  fill="url(#g3)"
                  opacity="0.5"
                />
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#818cf8" />
                    <stop offset="1" stopColor="#a78bfa" />
                  </linearGradient>
                  <radialGradient id="g2" cx="50%" cy="50%" r="50%">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="g3" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#818cf8" />
                    <stop offset="1" stopColor="#c4b5fd" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="spline-mobile-label">VERTEX</span>
              <span className="spline-mobile-sub">Professional POS Hardware</span>
            </div>

            {/* Desktop 3D canvas - CSS hides on mobile */}
            <div className="spline-canvas-wrap">
              {!loaded && (
                <div className="spline-loader">
                  <div className="spline-spinner" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  width: '100%',
                  height: 120,
                  background: 'linear-gradient(to bottom, transparent 0%, #090913 50%)',
                  zIndex: 2147483647,
                  pointerEvents: 'none',
                  borderRadius: '0 0 24px 24px',
                }}
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
