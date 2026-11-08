import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
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
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#12141c] border-l border-[#232736] h-full flex flex-col shadow-xl z-10">
        
        {/* Header */}
        <div className="p-4 border-b border-[#212534] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Your Cart</h2>
            <span className="text-xs text-gray-400 bg-[#1a1d29] px-2 py-0.5 rounded">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1d29] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <p className="font-medium text-white text-sm">Your cart is empty</p>
              <p className="text-xs text-gray-500 mt-1">Add coffees or leather goods to begin</p>
            </div>
          ) : (
            cart.map((item) => {
              const unitSol = parseFloat(item.product.price_sol as string);
              const unitUsd = parseFloat(item.product.price_usd as string);

              return (
                <div
                  key={item.product.id}
                  className="flex gap-3 bg-[#161924] p-3 rounded-lg border border-[#232736]"
                >
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-14 h-14 object-cover rounded-md bg-gray-900"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-medium text-white line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-500 hover:text-red-400 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="font-mono text-xs font-semibold text-white">
                          {(unitSol * item.quantity).toFixed(3)} SOL
                        </span>
                        <span className="text-[11px] text-gray-400 ml-1.5">
                          (${(unitUsd * item.quantity).toFixed(2)})
                        </span>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-2 bg-[#1f2332] px-2 py-0.5 rounded border border-[#2b3145]">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono text-white w-4 text-center">
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
          <div className="p-4 border-t border-[#212534] bg-[#141722] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal (USD)</span>
                <span>${totalUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-emerald-400 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-white font-semibold text-sm pt-2 border-t border-[#24293a]">
                <span>Total Due</span>
                <div className="text-right">
                  <div className="font-mono text-base font-bold text-white">
                    {totalSol.toFixed(3)} SOL
                  </div>
                  <div className="text-[11px] font-normal text-gray-400">
                    ≈ ${totalUsd.toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                onStartCheckout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
            >
              <span>Pay with Solana Pay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
