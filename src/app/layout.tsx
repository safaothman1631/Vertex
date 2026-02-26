import type { Metadata } from 'next'
import './globals.css'
import { LocaleProvider } from '@/contexts/locale'

export const metadata: Metadata = {
  title: 'Vertex — Professional POS Equipment',
  description: 'Shop barcode scanners, POS terminals, receipt printers, and more. Powered by Vertex.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ckb" dir="rtl">
      <body>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}
