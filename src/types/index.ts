export type Role = 'user' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  phone: string | null
  avatar_url: string | null
  preferred_locale: string | null
  notify_email: boolean
  notify_order: boolean
  notify_promo: boolean
  created_at: string
}

export interface UserAddress {
  id: string
  user_id: string
  label: string
  name: string
  phone: string
  address: string
  city: string
  country: string
  zip: string
  is_default: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  brand: string
  model: string
  category: string
  price: number
  old_price: number | null
  description: string
  specs: string[]
  images: string[]
  rating: number
  review_count: number
  in_stock: boolean
  is_new: boolean
  is_hot: boolean
  hidden: boolean
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  product: Product
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  user?: Profile
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  stripe_session_id: string | null
  shipping_address: ShippingAddress
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product: Product
  quantity: number
  price: number
}

export interface ShippingAddress {
  name: string
  email: string
  address: string
  city: string
  country: string
  zip: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  product_id: string
  rating: number
  comment: string
  created_at: string
  user?: Profile
  product?: Product
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order: number
  max_uses: number | null
  used_count: number
  active: boolean
  expires_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'info' | 'order' | 'promo' | 'system'
  is_read: boolean
  created_at: string
}

export interface InventoryLog {
  id: string
  product_id: string
  change: number
  reason: string
  created_by: string | null
  created_at: string
  product?: Product
}

export interface TrashItem {
  id: string
  table_name: string
  record_id: string
  record_data: Record<string, unknown>
  deleted_by: string | null
  deleted_at: string
  expires_at: string
}

export interface Promotion {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string
  badge_text: string
  position: 'hero_banner' | 'bar' | 'popup' | 'sidebar'
  is_active: boolean
  starts_at: string
  ends_at: string | null
  sort_order: number
  created_at: string
}

export interface SystemLog {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  source: 'api' | 'auth' | 'db' | 'cron' | 'manual'
  message: string
  details: Record<string, unknown>
  created_at: string
}
