import axios from 'axios'

const MENU_API = import.meta.env.VITE_MENU_SERVICE_URL || 'http://localhost:3001'
const CUSTOMER_API = import.meta.env.VITE_CUSTOMER_SERVICE_URL || 'http://localhost:3002'
const ORDER_API = import.meta.env.VITE_ORDER_SERVICE_URL || 'http://localhost:3003'

export const menuApi = axios.create({ baseURL: MENU_API })
export const customerApi = axios.create({ baseURL: CUSTOMER_API })
export const orderApi = axios.create({ baseURL: ORDER_API })

export interface Category {
  id: string
  name: string
  description?: string
  display_order: number
  products?: Product[]
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  is_available: boolean
  preparation_time: number
  image_url?: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  status: string
  total_amount: number
  estimated_ready_at?: string
  created_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  subtotal: number
}
