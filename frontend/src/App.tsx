import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { ProductGrid } from './components/ProductGrid.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { MerchantOrdersModal } from './components/MerchantOrdersModal.tsx';
import { Product, MerchantInfo, Order } from './types/index.ts';
import { Coffee, Shield, Zap, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMerchantOpen, setIsMerchantOpen] = useState(false);

  // Fetch product catalog
  const fetchProducts = async (category = 'All') => {
    setIsLoadingProducts(true);
    try {
      const url = category === 'All' ? '/api/products' : `/api/products?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch merchant store details
  const fetchMerchantInfo = async () => {
    try {
      const res = await fetch('/api/merchant');
      const data = await res.json();
      if (data.success && data.data) {
        setMerchantInfo(data.data);
      }
    } catch (err) {
      console.error('Error fetching merchant details:', err);
    }
  };

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    fetchMerchantInfo();
  }, []);

  const handleCheckoutSuccess = (order: Order) => {
    // Refresh merchant info to update total revenue & order count
    fetchMerchantInfo();
    // Refresh product stock
    fetchProducts(selectedCategory);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] flex flex-col text-gray-100">
      {/* Top Navbar */}
      <Navbar
        onOpenMerchant={() => setIsMerchantOpen(true)}
        merchantBalanceSol={merchantInfo?.balanceSol}
      />

      {/* Main Storefront Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <ProductGrid
          products={products}
          isLoading={isLoadingProducts}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#1e2334] bg-[#0c0d14] py-12 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-0.5">
              <div className="w-full h-full bg-[#0c0d14] rounded-[4px] flex items-center justify-center">
                <span className="text-xs font-bold text-[#14F195]">◎</span>
              </div>
            </div>
            <span className="font-semibold text-gray-300">SolRoast & Craft Co.</span>
            <span>—</span>
            <span>Solana Pay Small Business Demo</span>
          </div>

          <div className="flex items-center gap-6 text-gray-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Solana Devnet</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>PostgreSQL & Redis Accelerated</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Artisan Roasted Fresh</span>
            </span>
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

      {/* Small Business Merchant Orders Dashboard */}
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

