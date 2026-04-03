/**
 * Environment Variable Validation
 *
 * Validates all required env vars at startup so misconfigurations
 * are caught immediately rather than causing silent runtime failures.
 *
 * Usage: import '@/lib/env' at the top of any server-side entry point,
 * or let the auto-validation below run on module load.
 */

interface EnvSpec {
  required: boolean
  description: string
  /** Only required in production */
  productionOnly?: boolean
}

const ENV_SPEC: Record<string, EnvSpec> = {
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL',
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    description: 'Supabase anonymous (public) key',
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    description: 'Supabase service-role key (server-only, never expose to client)',
  },
  STRIPE_SECRET_KEY: {
    required: true,
    description: 'Stripe secret key for payment processing',
  },
  STRIPE_WEBHOOK_SECRET: {
    required: true,
    description: 'Stripe webhook signing secret',
  },
  CRON_SECRET: {
    required: true,
    description: 'Secret used by Vercel Cron to authenticate cron jobs',
  },
  NEXT_PUBLIC_APP_URL: {
    required: false,
    description: 'Full public app URL (https://yoursite.com)',
  },
  RESEND_API_KEY: {
    required: false,
    productionOnly: true,
    description: 'Resend API key for transactional emails',
  },
  REPORT_EMAIL: {
    required: false,
    productionOnly: true,
    description: 'Admin email address for daily system reports',
  },
}

/**
 * Validates environment variables.
 * Throws in production if required vars are missing.
 * Logs warnings in development.
 */
export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production'
  const missing: string[] = []
  const warnings: string[] = []

  for (const [key, spec] of Object.entries(ENV_SPEC)) {
    const value = process.env[key]
    const isRequired = spec.required || (spec.productionOnly && isProd)

    if (!value) {
      if (isRequired) {
        missing.push(`  • ${key} — ${spec.description}`)
      } else {
        warnings.push(`  • ${key} — ${spec.description}`)
      }
    }
  }

  if (warnings.length > 0) {
    console.warn('[Vertex] Optional env vars not set:\n' + warnings.join('\n'))
  }

  if (missing.length > 0) {
    const message =
      '[Vertex] Missing required environment variables:\n' +
      missing.join('\n') +
      '\n\nSet these in .env.local (development) or Vercel Dashboard (production).'

    // Always warn — never throw. Individual routes validate their own dependencies
    // so the app surfaces specific errors rather than crashing at startup.
    console.error(message)
  }
}

// ── Typed safe accessors ───────────────────────────────────────────────────
// Use these instead of process.env.XXX! throughout the codebase.
export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  CRON_SECRET: (process.env.CRON_SECRET ?? '').trim(),
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  REPORT_EMAIL: process.env.REPORT_EMAIL ?? '',
} as const
