import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'

const MAX_COMPARE = 4

interface CompareStore {
  items: Product[]
  add:    (product: Product) => void
  remove: (id: string)       => void
  clear:  ()                 => void
  has:    (id: string)       => boolean
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      add(product) {
        if (get().items.length >= MAX_COMPARE) return
        if (get().has(product.id)) return
        set(s => ({ items: [...s.items, product] }))
      },
      remove(id) {
        set(s => ({ items: s.items.filter(p => p.id !== id) }))
      },
      clear() { set({ items: [] }) },
      has(id) { return get().items.some(p => p.id === id) },
    }),
    { name: 'vertex-compare' }
  )
)
