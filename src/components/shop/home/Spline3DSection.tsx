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

    let disposed = false

    import('@splinetool/runtime').then(({ Application }) => {
      if (disposed) return
      const app = new Application(canvas)
      app.load('https://prod.spline.design/mDdxXJLr8ElI7pmF/scene.splinecode')
        .then(() => {
          if (!disposed) setLoaded(true)
        })
        .catch(() => {})
    })

    return () => { disposed = true }
  }, [])

  // Aggressively remove any <a> watermark injected by Spline runtime
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    function purge() {
      // Remove every single <a> inside the wrapper — no exceptions
      wrap!.querySelectorAll('a').forEach(a => a.remove())
      // Also check canvas parent for non-canvas, non-div children
      const canvas = canvasRef.current
      if (canvas?.parentElement) {
        Array.from(canvas.parentElement.children).forEach(child => {
          if (child.tagName === 'A') child.remove()
        })
      }
    }

    // MutationObserver catches immediate injections
    const observer = new MutationObserver(purge)
    observer.observe(wrap, { childList: true, subtree: true })

    // requestAnimationFrame loop — runs every frame, cannot be beaten
    let rafId: number
    function loop() {
      purge()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    // Stop the RAF loop after 15 seconds (watermark is long gone by then)
    const stopTimer = setTimeout(() => {
      cancelAnimationFrame(rafId)
      // Switch to a slow interval as maintenance
      const slowId = setInterval(purge, 2000)
      // Clean up slow interval on unmount handled below
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
            {!loaded && (
              <div className="spline-loader">
                <div className="spline-spinner" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
            {/* Cover watermark logo */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                height: 120,
                background: 'linear-gradient(to bottom, transparent 0%, #090913 45%)',
                zIndex: 2147483647,
                pointerEvents: 'none',
                borderRadius: '0 0 24px 24px',
              }}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
