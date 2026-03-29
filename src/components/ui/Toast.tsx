'use client'
import { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; type: ToastType }

const ToastCtx = createContext<(msg: string, type?: ToastType) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)
  const idRef = useRef(0)

  useEffect(() => { setMounted(true) }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const icons = { success: CheckCircle, error: AlertCircle, info: Info }
  const colors = {
    success: { bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)', text: '#10b981' },
    error: { bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)', text: '#ef4444' },
    info: { bg: 'rgba(99,102,241,.12)', border: 'rgba(99,102,241,.3)', text: '#6366f1' },
  }

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {mounted && createPortal(
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
          display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380,
          pointerEvents: 'none',
        }}>
          {toasts.map((t, i) => {
            const Icon = icons[t.type]
            const c = colors[t.type]
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 18px', borderRadius: 14,
                  background: c.bg, border: `1px solid ${c.border}`,
                  backdropFilter: 'blur(20px)',
                  pointerEvents: 'auto', cursor: 'pointer',
                  animation: 'toastIn .35s cubic-bezier(.21,1.02,.73,1) forwards',
                  boxShadow: '0 8px 30px rgba(0,0,0,.25)',
                }}
                onClick={() => remove(t.id)}
              >
                <Icon size={18} style={{ color: c.text, flexShrink: 0 }} />
                <span style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--text)', flex: 1 }}>{t.message}</span>
                <X size={14} style={{ color: 'var(--text2)', flexShrink: 0, opacity: .5 }} />
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  )
}
