'use client'

import { Truck, Zap, Timer } from 'lucide-react'
import type { ShippingMethod } from '@/types'
import { SHIPPING_METHODS } from '@/types'

interface Props {
  selected: string
  onChange: (methodId: string, cost: number) => void
}

const ICONS: Record<string, React.ElementType> = {
  standard:  Truck,
  express:   Zap,
  overnight: Timer,
}

export default function ShippingMethodSelector({ selected, onChange }: Props) {
  return (
    <div className="shipping-method-list" role="radiogroup" aria-label="Shipping method">
      {SHIPPING_METHODS.map((m: ShippingMethod) => {
        const Icon = ICONS[m.id] ?? Truck
        const active = selected === m.id
        return (
          <label key={m.id} className={`shipping-method-option${active ? ' active' : ''}`}>
            <input
              type="radio"
              name="shipping"
              value={m.id}
              checked={active}
              onChange={() => onChange(m.id, m.price)}
              className="sr-only"
            />
            <div className="sm-icon">
              <Icon size={18} />
            </div>
            <div className="sm-info">
              <div className="sm-name">{m.name}</div>
              <div className="sm-desc">{m.description} · {m.estimated_days}</div>
            </div>
            <div className="sm-price">
              {m.price === 0 ? (
                <span style={{ color: '#22c55e', fontWeight: 700 }}>Free</span>
              ) : (
                <span style={{ fontWeight: 700 }}>${m.price.toFixed(2)}</span>
              )}
            </div>
            {active && (
              <div className="sm-check" aria-hidden="true">✓</div>
            )}
          </label>
        )
      })}
    </div>
  )
}
