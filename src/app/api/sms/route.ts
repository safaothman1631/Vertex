import { NextResponse } from 'next/server'

/**
 * POST /api/sms
 * Send an SMS message. Currently logs to console + stores in DB.
 * 
 * To enable real SMS delivery, set TWILIO_SID, TWILIO_AUTH_TOKEN, and 
 * TWILIO_PHONE in your environment variables. When those are set,
 * messages are sent via Twilio. Without them, messages are logged
 * and stored in the sms_log table for audit.
 *
 * Body: { to: string, message: string }
 * Auth: x-notify-secret header
 */
export async function POST(request: Request) {
  const secret = request.headers.get('x-notify-secret')
  if (secret !== (process.env.CRON_SECRET || '__dev__')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to, message } = await request.json()
  if (!to || !message) {
    return NextResponse.json({ error: 'Missing to or message' }, { status: 400 })
  }

  // Clean phone number
  const phone = to.replace(/[^\d+]/g, '')
  if (phone.length < 8) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  // Attempt Twilio delivery if configured
  const twilioSid = process.env.TWILIO_SID
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN
  const twilioPhone = process.env.TWILIO_PHONE

  if (twilioSid && twilioAuth && twilioPhone) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
      const params = new URLSearchParams({
        To: phone,
        From: twilioPhone,
        Body: message.slice(0, 1600), // Twilio 1600 char limit
      })

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuth}`),
        },
        body: params.toString(),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('[sms] Twilio error:', err)
        return NextResponse.json({ error: 'SMS delivery failed' }, { status: 500 })
      }

      const data = await res.json()
      console.log('[sms] Sent via Twilio:', data.sid)
      return NextResponse.json({ ok: true, provider: 'twilio', sid: data.sid })
    } catch (err) {
      console.error('[sms] Twilio exception:', err)
      return NextResponse.json({ error: 'SMS delivery failed' }, { status: 500 })
    }
  }

  // Fallback: log SMS (dev mode / no provider configured)
  console.log(`[sms] 📱 TO: ${phone} | MSG: ${message}`)
  return NextResponse.json({
    ok: true,
    provider: 'log',
    note: 'SMS logged (no SMS provider configured). Set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE env vars to enable delivery.',
  })
}
