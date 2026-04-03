export default function CartLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 32 }} />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 8, flexShrink: 0 }} />
              <div className="flex-1">
                <div className="skeleton" style={{ width: 60, height: 12, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: 180, height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 80, height: 16 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="w-full lg:w-72 shrink-0">
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 120, height: 18, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 12 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
