import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { ProductCard } from './ProductCard.tsx';
import { Search, Coffee } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES = ['All', 'Specialty Coffee', 'Leather Goods', 'Brewing Gear'];

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  selectedCategory,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-6">
      {/* Simple, warm boutique hero banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-2xl bg-[#151722] border border-[#242938]">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
            Artisan Boutique
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Crafted for Everyday Rituals
          </h2>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            Freshly micro-roasted specialty coffees, handcrafted full-grain leather goods,
            and precision brewing gear. Pay seamlessly with Solana Pay.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white text-gray-900 font-semibold shadow-sm'
                  : 'bg-[#171a26] text-gray-400 hover:text-white hover:bg-[#202434] border border-[#262c3d]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151824] text-sm text-white placeholder-gray-500 rounded-lg pl-9 pr-3 py-1.5 border border-[#262b3d] focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-[#141620] rounded-xl border border-[#222736] p-4 flex flex-col justify-between animate-pulse"
            >
              <div className="w-full h-44 bg-[#1e2332] rounded-lg mb-3" />
              <div className="h-4 bg-[#1e2332] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#1e2332] rounded w-1/2 mb-4" />
              <div className="h-8 bg-[#1e2332] rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#141620] rounded-xl border border-[#222736]">
          <Coffee className="w-10 h-10 text-gray-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No products found</h3>
          <p className="text-xs text-gray-400 mt-1">Try selecting another category or clear your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </section>
  );
};
