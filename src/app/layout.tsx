import type { Metadata } from 'next'
import './globals.css'
import { LocaleProvider } from '@/contexts/locale'
import { PreferencesProvider } from '@/contexts/preferences'
import ScrollbarEffect from '@/components/ui/ScrollbarEffect'
import { ToastProvider } from '@/components/ui/Toast'
import { validateEnv } from '@/lib/env'
import LiveChat from '@/components/shop/LiveChat'
import CompareDrawer from '@/components/shop/CompareDrawer'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#080810" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body>
        <PreferencesProvider>
          <LocaleProvider>
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
