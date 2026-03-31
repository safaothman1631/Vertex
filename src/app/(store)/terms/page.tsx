export default function TermsPage() {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: 720 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 24 }}>Terms of Service</h1>
      <div style={{ color: 'var(--text2)', lineHeight: 1.8, fontSize: '.95rem' }}>
        <p style={{ marginBottom: 16 }}>
          By using Vertex, you agree to the following terms and conditions. Please read them carefully.
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '24px 0 12px' }}>Account Responsibilities</h2>
        <p style={{ marginBottom: 16 }}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '24px 0 12px' }}>Orders & Payments</h2>
        <p style={{ marginBottom: 16 }}>
          All orders are subject to product availability. Prices are displayed in USD and may change without notice. Payment is processed securely through Stripe.
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '24px 0 12px' }}>Returns & Refunds</h2>
        <p style={{ marginBottom: 16 }}>
          Please contact our support team regarding returns and refunds. Each case is reviewed individually.
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '24px 0 12px' }}>Contact</h2>
        <p>
          For questions about these terms, please visit our <a href="/contact" style={{ color: 'var(--primary)' }}>contact page</a>.
        </p>
      </div>
    </div>
  )
}
