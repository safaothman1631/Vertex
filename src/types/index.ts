export type Role = 'user' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
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
