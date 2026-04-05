'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])

  const colors = {
    danger: { bg: 'rgba(239,68,68,.12)', icon: 'var(--danger)', btn: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,.12)', icon: '#f59e0b', btn: '#f59e0b' },
    info: { bg: 'rgba(99,102,241,.12)', icon: 'var(--primary)', btn: 'var(--primary)' },
  }[variant]

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.5)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(4px)' }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: 'var(--bg1)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: 28,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 24px 48px rgba(0,0,0,.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: colors.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle size={20} style={{ color: colors.icon }} />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{title}</h3>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: '.92rem', lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: '.9rem',
              background: 'var(--bg3)',
              color: 'var(--text2)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '.9rem',
              background: colors.btn,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  )
}
