'use client'

import { motion } from 'motion/react'

const ease = [0.16, 1, 0.3, 1] as const

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
        style={{ fontSize: '5rem', marginBottom: 16 }}
      >
        ⚠️
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
        style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}
      >
        Something went wrong
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease }}
        style={{ color: 'var(--text2)', fontSize: '.95rem', maxWidth: 420, lineHeight: 1.7, marginBottom: 28 }}
      >
        An unexpected error occurred. Please try again.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => reset()}
        style={{
          padding: '14px 32px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '.95rem',
          background: 'var(--gradient)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(99,102,241,.25)',
        }}
      >
        Try Again
      </motion.button>
    </div>
  )
}
