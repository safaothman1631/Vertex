export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: 720 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 24 }}>Privacy Policy</h1>
      <div style={{ color: 'var(--text2)', lineHeight: 1.8, fontSize: '.95rem' }}>
        <p style={{ marginBottom: 16 }}>
          At Vertex, we take your privacy seriously. This page outlines how we collect, use, and protect your personal information.
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '24px 0 12px' }}>Information We Collect</h2>
        <p style={{ marginBottom: 16 }}>
          We collect information you provide directly, such as your name, email address, and shipping address when you create an account or place an order.
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '24px 0 12px' }}>How We Use Your Information</h2>
        <p style={{ marginBottom: 16 }}>
          Your information is used to process orders, improve our services, and communicate with you about your account and purchases.
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '24px 0 12px' }}>Data Protection</h2>
        <p style={{ marginBottom: 16 }}>
          We implement industry-standard security measures to protect your personal data from unauthorized access, alteration, or disclosure.
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '24px 0 12px' }}>Contact</h2>
        <p>
          If you have questions about our privacy practices, please reach out through our <a href="/contact" style={{ color: 'var(--primary)' }}>contact page</a>.
        </p>
      </div>
    </div>
  )
}
