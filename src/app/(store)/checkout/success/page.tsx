import type { Metadata } from 'next'
import CheckoutSuccessClient from '@/components/shop/CheckoutSuccessClient'

export const metadata: Metadata = {
  title: 'Order Confirmed',
  description: 'Your order has been placed successfully.',
  robots: { index: false },
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>
}) {
  const { order_id } = await searchParams
  return <CheckoutSuccessClient orderId={order_id} />
}
