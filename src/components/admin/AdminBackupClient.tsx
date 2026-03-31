'use client'

import { useState, useRef } from 'react'
import { Download, Upload, FileJson, AlertTriangle, CheckCircle, Loader2, Shield } from 'lucide-react'
import { useT } from '@/contexts/locale'

interface RestoreResult {
  table: string
  inserted: number
  error?: string
}

export default function AdminBackupClient() {
  const t = useT()
  const [downloading, setDownloading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [preview, setPreview] = useState<{ tables: Record<string, unknown[]>; created_at: string; version: string } | null>(null)
  const [restoreResults, setRestoreResults] = useState<RestoreResult[] | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDownload = async () => {
    setDownloading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/backup')
      if (!res.ok) throw new Error(t.admin.backupFailed)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vertex-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.admin.downloadFailed)
    }
    setDownloading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setRestoreResults(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!data.version || !data.tables) {
          setError(t.admin.invalidFormat)
          return
        }
        setPreview(data)
      } catch {
        setError(t.admin.parseError)
      }
    }
    reader.readAsText(file)
  }

  const handleRestore = async () => {
    if (!preview) return
    setRestoring(true)
    setError('')
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t.admin.restoreFailed)
      setRestoreResults(data.results)
      setPreview(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.admin.restoreFailed)
    }
    setRestoring(false)
  }

  const totalPreviewRows = preview ? Object.values(preview.tables).reduce((s, r) => s + (Array.isArray(r) ? r.length : 0), 0) : 0

  return (
    <div>
      <p className="admin-page-sub" style={{ marginBottom: 24 }}>
        {t.admin.backupDesc}
      </p>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#ef4444', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Download Card */}
        <div className="admin-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>{t.admin.downloadBackupBtn}</h3>
              <p style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{t.admin.downloadBackupDesc}</p>
            </div>
          </div>
          <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5 }}>
            {t.admin.downloadBackupLong}
          </p>
          <button onClick={handleDownload} disabled={downloading} className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
            {downloading ? <><Loader2 size={16} className="spin" /> {t.admin.downloading}...</> : <><Download size={16} /> {t.admin.downloadBackupBtn}</>}
          </button>
        </div>

        {/* Upload Card */}
        <div className="admin-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>{t.admin.restoreBackupBtn}</h3>
              <p style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{t.admin.restoreBackupDesc}</p>
            </div>
          </div>
          <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5 }}>
            {t.admin.restoreBackupLong}
          </p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} className="admin-btn" style={{ width: '100%', justifyContent: 'center', gap: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <FileJson size={16} /> {t.admin.selectFile}
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="admin-card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} /> {t.admin.backupPreview}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6, marginBottom: 16 }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: '.82rem' }}>
              <span style={{ color: 'var(--text3)' }}>{t.admin.version}:</span> <strong>{preview.version}</strong>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: '.82rem' }}>
              <span style={{ color: 'var(--text3)' }}>{t.admin.backupDate}</span> <strong>{new Date(preview.created_at).toLocaleDateString()}</strong>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: '.82rem' }}>
              <span style={{ color: 'var(--text3)' }}>{t.admin.tables}:</span> <strong>{Object.keys(preview.tables).length}</strong>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: '.82rem' }}>
              <span style={{ color: 'var(--text3)' }}>{t.admin.rows}:</span> <strong>{totalPreviewRows}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6, marginBottom: 16 }}>
            {Object.entries(preview.tables).map(([table, rows]) => (
              <div key={table} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                <span style={{ color: 'var(--text2)' }}>{table}</span>
                <strong style={{ color: 'var(--primary)' }}>{Array.isArray(rows) ? rows.length : 0}</strong>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleRestore} disabled={restoring} className="admin-btn admin-btn-primary" style={{ gap: 8 }}>
              {restoring ? <><Loader2 size={14} className="spin" /> {t.admin.restoring}...</> : <><Upload size={14} /> {t.admin.confirmRestore}</>}
            </button>
            <button onClick={() => setPreview(null)} className="admin-btn" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              {t.admin.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Restore Results */}
      {restoreResults && (
        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} color="#22c55e" /> {t.admin.restoreComplete}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {restoreResults.map(r => (
              <div key={r.table} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: r.error ? 'rgba(239,68,68,.06)' : 'var(--bg3)', borderRadius: 8, border: `1px solid ${r.error ? 'rgba(239,68,68,.2)' : 'var(--border)'}` }}>
                <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{r.table}</span>
                {r.error ? (
                  <span style={{ fontSize: '.78rem', color: '#ef4444' }}>{r.error}</span>
                ) : (
                  <span style={{ fontSize: '.85rem', color: r.inserted > 0 ? '#22c55e' : 'var(--text3)', fontWeight: 700 }}>
                    {r.inserted > 0 ? `${r.inserted} rows` : 'skipped'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
