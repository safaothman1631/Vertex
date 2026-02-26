import CheckoutSuccessClient from '@/components/shop/CheckoutSuccessClient'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>
}) {
  const { order_id } = await searchParams
  return <CheckoutSuccessClient orderId={order_id} />
}
