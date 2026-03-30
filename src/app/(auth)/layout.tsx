import type { Metadata } from 'next'
import PageTransition from '@/components/ui/PageTransition'

export const metadata: Metadata = {
  robots: { index: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
