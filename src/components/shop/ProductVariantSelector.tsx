'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ProductVariant } from '@/types'

interface Props {
  productId: string
  basePrice: number
  onSelect: (variant: ProductVariant | null, finalPrice: number) => void
}

export default function ProductVariantSelector({ productId, basePrice, onSelect }: Props) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/variants?product_id=${productId}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (Array.isArray(data)) setVariants(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [productId])

  // Group variants by name (e.g. "Color", "Size")
  const groups = useMemo(() => {
    const map = new Map<string, ProductVariant[]>()
    for (const v of variants) {
      if (!map.has(v.name)) map.set(v.name, [])
      map.get(v.name)!.push(v)
    }
    return map
  }, [variants])

  // Find matching variant for current selection
  const matchedVariant = useMemo(() => {
    if (Object.keys(selected).length === 0 || groups.size === 0) return null
    return variants.find(v => {
      const grpVariants = groups.get(v.name) ?? []
      return grpVariants.some(gv => selected[gv.name] === v.value && v.name === Object.keys(selected).find(k => selected[k] === v.value))
    }) ?? null
  }, [selected, variants, groups])

  useEffect(() => {
    if (matchedVariant) {
      onSelect(matchedVariant, basePrice + matchedVariant.price_modifier)
    } else {
      onSelect(null, basePrice)
    }
  }, [matchedVariant, basePrice])

  if (loading) {
    return (
      <div className="variant-skeleton">
        {[1,2].map(i => <div key={i} className="variant-skeleton-row" />)}
      </div>
    )
  }

  if (groups.size === 0) return null

  function handleSelect(groupName: string, value: string) {
    setSelected(prev => {
      const next = { ...prev }
      if (next[groupName] === value) {
        delete next[groupName]
      } else {
        next[groupName] = value
      }
      return next
    })
  }

  return (
    <div className="variant-selector">
      {Array.from(groups.entries()).map(([groupName, opts]) => {
        const currentVal = selected[groupName]
        return (
          <div key={groupName} className="variant-group">
            <div className="variant-group-label">
              {groupName}
              {currentVal && <span className="variant-selected-val">: {currentVal}</span>}
            </div>
            <div className="variant-options" role="radiogroup" aria-label={groupName}>
              {opts.map(v => {
                const isActive = currentVal === v.value
                const isOos    = v.stock_quantity === 0
                return (
                  <button
                    key={v.id}
                    role="radio"
                    aria-checked={isActive}
                    aria-label={`${groupName}: ${v.value}${isOos ? ' (Out of stock)' : ''}`}
                    disabled={isOos}
                    className={`variant-btn${isActive ? ' active' : ''}${isOos ? ' oos' : ''}`}
                    style={v.image_url ? { backgroundImage: `url(${v.image_url})` } : undefined}
                    onClick={() => handleSelect(groupName, v.value)}
                    title={`${v.value}${v.price_modifier !== 0 ? ` (+$${v.price_modifier.toFixed(2)})` : ''}${isOos ? ' — Out of stock' : ''}`}
                  >
                    {!v.image_url && v.value}
                    {v.price_modifier !== 0 && (
                      <span className="variant-price-mod">
                        {v.price_modifier > 0 ? '+' : ''}${v.price_modifier.toFixed(2)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
