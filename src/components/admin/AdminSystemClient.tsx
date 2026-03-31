'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Database, Shield, HardDrive, Zap, AlertTriangle, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp, Server } from 'lucide-react'
import type { SystemLog } from '@/types'
import { useT } from '@/contexts/locale'

interface HealthData {
  tableCounts: Record<string, number>
  totalRows: number
  health: { database: number; security: number; storage: number; performance: number; overall: number }
  errors24h: number
  recentErrors: SystemLog[]
  logs: SystemLog[]
  adminCount: number
  outOfStockCount: number
  lastOrderAt: string | null
}

const LEVEL_CONFIG: Record<string, { color: string; bg: string; badge: string }> = {
  info: { color: '#3b82f6', bg: 'rgba(59,130,246,.1)', badge: 'admin-badge-blue' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,.1)', badge: 'admin-badge-yellow' },
  error: { color: '#ef4444', bg: 'rgba(239,68,68,.1)', badge: 'admin-badge-red' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,.15)', badge: 'admin-badge-red' },
}

function HealthCard({ label, score, icon: Icon, detail }: { label: string; score: number; icon: React.ElementType; detail: string }) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const bg = score >= 80 ? 'rgba(34,197,94,.08)' : score >= 50 ? 'rgba(245,158,11,.08)' : 'rgba(239,68,68,.08)'
  return (
    <div className="admin-card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'center', borderLeft: `4px solid ${color}`, background: bg }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '.92rem' }}>{label}</div>
        <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 2 }}>{detail}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '1.6rem', color }}>{score}</div>
        <div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>/ 100</div>
      </div>
    </div>
  )
}

export default function AdminSystemClient({ initialLogs }: { initialLogs: SystemLog[] }) {
  const t = useT()
  const [health, setHealth] = useState<HealthData | null>(null)
  const [logs, setLogs] = useState<SystemLog[]>(initialLogs)
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system')
      if (res.ok) {
        const data = await res.json()
        setHealth(data)
        setLogs(data.logs ?? initialLogs)
      }
    } catch { /* ignore */ }
    setLoading(false)
    setLastRefresh(new Date())
  }, [initialLogs])

  useEffect(() => { fetchHealth() }, [fetchHealth])

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(fetchHealth, 60000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  const filteredLogs = logs.filter(l => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false
    if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
    return true
  })

  const h = health?.health

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="admin-page-sub">
          {loading ? `${t.admin.loading}...` : t.admin.overallHealth.replace('{score}', String(h?.overall ?? '—'))}
        </p>
        <button onClick={fetchHealth} disabled={loading} className="admin-btn admin-btn-primary" style={{ gap: 6 }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> {t.admin.refresh}
        </button>
      </div>

      {/* Overall Health Indicator */}
      {h && (
        <div className="admin-card" style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
            <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={h.overall >= 80 ? '#22c55e' : h.overall >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="10" strokeDasharray={`${(h.overall / 100) * 327} 327`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontWeight: 900, fontSize: '1.8rem', color: h.overall >= 80 ? '#22c55e' : h.overall >= 50 ? '#f59e0b' : '#ef4444' }}>{h.overall}</span>
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>
            {h.overall >= 80 ? `✓ ${t.admin.systemHealthy}` : h.overall >= 50 ? `⚠ ${t.admin.needsAttention}` : `✕ ${t.admin.criticalIssues}`}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '.82rem', marginTop: 4 }}>
            {t.admin.lastChecked}: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Health Cards */}
      {h && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
          <HealthCard label={t.admin.database} score={h.database} icon={Database} detail={`${health?.totalRows ?? 0} total rows · ${health?.errors24h ?? 0} errors (24h)`} />
          <HealthCard label={t.admin.security} score={h.security} icon={Shield} detail={`${health?.adminCount ?? 0} admin users · RLS enabled`} />
          <HealthCard label={t.admin.storage} score={h.storage} icon={HardDrive} detail={`${Object.keys(health?.tableCounts ?? {}).length} tables active`} />
          <HealthCard label={t.admin.performance} score={h.performance} icon={Zap} detail={health?.lastOrderAt ? `Last order: ${new Date(health.lastOrderAt).toLocaleDateString()}` : 'No orders yet'} />
        </div>
      )}

      {/* Table Row Counts */}
      {health && (
        <div className="admin-card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={16} /> {t.admin.databaseTables}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {Object.entries(health.tableCounts).sort(([, a], [, b]) => b - a).map(([table, count]) => (
              <div key={table} style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{table}</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '.9rem' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Logs */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.05rem' }}>{t.admin.systemLogs}</h2>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.82rem' }}>
          <option value="all">{t.admin.allLevels}</option>
          <option value="info">{t.admin.info}</option>
          <option value="warning">{t.admin.warning}</option>
          <option value="error">{t.admin.error}</option>
          <option value="critical">{t.admin.critical}</option>
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.82rem' }}>
          <option value="all">{t.admin.allSources}</option>
          <option value="api">{t.admin.api}</option>
          <option value="auth">{t.admin.auth}</option>
          <option value="db">{t.admin.dbSource}</option>
          <option value="cron">{t.admin.cron}</option>
          <option value="manual">{t.admin.manual}</option>
        </select>
        <span style={{ fontSize: '.8rem', color: 'var(--text3)' }}>{filteredLogs.length} entries</span>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
          <Activity size={40} style={{ opacity: .3, marginBottom: 12 }} />
          <p>{t.admin.noLogs}</p>
          <p style={{ fontSize: '.82rem', color: 'var(--text3)' }}>{t.admin.logsExplanation}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredLogs.map(log => {
            const cfg = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.info
            const isOpen = expanded === log.id
            return (
              <div key={log.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', borderLeft: `3px solid ${cfg.color}` }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', textAlign: 'left' }}
                >
                  <span className={`admin-badge ${cfg.badge}`} style={{ flexShrink: 0, fontSize: '.7rem' }}>{log.level.toUpperCase()}</span>
                  <span style={{ fontWeight: 600, fontSize: '.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</span>
                  <span style={{ fontSize: '.75rem', color: 'var(--text3)', flexShrink: 0 }}>{log.source}</span>
                  <span style={{ fontSize: '.75rem', color: 'var(--text3)', flexShrink: 0 }}>{new Date(log.created_at).toLocaleString()}</span>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 16px 14px', background: cfg.bg }}>
                    <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 6 }}>
                      <strong>Source:</strong> {log.source} · <strong>Level:</strong> {log.level} · <strong>Time:</strong> {new Date(log.created_at).toLocaleString()}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre style={{ fontSize: '.78rem', background: 'var(--bg0)', padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: 200, color: 'var(--text2)', border: '1px solid var(--border)' }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
