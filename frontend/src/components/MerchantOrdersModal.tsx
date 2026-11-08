import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  RefreshCw,
  ExternalLink,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Check,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Order, MerchantInfo } from '../types/index.ts';

interface MerchantOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantInfo?: MerchantInfo | null;
  onRefreshMerchant: () => void;
}

export const MerchantOrdersModal: React.FC<MerchantOrdersModalProps> = ({
  isOpen,
  onClose,
  merchantInfo,
  onRefreshMerchant,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders?limit=50');
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Error fetching merchant orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      onRefreshMerchant();
    }
  }, [isOpen]);

  const handleAirdrop = async () => {
    setIsAirdropping(true);
    setAirdropMsg(null);
    try {
      const res = await fetch('/api/merchant/airdrop', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAirdropMsg('Airdropped 1 SOL on Devnet successfully!');
        onRefreshMerchant();
      } else {
        setAirdropMsg(data.error || 'Airdrop rate limited by Devnet');
      }
    } catch (e: any) {
      setAirdropMsg(e.message || 'Airdrop request failed');
    } finally {
      setIsAirdropping(false);
      setTimeout(() => setAirdropMsg(null), 4000);
    }
  };

  const copyWallet = () => {
    if (!merchantInfo?.merchantWallet) return;
    navigator.clipboard.writeText(merchantInfo.merchantWallet);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    if (filter === 'confirmed') return o.status === 'confirmed';
    if (filter === 'pending') return o.status === 'pending';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-[#10121a] border border-[#23283a] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#212638] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Merchant Dashboard</h3>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                  Solana Devnet
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Small Business Settlement & Ledger Powered by Solana Pay + PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchOrders();
                onRefreshMerchant();
              }}
              disabled={isLoading}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a1f30] transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a1f30] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1 */}
            <div className="bg-[#141724] p-4 rounded-2xl border border-[#23283a]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Total Settled (SOL)</span>
                <Coins className="w-4 h-4 text-[#14F195]" />
              </div>
              <div className="font-mono text-xl font-extrabold text-[#14F195]">
                ◎ {merchantInfo?.metrics.totalRevenueSol.toFixed(4) || '0.0000'}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                ≈ ${merchantInfo?.metrics.totalRevenueUsd.toFixed(2) || '0.00'} USD
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#141724] p-4 rounded-2xl border border-[#23283a]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Confirmed Orders</span>
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="font-mono text-xl font-extrabold text-white">
                {merchantInfo?.metrics.confirmedOrders ?? 0}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                Instant 0% CC interchange fees
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-[#141724] p-4 rounded-2xl border border-[#23283a]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Pending Sessions</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-mono text-xl font-extrabold text-amber-300">
                {merchantInfo?.metrics.pendingOrders ?? 0}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Awaiting wallet scan
              </div>
            </div>

            {/* Metric 4: Merchant Wallet Balance */}
            <div className="bg-[#141724] p-4 rounded-2xl border border-[#23283a] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Merchant Balance</span>
                  <span className="text-[10px] text-purple-400 font-mono">Devnet</span>
                </div>
                <div className="font-mono text-xl font-extrabold text-white">
                  ◎ {merchantInfo?.balanceSol.toFixed(3) || '0.000'}
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleAirdrop}
                  disabled={isAirdropping}
                  className="w-full py-1 px-2.5 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/50 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3 h-3" />
                  <span>{isAirdropping ? 'Requesting...' : 'Top-up 1 Devnet SOL'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Merchant Wallet Key Display */}
          <div className="bg-[#141724] p-4 rounded-2xl border border-[#23283a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-gray-400">Merchant Settlement Address (Public Key):</span>
              <div className="font-mono text-gray-200 text-xs sm:text-sm mt-0.5 break-all">
                {merchantInfo?.merchantWallet}
              </div>
            </div>
            <button
              onClick={copyWallet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c2132] hover:bg-[#252b40] text-gray-300 border border-[#2d344a] text-xs font-medium transition-colors"
            >
              {copiedWallet ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>

          {airdropMsg && (
            <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/60 text-xs text-purple-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{airdropMsg}</span>
            </div>
          )}

          {/* Orders Filter Tabs */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Live Small Business Orders</h4>
            <div className="flex items-center gap-1 bg-[#141724] p-1 rounded-xl border border-[#23283a] text-xs">
              {(['all', 'confirmed', 'pending'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                    filter === tab
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-[#141724] rounded-2xl border border-[#23283a] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No {filter !== 'all' ? filter : ''} orders found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1a1e2e] text-gray-400 font-semibold border-b border-[#23283a]">
                    <tr>
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">On-Chain Tx</th>
                      <th className="py-3 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2334]">
                    {filteredOrders.map((ord) => {
                      const isConfirmed = ord.status === 'confirmed';
                      return (
                        <tr key={ord.id} className="hover:bg-[#181c2c] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {ord.order_number}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {ord.customer_name || 'Guest'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[#14F195]">
                              ◎ {parseFloat(ord.total_sol as string).toFixed(4)}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              ${parseFloat(ord.total_usd as string).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Confirmed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/50">
                                <Clock className="w-3 h-3 text-amber-400" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {ord.signature ? (
                              <a
                                href={`https://explorer.solana.com/tx/${ord.signature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                              >
                                <span>{ord.signature.slice(0, 8)}...{ord.signature.slice(-6)}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-gray-500 font-mono text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-400 font-mono text-[11px]">
                            {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

