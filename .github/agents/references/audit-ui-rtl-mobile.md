### 🎨 §17. پشکنینی CSS و Design System

```
📋 CSS Audit:
□ Tailwind CSS 4 with @theme directive
□ cn() utility (clsx + tailwind-merge)
□ CSS custom properties for theming
□ Container queries (@container) where needed
□ Cascade layers (@layer) for specificity management
□ CSS nesting (native)
□ Logical properties (start/end, not left/right) — see §36
□ GPU animations only (transform, opacity) — avoid animating width/height/top
□ content-visibility: auto for long lists
□ prefers-reduced-motion respected
□ No !important abuse
□ Mobile-first (@media min-width)
```

---

### 🎬 §17.B پشکنینی ئەنیمەیشن، مۆشن، و ترانزیشن — ئاستی جیهانی

> ئەم بەشە تایبەتە بە هەموو ئەو ئەنیمەیشن و مۆشنانەی کە وێبسایتێکی مۆدێرن و جیهانی دەیانبێت.
> لە page transitions بۆ scroll-driven parallax, لە micro-interactions بۆ hero animations.

#### A. Motion Philosophy — فەلسەفەی جوڵە
```
📋 Motion Principles:
□ Purpose: هەموو ئەنیمەیشنێک مەعنایەکی هەیە (نەک تەنها جوانی)
□ Performance: تەنها transform + opacity ئەنیمەیت بکە (GPU-accelerated) 
□ Subtlety: ئەنیمەیشنی نەرم و ئاسایی — نەک زۆر بەرچاو (200-500ms)
□ Accessibility: prefers-reduced-motion ڕێز بگرە — ئەنیمەیشن لابدە بۆ ئەوانەی ناویانەوێ
□ Consistency: هەمان timing function لە هەموو ئەپەکەدا
□ Direction-aware: RTL-safe — جوڵەکان لە RTL فلیپ بکە
□ Interruptible: ئەنیمەیشن قوت مەکە — بەکارهێنەر دەتوانێ لە ناوەڕاستدا هەڵبوەشێنێتەوە
```

#### B. CSS Motion System — سیستەمی ئەنیمەیشنی Tailwind
```css
/* ✅ globals.css — Design Tokens بۆ ئەنیمەیشن */
@theme {
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);

  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 350ms;
  --duration-slow: 500ms;
  --duration-dramatic: 800ms;
  --duration-cinematic: 1200ms;
}

/* ✅ Reduced Motion — Global Override */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ✅ Keyframe Library */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-down {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-start {
  /* RTL-safe: uses logical direction */
  from { opacity: 0; transform: translateX(calc(var(--dir, 1) * 40px)); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes scale-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes slide-up-spring {
  0% { opacity: 0; transform: translateY(100%); }
  60% { opacity: 1; transform: translateY(-5%); }
  100% { transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(37, 99, 235, 0); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes count-up {
  from { --num: 0; }
}

@keyframes reveal-mask {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}

@keyframes blur-in {
  from { opacity: 0; filter: blur(12px); }
  to { opacity: 1; filter: blur(0); }
}

/* ✅ Stagger system for lists */
.stagger-children > * {
  animation: fade-up var(--duration-normal) var(--ease-smooth) both;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 80ms; }
.stagger-children > *:nth-child(3) { animation-delay: 160ms; }
.stagger-children > *:nth-child(4) { animation-delay: 240ms; }
.stagger-children > *:nth-child(5) { animation-delay: 320ms; }
.stagger-children > *:nth-child(6) { animation-delay: 400ms; }
.stagger-children > *:nth-child(7) { animation-delay: 480ms; }
.stagger-children > *:nth-child(8) { animation-delay: 560ms; }
```

#### C. Scroll-Driven Animations — ئەنیمەیشنی سکرۆڵ (CSS-only)
```css
/* ✅ Scroll-driven animations — بەبێ JavaScript! (CSS Scroll Timeline) */

/* Hero image parallax on scroll */
@keyframes parallax-up {
  from { transform: translateY(0); }
  to { transform: translateY(-100px); }
}

.hero-parallax {
  animation: parallax-up linear;
  animation-timeline: scroll();
  animation-range: 0vh 80vh;
}

/* Fade + scale on scroll — section reveal */
@keyframes scroll-reveal {
  from {
    opacity: 0;
    transform: translateY(60px) scale(0.95);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.scroll-reveal {
  animation: scroll-reveal linear both;
  animation-timeline: view();
  animation-range: entry 10% entry 60%;
}

/* Progress bar that fills based on scroll position */
.scroll-progress {
  position: fixed;
  top: 0;
  inset-inline: 0;
  height: 3px;
  background: var(--color-primary);
  transform-origin: 0 0;
  animation: grow-x linear;
  animation-timeline: scroll();
  scale: 0 1;
}
@keyframes grow-x { to { scale: 1 1; } }

/* Horizontal scroll section — cards scroll sideways */
@keyframes scroll-horizontal {
  to { transform: translateX(calc(-100% + 100vw)); }
}

.horizontal-scroll-section {
  animation: scroll-horizontal linear;
  animation-timeline: scroll(nearest block);
}
```
```typescript
// ✅ Intersection Observer + CSS — Scroll Reveal Component
'use client'
import { useEffect, useRef, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'start' | 'end' | 'scale' | 'blur'
  duration?: number
  once?: boolean
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 600,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animationPlayState = 'running'
          if (once) observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const directionMap = {
    up: 'fade-up',
    down: 'fade-down',
    start: 'slide-in-start',
    end: 'slide-in-start', // CSS handles RTL via --dir
    scale: 'scale-in',
    blur: 'blur-in',
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        animation: `${directionMap[direction]} ${duration}ms var(--ease-smooth) ${delay}ms both`,
        animationPlayState: 'paused', // Plays when in viewport
      }}
    >
      {children}
    </div>
  )
}

// ✅ Usage:
// <ScrollReveal direction="up" delay={200}>
//   <ProductCard product={product} />
// </ScrollReveal>
```

#### D. Hero & Image Cinematic Effects — وێنەی ناوازەی سکرۆڵ
```typescript
// ✅ Parallax Hero — 3D Depth Effect on Scroll
'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export function ParallaxHero({
  src, alt, title, subtitle,
}: {
  src: string; alt: string; title: string; subtitle?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const parallaxOffset = scrollY * 0.4   // Image moves slower → depth illusion
  const textOffset = scrollY * 0.15       // Text moves even slower
  const opacity = Math.max(0, 1 - scrollY / 600) // Fade out as scroll
  const scale = 1 + scrollY * 0.0003     // Subtle zoom on scroll
  const blur = Math.min(scrollY / 200, 6) // Progressive blur

  return (
    <section
      ref={containerRef}
      className="relative h-[80vh] overflow-hidden"
    >
      {/* Background image — parallax layer */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translateY(${parallaxOffset}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Text content — different parallax speed */}
      <div
        className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4"
        style={{
          transform: `translateY(${textOffset}px)`,
          opacity,
        }}
      >
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
            style={{ animation: 'fade-up 800ms var(--ease-smooth) 200ms both' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl"
             style={{ animation: 'fade-up 800ms var(--ease-smooth) 500ms both' }}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}

// ✅ Usage:
// <ParallaxHero
//   src="/images/hero-banner.webp"
//   alt="NexPOS Collection"
//   title="کۆلێکشنی نوێ"
//   subtitle="بەرهەمە تازەکان ببینە"
// />
```

```typescript
// ✅ 3D Product Image — Tilt on Mouse Move (Glassmorphism Card)
'use client'
import { useRef, useState, type MouseEvent } from 'react'
import Image from 'next/image'

export function TiltProductCard({ product }: { product: Product }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 })

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = cardRef.current!.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width   // 0 to 1
    const y = (e.clientY - rect.top) / rect.height    // 0 to 1
    const rotateX = (y - 0.5) * -15   // -7.5 to 7.5 degrees
    const rotateY = (x - 0.5) * 15    // -7.5 to 7.5 degrees

    setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`)
    setGlarePos({ x: x * 100, y: y * 100 })
  }

  function handleMouseLeave() {
    setTransform('perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)')
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{
        transform,
        transition: 'transform 400ms var(--ease-smooth)',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Product Image */}
      <Image
        src={product.images?.[0] || '/images/placeholder.webp'}
        alt={product.name}
        width={400}
        height={400}
        className="object-cover aspect-square"
      />

      {/* Light reflection glare effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
        }}
      />

      {/* Glassmorphism info overlay */}
      <div className="absolute bottom-0 inset-x-0 p-4 backdrop-blur-md bg-white/10 border-t border-white/20
                      translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[var(--ease-smooth)]">
        <h3 className="font-semibold text-white">{product.name}</h3>
        <p className="text-white/80" dir="ltr">{formatIQD(product.price)}</p>
      </div>
    </div>
  )
}
```

```typescript
// ✅ Image Reveal on Scroll — Cinematic Mask Effect
'use client'
export function ImageReveal({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          observer.unobserve(el)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl"
      style={{
        clipPath: 'inset(0 100% 0 0)', // Hidden initially
        transition: 'clip-path 1.2s var(--ease-out-expo)',
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={800}
        height={600}
        className="object-cover scale-110"
        style={{
          transition: 'transform 1.5s var(--ease-out-expo)',
        }}
      />
      <style jsx>{`
        .revealed { clip-path: inset(0 0 0 0) !important; }
        .revealed img { transform: scale(1) !important; }
      `}</style>
    </div>
  )
}
```

#### E. Page & Route Transitions — گواستنەوەی نەرم لە نێوان لاپەڕەکان
```typescript
// ✅ View Transitions API — Next.js App Router
// layout.tsx — Enable view transitions globally
import { ViewTransitions } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ckb" dir="rtl">
      <body>
        <ViewTransitions>
          {children}
        </ViewTransitions>
      </body>
    </html>
  )
}
```
```css
/* ✅ View Transition Animations */
/* Cross-fade (default) */
::view-transition-old(root) {
  animation: fade-out 300ms var(--ease-smooth);
}
::view-transition-new(root) {
  animation: fade-in 300ms var(--ease-smooth);
}

/* Slide transition between pages */
::view-transition-old(page-content) {
  animation: slide-out-start 400ms var(--ease-in-out-quart);
}
::view-transition-new(page-content) {
  animation: slide-in-end 400ms var(--ease-in-out-quart);
}

@keyframes slide-out-start {
  to { opacity: 0; transform: translateX(calc(var(--dir, 1) * -30px)); }
}
@keyframes slide-in-end {
  from { opacity: 0; transform: translateX(calc(var(--dir, 1) * 30px)); }
}

/* Shared element transitions — product card → product page */
.product-card-image {
  view-transition-name: product-hero;
}
.product-page-hero {
  view-transition-name: product-hero;
}

::view-transition-group(product-hero) {
  animation-duration: 500ms;
  animation-timing-function: var(--ease-smooth);
}
```
```typescript
// ✅ Link with View Transition
import Link from 'next/link'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group">
      <Image
        src={product.images?.[0]}
        alt={product.name}
        width={300}
        height={300}
        className="product-card-image"
        style={{ viewTransitionName: `product-${product.id}` }}
      />
      <h3 style={{ viewTransitionName: `product-title-${product.id}` }}>
        {product.name}
      </h3>
    </Link>
  )
}
```

#### F. Micro-Interactions — وردە جوڵەکان
```typescript
// ✅ Button with Ripple Effect + Press Scale
'use client'
export function RippleButton({ children, onClick, className, ...props }: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const button = buttonRef.current!
    const rect = button.getBoundingClientRect()
    const ripple = document.createElement('span')
    const size = Math.max(rect.width, rect.height) * 2
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple-expand 600ms linear;
      pointer-events: none;
    `
    button.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
    onClick?.(e)
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden',
        'active:scale-[0.97] transition-transform duration-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// In globals.css:
// @keyframes ripple-expand { to { transform: scale(1); opacity: 0; } }
```

```typescript
// ✅ Add-to-Cart Fly Animation
'use client'
export function FlyToCartButton({
  product,
  cartIconRef,
}: {
  product: Product
  cartIconRef: React.RefObject<HTMLElement>
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  function handleClick() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      addToCart(product.id)
      return
    }

    // Create flying element
    const btn = buttonRef.current!
    const cart = cartIconRef.current!
    const btnRect = btn.getBoundingClientRect()
    const cartRect = cart.getBoundingClientRect()

    const flyEl = document.createElement('div')
    flyEl.style.cssText = `
      position: fixed;
      z-index: 9999;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--color-primary);
      left: ${btnRect.left + btnRect.width / 2 - 25}px;
      top: ${btnRect.top + btnRect.height / 2 - 25}px;
      pointer-events: none;
      transition: all 800ms cubic-bezier(0.2, 1, 0.3, 1);
    `
    document.body.appendChild(flyEl)

    // Trigger animation
    requestAnimationFrame(() => {
      flyEl.style.left = `${cartRect.left + cartRect.width / 2 - 10}px`
      flyEl.style.top = `${cartRect.top + cartRect.height / 2 - 10}px`
      flyEl.style.width = '20px'
      flyEl.style.height = '20px'
      flyEl.style.opacity = '0.5'
    })

    // Cleanup + cart bounce
    setTimeout(() => {
      flyEl.remove()
      cart.style.animation = 'scale-bounce 400ms var(--ease-spring)'
      setTimeout(() => { cart.style.animation = '' }, 400)
      addToCart(product.id)
    }, 800)
  }

  return (
    <button ref={buttonRef} onClick={handleClick}
      className="active:scale-95 transition-transform">
      زیادکردن بۆ سەبەتە
    </button>
  )
}
```

```typescript
// ✅ Number Counter Animation (Animated Stats)
'use client'
export function AnimatedCounter({
  target,
  duration = 2000,
  suffix = '',
}: {
  target: number
  duration?: number
  suffix?: string
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now()
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1)
          // Ease-out curve
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        observer.unobserve(el)
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref} dir="ltr">{count.toLocaleString()}{suffix}</span>
}

// <AnimatedCounter target={25000} suffix=" IQD" />
// <AnimatedCounter target={1500} suffix="+" />
```

#### G. Component Transitions — مۆشنی کۆمپۆنێنت
```typescript
// ✅ Modal with Spring Animation
'use client'
export function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ animation: 'fade-in 200ms var(--ease-smooth)' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal content */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                   max-w-lg w-full max-h-[85vh] overflow-y-auto"
        style={{
          animation: 'scale-in 350ms var(--ease-spring)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
```
```typescript
// ✅ Toast Notification with Slide + Timer
'use client'
export function Toast({
  message, type, onDismiss, duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <div
      role="alert"
      className={cn(
        'fixed bottom-4 end-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
        'border backdrop-blur-sm max-w-sm',
        type === 'success' && 'bg-green-50/90 border-green-200 text-green-800',
        type === 'error' && 'bg-red-50/90 border-red-200 text-red-800',
      )}
      style={{
        animation: 'slide-up-spring 500ms var(--ease-spring)',
      }}
    >
      <span>{message}</span>
      <button onClick={onDismiss} className="ms-auto p-1 hover:bg-black/5 rounded">✕</button>
      {/* Progress bar showing time remaining */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-current/20 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-current/40"
          style={{ animation: `shrink-x ${duration}ms linear forwards` }}
        />
      </div>
    </div>
  )
}
// globals.css: @keyframes shrink-x { from { width: 100%; } to { width: 0%; } }
```

```typescript
// ✅ Drawer / Side Panel — RTL-aware Slide
'use client'
export function Drawer({
  isOpen,
  onClose,
  side = 'end', // 'start' or 'end' — RTL-safe
  children,
}: DrawerProps) {
  const isStart = side === 'start'

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          style={{ animation: 'fade-in 200ms var(--ease-smooth)' }}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 z-50 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl',
          'transition-transform duration-300 ease-[var(--ease-smooth)]',
          isStart ? 'start-0' : 'end-0',
          isOpen
            ? 'translate-x-0'
            : isStart
              ? 'ltr:-translate-x-full rtl:translate-x-full'
              : 'ltr:translate-x-full rtl:-translate-x-full',
        )}
      >
        {children}
      </div>
    </>
  )
}
```

#### H. Scroll-Triggered Smart Animations
```typescript
// ✅ Horizontal Scroll Gallery — Products scroll sideways as user scrolls down
'use client'
export function HorizontalScrollGallery({ images }: { images: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const container = containerRef.current!
    const track = trackRef.current!

    const observer = new IntersectionObserver(() => {}, { threshold: 0 })

    function onScroll() {
      const rect = container.getBoundingClientRect()
      const scrollProgress = -rect.top / (rect.height - window.innerHeight)
      const clampedProgress = Math.max(0, Math.min(1, scrollProgress))
      const maxScroll = track.scrollWidth - window.innerWidth
      track.style.transform = `translateX(${-clampedProgress * maxScroll}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={containerRef} className="h-[300vh] relative">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <div
          ref={trackRef}
          className="flex gap-6 px-8 will-change-transform"
          style={{ transition: 'transform 100ms linear' }}
        >
          {images.map((src, i) => (
            <div key={i} className="flex-shrink-0 w-[70vw] md:w-[40vw] h-[60vh] rounded-2xl overflow-hidden">
              <Image src={src} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

```typescript
// ✅ Text Reveal — Characters Animate One by One
'use client'
export function TextReveal({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <h2 ref={ref} className={cn('overflow-hidden', className)}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: `all 500ms var(--ease-smooth) ${i * 30}ms`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h2>
  )
}

// <TextReveal text="بەخێربێیت بۆ نێکسپۆس" className="text-4xl font-bold" />
```

```typescript
// ✅ Magnetic Button — Follows cursor when hovering
'use client'
export function MagneticButton({
  children, className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null)

  function handleMouseMove(e: React.MouseEvent) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const btn = ref.current!
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`
  }

  function handleMouseLeave() {
    ref.current!.style.transform = 'translate(0, 0)'
  }

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('transition-transform duration-200 ease-out', className)}
      {...props}
    >
      {children}
    </button>
  )
}
```

#### I. Motion Audit Checklist — لیستی پشکنینی ئەنیمەیشن
```
📋 Motion Audit:
□ هەموو ئەنیمەیشنەکان تەنها transform + opacity بەکاردەهێنن (GPU layer)
□ will-change تەنها لەسەر ئەو ئیلیمێنتانەی کە خێرا ئەنیمەیت دەبن
□ prefers-reduced-motion: reduce — هەموو ئەنیمەیشنەکان لادەچن
□ Animation duration ≤ 800ms (بەبێ cinematic hero)
□ Stagger delay ≤ 80ms per item (زۆر مەکە)
□ No layout thrashing (width, height, top, left ئەنیمەیت مەکە)
□ requestAnimationFrame بۆ scroll handlers (نەک raw scroll event)
□ passive: true لەسەر scroll/touch listeners
□ IntersectionObserver بۆ scroll reveal (نەک scroll event + getBoundingClientRect)
□ cleanup لە useEffect (observer.disconnect, removeEventListener)
□ RTL-aware: slide directions فلیپ دەبن
□ No jank on low-end devices (test on throttled CPU)
□ Touch gestures نەرمن (no 300ms delay — touch-action: manipulation)
□ Loading skeletons دەرکەون بەبێ flash (min 200ms display)
□ View Transition names unique (no duplicates on same page)
□ Animations don't block main thread (no JS-heavy animations)
```
```bash
# Audit grep commands
# Non-GPU animations (BAD)
grep -rn "animate-\[.*width\|animate-\[.*height\|animate-\[.*top\|animate-\[.*left" src/ --include="*.tsx"
grep -rn "transition:.*width\|transition:.*height\|transition:.*top\|transition:.*left" src/ --include="*.css"

# Missing reduced motion
grep -rn "animation:\|@keyframes" src/ --include="*.css" | head -5
grep -rn "prefers-reduced-motion" src/ --include="*.css" | wc -l
# ⚠️ If animations > 0 but reduced-motion = 0 → FAIL

# Missing passive listener
grep -rn "addEventListener.*scroll\|addEventListener.*touch" src/ --include="*.tsx" | grep -v "passive"

# Missing cleanup
grep -rn "IntersectionObserver\|addEventListener" src/ --include="*.tsx" -l | while read f; do
  grep -qL "disconnect\|removeEventListener" "$f" && echo "⚠️ No cleanup: $f"
done

# View Transition name conflicts
grep -rn "viewTransitionName\|view-transition-name" src/ --include="*.tsx" --include="*.css"
```

#### J. Performance-Safe Motion Patterns
```
📊 Animation Performance Rules:

✅ GPU-accelerated (Compositor Thread):
  transform: translate, scale, rotate
  opacity
  filter: blur, brightness
  clip-path (with care)
  
❌ Layout-triggering (Main Thread — JANK!):
  width, height, min-*, max-*
  padding, margin, border-width
  top, left, right, bottom
  font-size, line-height
  display, position
  
⚠️ Paint-only (acceptable but not ideal):
  color, background-color
  box-shadow
  text-decoration
  outline
  border-color, border-radius
  visibility

📊 When to Use Each Tool:
CSS @keyframes → Simple, declarative, best performance
CSS transition → Hover, focus, state changes
CSS scroll-timeline → Scroll-driven, zero JS (newest!)
IntersectionObserver → Scroll reveal, lazy triggers
requestAnimationFrame → Complex scroll parallax
Framer Motion → Complex orchestrated sequences, layout animations, drag
React Spring → Physics-based springs
GSAP → Timeline sequences, SVG animation, complex scroll (ScrollTrigger)
Lottie → Designer-created vector animations (After Effects export)
```

---


### 🔄 §36. پشکنینی RTL و سیستەمی کوردی/عەرەبی — ئاستی پسپۆڕ

#### A. Document Level
```
□ <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}> — dynamic
□ Font: NRT, Noto Sans Arabic loaded
□ base font-size ≥ 16px
□ line-height ≥ 1.8 بۆ کوردی
```

#### B. CSS Logical Properties
```
📋 Physical → Logical Mapping (Tailwind):
ml-{n} → ms-{n}  (margin-inline-start)
mr-{n} → me-{n}  (margin-inline-end)
pl-{n} → ps-{n}  (padding-inline-start)
pr-{n} → pe-{n}  (padding-inline-end)
text-left → text-start
text-right → text-end
left-0 → start-0
right-0 → end-0
float-left → float-start
float-right → float-end
border-l → border-s
border-r → border-e
rounded-l → rounded-s
rounded-r → rounded-e
scroll-ml → scroll-ms
scroll-mr → scroll-me
```
```bash
# CRITICAL: find RTL-breaking physical properties
grep -rn "ml-\|mr-\|pl-\|pr-" src/ --include="*.tsx" | grep -v "ms-\|me-\|ps-\|pe-\|mx-\|my-\|px-\|py-\|m-\|p-"
grep -rn "text-left\|text-right" src/ --include="*.tsx" | grep -v "text-start\|text-end"
grep -rn "left-\|right-" src/ --include="*.tsx" | grep -v "start-\|end-\|inset-"
grep -rn "rounded-l\|rounded-r" src/ --include="*.tsx" | grep -v "rounded-s\|rounded-e"
grep -rn "border-l-\|border-r-" src/ --include="*.tsx" | grep -v "border-s-\|border-e-"
grep -rn "float-left\|float-right" src/ --include="*.tsx"
```

#### C. Bidirectional Text & Unicode BiDi
```
□ Numbers always LTR: dir="ltr" on price, phone, date elements
□ Mixed text: use <bdi> for user-generated content in opposite direction
□ Kurdish special characters supported: ڕ ڵ ۆ ێ ژ ڤ گ
□ Unicode BiDi algorithm not overridden incorrectly
```
```typescript
// ✅ Price Display — Always LTR Direction
function PriceDisplay({ price }: { price: number }) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(price)
  
  return (
    <span dir="ltr" className="inline-block font-mono">
      {formatted} <span className="text-sm">IQD</span>
    </span>
  )
  // ✅ dir="ltr" prevents RTL from reversing "25,000 IQD" → "IQD 25,000"
}

// ✅ Phone Input — LTR Inside RTL Layout
<input
  type="tel"
  inputMode="tel"
  dir="ltr"
  placeholder="0750 123 4567"
  className="text-start"  // ← start, not left!
  autoComplete="tel"
/>

// ✅ Mixed Content — <bdi> for User Names in RTL Context
<p>
  بینەری نوێ: <bdi>{user.full_name}</bdi> تۆمارکرا
  {/* <bdi> isolates LTR name like "John Smith" from breaking RTL flow */}
</p>
```

#### D. Icon Flip Rules
```
FLIP in RTL ↔️:        DON'T FLIP ⛔:
← → arrows             🔍 search
◀ ▶ chevrons            ❤️ heart/like
↩ undo/redo             🛒 cart
📤 share                ✏️ edit
🔙 back/forward         🗑️ delete
📋 list indent          ⭐ star
📂 folder open          🔔 notification
⏮ ⏭ media skip         📷 camera
                         🔒 lock
                         ☰ hamburger
                         ✓ checkmark
```

#### E. RTL Visual Checks
```
□ Header: logo right, nav left (RTL) — flipped from LTR
□ Sidebar: opens from right
□ Breadcrumbs: right-to-left order
□ Forms: text inputs right-aligned
□ Tables: columns right-to-left
□ Animations: slide directions flipped
□ Scrollbar: on left side in RTL
□ Phone/number inputs: dir="ltr" + inputMode="tel"
```

---

### 📱 §37. پشکنینی Mobile Responsive — ئاستی پسپۆڕ

#### A. Mobile-First Methodology
```
📋 Mobile Checklist:
□ Mobile-first CSS (min-width breakpoints)
□ Touch targets ≥ 44×44px (WCAG 2.5.8)
□ Input font-size ≥ 16px (prevents iOS zoom)
□ Safe areas: env(safe-area-inset-*) for notched devices
□ No horizontal overflow on mobile
□ Sticky header with auto-hide on scroll down
□ Bottom navigation on mobile (if applicable)
```

#### B. Mobile Forms
```
□ inputMode attribute:
  text → text, email → email, phone → tel
  number → numeric, search → search, url → url
□ enterKeyHint: search → "search", next → "next", done → "done", send → "send"
□ autocomplete attributes (name, email, tel, address)
□ Virtual keyboard doesn't overlap inputs (scroll into view)
```

#### C. Mobile Performance Budget
```
| Metric | Target |
|--------|--------|
| First Load JS | < 80kB (3G) |
| LCP | < 3s (mobile) |
| INP | < 200ms |
| Total page weight | < 1MB |
| Image count above fold | ≤ 3 |
```

#### D. Mobile Testing
```bash
# Viewport meta tag
grep -rn "viewport" src/app/layout.tsx
# Touch targets too small
grep -rn "p-1\b\|p-0\.5\|w-4\b\|h-4\b\|w-3\b\|h-3\b" src/ --include="*.tsx" | grep -i "button\|link\|click\|tap"
# Missing inputMode on inputs
grep -rn "type=\"tel\"\|type=\"email\"\|type=\"number\"" src/ --include="*.tsx" | grep -v "inputMode"
```

---


### 📝 §50. پشکنینی Form Validation & UX

```
📋 Form UX Checklist:
□ Client validation: onBlur (instant feedback, not onSubmit only)
□ Server validation: ALWAYS (Zod — client validation is UX, server is security)
□ Error messages in Kurdish
□ aria-invalid + aria-describedby on error fields
□ Phone inputs: dir="ltr" + inputMode="tel"
□ Submit button disabled while isPending (useTransition)
□ Required fields marked with *
□ FormField reusable component
□ Server-side type checking (typeof === 'string') + length limits
```
```typescript
// ✅ Complete Form Pattern — Client + Server Validation
'use client'
import { useTransition, useId } from 'react'
import { useLocale } from '@/contexts/locale'

export function ContactForm() {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { t } = useLocale()
  const emailId = useId()
  const messageId = useId()
  
  // Client validation (UX feedback)
  function validateField(name: string, value: string) {
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({ ...prev, email: t.errors.invalidEmail }))
    } else if (name === 'message' && value.length < 10) {
      setErrors(prev => ({ ...prev, message: t.errors.tooShort }))
    } else {
      setErrors(prev => { const { [name]: _, ...rest } = prev; return rest })
    }
  }
  
  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitContactForm(formData) // Server Action
      if (result?.errors) setErrors(result.errors)
    })
  }
  
  return (
    <form action={handleSubmit}>
      <div>
        <label htmlFor={emailId}>ئیمەیڵ *</label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          onBlur={(e) => validateField('email', e.target.value)}
        />
        {errors.email && (
          <p id={`${emailId}-error`} role="alert" className="text-red-500 text-sm">
            {errors.email}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor={messageId}>پەیام *</label>
        <textarea
          id={messageId}
          name="message"
          required
          minLength={10}
          maxLength={1000}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? `${messageId}-error` : undefined}
          onBlur={(e) => validateField('message', e.target.value)}
        />
        {errors.message && (
          <p id={`${messageId}-error`} role="alert" className="text-red-500 text-sm">
            {errors.message}
          </p>
        )}
      </div>
      
      <button type="submit" disabled={isPending}>
        {isPending ? t.common.loading : t.common.send}
      </button>
    </form>
  )
}
```
```typescript
// ✅ Server Action — Zod validation (security layer)
'use server'
import { z } from 'zod'

const ContactSchema = z.object({
  email: z.string().email().max(255),
  message: z.string().min(10).max(1000),
})

export async function submitContactForm(formData: FormData) {
  const parsed = ContactSchema.safeParse({
    email: formData.get('email'),
    message: formData.get('message'),
  })
  
  if (!parsed.success) {
    return { errors: Object.fromEntries(
      parsed.error.issues.map(i => [i.path[0], i.message])
    )}
  }
  
  // Rate limit
  const ip = headers().get('x-forwarded-for') ?? 'unknown'
  const { success } = await rateLimit(ip, 'contact', { limit: 3, window: 60 })
  if (!success) return { errors: { form: 'زۆر داواکاریت ناردووە' } }
  
  const supabase = await createClient()
  await supabase.from('contact_messages').insert(parsed.data)
  
  revalidatePath('/admin/messages')
  return { success: true }
}
```

---

