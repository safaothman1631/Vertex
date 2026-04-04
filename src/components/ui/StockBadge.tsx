'use client'

interface StockBadgeProps {
  stockQty: number
  inStock: boolean
  lowStockThreshold?: number
  className?: string
}

export default function StockBadge({ stockQty, inStock, lowStockThreshold = 10, className = '' }: StockBadgeProps) {
  if (!inStock || stockQty === 0) {
    return (
      <span className={`stock-badge out ${className}`}>
        Out of Stock
      </span>
    )
  }
  if (stockQty <= lowStockThreshold) {
    return (
      <span className={`stock-badge low ${className}`}>
        Only {stockQty} left!
      </span>
    )
  }
  return (
    <span className={`stock-badge in ${className}`}>
      In Stock
    </span>
  )
}
