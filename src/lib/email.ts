import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? 'Vertex <onboarding@resend.dev>'
const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─────────────────────────────────────────────────────────
//  Low-level send wrapper (returns null on failure)
// ─────────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to)
    return null
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) { console.error('[email] Resend error:', error); return null }
    return data
  } catch (err) {
    console.error('[email] send error:', err)
    return null
  }
}

// ─────────────────────────────────────────────────────────
//  Shared layout
// ─────────────────────────────────────────────────────────
function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#0d0e1a;color:#eef0f8}
  .wrap{max-width:560px;margin:0 auto;padding:40px 24px}
  .logo{font-size:1.4rem;font-weight:900;color:#fff;margin-bottom:6px}
  .logo span{color:#6366f1}
  .card{background:#131426;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px 24px;margin-top:20px}
  h1{font-size:1.15rem;font-weight:800;margin:0 0 16px;color:#eef0f8}
  p{color:#8891b8;font-size:.9rem;line-height:1.7;margin:0 0 12px}
  .btn{display:inline-block;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff!important;padding:12px 28px;border-radius:8px;font-weight:700;font-size:.9rem;text-decoration:none;margin-top:8px}
  .footer{margin-top:28px;font-size:.75rem;color:#525878;text-align:center}
  table.items{width:100%;border-collapse:collapse;margin:14px 0}
  table.items td{padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:.85rem;color:#8891b8}
  table.items td.val{text-align:right;color:#eef0f8;font-weight:700}
  .badge{display:inline-block;padding:4px 12px;border-radius:100px;font-size:.75rem;font-weight:700;background:rgba(99,102,241,.15);color:#a5b4fc}
  .highlight{color:#6366f1;font-weight:700}
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">Ver<span>tex</span></div>
  <div class="card">
    <h1>${title}</h1>
    ${body}
  </div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} Vertex &bull; <a href="${APP}" style="color:#6366f1;text-decoration:none">Visit Store</a></p>
    <p style="margin-top:4px;font-size:.7rem;color:#525878">You received this email because of your notification preferences.
      <a href="${APP}/settings#notifications" style="color:#525878">Manage preferences</a></p>
  </div>
</div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────
//  Order confirmation (after successful payment)
// ─────────────────────────────────────────────────────────
interface OrderItem { name: string; quantity: number; price: number }

export async function sendOrderConfirmation(
  to: string,
  orderId: string,
  items: OrderItem[],
  total: number,
) {
  const rows = items.map(i =>
    `<tr><td>${i.name} &times; ${i.quantity}</td><td class="val">$${(i.price * i.quantity).toFixed(2)}</td></tr>`
  ).join('')

  const html = layout('Order Confirmed! 🎉', `
    <p>Thank you for your purchase. Your order has been received and is being processed.</p>
    <p>Order ID: <span class="highlight">#${orderId.slice(0, 8).toUpperCase()}</span></p>
    <table class="items">${rows}
      <tr><td style="font-weight:700;color:#eef0f8;border-bottom:none">Total</td>
          <td class="val" style="font-size:1.05rem;border-bottom:none">$${total.toFixed(2)}</td></tr>
    </table>
    <a href="${APP}/orders" class="btn">View Order</a>
  `)

  return send(to, `Order Confirmed #${orderId.slice(0, 8).toUpperCase()}`, html)
}

// ─────────────────────────────────────────────────────────
//  Order status update
// ─────────────────────────────────────────────────────────
const STATUS_EMOJI: Record<string, string> = {
  processing: '⚙️',
  shipped: '🚚',
  delivered: '✅',
  cancelled: '❌',
}

export async function sendOrderStatusEmail(
  to: string,
  orderId: string,
  status: string,
) {
  const emoji = STATUS_EMOJI[status] ?? '📦'
  const html = layout(`Order Status Updated ${emoji}`, `
    <p>Your order <span class="highlight">#${orderId.slice(0, 8).toUpperCase()}</span> has been updated.</p>
    <p style="margin:18px 0">
      New status: <span class="badge">${emoji} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </p>
    ${status === 'shipped' ? '<p>Your package is on its way! You\'ll receive another update when it\'s delivered.</p>' : ''}
    ${status === 'delivered' ? '<p>Your order has been delivered. Enjoy your purchase!</p>' : ''}
    ${status === 'cancelled' ? '<p>If you didn\'t request this cancellation, please contact support.</p>' : ''}
    <a href="${APP}/orders" class="btn">View Order Details</a>
  `)

  return send(to, `Order #${orderId.slice(0, 8).toUpperCase()} — ${status.charAt(0).toUpperCase() + status.slice(1)}`, html)
}

// ─────────────────────────────────────────────────────────
//  Promotional / broadcast email
// ─────────────────────────────────────────────────────────
export async function sendPromoEmail(
  to: string,
  title: string,
  message: string,
) {
  const html = layout(title, `
    <p>${message.replace(/\n/g, '<br>')}</p>
    <a href="${APP}/products" class="btn">Shop Now</a>
  `)
  return send(to, title, html)
}

// ─────────────────────────────────────────────────────────
//  Back-in-stock alert
// ─────────────────────────────────────────────────────────
export async function sendBackInStockEmail(
  to: string,
  productName: string,
  productId: string,
) {
  const html = layout('Item Back in Stock! 📦', `
    <p>Great news! <strong>${productName}</strong> is back in stock and ready to order.</p>
    <p>Don't miss out — popular items sell fast!</p>
    <a href="${APP}/products/${productId}" class="btn">View Product</a>
  `)
  return send(to, `${productName} is back in stock!`, html)
}

// ─────────────────────────────────────────────────────────
//  Wishlist price-drop alert
// ─────────────────────────────────────────────────────────
export async function sendWishlistAlertEmail(
  to: string,
  productName: string,
  productId: string,
  oldPrice: number,
  newPrice: number,
) {
  const pct = Math.round((1 - newPrice / oldPrice) * 100)
  const html = layout('Wishlist Price Drop! 🏷️', `
    <p>An item on your wishlist just got cheaper!</p>
    <p><strong>${productName}</strong></p>
    <p>
      <span style="text-decoration:line-through;color:#525878">$${oldPrice.toFixed(2)}</span>
      &rarr; <span class="highlight" style="font-size:1.1rem">$${newPrice.toFixed(2)}</span>
      <span class="badge" style="margin-left:8px;background:rgba(16,185,129,.15);color:#10b981">-${pct}%</span>
    </p>
    <a href="${APP}/products/${productId}" class="btn">Buy Now</a>
  `)
  return send(to, `Price Drop: ${productName} — now $${newPrice.toFixed(2)}`, html)
}

// ─────────────────────────────────────────────────────────
//  Newsletter
// ─────────────────────────────────────────────────────────
export async function sendNewsletterEmail(
  to: string,
  subject: string,
  content: string,
) {
  const html = layout(subject, `
    <div>${content}</div>
    <a href="${APP}/products" class="btn" style="margin-top:16px">Browse Products</a>
  `)
  return send(to, subject, html)
}
