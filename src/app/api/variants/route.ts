import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/variants?product_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')
  if (!productId) return NextResponse.json({ error: 'product_id is required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order')
    .order('name')

  if (error) return NextResponse.json({ error: 'Failed to load variants' }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/variants  — admin: create variant
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const productId     = typeof body.product_id      === 'string' ? body.product_id      : null
    const name          = typeof body.name            === 'string' ? body.name.trim()      : ''
    const value         = typeof body.value           === 'string' ? body.value.trim()     : ''
    const priceModifier = typeof body.price_modifier  === 'number' ? body.price_modifier   : 0
    const stockQty      = typeof body.stock_quantity  === 'number' ? body.stock_quantity   : 99
    const sku           = typeof body.sku             === 'string' ? body.sku.trim()       : null
    const imageUrl      = typeof body.image_url       === 'string' ? body.image_url.trim() : null
    const sortOrder     = typeof body.sort_order      === 'number' ? body.sort_order       : 0

    if (!productId || !name || !value) {
      return NextResponse.json({ error: 'product_id, name, and value are required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('product_variants').insert({
      product_id: productId, name, value,
      price_modifier: priceModifier,
      stock_quantity: stockQty,
      sku: sku || null,
      image_url: imageUrl || null,
      sort_order: sortOrder,
    }).select().single()

    if (error) return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/variants  — admin: update variant
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('product_variants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/variants?id=xxx  — admin: delete variant
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase.from('product_variants').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 })
  return NextResponse.json({ success: true })
}
