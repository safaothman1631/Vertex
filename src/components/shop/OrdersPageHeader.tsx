'use client'
import { useT } from '@/contexts/locale'
import { usePreferences } from '@/contexts/preferences'
import { Package, TrendingUp } from 'lucide-react'

interface Props {
  totalOrders: number
  totalSpent: number
}

export default function OrdersPageHeader({ totalOrders, totalSpent }: Props) {
  const t = useT()
  const { formatPrice } = usePreferences()
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={17} style={{ color: 'var(--primary)' }} />
        </div>
        <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          {t.orders.title}
        </span>
      </div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
        {t.orders.pageHeadLine1 ?? 'Your'}{' '}
        <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {t.orders.pageHeadLine2 ?? 'Order History'}
        </span>
      </h1>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 20px' }}>
          <Package size={16} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{totalOrders}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: 1 }}>{t.orders.totalOrders ?? 'Total Orders'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 20px' }}>
          <TrendingUp size={16} style={{ color: '#22c55e' }} />
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#22c55e' }}>{formatPrice(totalSpent)}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: 1 }}>{t.orders.totalSpent ?? 'Total Spent'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
