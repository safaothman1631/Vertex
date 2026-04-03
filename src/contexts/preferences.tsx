'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface Preferences {
  theme: string
  currency: string
  compactMode: boolean
}

interface PreferencesContextValue extends Preferences {
  setTheme: (t: string) => void
  setCurrency: (c: string) => void
  setCompactMode: (v: boolean) => void
  formatPrice: (amount: number) => string
  rates: Record<string, number>
  ratesLoading: boolean
  ratesFetched: boolean
}

// Fallback static rates (USD base) — used until live rates arrive
const FALLBACK_RATES: Record<string, number> = { USD: 1, IQD: 1310, EUR: 0.93, TRY: 32.5 }
export const SYMBOLS: Record<string, string> = { USD: '$', IQD: 'د.ع', EUR: '€', TRY: '₺' }
export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'IQD', symbol: 'د.ع', label: 'Iraqi Dinar', flag: '🇮🇶' },
  { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺' },
  { code: 'TRY', symbol: '₺', label: 'Turkish Lira', flag: '🇹🇷' },
]
const STORAGE_KEY = 'vertex-prefs'
const RATES_CACHE_KEY = 'vertex-rates'
const RATES_TTL = 6 * 60 * 60 * 1000 // 6 hours

const PreferencesContext = createContext<PreferencesContextValue>({
  theme: 'dark',
  currency: 'USD',
  compactMode: false,
  setTheme: () => {},
  setCurrency: () => {},
  setCompactMode: () => {},
  formatPrice: (n) => `$${n.toFixed(2)}`,
  rates: FALLBACK_RATES,
  ratesLoading: false,
  ratesFetched: false,
})

// Module-level refs so we can remove the previous listener when theme changes
let _autoMq: MediaQueryList | null = null
let _autoMqHandler: ((e: MediaQueryListEvent) => void) | null = null

function applyTheme(theme: string) {
  if (typeof document === 'undefined') return

  // Remove any previous auto-theme listener
  if (_autoMq && _autoMqHandler) {
    _autoMq.removeEventListener('change', _autoMqHandler)
    _autoMq = null
    _autoMqHandler = null
  }

  if (theme === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const resolve = () => document.documentElement.setAttribute('data-theme', mq.matches ? 'light' : 'dark')
    resolve()
    _autoMqHandler = resolve
    mq.addEventListener('change', _autoMqHandler)
    _autoMq = mq
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

function readStorage(): Partial<Preferences> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(updates: Partial<Preferences>) {
  try {
    const current = readStorage()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }))
  } catch {}
}

export function PreferencesProvider({
  children,
  initialTheme = 'dark',
  initialCurrency = 'USD',
  initialCompactMode = false,
}: {
  children: React.ReactNode
  initialTheme?: string
  initialCurrency?: string
  initialCompactMode?: boolean
}) {
  const [theme, setThemeState] = useState(initialTheme)
  const [currency, setCurrencyState] = useState(initialCurrency)
  const [compactMode, setCompactModeState] = useState(initialCompactMode)
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesFetched, setRatesFetched] = useState(false)

  // Load prefs from localStorage on mount
  useEffect(() => {
    const stored = readStorage()
    const resolvedTheme = initialTheme !== 'dark' ? initialTheme : (stored.theme ?? initialTheme)
    const resolvedCurrency = initialCurrency !== 'USD' ? initialCurrency : (stored.currency ?? initialCurrency)
    const resolvedCompact = initialCompactMode !== false ? initialCompactMode : (stored.compactMode ?? initialCompactMode)
    setThemeState(resolvedTheme)
    setCurrencyState(resolvedCurrency)
    setCompactModeState(resolvedCompact)
    applyTheme(resolvedTheme)
    saveToStorage({ theme: resolvedTheme, currency: resolvedCurrency, compactMode: resolvedCompact })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch live exchange rates (free API, no key needed)
  useEffect(() => {
    async function fetchRates() {
      // Check cache first
      try {
        const cached = localStorage.getItem(RATES_CACHE_KEY)
        if (cached) {
          const { ts, data } = JSON.parse(cached)
          if (Date.now() - ts < RATES_TTL && data?.USD) {
            setRates({ ...FALLBACK_RATES, ...data })
            setRatesFetched(true)
            return
          }
        }
      } catch {}

      setRatesLoading(true)
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 21600 } } as RequestInit)
        if (!res.ok) throw new Error('rate fetch failed')
        const json = await res.json()
        if (json?.rates) {
          const picked: Record<string, number> = { USD: 1 }
          for (const code of ['IQD', 'EUR', 'TRY', 'GBP', 'SAR', 'AED']) {
            if (json.rates[code]) picked[code] = json.rates[code]
          }
          setRates({ ...FALLBACK_RATES, ...picked })
          localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: picked }))
          setRatesFetched(true)
        }
      } catch {
        // Silently use fallback rates
        setRatesFetched(true)
      } finally {
        setRatesLoading(false)
      }
    }
    fetchRates()
  }, [])

  const setTheme = useCallback((t: string) => {
    setThemeState(t)
    applyTheme(t)
    saveToStorage({ theme: t })
  }, [])

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c)
    saveToStorage({ currency: c })
  }, [])

  const setCompactMode = useCallback((v: boolean) => {
    setCompactModeState(v)
    saveToStorage({ compactMode: v })
  }, [])

  const formatPrice = useCallback((amount: number) => {
    const rate = rates[currency] ?? 1
    const symbol = SYMBOLS[currency] ?? currency
    const converted = amount * rate
    if (currency === 'IQD') return `${Math.round(converted).toLocaleString()} ${symbol}`
    if (currency === 'TRY') return `${symbol}${Math.round(converted).toLocaleString()}`
    return `${symbol}${converted.toFixed(2)}`
  }, [currency, rates])

  return (
    <PreferencesContext.Provider value={{ theme, currency, compactMode, setTheme, setCurrency, setCompactMode, formatPrice, rates, ratesLoading, ratesFetched }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  return useContext(PreferencesContext)
}
