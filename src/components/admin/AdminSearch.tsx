'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface AdminSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounce?: number
}

export default function AdminSearch({ value, onChange, placeholder = 'Search…', debounce = 300 }: AdminSearchProps) {
  const [local, setLocal] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => { setLocal(value) }, [value])

  function handleChange(v: string) {
    setLocal(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), debounce)
  }

  function handleClear() {
    setLocal('')
    onChange('')
  }

  return (
    <div className="admin-search-wrap" style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
      <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
      <input
        type="text"
        value={local}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '7px 32px 7px 32px',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text)',
          fontSize: '.82rem',
          outline: 'none',
        }}
      />
      {local && (
        <button onClick={handleClear} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 2 }}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}
