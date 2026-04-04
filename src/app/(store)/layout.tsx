import Navbar from '@/components/shop/Navbar'
import Footer from '@/components/shop/Footer'
import PageTransition from '@/components/ui/PageTransition'
import BackToTop from '@/components/ui/BackToTop'
import { PreferencesProvider } from '@/contexts/preferences'
import { createClient } from '@/lib/supabase-server'

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let initialTheme = 'dark', initialCurrency = 'USD', initialCompactMode = false
  let initialUser: { id: string; email: string; name: string; role: string; avatar_url?: string | null } | null = null
  let initialWishlistCount = 0
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from('profiles')
          .select('theme, currency, compact_mode, full_name, role, avatar_url')
          .eq('id', user.id)
          .single(),
        supabase
          .from('wishlist')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])
      if (data) {
        initialTheme = data.theme ?? 'dark'
        initialCurrency = data.currency ?? 'USD'
        initialCompactMode = data.compact_mode ?? false
        initialUser = {
          id: user.id,
          email: user.email ?? '',
          name: data.full_name ?? user.email ?? '',
          role: data.role ?? 'user',
          avatar_url: data.avatar_url,
        }
      }
      initialWishlistCount = count ?? 0
    }
  } catch (err) { console.error('[store-layout] init:', err) }

  return (
    <PreferencesProvider
      initialTheme={initialTheme}
      initialCurrency={initialCurrency}
      initialCompactMode={initialCompactMode}
    >
      <a
        href="#main-content"
        className="skip-to-content"
      >
        Skip to content
      </a>
      <Navbar initialUser={initialUser} initialWishlistCount={initialWishlistCount} />
      <main id="main-content" style={{ paddingTop: '64px' }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <BackToTop />
    </PreferencesProvider>
  )
}
