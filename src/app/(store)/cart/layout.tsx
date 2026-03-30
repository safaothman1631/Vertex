import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Review items in your shopping cart before checkout.',
  robots: { index: false },
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
