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
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('theme, currency, compact_mode')
        .eq('id', user.id)
        .single()
      if (data) {
        initialTheme = data.theme ?? 'dark'
        initialCurrency = data.currency ?? 'USD'
        initialCompactMode = data.compact_mode ?? false
      }
    }
  } catch {}

  return (
    <PreferencesProvider
      initialTheme={initialTheme}
      initialCurrency={initialCurrency}
      initialCompactMode={initialCompactMode}
    >
      <Navbar />
      <main style={{ paddingTop: '64px' }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <BackToTop />
    </PreferencesProvider>
  )
}
