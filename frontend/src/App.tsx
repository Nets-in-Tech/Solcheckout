import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { ProductGrid } from './components/ProductGrid.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { MerchantOrdersModal } from './components/MerchantOrdersModal.tsx';
import { Product, MerchantInfo, Order } from './types/index.ts';

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
      if (!res.ok) {
        console.warn(`Products endpoint returned status ${res.status}`);
        return;
      }
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
      if (!res.ok) {
        console.warn(`Merchant endpoint returned status ${res.status}`);
        return;
      }
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
      <footer className="mt-16 border-t border-[#1e2230] bg-[#0b0c12] py-8 text-xs text-gray-500">
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
