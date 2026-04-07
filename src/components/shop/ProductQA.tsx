'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import type { ProductQuestion } from '@/types'
import { createClient } from '@/lib/supabase-client'

interface Props {
  productId: string
}

export default function ProductQA({ productId }: Props) {
  const [questions, setQuestions] = useState<ProductQuestion[]>([])
  const [loading, setLoading]     = useState(true)
  const [asking, setAsking]       = useState(false)
  const [text, setText]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [userId, setUserId]       = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await createClient().auth.getUser()
      setUserId(user?.id ?? null)
    })()
  }, [])

  useEffect(() => {
    fetch(`/api/questions?product_id=${productId}`)
      .then(r => r.json())
      .then(({ data }) => { if (Array.isArray(data)) setQuestions(data) })
      .finally(() => setLoading(false))
  }, [productId])

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    const q = text.trim()
    if (!q || q.length < 5) { setError('Question must be at least 5 characters'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, question: q }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to submit'); return }
      setQuestions(prev => [json.data, ...prev])
      setText('')
      setAsking(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch { setError('Network error') }
    setSubmitting(false)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  return (
    <section className="product-qa-section" aria-label="Product Q&A">
      <div className="qa-header">
        <MessageCircle size={18} />
        <h3>Questions &amp; Answers</h3>
        <span className="qa-count">{questions.length}</span>
      </div>

      {/* Ask button */}
      {userId && !asking && (
        <button className="qa-ask-btn" onClick={() => setAsking(true)}>
          Ask a Question
        </button>
      )}
      {!userId && (
        <p className="qa-login-note">
          <a href="/login" style={{ color: 'var(--accent)' }}>Sign in</a> to ask a question
        </p>
      )}

      {/* Ask form */}
      {asking && (
        <form className="qa-form" onSubmit={handleAsk}>
          <textarea
            className="qa-textarea"
            placeholder="What would you like to know about this product?"
            value={text}
            onChange={e => { setText(e.target.value); setError('') }}
            rows={3}
            maxLength={500}
            autoFocus
          />
          <div className="qa-form-actions">
            <span className="qa-char-count">{text.length}/500</span>
            {error && <span className="qa-error" role="alert">{error}</span>}
            <button type="button" className="qa-cancel-btn" onClick={() => { setAsking(false); setError('') }}>
              Cancel
            </button>
            <button type="submit" className="qa-submit-btn" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="spin" /> : 'Submit'}
            </button>
          </div>
        </form>
      )}

      {success && (
        <div className="qa-success" role="status">
          <CheckCircle2 size={14} />
          Question submitted! Our team will answer soon.
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="qa-loading">
          {[1,2,3].map(i => <div key={i} className="qa-skeleton" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="qa-empty">
          <MessageCircle size={32} opacity={.3} />
          <p>No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <ul className="qa-list">
          {questions.map(q => {
            const isOpen = expanded.has(q.id)
            const hasAnswer = !!q.answer
            return (
              <li key={q.id} className="qa-item">
                <button
                  className="qa-question"
                  onClick={() => toggleExpand(q.id)}
                  aria-expanded={isOpen}
                >
                  <span className="qa-q-icon">Q</span>
                  <span className="qa-q-text">{q.question}</span>
                  <span className="qa-q-meta">
                    {new Date(q.created_at).toLocaleDateString()}
                    {hasAnswer && <span className="qa-answered-badge">✓ Answered</span>}
                  </span>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isOpen && (
                  <div className="qa-answer">
                    {hasAnswer ? (
                      <>
                        <span className="qa-a-icon">A</span>
                        <p>{q.answer}</p>
                        {q.answered_at && (
                          <span className="qa-a-date">Answered {new Date(q.answered_at).toLocaleDateString()}</span>
                        )}
                      </>
                    ) : (
                      <p className="qa-pending">This question is waiting for an answer from our team.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
