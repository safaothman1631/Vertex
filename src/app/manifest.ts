import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vertex — Professional POS Equipment',
    short_name: 'Vertex',
    description: 'Shop barcode scanners, POS terminals, receipt printers, and professional POS equipment.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080810',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    categories: ['shopping', 'business'],
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
