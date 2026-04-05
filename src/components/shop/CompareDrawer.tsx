'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { X, Scale, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { useCompareStore } from '@/store/compare'
import { usePreferences } from '@/contexts/preferences'
import type { Product } from '@/types'

const SPEC_LABELS = [
  { key: 'price',    label: 'Price' },
  { key: 'brand',    label: 'Brand' },
  { key: 'category', label: 'Category' },
  { key: 'rating',   label: 'Rating' },
  { key: 'in_stock', label: 'Stock' },
]

function cell(product: Product, key: string, formatPrice: (n: number) => string) {
  if (key === 'price')    return formatPrice(product.price)
  if (key === 'brand')    return product.brand
  if (key === 'category') return product.category
  if (key === 'rating')   return `${product.rating} ★ (${product.review_count})`
  if (key === 'in_stock') return (product.in_stock
    ? <span style={{ color: '#22c55e' }}>✓ In Stock</span>
    : <span style={{ color: '#ef4444' }}>✗ Out of Stock</span>)
  return '—'
}

export default function CompareDrawer() {
  const { items, remove, clear } = useCompareStore()
  const { formatPrice } = usePreferences()
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(false)

  if (items.length === 0) return null

  return (
    <>
      {/* Floating trigger bar */}
      <div
        className="compare-bar"
        role="region"
        aria-label={`Compare ${items.length} products`}
      >
        <button className="compare-bar-toggle" onClick={() => setOpen(o => !o)}>
          <Scale size={16} />
          <span>Compare ({items.length})</span>
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        <div className="compare-bar-items">
          {items.map(p => (
            <div key={p.id} className="compare-mini-item">
              <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill sizes="36px" style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 36, height: 36, background: 'var(--bg3)', borderRadius: 8 }} />
                )}
              </div>
              <span className="compare-mini-name">{p.name.slice(0, 20)}</span>
              <button
                className="compare-mini-remove"
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.name} from compare`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <button className="compare-clear-btn" onClick={clear} aria-label="Clear compare list">
          <X size={14} />
          Clear
        </button>
      </div>

      {/* Comparison table modal */}
      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="compare-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Product comparison">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(4px)' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="compare-modal" onClick={e => e.stopPropagation()}>
            <div className="compare-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scale size={18} />
                <span style={{ fontWeight: 700 }}>Product Comparison</span>
              </div>
              <button onClick={() => setOpen(false)} className="compare-close" aria-label="Close comparison">
                <X size={18} />
              </button>
            </div>

            <div className="compare-table-wrap">
              <table className="compare-table" role="table">
                <thead>
                  <tr>
                    <th className="compare-th-label">Feature</th>
                    {items.map(p => (
                      <th key={p.id} className="compare-th-product">
                        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px', borderRadius: 12, overflow: 'hidden' }}>
                          {p.images?.[0] ? (
                            <Image src={p.images[0]} alt={p.name} fill sizes="80px" style={{ objectFit: 'contain' }} />
                          ) : (
                            <div style={{ width: 80, height: 80, background: 'var(--bg3)', borderRadius: 12 }} />
                          )}
                        </div>
                        <div className="compare-prod-name">{p.name}</div>
                        <div className="compare-prod-price">{formatPrice(p.price)}</div>
                        <button className="compare-remove-prod" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>
                          <X size={12} /> Remove
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SPEC_LABELS.map(({ key, label }) => (
                    <tr key={key}>
                      <td className="compare-td-label">{label}</td>
                      {items.map(p => (
                        <td key={p.id} className="compare-td-val">
                          {key === 'rating' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                              <Star size={12} style={{ color: '#f59e0b' }} />
                              {p.rating} ({p.review_count})
                            </span>
                          ) : (
                            cell(p, key, formatPrice)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Dynamic specs */}
                  <tr>
                    <td className="compare-td-label" style={{ verticalAlign: 'top', paddingTop: 16 }}>Specifications</td>
                    {items.map(p => (
                      <td key={p.id} className="compare-td-val">
                        <button
                          className="compare-specs-toggle"
                          onClick={() => setExpanded(e => !e)}
                          aria-expanded={expanded}
                        >
                          {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                          {expanded ? 'Hide' : 'Show'} Specs
                        </button>
                        {expanded && (
                          <ul className="compare-specs-list">
                            {(p.specs ?? []).map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* CTA */}
                  <tr>
                    <td className="compare-td-label">Action</td>
                    {items.map(p => (
                      <td key={p.id} className="compare-td-val">
                        <Link href={`/products/${p.id}`} className="compare-view-btn">
                          View Details
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  )
}
