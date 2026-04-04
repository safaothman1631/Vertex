'use client'

import { useState, useMemo, useEffect } from 'react'
import { Trash2, ShieldCheck, User, Eye, X, ShoppingBag } from 'lucide-react'
import type { Profile } from '@/types'
import { useT } from '@/contexts/locale'
import AdminSearch from './AdminSearch'
import AdminPagination from './AdminPagination'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

type UserWithOrders = Profile & { order_count: number }

export default function AdminUsersClient({ users: initial }: { users: UserWithOrders[] }) {
  const [users, setUsers] = useState<UserWithOrders[]>(initial)
  const [detail, setDetail] = useState<UserWithOrders | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [filterRole, setFilterRole] = useState<'' | 'admin' | 'customer'>('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const t = useT()
  const { confirm, confirmProps } = useConfirm()

  useEffect(() => { setPage(1) }, [searchQ, filterRole])

  const filtered = useMemo(() => {
    let list = users
    if (searchQ) {
      const q = searchQ.toLowerCase()
      list = list.filter(u => (u.full_name ?? '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    if (filterRole === 'admin') list = list.filter(u => u.role === 'admin')
    if (filterRole === 'customer') list = list.filter(u => u.role === 'user')
    return list
  }, [users, searchQ, filterRole])

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page, perPage])

  async function handleRoleToggle(id: string, current: 'user' | 'admin') {
    const next = current === 'admin' ? 'user' : 'admin'
    setUpdatingId(id)
    setError(null)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, role: next }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? t.admin.failedUpdateRole)
    } else {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: next } : u))
      if (detail?.id === id) setDetail(prev => prev ? { ...prev, role: next } : prev)
    }
    setUpdatingId(null)
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ message: t.admin.deleteUserConfirm, title: t.admin.deleteUser })
    if (!ok) return
    setError(null)
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? t.admin.failedDeleteUser)
    } else {
      setUsers(prev => prev.filter(u => u.id !== id))
      if (detail?.id === id) setDetail(null)
    }
  }

  const admins = filtered.filter(u => u.role === 'admin').length
  const regular = filtered.filter(u => u.role === 'user').length

  return (
    <div>
      {error && (
        <div style={{ margin: '0 0 16px', padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: 'var(--danger)', fontSize: '.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0 4px' }}><X size={14} /></button>
        </div>
      )}
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{t.admin.users}</h1>
          <p className="admin-page-sub">{filtered.length} {t.admin.registered} — {admins} {t.admin.adminRole}, {regular} {t.admin.customerRole}</p>
        </div>
      </div>

      <div className="admin-filter-toolbar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <AdminSearch value={searchQ} onChange={setSearchQ} placeholder={t.admin.search} />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value as '' | 'admin' | 'customer')}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.82rem', padding: '7px 10px' }}
        >
          <option value="">{t.admin.all}</option>
          <option value="admin">{t.admin.adminRole}</option>
          <option value="customer">{t.admin.customerRole}</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {[t.admin.name, t.admin.email, t.admin.orderCount, t.admin.role, t.admin.joinDate, t.admin.actions].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px' }}>{t.admin.noUsers}</td></tr>
            ) : paginated.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.full_name ?? '—'}</td>
                <td style={{ color: 'var(--text2)' }}>{u.email}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ShoppingBag size={12} style={{ color: 'var(--text2)' }} />
                    <span style={{ color: 'var(--text2)', fontSize: '.85rem' }}>{u.order_count}</span>
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => handleRoleToggle(u.id, u.role)}
                    disabled={updatingId === u.id}
                    title={u.role === 'admin' ? t.admin.revokeAdmin : t.admin.makeAdmin}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px', borderRadius: 20,
                      border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '.75rem',
                      background: u.role === 'admin' ? 'rgba(168,85,247,.15)' : 'rgba(56,189,248,.15)',
                      color: u.role === 'admin' ? '#a855f7' : '#38bdf8',
                      opacity: updatingId === u.id ? 0.5 : 1,
                    }}
                  >
                    {u.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                    {u.role}
                  </button>
                </td>
                <td style={{ color: 'var(--text2)', fontSize: '.82rem' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setDetail(u)}
                      title={t.admin.userDetails}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--primary)' }}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      title={t.admin.deleteUser}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />

      {/* Mobile Cards */}
      <div className="admin-mobile-cards">
        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px 0' }}>{t.admin.noUsers}</div>
        ) : paginated.map(u => (
          <div key={u.id} className="admin-product-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{u.full_name ?? '—'}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 2 }}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setDetail(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--primary)' }}>
                  <Eye size={15} />
                </button>
                <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--danger)' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleRoleToggle(u.id, u.role)}
                style={{
                  padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '.72rem',
                  background: u.role === 'admin' ? 'rgba(168,85,247,.15)' : 'rgba(56,189,248,.15)',
                  color: u.role === 'admin' ? '#a855f7' : '#38bdf8',
                }}
              >
                {u.role}
              </button>
              <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{u.order_count} {t.admin.orders}</span>
              <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{new Date(u.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setDetail(null) }}
        >
          <div className="admin-modal-inner" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.05rem' }}>{t.admin.userDetails}</h2>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>
                {(detail.full_name ?? detail.email)[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{detail.full_name ?? '—'}</div>
                <div style={{ color: 'var(--text2)', fontSize: '.85rem' }}>{detail.email}</div>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: t.admin.role, value: detail.role, highlight: detail.role === 'admin' ? '#a855f7' : '#38bdf8' },
                { label: t.admin.totalOrders, value: String(detail.order_count), highlight: 'var(--primary)' },
                { label: t.admin.userId, value: detail.id.slice(0, 12) + '…', highlight: undefined },
                { label: t.admin.joinDate, value: new Date(detail.created_at).toLocaleDateString(), highlight: undefined },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, color: highlight ?? 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleRoleToggle(detail.id, detail.role)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
                  background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '.85rem', color: 'var(--text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {detail.role === 'admin' ? <><User size={14} /> {t.admin.revokeAdmin}</> : <><ShieldCheck size={14} /> {t.admin.makeAdmin}</>}
              </button>
              <button
                onClick={() => handleDelete(detail.id)}
                style={{
                  padding: '10px 18px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239,68,68,.12)', color: 'var(--danger)',
                  border: '1px solid rgba(239,68,68,.25)', cursor: 'pointer', fontWeight: 700, fontSize: '.85rem',
                }}
              >
                {t.admin.delete}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal {...confirmProps} />
    </div>
  )
}
