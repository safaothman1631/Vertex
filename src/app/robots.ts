import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vertex-pos.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/cart', '/checkout/', '/orders', '/wishlist', '/settings', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
