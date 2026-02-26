'use client'
import Link from 'next/link'
import { useT } from '@/contexts/locale'

export default function Footer() {
  const t = useT()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo" style={{ fontSize: '1.4rem' }}>
              <span>Ver<span className="logo-accent">tex</span></span>
            </div>
            <p>{t.footer.desc}</p>
          </div>

          <div className="footer-links">
            <div className="f-col">
              <h4>{t.footer.shopTitle}</h4>
              <Link href="/products">{t.footer.allProducts}</Link>
              <Link href="/products?category=scanners">{t.footer.barcodeScanner}</Link>
              <Link href="/products?category=terminals">{t.footer.posTerminals}</Link>
              <Link href="/products?category=printers">{t.footer.printers}</Link>
              <Link href="/products?category=mobile">{t.footer.mobileComputers}</Link>
            </div>
            <div className="f-col">
              <h4>{t.footer.brandsTitle}</h4>
              <Link href="/products?brand=Honeywell">Honeywell</Link>
              <Link href="/products?brand=Zebra">Zebra</Link>
              <Link href="/products?brand=Ingenico">Ingenico</Link>
              <Link href="/products?brand=Verifone">Verifone</Link>
              <Link href="/products?brand=Epson">Epson</Link>
            </div>
            <div className="f-col">
              <h4>{t.footer.accountTitle}</h4>
              <Link href="/login">{t.footer.signIn}</Link>
              <Link href="/register">{t.footer.signUpFree}</Link>
              <Link href="/orders">{t.footer.myOrders}</Link>
              <Link href="/wishlist">{t.footer.wishlist}</Link>
            </div>
            <div className="f-col">
              <h4>{t.footer.supportTitle}</h4>
              <Link href="/contact">{t.footer.contactUs}</Link>
              <Link href="/admin">{t.footer.adminPanel}</Link>
            </div>
          </div>
        </div>

        <div className="footer-btm">
          <div className="footer-btm-inner">
            <span>© {new Date().getFullYear()} Vertex. {t.footer.rights}</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link href="#">{t.footer.privacy}</Link>
              <Link href="#">{t.footer.terms}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
