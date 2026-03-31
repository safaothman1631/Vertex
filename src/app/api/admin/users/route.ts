import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase-server'

// PATCH /api/admin/users — toggle role for a user
export async function PATCH(request: Request) {
  // Verify requesting user is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, role } = body

  if (!userId || !['user', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Use admin client to bypass RLS
  const adminClient = createAdminClient()

  // ── Guard: cannot demote the last administrator ──────────────────────────
  if (role === 'user') {
    const { data: targetProfile } = await adminClient
      .from('profiles').select('role').eq('id', userId).single()
    if (targetProfile?.role === 'admin') {
      const { count: adminCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')
      if ((adminCount ?? 0) <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last administrator' },
          { status: 400 }
        )
      }
    }
  }
  const { error } = await adminClient
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/admin/users')
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/users — delete a user account
export async function DELETE(request: Request) {
  // Verify requesting user is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  // ── Guard: admin cannot delete their own account via admin panel ──────────
  if (userId === user.id) {
    return NextResponse.json(
      { error: 'Cannot delete your own account from the admin panel' },
      { status: 400 }
    )
  }

  // Use admin client to delete from auth.users (cascades to profiles)
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/admin/users')
  return NextResponse.json({ success: true })
}
