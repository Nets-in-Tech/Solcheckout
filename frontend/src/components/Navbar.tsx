import React from 'react';
import { ShoppingBag, ClipboardList } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface NavbarProps {
  onOpenMerchant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMerchant }) => {
  const { totalItemCount, totalSol, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-[#12131a] border-b border-[#222533]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 py-4 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e2230] border border-[#2d3244] flex items-center justify-center text-amber-400 font-semibold text-lg">
            ☕
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight">
              SolRoast & Craft Co.
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">
              Artisan Coffee & Handcrafted Leather Goods
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Store Orders / Admin Button */}
          <button
            onClick={onOpenMerchant}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1a1d29] hover:bg-[#222736] text-gray-300 border border-[#2b3042] text-xs sm:text-sm font-medium transition-colors"
          >
            <ClipboardList className="w-4 h-4 text-gray-400" />
            <span className="hidden sm:inline">Store Orders</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-[#272c3d] hover:bg-[#32384e] text-white font-medium text-xs sm:text-sm border border-[#3b4259] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            {totalItemCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-emerald-500 text-black font-bold text-xs">
                {totalItemCount}
              </span>
            )}
            {totalSol > 0 && (
              <span className="hidden md:inline font-mono text-xs text-gray-300 border-l border-gray-600 pl-2">
                {totalSol.toFixed(3)} SOL
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
