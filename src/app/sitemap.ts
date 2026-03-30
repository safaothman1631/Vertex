import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase-server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vertex-pos.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('hidden', false)
    .order('updated_at', { ascending: false })

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified: p.updated_at || undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date().toISOString(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: new Date().toISOString(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [...staticPages, ...productEntries]
}
