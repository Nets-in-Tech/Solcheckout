import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { Order } from '../types/index.ts';
import { PublicKey, Transaction } from '@solana/web3.js';

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

  // Active Order State
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [solanaPayUrl, setSolanaPayUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Polling & Status
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when opened
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

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Handle Create Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        customerName: customerName.trim() || 'Boutique Guest',
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

      // Start on-chain polling for payment verification
      startPollingVerification(data.data.order.id);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start polling verification endpoint
  const startPollingVerification = (orderId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        setIsVerifying(true);
        const res = await fetch(`/api/orders/${orderId}/verify`);
        const data = await res.json();

        if (data.success && data.confirmed) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          handlePaymentSuccess(data.order, data.signature);
        }
      } catch (err) {
        console.warn('Polling check error:', err);
      } finally {
        setIsVerifying(false);
      }
    }, 2000);
  };

  // Trigger celebration and update state
  const handlePaymentSuccess = (order: Order, signature?: string) => {
    setTxSignature(signature || order.signature || null);
    setCurrentOrder(order);
    setStep('confirmed');
    clearCart();
    onSuccess(order);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14F195', '#9945FF', '#00F2FE', '#FFD700'],
      });
    } catch {}
  };

  // 1-Click Devnet Simulation
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
        throw new Error(data.error || 'Simulation failed');
      }

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      handlePaymentSuccess({ ...currentOrder, status: 'confirmed', signature: data.signature }, data.signature);
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Direct Browser Wallet Checkout (Phantom / Solflare if installed)
  const handleBrowserWalletPay = async () => {
    if (!currentOrder) return;
    setErrorMessage(null);

    try {
      const solana = (window as any).solana;
      if (!solana || !solana.isPhantom) {
        throw new Error('Phantom wallet extension not detected. Please scan the QR code with your mobile wallet or click "Simulate Devnet Payment".');
      }

      // Connect wallet
      const resp = await solana.connect();
      const buyerPubkey = resp.publicKey.toString();

      // Request transaction from Solana Pay transaction endpoint
      const txRes = await fetch(`/api/solana-pay/tx?orderId=${currentOrder.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: buyerPubkey }),
      });

      const txData = await txRes.json();
      if (!txRes.ok || !txData.transaction) {
        throw new Error(txData.error || 'Failed to build transaction');
      }

      // Deserialize transaction using native browser Base64 decoding
      const binaryString = window.atob(txData.transaction);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const transaction = Transaction.from(bytes);

      // Request signature from Phantom
      const { signature } = await solana.signAndSendTransaction(transaction);

      console.log('Transaction sent with signature:', signature);
      // Polling will detect it on-chain momentarily
    } catch (err: any) {
      setErrorMessage(err.message || 'Browser wallet payment failed');
    }
  };

  // Copy Solana Pay URL to clipboard
  const handleCopyUrl = () => {
    if (!solanaPayUrl) return;
    navigator.clipboard.writeText(solanaPayUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#11131b] border border-[#23283a] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-5 border-b border-[#212638] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#11131b] rounded-[6px] flex items-center justify-center">
                <span className="font-bold text-sm bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                  ◎
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Solana Pay Checkout</h3>
              <p className="text-xs text-gray-400">Direct on-chain instant settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a1f30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          
          {/* STEP 1: Express Guest Information */}
          {step === 'info' && (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#161a27] border border-[#252b3e] flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">Total Order Amount</span>
                  <div className="font-mono text-xl font-extrabold text-[#14F195]">
                    ◎ {totalSol.toFixed(4)} SOL
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">{cart.length} items</span>
                  <div className="text-sm font-semibold text-white">${totalUsd.toFixed(2)} USD</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Your Name (or Pseudonym)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Satoshi or Anonymous"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#161a27] text-sm text-white placeholder-gray-500 rounded-xl px-4 py-2.5 border border-[#252b3e] focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Email for Receipt & Tracking (Optional)
                </label>
                <input
                  type="email"
                  placeholder="buyer@solana.org"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-[#161a27] text-sm text-white placeholder-gray-500 rounded-xl px-4 py-2.5 border border-[#252b3e] focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Delivery City / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  className="w-full bg-[#161a27] text-sm text-white placeholder-gray-500 rounded-xl px-4 py-2.5 border border-[#252b3e] focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-900/30 transition-transform active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Solana Pay Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Solana Pay QR Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Solana Pay Interactive Screen */}
          {step === 'payment' && currentOrder && (
            <div className="flex flex-col items-center text-center space-y-5">
              
              {/* Amount Badge */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold mb-1">
                  <span>Order {currentOrder.order_number}</span>
                </div>
                <div className="font-mono text-3xl font-extrabold bg-gradient-to-r from-[#14F195] to-[#00F2FE] bg-clip-text text-transparent">
                  ◎ {parseFloat(currentOrder.total_sol as string).toFixed(4)} SOL
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  ≈ ${parseFloat(currentOrder.total_usd as string).toFixed(2)} USD
                </p>
              </div>

              {/* QR Code Container */}
              <div className="relative p-5 bg-white rounded-3xl shadow-2xl border-4 border-[#23283a] group">
                <QRCodeSVG
                  value={solanaPayUrl}
                  size={210}
                  level="M"
                  includeMargin={false}
                />
                
                {/* Central Solana Emblem */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-[#11131b] border-2 border-white flex items-center justify-center shadow-lg">
                    <span className="font-bold text-sm bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                      ◎
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-200">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>Scan with Phantom, Solflare, or any Solana Pay app</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Reference key linked to this order for non-custodial validation
                </p>
              </div>

              {/* Real-time Status Indicator */}
              <div className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#161a27] border border-[#252b3e] text-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#14F195]"></span>
                </span>
                <span className="text-gray-300 font-medium">Listening for payment on Solana Devnet...</span>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2 pt-1">
                {/* Copy URL & Deep Link */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1a1f30] hover:bg-[#232940] text-xs font-semibold text-gray-200 border border-[#2c3348] transition-colors"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
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
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1a1f30] hover:bg-[#232940] text-xs font-semibold text-gray-200 border border-[#2c3348] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Wallet</span>
                  </a>
                </div>

                {/* Browser Extension Wallet Pay */}
                <button
                  onClick={handleBrowserWalletPay}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1a1f30] hover:bg-[#232940] text-xs font-semibold text-purple-300 border border-purple-800/40 hover:border-purple-600/60 transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Pay with Browser Wallet (Phantom Extension)</span>
                </button>

                {/* 1-Click Devnet Simulation Button */}
                <button
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600/20 to-emerald-600/20 hover:from-amber-600/30 hover:to-emerald-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all disabled:opacity-50"
                  title="Broadcasts a real on-chain transaction on Devnet to simulate instant payment confirmation"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Broadcasting Devnet Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span>⚡ Simulate Devnet Payment (1-Click Test)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: Payment Confirmed Success Screen */}
          {step === 'confirmed' && currentOrder && (
            <div className="flex flex-col items-center text-center space-y-5 py-4">
              
              {/* Glowing Confirmed Icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                  <Check className="w-10 h-10 text-[#14F195] stroke-[3]" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-2xl font-extrabold text-white">Payment Confirmed!</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Settled on Solana Devnet with zero intermediary fees
                </p>
              </div>

              {/* Receipt Summary */}
              <div className="w-full bg-[#161a27] rounded-2xl border border-[#252b3e] p-4 text-xs space-y-2.5 text-left">
                <div className="flex justify-between pb-2 border-b border-[#23283a]">
                  <span className="text-gray-400">Order Number</span>
                  <span className="font-mono font-bold text-white">{currentOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount Paid</span>
                  <span className="font-mono font-bold text-[#14F195]">
                    ◎ {parseFloat(currentOrder.total_sol as string).toFixed(4)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Merchant</span>
                  <span className="text-gray-200">SolRoast & Craft Co.</span>
                </div>
                {txSignature && (
                  <div className="pt-2 border-t border-[#23283a]">
                    <span className="text-gray-400 block mb-1">On-Chain Transaction</span>
                    <a
                      href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-purple-400 hover:text-purple-300 break-all flex items-center gap-1 group"
                    >
                      <span className="truncate">{txSignature}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="w-full flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold text-xs shadow-lg transition-transform active:scale-[0.99]"
                >
                  Done / Continue Shopping
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

