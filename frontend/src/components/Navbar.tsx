import React from 'react';
import { ShoppingBag, Store, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface NavbarProps {
  onOpenMerchant: () => void;
  merchantBalanceSol?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMerchant, merchantBalanceSol }) => {
  const { totalItemCount, totalSol, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-[#0d0e15]/90 backdrop-blur-md border-b border-[#232736]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-0.5 shadow-lg shadow-purple-900/30">
            <div className="w-full h-full bg-[#0d0e15] rounded-[10px] flex items-center justify-center">
              <span className="font-bold text-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                ◎
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                SolRoast <span className="text-gray-400 font-light">&</span> Craft Co.
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                Solana Pay
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">
              Artisan Coffee & Handcrafted Leather Goods
            </p>
          </div>
        </div>

        {/* Center: Network Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161922] border border-[#272b38] text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14F195]"></span>
          </span>
          <span className="text-gray-300 font-medium">Solana Devnet</span>
          <span className="text-gray-500">•</span>
          <span className="text-emerald-400 font-mono text-[11px]">Instant Non-Custodial</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Merchant Portal Button */}
          <button
            onClick={onOpenMerchant}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1d28] hover:bg-[#222634] text-gray-200 border border-[#2e3346] text-xs sm:text-sm font-medium transition-all duration-200 hover:border-purple-500/50"
            title="Open Merchant Small Business Dashboard"
          >
            <Store className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Merchant Portal</span>
            {merchantBalanceSol !== undefined && (
              <span className="hidden lg:inline text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                {merchantBalanceSol.toFixed(3)} SOL
              </span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#9945FF] to-[#7928CA] hover:from-[#8935ef] hover:to-[#6a20b0] text-white font-medium text-xs sm:text-sm shadow-lg shadow-purple-900/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="font-semibold">Cart</span>
            {totalItemCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#14F195] text-black font-bold text-xs">
                {totalItemCount}
              </span>
            )}
            {totalSol > 0 && (
              <span className="hidden md:inline font-mono text-xs text-purple-200 border-l border-purple-400/30 pl-2">
                ◎ {totalSol.toFixed(4)}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};

