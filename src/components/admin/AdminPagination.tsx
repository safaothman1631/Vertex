'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '@/contexts/locale'

interface AdminPaginationProps {
  total: number
  page: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  pageSizes?: number[]
}

export default function AdminPagination({ total, page, perPage, onPageChange, onPerPageChange, pageSizes = [10, 25, 50] }: AdminPaginationProps) {
  const t = useT()
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = Math.min(total, (page - 1) * perPage + 1)
  const end = Math.min(total, page * perPage)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '10px 0', fontSize: '.8rem', color: 'var(--text2)' }}>
      <span>{t.admin.showing} {start}–{end} {t.admin.of} {total}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {onPerPageChange && (
          <select
            value={perPage}
            onChange={e => onPerPageChange(Number(e.target.value))}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '4px 6px', fontSize: '.78rem' }}
          >
            {pageSizes.map(s => (
              <option key={s} value={s}>{s} / {t.admin.page}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1, color: 'var(--text)' }}
        >
          <ChevronLeft size={14} />
        </button>

        <span style={{ minWidth: 60, textAlign: 'center' }}>
          {page} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, color: 'var(--text)' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
