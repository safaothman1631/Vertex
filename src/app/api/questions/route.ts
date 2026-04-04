import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

const limiter = createRateLimiter({ window: 60_000, max: 20 })

// GET /api/questions?product_id=xxx  — list questions for a product
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')
  if (!productId) return NextResponse.json({ error: 'product_id is required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_questions')
    .select('*, user:profiles!product_questions_user_id_fkey(id, full_name, avatar_url)')
    .eq('product_id', productId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/questions  — ask a question
export async function POST(request: Request) {
  const ip = getClientIP(request)
  if (!limiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

    const body = await request.json()
    const productId = typeof body.product_id === 'string' ? body.product_id : null
    const question  = typeof body.question  === 'string' ? body.question.trim().slice(0, 500) : ''

    if (!productId) return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    if (!question || question.length < 5) return NextResponse.json({ error: 'Question too short' }, { status: 400 })

    const { data, error } = await supabase.from('product_questions').insert({
      product_id: productId,
      user_id: user.id,
      question,
      is_public: true,
    }).select().single()

    if (error) return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
