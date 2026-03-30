import type { Metadata } from 'next'
import './globals.css'
import { LocaleProvider } from '@/contexts/locale'
import ScrollbarEffect from '@/components/ui/ScrollbarEffect'
import { ToastProvider } from '@/components/ui/Toast'

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
