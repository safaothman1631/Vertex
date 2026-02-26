'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import ckb from '@/messages/ckb'
import ar from '@/messages/ar'
import tr from '@/messages/tr'
import en from '@/messages/en'

export type Locale = 'ckb' | 'ar' | 'tr' | 'en'

// Deep-key accessor type (up to 2 levels for our use case)
export type Messages = typeof ckb

const messages: Record<Locale, Messages> = { ckb, ar: ar as unknown as Messages, tr: tr as unknown as Messages, en: en as unknown as Messages }

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Messages
  dir: 'ltr' | 'rtl'
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: ckb,
  dir: 'ltr',
})

const RTL_LOCALES: Locale[] = ['ckb', 'ar'] // 'tr' and 'en' are LTR

const COOKIE = 'nexpos-locale'

function readCookie(): Locale | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`))
  if (!match) return null
  const val = decodeURIComponent(match[1])
  if (val === 'ckb' || val === 'ar' || val === 'tr' || val === 'en') return val
  return null
}

function writeCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  // Load from cookie / localStorage on mount
  useEffect(() => {
    const saved = readCookie() || (localStorage.getItem(COOKIE) as Locale | null)
    if (saved) setLocaleState(saved)
  }, [])

  // Apply dir + lang to <html> whenever locale changes
  useEffect(() => {
    const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    writeCookie(l)
    localStorage.setItem(COOKIE, l)
  }, [])

  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr'

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: messages[locale], dir }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}

/** Shorthand: returns the translation object for the current locale */
export function useT() {
  return useContext(LocaleContext).t
}
