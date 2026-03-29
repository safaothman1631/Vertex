import { createClient } from '@/lib/supabase-server'
import HomeClient from '@/components/shop/HomeClient'
import type { Product } from '@/types'

export default async function Home() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('hidden', false)
    .order('created_at', { ascending: false })

  return <HomeClient products={(products as Product[]) ?? []} />
}
