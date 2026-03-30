import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'

const MAX_ITEMS = 10

interface RecentlyViewedStore {
  items: Product[]
  addItem: (product: Product) => void
  clear: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          const filtered = state.items.filter((i) => i.id !== product.id)
          return { items: [product, ...filtered].slice(0, MAX_ITEMS) }
        })
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'vertex-recently-viewed' }
  )
)
