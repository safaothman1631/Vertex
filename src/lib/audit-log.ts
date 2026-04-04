import type { SupabaseClient } from '@supabase/supabase-js'

type AuditAction =
  | 'user.role_changed'
  | 'user.deleted'
  | 'backup.created'
  | 'backup.restored'
  | 'notification.broadcast'

interface AuditEntry {
  action: AuditAction
  adminId: string
  targetId?: string
  details?: Record<string, unknown>
}

/**
 * Write an audit log entry to system_logs.
 * Fire-and-forget — errors are caught internally so the caller is not blocked.
 */
export async function auditLog(client: SupabaseClient, entry: AuditEntry) {
  try {
    await client.from('system_logs').insert({
      level: 'info',
      source: 'audit',
      message: entry.action,
      details: {
        admin_id: entry.adminId,
        target_id: entry.targetId,
        ...entry.details,
      },
    })
  } catch {
    // Non-critical — don't let audit failures break the request
    console.error('[audit-log] Failed to write audit entry:', entry.action)
  }
}
