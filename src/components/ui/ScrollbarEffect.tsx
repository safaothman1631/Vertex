'use client'
import { useEffect, useRef, useCallback } from 'react'

export default function ScrollbarEffect() {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartScroll = useRef(0)

  const show = useCallback(() => {
    const track = trackRef.current
    if (track) track.style.opacity = '1'
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!isDragging.current && trackRef.current)
        trackRef.current.style.opacity = '0'
    }, 1000)
  }, [])

  const updateThumb = useCallback(() => {
    const thumb = thumbRef.current
    const track = trackRef.current
    if (!thumb || !track) return
    const scrollTop = window.scrollY
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight
    if (scrollHeight <= clientHeight) return
    const trackH = track.clientHeight
    const thumbH = Math.max(36, (clientHeight / scrollHeight) * trackH)
    const maxTop = trackH - thumbH
    const top = (scrollTop / (scrollHeight - clientHeight)) * maxTop
    thumb.style.height = `${thumbH}px`
    thumb.style.transform = `translateY(${top}px)`
  }, [])

  useEffect(() => {
    const onScroll = () => { updateThumb(); show() }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateThumb, { passive: true })
    updateThumb()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateThumb)
      clearTimeout(timerRef.current)
    }
  }, [updateThumb, show])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragStartY.current = e.clientY
    dragStartScroll.current = window.scrollY
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return
    const onMove = (e: MouseEvent) => {
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight
      const trackH = track.clientHeight
      const thumbH = thumb.clientHeight
      const ratio = (scrollHeight - clientHeight) / (trackH - thumbH)
      window.scrollTo({ top: dragStartScroll.current + (e.clientY - dragStartY.current) * ratio })
    }
    const onUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      timerRef.current = setTimeout(() => {
        if (trackRef.current) trackRef.current.style.opacity = '0'
      }, 800)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={trackRef}
      style={{
        position: 'fixed', top: 8, bottom: 8, right: 4,
        width: 4, zIndex: 9999,
        opacity: 0, transition: 'opacity 0.4s ease',
        pointerEvents: 'none', borderRadius: 99,
      }}
    >
      <div
        ref={thumbRef}
        onMouseDown={onMouseDown}
        style={{
          position: 'absolute', left: 0, right: 0, top: 0,
          background: 'linear-gradient(180deg, var(--primary), #818cf8)',
          borderRadius: 99,
          boxShadow: '0 2px 8px rgba(99,102,241,0.45)',
          cursor: 'pointer',
          pointerEvents: 'auto',
          transition: 'transform 0.08s linear',
        }}
      />
    </div>
  )
}
