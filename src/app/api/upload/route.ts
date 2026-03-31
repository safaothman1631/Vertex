import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  // Verify user is authenticated and is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  // ── Whitelist allowed storage folders to prevent path traversal ──────────
  const ALLOWED_FOLDERS = ['brands', 'products', 'categories', 'promotions', 'avatars'] as const
  const rawFolder = (formData.get('folder') as string | null)?.replace(/[^a-z0-9_-]/g, '') || ''
  const folder: string = (ALLOWED_FOLDERS as readonly string[]).includes(rawFolder) ? rawFolder : 'general'

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const admin = createAdminClient()
  const urls: string[] = []
  const errors: string[] = []

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: unsupported file type`)
      continue
    }
    if (file.size > MAX_SIZE) {
      errors.push(`${file.name}: file too large (max 5MB)`)
      continue
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${folder}/${crypto.randomUUID()}.${ext}`

    const buffer = await file.arrayBuffer()
    const { error } = await admin.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      errors.push(`${file.name}: ${error.message}`)
    } else {
      const { data } = admin.storage.from('images').getPublicUrl(fileName)
      urls.push(data.publicUrl)
    }
  }

  return NextResponse.json({ urls, errors })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can delete uploaded files
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { paths } = await req.json()
  if (!paths?.length) {
    return NextResponse.json({ error: 'No paths provided' }, { status: 400 })
  }

  // Extract storage paths from full URLs
  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/`
  const storagePaths = paths.map((url: string) =>
    url.startsWith(bucketUrl) ? url.slice(bucketUrl.length) : url
  )

  const admin = createAdminClient()
  const { error } = await admin.storage.from('images').remove(storagePaths)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
