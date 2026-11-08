import React, { useState } from 'react';
import { Star, Plus, Check } from 'lucide-react';
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
    <div className="bg-[#141620] rounded-xl border border-[#232736] overflow-hidden flex flex-col hover:border-[#383e54] transition-colors">
      {/* Product Image */}
      <div className="relative aspect-[4/3] w-full bg-gray-900 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#12141c]/90 text-amber-300 border border-amber-500/20">
              {product.badge}
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>{product.category}</span>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[11px] font-medium text-gray-300">{product.rating || 4.9}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-white line-clamp-1">
            {product.name}
          </h3>

          {/* Description */}
          <p className="mt-1 text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Add Button */}
        <div className="mt-4 pt-3 border-t border-[#1e2332] flex items-center justify-between">
          <div>
            <div className="font-mono text-sm font-bold text-white">
              {priceSol.toFixed(3)} SOL
            </div>
            <div className="text-[11px] text-gray-400">
              ${priceUsd.toFixed(2)} USD
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#222736] hover:bg-[#2e3448] text-white border border-[#30364a]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
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
