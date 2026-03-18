// Types for Menu Service
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category_id: string;
  image_url?: string | null;
  is_available: boolean;
  preparation_time: number;
  created_at: Date;
  updated_at: Date;
}

// Types for Customer Service
export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderHistory {
  id: string;
  customer_id: string;
  order_id: string;
  total_amount: number;
  items_count: number;
  created_at: Date;
}

// Types for Order Service
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  total_amount: number;
  estimated_ready_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

// Request/Response types
export interface CreateOrderRequest {
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

export interface ApiError {
  error: string;
  message: string;
}
