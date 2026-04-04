'use client'
import Link from 'next/link'
import FadeIn from '@/components/ui/FadeIn'
import { useT } from '@/contexts/locale'
import { usePreferences } from '@/contexts/preferences'

interface HeroData {
  todayRevenue: number
  revPctChange: number
  avgRating: string
  reviewCount: string
  terminalItems: { name: string; sku: string; price: number }[]
  terminalTotal: number
}

interface StatsData {
  customers: string
  products: string
  brands: string
  orders: string
  support: string
}

const STATS_KEYS: Array<keyof StatsData> = ['customers', 'products', 'brands', 'support']

export default function HeroSection({ statsData, heroData }: { statsData: StatsData; heroData: HeroData }) {
  const t = useT()
  const { formatPrice } = usePreferences()

  return (
    <section id="hero" className="hero">
      <div className="hero-glow" />
      <div className="container">
        <div className="hero-inner">
          {/* Left */}
          <div className="hero-content">
            <div className="hero-badge" style={{ animation: 'anim-fade-down 0.6s var(--ease-smooth) 0.1s both' }}>
              <span className="pulse-dot" />
              {t.hero.badge}
            </div>
            <h1 className="hero-title" style={{ animation: 'anim-fade-up 0.8s var(--ease-smooth) 0.2s both' }}>
              {t.hero.titleLine1}<br />
              {t.hero.titleLine2}<br />
              <span className="gradient-text">{t.hero.titleHighlight}</span>
            </h1>
            <p className="hero-desc" style={{ animation: 'anim-fade-up 0.7s var(--ease-smooth) 0.35s both' }}>
              {t.hero.desc}
            </p>
            <div className="hero-actions" style={{ animation: 'anim-fade-up 0.7s var(--ease-smooth) 0.5s both' }}>
              <Link href="/products" className="btn btn-primary btn-glow">{t.hero.shopNow}</Link>
              <Link href="#brands" className="btn btn-ghost">{t.hero.browseBrands}</Link>
            </div>
            <div className="hero-stats" style={{ animation: 'anim-fade-up 0.6s var(--ease-smooth) 0.65s both' }}>
              {STATS_KEYS.slice(0, 3).map((key) => (
                <div key={key} className="hero-stat">
                  <strong>{statsData[key]}</strong>
                  <span>{t.stats[key as keyof typeof t.stats]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — POS Screen mockup */}
          <div className="hero-visual" style={{ animation: 'anim-blur-in 1s var(--ease-smooth) 0.4s both' }}>
            <div className="pos-screen">
              <div className="pos-header">
                <span>Vertex Terminal</span>
                <span style={{ color: 'var(--green)', fontSize: 11 }}>{t.hero.terminalLive}</span>
              </div>
              <div className="pos-items">
                {heroData.terminalItems.length > 0 ? heroData.terminalItems.map((item) => (
                  <div key={item.sku} className="pos-item">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                      <div className="pos-sku">{item.sku}</div>
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatPrice(item.price)}</div>
                  </div>
                )) : (
                  <div style={{ padding: '12px 0', color: 'var(--text3)', fontSize: 12, textAlign: 'center' }}>No products</div>
                )}
              </div>
              <div className="pos-total">
                <span>{t.hero.total}</span>
                <span>{formatPrice(heroData.terminalTotal)}</span>
              </div>
              <button className="pos-btn">{t.hero.processPayment}</button>
              <div className="pos-pay-methods">
                <span>{t.hero.payCard}</span>
                <span>{t.hero.payNfc}</span>
                <span>{t.hero.payCash}</span>
              </div>
            </div>

            <div className="float-card fc1" style={{ animation: 'anim-slide-up-spring 0.8s var(--ease-spring) 0.9s both' }}>
              <div style={{ color: 'var(--green)', fontWeight: 800, fontSize: 20 }}>
                {heroData.todayRevenue > 0 ? `+$${heroData.todayRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$0'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{t.hero.todaySales}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: heroData.revPctChange >= 0 ? 'var(--green)' : '#ef4444' }}>
                {heroData.revPctChange >= 0 ? '▲' : '▼'} {Math.abs(heroData.revPctChange)}% vs Yesterday
              </div>
            </div>
            <div className="float-card fc2" style={{ animation: 'anim-slide-down-spring 0.8s var(--ease-spring) 1.1s both' }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>★ {heroData.avgRating}/5</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{t.hero.customerRating}</div>
              <div style={{ fontSize: 11, marginTop: 2, opacity: 0.6 }}>{heroData.reviewCount} {t.hero.reviews}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
