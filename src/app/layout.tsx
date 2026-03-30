import type { Metadata } from 'next'
import './globals.css'
import { LocaleProvider } from '@/contexts/locale'
import ScrollbarEffect from '@/components/ui/ScrollbarEffect'
import { ToastProvider } from '@/components/ui/Toast'

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
    <html lang="ckb" dir="rtl" suppressHydrationWarning>
      <body>
        <LocaleProvider>
          <ToastProvider>
            <ScrollbarEffect />
            {children}
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
