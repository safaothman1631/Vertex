'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useT } from '@/contexts/locale'
import { usePreferences } from '@/contexts/preferences'
import type { Product } from '@/types'

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const { formatPrice } = usePreferences()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    const supabase = createClient()
    const term = `%${q.trim()}%`
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, model, price, old_price, images, rating, review_count, in_stock')
      .or(`name.ilike.${term},brand.ilike.${term},model.ilike.${term}`)
      .eq('hidden', false)
      .limit(8)
    setResults((data ?? []) as Product[])
    setLoading(false)
  }, [])

  function handleChange(val: string) {
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  function goToProduct(id: string) {
    onClose()
    router.push(`/products/${id}`)
  }

  function goToAll() {
    onClose()
    router.push(`/products?q=${encodeURIComponent(query.trim())}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) goToAll()
  }

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 'clamp(80px, 15vh, 160px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 580, margin: '0 16px',
          animation: 'scaleIn .2s cubic-bezier(.21,1.02,.73,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--bg1)', border: '1px solid var(--border)',
          borderRadius: 18, padding: '14px 18px',
          boxShadow: '0 24px 80px rgba(0,0,0,.5)',
        }}>
          <Search size={20} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder={t.search?.placeholder ?? 'Search products, brands, models...'}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: '1.05rem', fontFamily: 'inherit',
            }}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]) }} style={{
              background: 'var(--bg3)', border: 'none', borderRadius: 8,
              padding: '4px 6px', cursor: 'pointer', color: 'var(--text3)',
              display: 'flex', alignItems: 'center',
            }}>
              <X size={14} />
            </button>
          )}
          <kbd style={{
            fontSize: '.7rem', fontFamily: 'monospace', color: 'var(--text3)',
            background: 'var(--bg3)', padding: '3px 7px', borderRadius: 6,
            border: '1px solid var(--border)',
          }}>ESC</kbd>
        </form>

        {/* Results */}
        {(results.length > 0 || (loading && query.length >= 2)) && (
          <div style={{
            marginTop: 8, background: 'var(--bg1)', border: '1px solid var(--border)',
            borderRadius: 18, overflow: 'hidden',
            boxShadow: '0 16px 60px rgba(0,0,0,.4)',
            maxHeight: '50vh', overflowY: 'auto',
          }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: '.88rem' }}>
                {t.search?.searching ?? 'Searching...'}
              </div>
            ) : (
              <>
                {results.map(p => (
                  <button key={p.id} onClick={() => goToProduct(p.id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 18px', border: 'none', background: 'none',
                    cursor: 'pointer', color: 'var(--text)', textAlign: 'start',
                    transition: 'background .15s', fontFamily: 'inherit',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                      background: '#fff', overflow: 'hidden', position: 'relative',
                      border: '1px solid var(--border)',
                    }}>
                      {p.images?.[0] ? (
                        <Image src={p.images[0]} alt="" fill sizes="48px" style={{ objectFit: 'contain', padding: 4 }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.62rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{p.brand}</div>
                      <div style={{ fontSize: '.88rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '.95rem', color: 'var(--primary)', flexShrink: 0 }}>
                      {formatPrice(p.price)}
                    </div>
                  </button>
                ))}
                {query.trim().length >= 2 && (
                  <button onClick={goToAll} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '14px', border: 'none',
                    background: 'var(--bg2)', cursor: 'pointer',
                    color: 'var(--primary)', fontWeight: 700, fontSize: '.85rem',
                    fontFamily: 'inherit', borderTop: '1px solid var(--border)',
                    transition: 'background .15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg2)')}
                  >
                    {t.search?.viewAll ?? 'View all results'} <ArrowRight className="rtl-flip" size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* No results */}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <div style={{
            marginTop: 8, background: 'var(--bg1)', border: '1px solid var(--border)',
            borderRadius: 18, padding: '32px 24px', textAlign: 'center',
            boxShadow: '0 16px 60px rgba(0,0,0,.4)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
            <p style={{ color: 'var(--text2)', fontWeight: 600 }}>{t.search?.noResults ?? 'No products found'}</p>
            <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginTop: 4 }}>{t.search?.tryDifferent ?? 'Try a different search term'}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
