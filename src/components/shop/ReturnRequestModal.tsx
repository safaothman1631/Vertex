'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { X, Loader2, Package, CheckCircle2 } from 'lucide-react'
import { RETURN_REASONS } from '@/types'

interface Props {
  orderId: string
  orderNumber: string
  onClose: () => void
}

export default function ReturnRequestModal({ orderId, orderNumber, onClose }: Props) {
  const [reason, setReason]         = useState('')
  const [description, setDesc]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [done, setDone]             = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) { setError('Please select a reason'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, reason, description }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Submission failed'); setSubmitting(false); return }
      setDone(true)
    } catch { setError('Network error — please try again') }
    setSubmitting(false)
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Return Request"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(4px)' }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 480, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontWeight: 800 }}>Request Return</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>Order #{orderNumber.slice(0, 12)}...</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 7, cursor: 'pointer', color: 'var(--text2)' }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle2 size={48} style={{ color: '#22c55e', margin: '0 auto 16px', display: 'block' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Return Request Submitted!</div>
              <p style={{ color: 'var(--text2)', fontSize: '.9rem', marginBottom: 24 }}>
                Our team will review your request within 1–2 business days. You&apos;ll receive an email update.
              </p>
              <button onClick={onClose} style={{ padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Reason select */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '.875rem' }}>
                  Reason for Return *
                </label>
                <select
                  value={reason}
                  onChange={e => { setReason(e.target.value); setError('') }}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text1)', fontSize: '.9rem', appearance: 'auto' }}
                  required
                >
                  <option value="">Select a reason...</option>
                  {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '.875rem' }}>
                  Additional Details <span style={{ color: 'var(--text2)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Describe the issue in more detail..."
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text1)', fontSize: '.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '.75rem', color: 'var(--text2)', textAlign: 'right' }}>{description.length}/1000</div>
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: '.85rem', marginBottom: 12 }} role="alert">{error}</p>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={{ padding: '10px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', color: 'var(--text1)', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !reason} style={{ padding: '10px 20px', background: submitting || !reason ? 'var(--bg3)' : 'var(--accent)', color: submitting || !reason ? 'var(--text2)' : '#fff', border: '1px solid var(--border)', borderRadius: 10, cursor: submitting || !reason ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {submitting && <Loader2 size={14} className="spin" />}
                  Submit Return
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
