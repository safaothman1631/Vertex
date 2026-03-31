import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-server'

// ── Report recipient: set REPORT_EMAIL in your .env.local / Vercel env vars ─
const REPORT_EMAIL = process.env.REPORT_EMAIL
if (!REPORT_EMAIL && process.env.NODE_ENV === 'production') {
  console.error('REPORT_EMAIL environment variable is not set')
}

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!REPORT_EMAIL) {
    return NextResponse.json({ error: 'REPORT_EMAIL not configured' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const admin = createAdminClient()

  // Gather metrics
  const [
    { count: userCount },
    { count: productCount },
    { count: orderCount },
    { count: brandCount },
    { count: categoryCount },
    { count: reviewCount },
    { count: couponCount },
    { count: notifCount },
    { count: trashCount },
    { count: contactCount },
    { count: promoCount },
    { count: errorCount24h },
    { count: adminCount },
    { data: recentOrders },
    { count: outOfStockCount },
    { data: todayOrders },
    { data: newUsers24h },
    { data: recentErrors },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('products').select('*', { count: 'exact', head: true }),
    admin.from('orders').select('*', { count: 'exact', head: true }),
    admin.from('brands').select('*', { count: 'exact', head: true }),
    admin.from('categories').select('*', { count: 'exact', head: true }),
    admin.from('reviews').select('*', { count: 'exact', head: true }),
    admin.from('coupons').select('*', { count: 'exact', head: true }),
    admin.from('notifications').select('*', { count: 'exact', head: true }),
    admin.from('trash').select('*', { count: 'exact', head: true }),
    admin.from('contact_messages').select('*', { count: 'exact', head: true }),
    admin.from('promotions').select('*', { count: 'exact', head: true }),
    admin.from('system_logs').select('*', { count: 'exact', head: true }).eq('level', 'error').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    admin.from('orders').select('id, created_at').order('created_at', { ascending: false }).limit(1),
    admin.from('products').select('*', { count: 'exact', head: true }).eq('in_stock', false),
    admin.from('orders').select('total, status').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    admin.from('profiles').select('id').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    admin.from('system_logs').select('level, source, message, created_at').eq('level', 'error').gte('created_at', new Date(Date.now() - 86400000).toISOString()).order('created_at', { ascending: false }).limit(10),
  ])

  const tableCounts: Record<string, number> = {
    profiles: userCount ?? 0,
    products: productCount ?? 0,
    orders: orderCount ?? 0,
    brands: brandCount ?? 0,
    categories: categoryCount ?? 0,
    reviews: reviewCount ?? 0,
    coupons: couponCount ?? 0,
    notifications: notifCount ?? 0,
    trash: trashCount ?? 0,
    contact_messages: contactCount ?? 0,
    promotions: promoCount ?? 0,
  }

  const totalRows = Object.values(tableCounts).reduce((a, b) => a + b, 0)
  const errCount24 = errorCount24h ?? 0

  // Health scores
  const dbHealth = errCount24 === 0 ? 100 : errCount24 < 3 ? 80 : errCount24 < 10 ? 50 : 20
  const securityHealth = (adminCount ?? 0) <= 3 ? 100 : (adminCount ?? 0) <= 5 ? 80 : 60
  const storageHealth = totalRows < 10000 ? 100 : totalRows < 50000 ? 80 : 60
  const performanceHealth = errCount24 === 0 ? 95 : 70
  const overallHealth = Math.round((dbHealth + securityHealth + storageHealth + performanceHealth) / 4)

  // Today's revenue
  const todayRevenue = (todayOrders ?? []).reduce((s, o) => s + ((o as { total: number }).total ?? 0), 0)
  const todayOrderCount = (todayOrders ?? []).length
  const newUserCount = (newUsers24h ?? []).length

  const healthColor = (score: number) => score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const healthLabel = (score: number) => score >= 80 ? 'Healthy' : score >= 50 ? 'Warning' : 'Critical'

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const errorsHtml = (recentErrors ?? []).length > 0
    ? (recentErrors as { level: string; source: string; message: string; created_at: string }[]).map(e =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#ef4444;font-weight:600">${e.level}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${e.source}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${e.message}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#888;font-size:12px">${new Date(e.created_at).toLocaleTimeString()}</td>
      </tr>`
    ).join('')
    : '<tr><td colspan="4" style="padding:16px;text-align:center;color:#888">No errors in the last 24 hours ✓</td></tr>'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">⚡ Vertex Daily Report</h1>
      <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px">${date}</p>
    </div>

    <div style="background:#fff;border-radius:0 0 16px 16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.06)">
      
      <!-- Overall Health -->
      <div style="text-align:center;margin-bottom:32px">
        <div style="display:inline-block;width:90px;height:90px;border-radius:50%;border:6px solid ${healthColor(overallHealth)};line-height:78px;font-size:32px;font-weight:900;color:${healthColor(overallHealth)}">${overallHealth}</div>
        <p style="margin:8px 0 0;font-weight:700;color:${healthColor(overallHealth)};font-size:16px">${healthLabel(overallHealth)}</p>
      </div>

      <!-- Health Scores Grid -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td style="padding:6px">
            <div style="background:#f8f9fa;border-radius:12px;padding:16px;text-align:center;border-left:4px solid ${healthColor(dbHealth)}">
              <div style="font-size:11px;color:#888;text-transform:uppercase;font-weight:700">Database</div>
              <div style="font-size:28px;font-weight:900;color:${healthColor(dbHealth)}">${dbHealth}</div>
            </div>
          </td>
          <td style="padding:6px">
            <div style="background:#f8f9fa;border-radius:12px;padding:16px;text-align:center;border-left:4px solid ${healthColor(securityHealth)}">
              <div style="font-size:11px;color:#888;text-transform:uppercase;font-weight:700">Security</div>
              <div style="font-size:28px;font-weight:900;color:${healthColor(securityHealth)}">${securityHealth}</div>
            </div>
          </td>
          <td style="padding:6px">
            <div style="background:#f8f9fa;border-radius:12px;padding:16px;text-align:center;border-left:4px solid ${healthColor(storageHealth)}">
              <div style="font-size:11px;color:#888;text-transform:uppercase;font-weight:700">Storage</div>
              <div style="font-size:28px;font-weight:900;color:${healthColor(storageHealth)}">${storageHealth}</div>
            </div>
          </td>
          <td style="padding:6px">
            <div style="background:#f8f9fa;border-radius:12px;padding:16px;text-align:center;border-left:4px solid ${healthColor(performanceHealth)}">
              <div style="font-size:11px;color:#888;text-transform:uppercase;font-weight:700">Perf</div>
              <div style="font-size:28px;font-weight:900;color:${healthColor(performanceHealth)}">${performanceHealth}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- 24h Activity Summary -->
      <h2 style="font-size:16px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #f0f0f0">📊 Last 24 Hours</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td style="padding:8px;text-align:center">
            <div style="font-size:28px;font-weight:900;color:#6366f1">${todayOrderCount}</div>
            <div style="font-size:12px;color:#888;font-weight:600">New Orders</div>
          </td>
          <td style="padding:8px;text-align:center">
            <div style="font-size:28px;font-weight:900;color:#22c55e">$${todayRevenue.toFixed(0)}</div>
            <div style="font-size:12px;color:#888;font-weight:600">Revenue</div>
          </td>
          <td style="padding:8px;text-align:center">
            <div style="font-size:28px;font-weight:900;color:#3b82f6">${newUserCount}</div>
            <div style="font-size:12px;color:#888;font-weight:600">New Users</div>
          </td>
          <td style="padding:8px;text-align:center">
            <div style="font-size:28px;font-weight:900;color:${errCount24 > 0 ? '#ef4444' : '#22c55e'}">${errCount24}</div>
            <div style="font-size:12px;color:#888;font-weight:600">Errors</div>
          </td>
        </tr>
      </table>

      <!-- Database Overview -->
      <h2 style="font-size:16px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #f0f0f0">🗄️ Database Overview</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;font-size:13px">
        ${Object.entries(tableCounts).map(([table, count]) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-weight:600">${table}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:#6366f1;font-weight:700">${count}</td>
          </tr>`
        ).join('')}
        <tr style="background:#f8f9fa">
          <td style="padding:8px 12px;font-weight:800">Total Rows</td>
          <td style="padding:8px 12px;text-align:right;font-weight:800;color:#6366f1">${totalRows}</td>
        </tr>
      </table>

      <!-- Key Metrics -->
      <h2 style="font-size:16px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #f0f0f0">🔑 Key Metrics</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;font-size:13px">
        <tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">Admin Users</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700">${adminCount ?? 0}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">Out of Stock Products</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;color:${(outOfStockCount ?? 0) > 0 ? '#f59e0b' : '#22c55e'}">${outOfStockCount ?? 0}</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">Last Order</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700">${recentOrders?.[0]?.created_at ? new Date(recentOrders[0].created_at).toLocaleDateString() : 'None'}</td></tr>
      </table>

      <!-- Recent Errors -->
      <h2 style="font-size:16px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #f0f0f0">⚠️ Errors (24h)</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;font-size:12px">
        <tr style="background:#f8f9fa">
          <th style="padding:8px 12px;text-align:left;font-weight:700">Level</th>
          <th style="padding:8px 12px;text-align:left;font-weight:700">Source</th>
          <th style="padding:8px 12px;text-align:left;font-weight:700">Message</th>
          <th style="padding:8px 12px;text-align:left;font-weight:700">Time</th>
        </tr>
        ${errorsHtml}
      </table>

      <!-- Footer -->
      <div style="text-align:center;padding-top:20px;border-top:2px solid #f0f0f0;color:#888;font-size:12px">
        <p>This is an automated daily report from <strong>Vertex POS</strong></p>
        <p>Generated at ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
</body>
</html>`

  const { error: emailError } = await resend.emails.send({
    from: 'Vertex System <onboarding@resend.dev>',
    to: REPORT_EMAIL!,
    subject: `Vertex Daily Report — Health: ${overallHealth}/100 ${overallHealth >= 80 ? '✅' : overallHealth >= 50 ? '⚠️' : '🔴'} — ${date}`,
    html,
  })

  if (emailError) {
    // Log the failure
    await admin.from('system_logs').insert({
      level: 'error',
      source: 'cron',
      message: 'Daily report email failed',
      details: { error: emailError.message },
    })
    return NextResponse.json({ error: emailError.message }, { status: 500 })
  }

  // Log success
  await admin.from('system_logs').insert({
    level: 'info',
    source: 'cron',
    message: 'Daily report email sent',
    details: { to: REPORT_EMAIL, health: overallHealth },
  })

  return NextResponse.json({ success: true, health: overallHealth })
}
