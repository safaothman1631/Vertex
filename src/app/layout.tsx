import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter, Noto_Sans_Arabic } from 'next/font/google'
import './globals.css'
import { LocaleProvider, type Locale } from '@/contexts/locale'
import { PreferencesProvider } from '@/contexts/preferences'
import ScrollbarEffect from '@/components/ui/ScrollbarEffect'
import { ToastProvider } from '@/components/ui/Toast'
import { validateEnv } from '@/lib/env'
import LiveChat from '@/components/shop/LiveChat'
import CompareDrawer from '@/components/shop/CompareDrawer'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-arabic',
  weight: ['400', '500', '600', '700', '800'],
})

// Validate required environment variables at startup (server-side only)
if (typeof window === 'undefined') {
  validateEnv()
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vertex-pos.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Vertex — Professional POS Equipment',
    template: '%s | Vertex',
  },
  description: 'Shop barcode scanners, POS terminals, receipt printers, cash drawers, and professional POS equipment. Trusted by businesses worldwide.',
  keywords: ['POS equipment', 'barcode scanner', 'receipt printer', 'cash drawer', 'POS terminal', 'point of sale'],
  authors: [{ name: 'Vertex' }],
  creator: 'Vertex',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Vertex',
    title: 'Vertex — Professional POS Equipment',
    description: 'Shop barcode scanners, POS terminals, receipt printers, and professional POS equipment.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vertex — Professional POS Equipment',
    description: 'Shop barcode scanners, POS terminals, receipt printers, and professional POS equipment.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read locale cookie on server to prevent hydration mismatch
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('nexpos-locale')?.value
  const validLocales: Locale[] = ['ckb', 'ar', 'tr', 'en']
  const initialLocale: Locale = validLocales.includes(localeCookie as Locale) ? (localeCookie as Locale) : 'en'
  const dir = initialLocale === 'ckb' || initialLocale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={initialLocale} dir={dir} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#080810" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={`${inter.variable} ${notoArabic.variable}`}>
        <PreferencesProvider>
          <LocaleProvider initialLocale={initialLocale}>
            <ToastProvider>
              <ScrollbarEffect />
              {children}
              <CompareDrawer />
              <LiveChat />
            </ToastProvider>
          </LocaleProvider>
        </PreferencesProvider>
      </body>
    </html>
  )
}
