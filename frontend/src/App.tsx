import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { ProductGrid } from './components/ProductGrid.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { MerchantOrdersModal } from './components/MerchantOrdersModal.tsx';
import { Product, MerchantInfo, Order } from './types/index.ts';

// Boutique storefront products (guaranteed catalog)
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1,
    slug: 'ethiopian-yirgacheffe',
    name: 'Single-Origin Ethiopian Yirgacheffe (250g)',
    category: 'Specialty Coffee',
    description: 'Washed heirloom varietal from Gedeb, Yirgacheffe. Notes of bergamot blossoms, sweet Meyer lemon, and silky black tea finish.',
    price_usd: 19.50,
    price_sol: 0.0950,
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    stock: 35,
    badge: 'Popular',
    rating: 4.9,
  },
  {
    id: 2,
    slug: 'tuscan-leather-cardholder',
    name: 'Handcrafted Leather Cardholder',
    category: 'Handcrafted Leather',
    description: 'Full-grain vegetable-tanned leather with hand-burnished edges and saddle stitching. Holds 6-8 cards comfortably.',
    price_usd: 48.00,
    price_sol: 0.2400,
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    stock: 18,
    badge: 'Handmade',
    rating: 5.0,
  },
  {
    id: 3,
    slug: 'ceramic-pourover-set',
    name: 'Ceramic Pour-Over Dripper & Carafe',
    category: 'Brewing Gear',
    description: 'Stoneware ceramic dripper with spiral extraction ridges and matching 600ml borosilicate glass serving carafe.',
    price_usd: 55.00,
    price_sol: 0.2750,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    stock: 14,
    badge: 'Bestseller',
    rating: 4.8,
  },
  {
    id: 4,
    slug: 'panama-geisha-reserve',
    name: 'Panama Geisha Reserve (150g)',
    category: 'Specialty Coffee',
    description: 'Rare Gesha varietal grown at 1,800m elevation. Delicate aroma of white peach, jasmine, tropical mango, and honey.',
    price_usd: 42.00,
    price_sol: 0.2100,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    stock: 12,
    badge: 'Limited Lot',
    rating: 5.0,
  },
  {
    id: 5,
    slug: 'leather-journal-cover-a5',
    name: 'Classic Leather Journal Cover (A5)',
    category: 'Handcrafted Leather',
    description: 'Full-grain leather notebook cover with pen sleeve. Includes 192-page fountain-pen-friendly dot grid refill.',
    price_usd: 65.00,
    price_sol: 0.3250,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    stock: 22,
    badge: 'Classic',
    rating: 4.9,
  },
  {
    id: 6,
    slug: 'cold-drip-concentrate',
    name: 'Slow Kyoto Cold Brew Concentrate (500ml)',
    category: 'Specialty Coffee',
    description: '16-hour ambient water drip through specialty roast beans. Smooth, low acidity, with dark chocolate notes.',
    price_usd: 22.00,
    price_sol: 0.1100,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    stock: 40,
    badge: 'Cold Brew',
    rating: 4.7,
  },
  {
    id: 7,
    slug: 'leather-coaster-set',
    name: 'Handcrafted Leather Coasters (Pack of 4)',
    category: 'Handcrafted Leather',
    description: 'Heavy 3.5mm saddle leather coasters sealed with natural beeswax to resist stains and moisture.',
    price_usd: 26.00,
    price_sol: 0.1300,
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    stock: 30,
    badge: 'Gift Idea',
    rating: 4.8,
  },
  {
    id: 8,
    slug: 'barista-heavy-apron',
    name: 'Canvas & Leather Barista Apron',
    category: 'Brewing Gear',
    description: 'Durable 14oz water-resistant duck canvas with detachable leather cross-back harness and brass buckles.',
    price_usd: 78.00,
    price_sol: 0.3900,
    image_url: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    badge: 'Durable',
    rating: 4.9,
  },
];

export const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>({
    merchantName: 'SolRoast & Craft Co.',
    merchantWallet: '7VMv92GaPH3mn6Vt7sRzVeR4PMX8byDH5EU7KCTDQgM3',
    merchantIcon: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=128&q=80',
    network: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    balanceSol: 0,
    metrics: {
      totalOrders: 0,
      confirmedOrders: 0,
      pendingOrders: 0,
      totalRevenueUsd: 0,
      totalRevenueSol: 0,
    },
  });

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMerchantOpen, setIsMerchantOpen] = useState(false);

  // Fetch product catalog
  const fetchProducts = async (category = 'All') => {
    try {
      const url = category === 'All' ? '/api/products' : `/api/products?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setProducts(data.data);
          return;
        }
      }
    } catch {
      // Retain fallback items silently
    }
  };

  // Fetch merchant store details
  const fetchMerchantInfo = async () => {
    try {
      const res = await fetch('/api/merchant');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setMerchantInfo(data.data);
        }
      }
    } catch {
      // Retain default merchant details silently
    }
  };

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    fetchMerchantInfo();
  }, []);

  const handleCheckoutSuccess = (order: Order) => {
    fetchMerchantInfo();
    fetchProducts(selectedCategory);
  };

  return (
    <div className="min-h-screen bg-[#0e1017] flex flex-col text-gray-100">
      {/* Top Navbar */}
      <Navbar onOpenMerchant={() => setIsMerchantOpen(true)} />

      {/* Main Storefront Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6">
        <ProductGrid
          products={products}
          isLoading={isLoadingProducts}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      </main>

      {/* Simple, tasteful e-commerce footer */}
      <footer className="mt-16 border-t border-[#1e2230] bg-[#0b0c10] py-8 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-400">SolRoast & Craft Co.</span>
            <span>•</span>
            <span>Artisan Coffee & Handcrafted Leather Goods</span>
          </div>

          <div className="text-gray-500">
            Powered by Solana Pay
          </div>
        </div>
      </footer>

      {/* Slide-over Cart Drawer */}
      <CartDrawer onStartCheckout={() => setIsCheckoutOpen(true)} />

      {/* Solana Pay Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Store Orders Dashboard */}
      <MerchantOrdersModal
        isOpen={isMerchantOpen}
        onClose={() => setIsMerchantOpen(false)}
        merchantInfo={merchantInfo}
        onRefreshMerchant={fetchMerchantInfo}
      />
    </div>
  );
};
export default App;
