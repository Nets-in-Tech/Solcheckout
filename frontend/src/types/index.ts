export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  price_usd: string | number;
  price_sol: string | number;
  image_url: string;
  stock: number;
  badge?: string;
  rating?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPriceUsd: number;
  unitPriceSol: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  total_usd: string | number;
  total_sol: string | number;
  reference_pubkey: string;
  recipient_pubkey: string;
  payer_pubkey?: string;
  signature?: string;
  customer_email?: string;
  customer_name?: string;
  created_at: string;
  confirmed_at?: string;
  items?: OrderItem[];
}

export interface MerchantInfo {
  merchantName: string;
  merchantWallet: string;
  merchantIcon: string;
  network: string;
  rpcUrl: string;
  balanceSol: number;
  metrics: {
    totalOrders: number;
    confirmedOrders: number;
    pendingOrders: number;
    totalRevenueUsd: number;
    totalRevenueSol: number;
  };
}

