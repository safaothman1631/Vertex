/**
 * Generic CSV export utility
 * Usage: exportCSV(rows, columns, 'orders.csv')
 */

export interface CsvColumn<T> {
  header: string
  accessor: (row: T) => string | number | boolean | null | undefined
}

export function exportCSV<T>(rows: T[], columns: CsvColumn<T>[], filename: string): void {
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = String(val).replace(/"/g, '""')
    return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str
  }

  const header = columns.map(c => escape(c.header)).join(',')
  const body   = rows.map(row =>
    columns.map(c => escape(c.accessor(row))).join(',')
  ).join('\n')

  const csv = `\uFEFF${header}\n${body}` // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Pre-built exporters ──────────────────────────────────────

import type { Order, Product } from '@/types'

export function exportOrders(orders: Order[]) {
  exportCSV<Order>(
    orders,
    [
      { header: 'Order ID',        accessor: o => o.id },
      { header: 'Date',            accessor: o => new Date(o.created_at).toLocaleDateString() },
      { header: 'Status',          accessor: o => o.status },
      { header: 'Customer',        accessor: o => o.shipping_address?.name ?? '' },
      { header: 'Email',           accessor: o => o.shipping_address?.email ?? '' },
      { header: 'Items',           accessor: o => (o.items ?? []).length },
      { header: 'Subtotal',        accessor: o => o.total },
      { header: 'Shipping Method', accessor: o => o.shipping_method ?? 'standard' },
      { header: 'Shipping Cost',   accessor: o => o.shipping_cost ?? 0 },
      { header: 'Tracking No.',    accessor: o => o.tracking_number ?? '' },
      { header: 'Carrier',        accessor: o => o.carrier ?? '' },
      { header: 'City',            accessor: o => o.shipping_address?.city ?? '' },
      { header: 'Country',         accessor: o => o.shipping_address?.country ?? '' },
    ],
    `orders-${new Date().toISOString().slice(0, 10)}.csv`
  )
}

export function exportProducts(products: Product[]) {
  exportCSV<Product>(
    products,
    [
      { header: 'ID',           accessor: p => p.id },
      { header: 'Name',         accessor: p => p.name },
      { header: 'Brand',        accessor: p => p.brand },
      { header: 'Model',        accessor: p => p.model },
      { header: 'Category',     accessor: p => p.category },
      { header: 'Price',        accessor: p => p.price },
      { header: 'Old Price',    accessor: p => p.old_price ?? '' },
      { header: 'In Stock',     accessor: p => p.in_stock ? 'Yes' : 'No' },
      { header: 'Stock Qty',    accessor: p => p.stock_quantity ?? 9999 },
      { header: 'Is New',       accessor: p => p.is_new ? 'Yes' : 'No' },
      { header: 'Is Hot',       accessor: p => p.is_hot ? 'Yes' : 'No' },
      { header: 'Rating',       accessor: p => p.rating },
      { header: 'Reviews',      accessor: p => p.review_count },
      { header: 'Hidden',       accessor: p => p.hidden ? 'Yes' : 'No' },
      { header: 'Created',      accessor: p => new Date(p.created_at).toLocaleDateString() },
    ],
    `products-${new Date().toISOString().slice(0, 10)}.csv`
  )
}
