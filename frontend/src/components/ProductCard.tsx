import React, { useState } from 'react';
import { Star, Plus, Check, Flame } from 'lucide-react';
import { Product } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  const priceSol = parseFloat(product.price_sol as string);
  const priceUsd = parseFloat(product.price_usd as string);

  return (
    <div className="group relative bg-[#131620] rounded-2xl border border-[#212638] overflow-hidden flex flex-col transition-all duration-300 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-950/20 hover:-translate-y-1">
      {/* Product Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-900">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131620] via-transparent to-transparent opacity-60" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {product.badge ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0d0e15]/90 text-amber-300 border border-amber-500/30 backdrop-blur-md">
              <Flame className="w-3 h-3 text-amber-400" />
              {product.badge}
            </span>
          ) : (
            <span />
          )}

          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#0d0e15]/80 text-gray-300 border border-gray-700/50 backdrop-blur-md">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-semibold text-gray-300">{product.rating || 4.9}</span>
            <span className="text-xs text-gray-500">• In Stock ({product.stock})</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Description */}
          <p className="mt-1.5 text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="mt-5 pt-4 border-t border-[#1f2434] flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-base bg-gradient-to-r from-[#14F195] to-[#00F2FE] bg-clip-text text-transparent">
                ◎ {priceSol.toFixed(4)}
              </span>
              <span className="text-xs text-gray-400 font-mono">SOL</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              ${priceUsd.toFixed(2)} USD
            </p>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isAdded
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-[#222738] hover:bg-gradient-to-r hover:from-[#9945FF] hover:to-[#14F195] hover:text-white text-gray-200 border border-[#2d344a]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

