import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  ArrowRight,
  Smartphone,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { Order } from '../types/index.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { cart, totalUsd, totalSol, clearCart } = useCart();

  const [step, setStep] = useState<'info' | 'payment' | 'confirmed'>('info');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingCity, setShippingCity] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [solanaPayUrl, setSolanaPayUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [isSimulating, setIsSimulating] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('info');
      setCurrentOrder(null);
      setSolanaPayUrl('');
      setErrorMessage(null);
      setTxSignature(null);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        customerName: customerName.trim() || 'Guest Customer',
        customerEmail: customerEmail.trim() || undefined,
        shippingAddress: shippingCity.trim() ? { city: shippingCity.trim() } : undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      setCurrentOrder(data.data.order);
      setSolanaPayUrl(data.data.solanaPayUrl);
      setStep('payment');

      startPollingVerification(data.data.order.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPollingVerification = (orderId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/verify`);
        const data = await res.json();

        if (data.success && data.confirmed) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          handlePaymentSuccess(data.order, data.signature);
        }
      } catch (err) {
        // silently retry polling
      }
    }, 2000);
  };

  const handlePaymentSuccess = (order: Order, signature?: string) => {
    setTxSignature(signature || order.signature || null);
    setCurrentOrder(order);
    setStep('confirmed');
    clearCart();
    onSuccess(order);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  const handleSimulatePayment = async () => {
    if (!currentOrder) return;
    setIsSimulating(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/test-pay`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment simulation failed');
      }

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      handlePaymentSuccess({ ...currentOrder, status: 'confirmed', signature: data.signature }, data.signature);
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleBrowserWalletPay = async () => {
    if (!currentOrder || !solanaPayUrl) return;
    setErrorMessage(null);

    try {
      // Standard Solana Pay protocol: open the solana: payment URI directly
      window.location.href = solanaPayUrl;
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not launch wallet.');
    }
  };

  const handleCopyUrl = () => {
    if (!solanaPayUrl) return;
    navigator.clipboard.writeText(solanaPayUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#13151f] border border-[#23283a] rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#212638] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Checkout</h3>
            <p className="text-xs text-gray-400">Solana Pay</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2030] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-red-950/50 border border-red-800/50 flex items-start gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <div className="p-5 overflow-y-auto">
          
          {/* STEP 1: Customer Details */}
          {step === 'info' && (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#181b28] border border-[#262c3e] flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">Order Total</span>
                  <div className="font-mono text-lg font-bold text-white">
                    {totalSol.toFixed(3)} SOL
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">{cart.length} items</span>
                  <div className="text-xs font-medium text-gray-300">${totalUsd.toFixed(2)} USD</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Miller"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#181b28] text-xs text-white placeholder-gray-500 rounded-lg px-3.5 py-2 border border-[#272d40] focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Email (for order confirmation)
                </label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-[#181b28] text-xs text-white placeholder-gray-500 rounded-lg px-3.5 py-2 border border-[#272d40] focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Delivery City / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Austin, TX"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  className="w-full bg-[#181b28] text-xs text-white placeholder-gray-500 rounded-lg px-3.5 py-2 border border-[#272d40] focus:outline-none focus:border-gray-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Preparing Payment...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment Screen */}
          {step === 'payment' && currentOrder && (
            <div className="flex flex-col items-center text-center space-y-4">
              
              <div>
                <div className="text-xs text-gray-400">
                  Order {currentOrder.order_number}
                </div>
                <div className="font-mono text-2xl font-bold text-white mt-0.5">
                  {parseFloat(currentOrder.total_sol as string).toFixed(3)} SOL
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  ≈ ${parseFloat(currentOrder.total_usd as string).toFixed(2)} USD
                </p>
              </div>

              {/* QR Code */}
              <div className="p-4 bg-white rounded-2xl shadow border border-gray-200">
                <QRCodeSVG
                  value={solanaPayUrl}
                  size={190}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-gray-300" />
                <span>Scan with your Phantom or Solflare wallet</span>
              </div>

              {/* Status bar */}
              <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#181b28] border border-[#252b3e] text-xs text-gray-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Waiting for payment...</span>
              </div>

              {/* Action buttons */}
              <div className="w-full space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1a1d2b] hover:bg-[#232738] text-xs font-medium text-gray-300 border border-[#2b3044] transition-colors"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={solanaPayUrl}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1a1d2b] hover:bg-[#232738] text-xs font-medium text-gray-300 border border-[#2b3044] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Wallet</span>
                  </a>
                </div>

                <button
                  onClick={handleBrowserWalletPay}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#1a1d2b] hover:bg-[#232738] text-xs font-medium text-gray-300 border border-[#2b3044] transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5 text-gray-300" />
                  <span>Pay with Browser Wallet (Phantom Extension)</span>
                </button>

                <button
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#202534] hover:bg-[#282f42] text-xs text-gray-300 border border-[#2e354a] transition-colors disabled:opacity-50"
                  title="Simulates an instant test payment"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test Payment...</span>
                    </>
                  ) : (
                    <span>Simulate Payment (Demo)</span>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: Confirmed Screen */}
          {step === 'confirmed' && currentOrder && (
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-emerald-400">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Payment Received!</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Thank you for your order.
                </p>
              </div>

              <div className="w-full bg-[#181b28] rounded-xl border border-[#262c3e] p-3.5 text-xs space-y-2 text-left">
                <div className="flex justify-between pb-1.5 border-b border-[#24293a]">
                  <span className="text-gray-400">Order Number</span>
                  <span className="font-mono font-semibold text-white">{currentOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Paid</span>
                  <span className="font-mono font-semibold text-white">
                    {parseFloat(currentOrder.total_sol as string).toFixed(3)} SOL
                  </span>
                </div>
                {txSignature && (
                  <div className="pt-1.5 border-t border-[#24293a]">
                    <span className="text-gray-400 block mb-0.5">Receipt Link</span>
                    <a
                      href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-gray-300 hover:text-white flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{txSignature}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
