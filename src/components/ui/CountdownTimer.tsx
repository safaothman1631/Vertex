'use client'

import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

interface Props {
  endsAt: string          // ISO date string
  label?: string
  compact?: boolean
}

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

function calcTimeLeft(endsAt: string): TimeLeft | null {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return null
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export default function CountdownTimer({ endsAt, label = 'Sale ends in', compact = false }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calcTimeLeft(endsAt))

  useEffect(() => {
    const id = setInterval(() => {
      const t = calcTimeLeft(endsAt)
      setTimeLeft(t)
      if (!t) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (!timeLeft) return null

  if (compact) {
    const { days, hours, minutes, seconds } = timeLeft
    const parts: string[] = []
    if (days   > 0) parts.push(`${days}d`)
    if (hours  > 0) parts.push(`${hours}h`)
    parts.push(`${String(minutes).padStart(2, '0')}m`)
    parts.push(`${String(seconds).padStart(2, '0')}s`)
    return (
      <span className="countdown-compact" aria-label={`${label} ${parts.join(' ')}`}>
        <Timer size={12} />
        {parts.join(' ')}
      </span>
    )
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="countdown-wrap" role="timer" aria-label="Flash sale countdown">
      <div className="countdown-label">
        <Timer size={14} />
        {label}
      </div>
      <div className="countdown-blocks">
        {timeLeft.days > 0 && (
          <div className="countdown-block">
            <span className="cb-num">{pad(timeLeft.days)}</span>
            <span className="cb-unit">Days</span>
          </div>
        )}
        <div className="countdown-block">
          <span className="cb-num">{pad(timeLeft.hours)}</span>
          <span className="cb-unit">Hrs</span>
        </div>
        <div className="countdown-block">
          <span className="cb-num">{pad(timeLeft.minutes)}</span>
          <span className="cb-unit">Min</span>
        </div>
        <div className="countdown-block">
          <span className="cb-num">{pad(timeLeft.seconds)}</span>
          <span className="cb-unit">Sec</span>
        </div>
      </div>
    </div>
  )
}
