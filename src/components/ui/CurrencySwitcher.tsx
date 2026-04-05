'use client'

import { useRef, useState, useEffect } from 'react'
import { Loader2, Pencil, Check, RotateCcw } from 'lucide-react'
import { usePreferences, CURRENCIES, SYMBOLS } from '@/contexts/preferences'

interface Props {
  /** 'navbar' = compact pill, 'inline' = shows rate info per option, 'admin' = flat row */
  variant?: 'navbar' | 'inline' | 'admin'
  /** USD amount to preview live on hover (used in inline variant) */
  previewAmount?: number
}

export default function CurrencySwitcher({ variant = 'navbar', previewAmount }: Props) {
  const { currency, setCurrency, rates, effectiveRates, customRates, setCustomRate, ratesLoading, formatPrice } = usePreferences()
  const [open, setOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateInput, setRateInput] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const current = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [])

  // ── INLINE VARIANT (product page — big live-updating block) ──────────────
  if (variant === 'inline') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CURRENCIES.map(cur => {
            const active = currency === cur.code
            const rate = effectiveRates[cur.code] ?? 1
            const isCustom = cur.code in customRates
            const preview = previewAmount != null
              ? (cur.code === 'IQD'
                  ? `${Math.round(previewAmount * rate).toLocaleString()} ${cur.symbol}`
                  : cur.code === 'TRY'
                    ? `${cur.symbol}${Math.round(previewAmount * rate).toLocaleString()}`
                    : `${cur.symbol}${(previewAmount * rate).toFixed(2)}`)
              : null
            return (
              <div key={cur.code} style={{ position: 'relative' }}>
                <button
                  onClick={() => setCurrency(cur.code)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all .18s',
                    background: active ? 'rgba(99,102,241,.12)' : 'var(--bg3)',
                    border: active ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    color: active ? 'var(--primary)' : 'var(--text)',
                    boxShadow: active ? '0 2px 12px rgba(99,102,241,.2)' : 'none',
                    minWidth: 72,
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{cur.flag}</span>
                  <span style={{ fontWeight: 800, fontSize: '.82rem' }}>{cur.code}</span>
                  {preview && (
                    <span style={{ fontSize: '.72rem', fontWeight: 600, color: active ? 'var(--primary)' : 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {preview}
                    </span>
                  )}
                  {isCustom && (
                    <span style={{ fontSize: '.58rem', color: '#f59e0b', fontWeight: 700 }}>custom</span>
                  )}
                  {ratesLoading && active && (
                    <Loader2 size={10} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                  )}
                </button>
                {/* Edit rate button */}
                {cur.code !== 'USD' && (
                  <button
                    onClick={() => {
                      setEditingRate(editingRate === cur.code ? null : cur.code)
                      setRateInput(String(effectiveRates[cur.code] ?? ''))
                    }}
                    title="Custom rate"
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                      borderRadius: '50%', border: '1px solid var(--border)',
                      background: isCustom ? '#f59e0b' : 'var(--bg2)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isCustom ? '#fff' : 'var(--text3)', padding: 0,
                    }}
                  >
                    <Pencil size={9} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {/* Custom rate editor */}
        {editingRate && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
              1 USD =
            </span>
            <input
              type="number"
              value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              placeholder={String(rates[editingRate] ?? '')}
              dir="ltr"
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit',
                fontWeight: 700, fontSize: '.85rem', minWidth: 0,
              }}
            />
            <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text3)' }}>
              {SYMBOLS[editingRate] ?? editingRate}
            </span>
            <button
              onClick={() => {
                const val = parseFloat(rateInput)
                if (val > 0) setCustomRate(editingRate, val)
                setEditingRate(null)
              }}
              title="Save"
              style={{
                width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                background: 'var(--primary)', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Check size={14} />
            </button>
            {editingRate in customRates && (
              <button
                onClick={() => { setCustomRate(editingRate, null); setEditingRate(null) }}
                title="Reset to API rate"
                style={{
                  width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)',
                  cursor: 'pointer', background: 'var(--bg)', color: 'var(--text3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── ADMIN VARIANT (flat row in topbar) ───────────────────────────────────
  if (variant === 'admin') {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {CURRENCIES.map(cur => {
          const active = currency === cur.code
          return (
            <button
              key={cur.code}
              onClick={() => setCurrency(cur.code)}
              title={cur.label}
              style={{
                padding: '4px 9px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '.72rem', fontWeight: 700, transition: 'all .15s',
                background: active ? 'rgba(99,102,241,.15)' : 'transparent',
                border: active ? '1px solid rgba(99,102,241,.4)' : '1px solid transparent',
                color: active ? 'var(--primary)' : 'var(--text3)',
              }}
            >
              {cur.symbol}<span className="admin-cur-code"> {cur.code}</span>
            </button>
          )
        })}
        {ratesLoading && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite', color: 'var(--text3)' }} />}
      </div>
    )
  }

  // ── NAVBAR VARIANT (compact dropdown pill) ───────────────────────────────
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="nav-action-btn nav-lang-btn"
        title="Currency"
        style={{
          gap: 4, padding: '0 10px', width: 'auto', fontSize: '.78rem', fontWeight: 700,
          background: open ? 'rgba(99,102,241,.12)' : undefined,
          border: open ? '1px solid rgba(99,102,241,.3)' : undefined,
        }}
      >
        <span style={{ fontSize: '.85rem' }}>{current.flag}</span>
        <span>{current.code}</span>
        {ratesLoading && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', insetInlineEnd: 0,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,.45)',
          animation: 'floatUp .18s cubic-bezier(.22,1,.36,1) both',
          zIndex: 300, minWidth: 220,
        }}>
          {/* Header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
            <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Currency
              {ratesLoading && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite', marginInlineStart: 6, display: 'inline-block', verticalAlign: 'middle' }} />}
              {!ratesLoading && <span style={{ marginInlineStart: 6, color: '#10b981', fontSize: '.65rem' }}>● live</span>}
            </p>
          </div>

          {CURRENCIES.map(cur => {
            const active = currency === cur.code
            const rate = effectiveRates[cur.code] ?? 1
            const isCustom = cur.code in customRates
            return (
              <button
                key={cur.code}
                onClick={() => { setCurrency(cur.code); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'start',
                  background: active ? 'rgba(99,102,241,.08)' : 'var(--bg2)',
                  color: active ? 'var(--primary)' : 'var(--text)',
                  fontFamily: 'inherit', transition: 'background .15s',
                  borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg2)' }}
              >
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{cur.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '.85rem' }}>
                    {cur.label}
                    {isCustom && <span style={{ fontSize: '.6rem', color: '#f59e0b', marginInlineStart: 6, fontWeight: 700 }}>CUSTOM</span>}
                  </p>
                  <p style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 1 }}>
                    1 USD = {cur.code === 'IQD'
                      ? `${Math.round(rate).toLocaleString()} ${cur.symbol}`
                      : `${cur.symbol}${rate.toFixed(cur.code === 'USD' ? 0 : 2)}`}
                  </p>
                </div>
                <span style={{ fontSize: '.82rem', fontWeight: 800, flexShrink: 0, color: active ? 'var(--primary)' : 'var(--text3)' }}>
                  {cur.symbol} {cur.code}
                </span>
              </button>
            )
          })}

          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg3)' }}>
            <p style={{ fontSize: '.65rem', color: 'var(--text3)' }}>
              Rates via open.er-api.com · Updated every 6 hours
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
