import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { ProductCard } from './ProductCard.tsx';
import { Search, Sparkles, Coffee, Shield, Zap } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES = ['All', 'Specialty Coffee', 'Handcrafted Leather', 'Brewing Gear'];

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
    <section className="py-8">
      {/* Hero Banner */}
      <div className="relative mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#17142b] via-[#121626] to-[#0d1620] border border-purple-900/30 overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-[#14F195]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Decentralized Small Business Commerce</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Curated Artisan Goods.{' '}
            <span className="bg-gradient-to-r from-[#14F195] via-[#00F2FE] to-[#9945FF] bg-clip-text text-transparent">
              Instant Solana Pay.
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
            Direct peer-to-merchant settlement. No sign-up roadblocks, no credit card processing fees.
            Scan with your favorite mobile wallet or checkout in 1 click.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>400ms Sub-second Finality</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Non-Custodial Direct Settlement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Micro-Roasted & Handcrafted Fresh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#9945FF] to-[#7928CA] text-white shadow-lg shadow-purple-900/30'
                  : 'bg-[#151824] text-gray-300 hover:bg-[#1e2334] border border-[#23283a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search beans, leather, gear..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131622] text-sm text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-2 border border-[#23283a] focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-[#131620] rounded-2xl border border-[#212638] aspect-[4/5] p-5 flex flex-col justify-between animate-pulse"
            >
              <div className="w-full h-44 bg-[#1c2132] rounded-xl" />
              <div className="space-y-3">
                <div className="h-4 bg-[#1c2132] rounded w-3/4" />
                <div className="h-3 bg-[#1c2132] rounded w-1/2" />
              </div>
              <div className="h-8 bg-[#1c2132] rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#131620] rounded-2xl border border-[#212638]">
          <Coffee className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No products found</h3>
          <p className="text-xs text-gray-400 mt-1">Try selecting a different category or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </section>
  );
};

