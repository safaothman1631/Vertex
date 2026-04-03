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
}

// Exchange rates (USD base)
const RATES: Record<string, number> = { USD: 1, IQD: 1310, EUR: 0.93, TRY: 32.5 }
const SYMBOLS: Record<string, string> = { USD: '$', IQD: 'د.ع', EUR: '€', TRY: '₺' }
const STORAGE_KEY = 'vertex-prefs'

const PreferencesContext = createContext<PreferencesContextValue>({
  theme: 'dark',
  currency: 'USD',
  compactMode: false,
  setTheme: () => {},
  setCurrency: () => {},
  setCompactMode: () => {},
  formatPrice: (n) => `$${n.toFixed(2)}`,
})

function applyTheme(theme: string) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
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

  // On mount: merge localStorage with server values (server DB values win if stored differs)
  // Then apply theme to DOM
  useEffect(() => {
    const stored = readStorage()
    // Server-fetched values (initialX) are authoritative for logged-in users.
    // If no server value was provided (unauthenticated), fall back to localStorage.
    const resolvedTheme = initialTheme !== 'dark' ? initialTheme : (stored.theme ?? initialTheme)
    const resolvedCurrency = initialCurrency !== 'USD' ? initialCurrency : (stored.currency ?? initialCurrency)
    const resolvedCompact = initialCompactMode !== false ? initialCompactMode : (stored.compactMode ?? initialCompactMode)

    setThemeState(resolvedTheme)
    setCurrencyState(resolvedCurrency)
    setCompactModeState(resolvedCompact)
    applyTheme(resolvedTheme)

    // Sync to localStorage
    saveToStorage({ theme: resolvedTheme, currency: resolvedCurrency, compactMode: resolvedCompact })
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const rate = RATES[currency] ?? 1
    const symbol = SYMBOLS[currency] ?? currency
    const converted = amount * rate
    if (currency === 'IQD') return `${Math.round(converted).toLocaleString()} ${symbol}`
    if (currency === 'TRY') return `${symbol}${Math.round(converted).toLocaleString()}`
    return `${symbol}${converted.toFixed(2)}`
  }, [currency])

  return (
    <PreferencesContext.Provider value={{ theme, currency, compactMode, setTheme, setCurrency, setCompactMode, formatPrice }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  return useContext(PreferencesContext)
}
