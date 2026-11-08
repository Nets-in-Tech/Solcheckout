import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  ExternalLink,
  Coins,
  CheckCircle2,
  Clock,
  Copy,
  Check,
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
      console.error('Error fetching orders:', err);
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

  const copyWallet = () => {
    if (!merchantInfo?.merchantWallet) return;
    navigator.clipboard.writeText(merchantInfo.merchantWallet);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[#12141c] border border-[#23283a] rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#212638] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Store Orders & Sales</h3>
            <p className="text-xs text-gray-400">Overview of recent customer checkouts</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchOrders();
                onRefreshMerchant();
              }}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1d29] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1d29] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#171a26] p-3.5 rounded-xl border border-[#24293a]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Total Revenue</span>
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="font-mono text-lg font-bold text-white">
                {merchantInfo?.metrics.totalRevenueSol.toFixed(3) || '0.000'} SOL
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                ${merchantInfo?.metrics.totalRevenueUsd.toFixed(2) || '0.00'} USD
              </div>
            </div>

            <div className="bg-[#171a26] p-3.5 rounded-xl border border-[#24293a]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Completed Orders</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="font-mono text-lg font-bold text-white">
                {merchantInfo?.metrics.confirmedOrders ?? 0}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Paid and confirmed
              </div>
            </div>

            <div className="bg-[#171a26] p-3.5 rounded-xl border border-[#24293a]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Pending Checkouts</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="font-mono text-lg font-bold text-white">
                {merchantInfo?.metrics.pendingOrders ?? 0}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Awaiting payment
              </div>
            </div>
          </div>

          {/* Merchant Wallet Box */}
          <div className="bg-[#171a26] p-3.5 rounded-xl border border-[#24293a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-gray-400">Receiving Wallet Address:</span>
              <div className="font-mono text-gray-200 mt-0.5 break-all">
                {merchantInfo?.merchantWallet}
              </div>
            </div>
            <button
              onClick={copyWallet}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202534] hover:bg-[#282e40] text-gray-300 border border-[#2d3448] text-xs transition-colors shrink-0"
            >
              {copiedWallet ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Table */}
          <div className="bg-[#171a26] rounded-xl border border-[#24293a] overflow-hidden">
            <div className="p-3 border-b border-[#24293a] text-xs font-semibold text-white">
              Recent Orders
            </div>
            {isLoading ? (
              <div className="p-6 text-center text-xs text-gray-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1b1f2e] text-gray-400 border-b border-[#24293a]">
                    <tr>
                      <th className="py-2.5 px-3">Order</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202434]">
                    {orders.map((ord) => {
                      const isConfirmed = ord.status === 'confirmed';
                      return (
                        <tr key={ord.id} className="hover:bg-[#1b1e2c]">
                          <td className="py-2.5 px-3 font-mono font-medium text-white">
                            {ord.order_number}
                          </td>
                          <td className="py-2.5 px-3 text-gray-300">
                            {ord.customer_name || 'Guest'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-white font-medium">
                              {parseFloat(ord.total_sol as string).toFixed(3)} SOL
                            </span>
                            <span className="text-[10px] text-gray-400 ml-1">
                              (${parseFloat(ord.total_usd as string).toFixed(2)})
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {isConfirmed ? (
                              <span className="text-emerald-400 font-medium">Confirmed</span>
                            ) : (
                              <span className="text-amber-400 font-medium">Pending</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-400 font-mono text-[11px]">
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
