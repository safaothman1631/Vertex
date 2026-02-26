'use client'
import { useT } from '@/contexts/locale'

export default function OrdersPageHeader() {
  const t = useT()
  return <h1 className="text-3xl font-bold mb-8">{t.orders.title}</h1>
}
