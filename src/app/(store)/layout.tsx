import Navbar from '@/components/shop/Navbar'
import Footer from '@/components/shop/Footer'
import PageTransition from '@/components/ui/PageTransition'

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '64px' }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  )
}
