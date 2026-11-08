import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartDrawerProps {
  onStartCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onStartCheckout }) => {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, totalUsd, totalSol } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#10121a] border-l border-[#23283a] h-full flex flex-col shadow-2xl z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-[#212638] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Your Order</h2>
            <span className="text-xs font-mono text-gray-400 bg-[#1c2132] px-2 py-0.5 rounded">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a1f30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <div className="w-16 h-16 rounded-full bg-[#161a26] flex items-center justify-center mb-3">
                <span className="text-2xl">🛍️</span>
              </div>
              <p className="font-semibold text-white">Your cart is empty</p>
              <p className="text-xs text-gray-500 mt-1">Discover artisan coffee & leather goods</p>
            </div>
          ) : (
            cart.map((item) => {
              const unitSol = parseFloat(item.product.price_sol as string);
              const unitUsd = parseFloat(item.product.price_usd as string);

              return (
                <div
                  key={item.product.id}
                  className="flex gap-3 bg-[#151824] p-3 rounded-2xl border border-[#232738]"
                >
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-xl bg-gray-900"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#14F195]">
                          ◎ {(unitSol * item.quantity).toFixed(4)}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-1.5">
                          (${(unitUsd * item.quantity).toFixed(2)})
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-[#1b2030] px-2 py-1 rounded-lg border border-[#2c3348]">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-semibold text-white w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout CTA */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#212638] bg-[#121520] space-y-4">
            
            {/* Totals */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal (USD)</span>
                <span>${totalUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Estimated Network Gas</span>
                <span className="text-emerald-400 font-mono">~0.000005 SOL (&lt; $0.001)</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-[#23283a]">
                <span>Total Due</span>
                <div className="text-right">
                  <div className="font-mono text-base font-extrabold bg-gradient-to-r from-[#14F195] to-[#00F2FE] bg-clip-text text-transparent">
                    ◎ {totalSol.toFixed(4)} SOL
                  </div>
                  <div className="text-[11px] font-normal text-gray-400">
                    ≈ ${totalUsd.toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>

            {/* Solana Pay Button */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                onStartCheckout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#9945FF] via-[#7928CA] to-[#14F195] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-900/40 transition-transform active:scale-[0.99]"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Checkout with Solana Pay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct on-chain settlement • Non-custodial</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

