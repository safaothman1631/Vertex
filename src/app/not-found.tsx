'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

const ease = [0.16, 1, 0.3, 1] as const

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      background: 'var(--bg0)',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        style={{ fontSize: '6rem', marginBottom: 16, filter: 'drop-shadow(0 8px 20px rgba(99,102,241,.15))' }}
      >
        🔍
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
        style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}
      >
        404 — Page Not Found
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease }}
        style={{ color: 'var(--text2)', fontSize: '1rem', maxWidth: 420, lineHeight: 1.7, marginBottom: 28 }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '.95rem',
            background: 'var(--gradient)',
            color: '#fff',
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(99,102,241,.25)',
          }}
        >
          Back to Home
        </Link>
      </motion.div>
    </div>
  )
}
