import type { NextConfig } from "next";
import path from 'path';

const SUPABASE_HOST = 'xlzcnxketisxbuznfipn.supabase.co'

const isDev = process.env.NODE_ENV === 'development'

// ─── Content Security Policy ───────────────────────────────────────────────
const csp = [
  "default-src 'self'",
  // Next.js needs unsafe-inline for its injected scripts; Stripe needs its CDN
  // unsafe-eval in dev + wasm-unsafe-eval always (needed for Spline/Three.js WASM shaders)
  `script-src 'self' 'unsafe-inline' blob: https://js.stripe.com https://maps.googleapis.com https://unpkg.com 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''}`,
  // Inline styles used throughout the app
  "style-src 'self' 'unsafe-inline'",
  // Images: own origin, Supabase storage, base64 data URIs, blobs
  `img-src 'self' data: blob: https://${SUPABASE_HOST} https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://*.googleusercontent.com`,
  // Fonts: own origin + data: URIs
  "font-src 'self' data:",
  // Web Workers: Spline runtime creates blob: URL workers for WebGL rendering
  "worker-src blob: 'self'",
  // XHR / fetch / WebSocket: Supabase REST + Realtime, Stripe API, Nominatim geocoding, Spline CDN
  `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://api.stripe.com https://nominatim.openstreetmap.org https://prod.spline.design https://unpkg.com`,
  // Stripe payment iframe + Google Maps
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://maps.googleapis.com https://maps.google.com https://www.google.com",
  // Never load plugins (Flash, etc.)
  "object-src 'none'",
  // Prevent base-tag hijacking
  "base-uri 'self'",
  // Forms must submit to own origin
  "form-action 'self'",
  // Block mixed content loading
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  // HTTPS-only for 2 years, include sub-domains, allow preload
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Block clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Legacy XSS auditor (older browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Only send origin, not full URL, in Referer header
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser feature access
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  // Enable DNS prefetch
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Full CSP
  { key: 'Content-Security-Policy', value: csp },
]

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Remove the X-Powered-By: Next.js header (information disclosure)
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Fix Vercel middleware tracing for Next.js 16 + Turbopack
  outputFileTracingIncludes: {
    '/middleware': ['./middleware.ts', './src/proxy.ts'],
  },
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: SUPABASE_HOST,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
